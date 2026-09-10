import db from "../db.js";
import * as accountRepository from "../repositories/accountRepository.js";
import * as transactionRepository from "../repositories/transactionRepository.js";
import * as ledgerRepository from "../repositories/ledgerRepository.js";
import AppError from "../errors/appErrors.js";
import { generateRequestHash } from "../utils/requestHash.js";
import { generateTransactionId } from "../utils/idGenerator.js";

const PAYMENT_FAILURE_CODES = new Set([
    "SOURCE_ACCOUNT_NOT_ACTIVE",
    "DESTINATION_ACCOUNT_NOT_ACTIVE",
    "CURRENCY_MISMATCH",
    "INSUFFICIENT_BALANCE"
]);

export async function createPayment(paymentData) {
    const connection = await db.getConnection();

    let transactionStarted = false;
    let committed = false;
    try {
        await connection.beginTransaction();
        transactionStarted = true;

        const requestHash = generateRequestHash(paymentData);
        const transactionId = generateTransactionId();
        const normalizedCurrency = paymentData.currency.toUpperCase();

        const existingTransaction = await transactionRepository.findByIdempotencyKey(
            connection,
            paymentData.idempotencyKey
        );

        if (existingTransaction) {
            if (existingTransaction.request_hash !== requestHash) {
                throw new AppError(
                    "Idempotency key was already used with a different request",
                    409,
                    "IDEMPOTENCY_KEY_CONFLICT"
                );
            }

            return {
                transaction: existingTransaction,
                idempotent: true
            };
        }

        if (paymentData.sourceAccountId === paymentData.destinationAccountId) {
            throw new AppError(
                "Source and destination accounts must be different",
                400,
                "SAME_ACCOUNT_TRANSFER"
            );
        }

        try {
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

            const transaction = {
                id: transactionId,
                idempotencyKey: paymentData.idempotencyKey,
                requestHash,
                sourceAccountId: paymentData.sourceAccountId,
                destinationAccountId: paymentData.destinationAccountId,
                amount: paymentData.amount,
                currency: normalizedCurrency,
                status: "PENDING"
            };

            try {
                await transactionRepository.create(
                    connection,
                    transaction
                );
            } catch (error) {
                if (error.code !== "ER_DUP_ENTRY") {
                    throw error;
                }

                const concurrentTransaction =
                    await transactionRepository.findByIdempotencyKey(
                        connection,
                        paymentData.idempotencyKey
                    );

                if (!concurrentTransaction) {
                    throw error;
                }

                if (concurrentTransaction.request_hash !== requestHash) {
                    throw new AppError(
                        "Idempotency key was already used with a different request",
                        409,
                        "IDEMPOTENCY_KEY_CONFLICT"
                    );
                }

                return {
                    transaction: concurrentTransaction,
                    idempotent: true
                };
            }


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
                sourceAccount.currency !== normalizedCurrency ||
                destinationAccount.currency !== normalizedCurrency
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

            const creditResult = await accountRepository.credit(
                connection,
                destinationAccount.id,
                paymentData.amount
            );

            if (creditResult.affectedRows !== 1) {
                throw new Error("Failed to credit destination account");
            }

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

            const completionResult = await transactionRepository.markCompleted(
                connection,
                transactionId
            );

            if (completionResult.affectedRows !== 1) {
                throw new Error("Failed to mark transaction as completed");
            }

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
            if (
                error instanceof AppError &&
                PAYMENT_FAILURE_CODES.has(error.code)
            ) {
                const failedResult = await transactionRepository.markFailed(
                    connection,
                    transactionId
                );

                if (failedResult.affectedRows !== 1) {
                    throw new Error("Failed to mark transaction as failed");
                }

                await connection.commit();
                committed = true;

                throw error;
            }

            throw error;
        }

    } finally {
        if (transactionStarted && !committed) {
            await connection.rollback();
        }

        connection.release();
    }
}