import db from "../db.js";
import * as accountRepository from "../repositories/accountRepository.js";
import * as transactionRepository from "../repositories/transactionRepository.js";
import * as ledgerRepository from "../repositories/ledgerRepository.js";
import AppError from "../errors/appErrors.js";
import { generateRequestHash } from "../utils/requestHash.js";
import { generateTransactionId } from "../utils/idGenerator.js";

export async function createPayment(paymentData) {
    const connection = await db.getConnection();

    let transactionStarted = false;
    let committed = false;
    try {
        await connection.beginTransaction();
        transactionStarted = true;

        const requestHash = generateRequestHash(paymentData);
        const transactionId = generateTransactionId();

        const transaction = {
            id: transactionId,
            idempotencyKey: paymentData.idempotencyKey,
            requestHash,
            sourceAccountId: paymentData.sourceAccountId,
            destinationAccountId: paymentData.destinationAccountId,
            amount: paymentData.amount,
            currency: paymentData.currency,
            status: "PENDING"
        };

        try {
            await transactionRepository.create(connection, transaction);
        } catch (error) {
            if (error.code !== "ER_DUP_ENTRY") {
                throw error;
            }

            const existingTransaction = await transactionRepository.findByIdempotencyKey(connection, paymentData.idempotencyKey);

            if (!existingTransaction) {
                throw error;
            }

            if (existingTransaction.request_hash !== requestHash) {
                throw new AppError(
                    "Idempotency key was already used with a different request",
                    409,
                    "IDEMPOTENCY_KEY_CONFLICT"
                )
            }

            return {
                transaction: existingTransaction,
                idempotent: true
            };
        }

        const accounts = await accountRepository.findAccountForUpdate(
            connection,
            [
                paymentData.sourceAccountId,
                paymentData.destinationAccountId
            ]
        );

        if (accounts.length !== 2) {
            throw new AppError(
                "Source or destination account does not exist",
                404,
                "ACCOUNT_NOT_FOUND"
            );
        }

        const sourceAccount = accounts.find(
            account => account.id === paymentData.sourceAccountId
        );

        const destinationAccount = accounts.find(
            account => account.id === paymentData.destinationAccountId
        );

        if (sourceAccount.status !== "ACTIVE") {
            throw new AppError(
                "Source account is not active",
                409,
                "SOURCE_ACCOUNT_NOT_ACTIVE"
            );
        }

        if (destinationAccount.status !== "ACTIVE") {
            throw new AppError(
                "Destination account is not active",
                409,
                "DESTINATION_ACCOUNT_NOT_ACTIVE"
            );
        }

        if (
            sourceAccount.currency !== paymentData.currency ||
            destinationAccount.currency !== paymentData.currency
        ) {
            throw new AppError(
                "Payment currency does not match account currency",
                400,
                "CURRENCY_MISMATCH"
            );
        }

        const debitResult = await accountRepository.debit(
            connection,
            sourceAccount.id,
            paymentData.amount
        );

        if (debitResult.affectedRows !== 1) {
            throw new AppError(
                "Insufficient balance in source account",
                400,
                "INSUFFICIENT_BALANCE"
            );
        }

        await accountRepository.credit(
            connection,
            destinationAccount.id,
            paymentData.amount
        );

        await ledgerRepository.createEntries(connection, [
            {
                transactionId: transactionId,
                accountId: sourceAccount.id,
                amount: paymentData.amount,
                entryType: "DEBIT"
            },
            {
                transactionId: transactionId,
                accountId: destinationAccount.id,
                amount: paymentData.amount,
                entryType: "CREDIT"
            }
        ]);

        await transactionRepository.markCompleted(
            connection,
            transactionId
        );

        const completedTransaction = await transactionRepository.findById(
            connection,
            transactionId
        );

        await connection.commit();
        committed = true;

        return {
            transaction: completedTransaction,
            idempotent: false
        };
    } catch (error) {
        throw error;

    } finally {
        if (transactionStarted && !committed) {
            await connection.rollback();
        }

        connection.release();
    }
}