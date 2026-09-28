import db from "../db.js";
import AppError from "../errors/appErrors.js";
import * as transactionRepository from "../repositories/transactionRepository.js";
import * as ledgerRepository from "../repositories/ledgerRepository.js";

export async function getTransactionLedger(transactionId) {
    const connection = await db.getConnection();

    try {
        const transaction = await transactionRepository.findById(
            connection,
            transactionId
        );

        if (!transaction) {
            throw new AppError(
                "Transaction not found",
                404,
                "TRANSACTION_NOT_FOUND"
            );
        }

        const ledgerEntries =
            await ledgerRepository.findByTransactionId(
                connection,
                transactionId
            );

        return {
            transaction: {
                id: transaction.id,
                sourceAccountId: transaction.source_account_id,
                destinationAccountId: transaction.destination_account_id,
                amount: transaction.amount,
                currency: transaction.currency,
                status: transaction.status,
                createdAt: transaction.created_at,
                updatedAt: transaction.updated_at
            },
            ledgerEntries
        };
    } finally {
        connection.release();
    }
}