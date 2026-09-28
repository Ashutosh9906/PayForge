import db from "../db.js";
import AppError from "../errors/appErrors.js";
import * as transactionRepository from "../repositories/transactionRepository.js";

export async function reconcileTransaction(transactionId) {
    const connection = await db.getConnection();

    try {
        const transaction =
            await transactionRepository.findTransactionForReconciliation(
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

        const ledgerCount = Number(transaction.ledger_count);
        const debitCount = Number(transaction.debit_count);
        const creditCount = Number(transaction.credit_count);

        // COMPLETED
        if (transaction.status === "COMPLETED") {
            const isConsistent =
                ledgerCount === 2 &&
                debitCount === 1 &&
                creditCount === 1 &&
                transaction.debit_account_id ===
                    transaction.source_account_id &&
                transaction.credit_account_id ===
                    transaction.destination_account_id &&
                transaction.debit_amount === transaction.amount &&
                transaction.credit_amount === transaction.amount;

            if (!isConsistent) {
                return {
                    transactionId: transaction.id,
                    status: "INCONSISTENT",
                    issue: "LEDGER_MISMATCH"
                };
            }

            return {
                transactionId: transaction.id,
                status: "CONSISTENT",
                issue: null
            };
        }

        // FAILED
        if (transaction.status === "FAILED") {
            if (ledgerCount !== 0) {
                return {
                    transactionId: transaction.id,
                    status: "INCONSISTENT",
                    issue: "FAILED_TRANSACTION_HAS_LEDGER"
                };
            }

            return {
                transactionId: transaction.id,
                status: "CONSISTENT",
                issue: null
            };
        }

        // PENDING
        if (transaction.status === "PENDING") {
            const updatedAt = new Date(transaction.updated_at);
            const now = new Date();

            const ageInMilliseconds = now - updatedAt;
            const tenMinutes = 10 * 60 * 1000;

            if (ageInMilliseconds >= tenMinutes) {
                return {
                    transactionId: transaction.id,
                    status: "INCONSISTENT",
                    issue: "STALE_PENDING_TRANSACTION"
                };
            }

            return {
                transactionId: transaction.id,
                status: "SKIPPED",
                issue: null
            };
        }

    } finally {
        connection.release();
    }
}