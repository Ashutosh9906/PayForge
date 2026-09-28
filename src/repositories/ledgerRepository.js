export async function createEntries(connection, entries) {
    const values = [];

    for (const entry of entries) {
        values.push(
            entry.transactionId,
            entry.accountId,
            entry.amount,
            entry.entryType
        );
    }

    const placeholders = entries
        .map(() => "(?, ?, ?, ?)")
        .join(", ");

    const [result] = await connection.query(
        `
        INSERT INTO ledger_entries
            (transaction_id, account_id, amount, entry_type)
        VALUES ${placeholders}
        `,
        values
    );

    return result;
}

export async function findByTransactionId(connection, transactionId) {
    const [result] = await connection.query(
        `
        SELECT
            id,
            transaction_id,
            account_id,
            amount,
            entry_type,
            created_at
        FROM ledger_entries
        WHERE transaction_id = ?
        ORDER BY created_at ASC
        `,
        [transactionId]
    );

    return result;
}