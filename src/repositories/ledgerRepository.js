async function createEntry(connection, entry){
    const [result] = await connection.query(
        `
        INSERT INTO ledger_entries (transaction_id, account_id, amount, entry_type)
        VALUES (?, ?, ?, ?)
        `,
        [entry.transactionId, entry.accountId, entry.amount, entry.entryType]
    )

    return result;
}

export async function createEntries(connection, entries){
    for(const entry of entries){
        await createEntry(connection, entry);
    }
}