export async function findAccountForUpdate(connection, accountIds){
    const [rows] = await connection.query(
        `
        SELECT id, user_id, balance, currency, status   
        FROM accounts
        WHERE id IN (?, ?)
        ORDER BY id
        FOR UPDATE
        `,
        accountIds
    );

    return rows;
}

export async function debit(connection, accountId, amount) {
    const [result] = await connection.query(
        `
        UPDATE accounts
        SET balance = balance - ?
        WHERE id = ?
          AND balance >= ?
        `,
        [amount, accountId, amount]
    );

    return result;
}

export async function credit(connection, accountId, amount){
    const [result] = await connection.query(
        `
        UPDATE accounts
        SET balance = balance + ?
        WHERE id = ?
        `,
        [amount, accountId]
    )

    return result;
}

export async function findById(connection, accountId){
    const [result] = await connection.query(
        `
        SELECT * FROM accounts
        WHERE id = ?
        `,
        [accountId]
    );

    return result;
}