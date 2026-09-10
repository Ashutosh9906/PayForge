export async function findByIdempotencyKey(connection, idempotencykey) {
    const [result] = await connection.query(
        `
        SELECT id, idempotency_key, request_hash, source_account_id, destination_account_id, amount, currency, status, created_at, updated_at
        FROM transactions
        WHERE idempotency_key = ?
        `,
        [idempotencykey]
    );

    return result[0] || null;
}

export async function create(connection, transaction) {
    const [result] = await connection.query(
        `
        INSERT INTO transactions (id, idempotency_key, request_hash, source_account_id, destination_account_id, amount, currency, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            transaction.id, 
            transaction.idempotencyKey, 
            transaction.requestHash, 
            transaction.sourceAccountId, 
            transaction.destinationAccountId, 
            transaction.amount, 
            transaction.currency, 
            transaction.status
        ]
    );

    return result;
}

export async function markCompleted(connection, transactionId) {
    const [result] = await connection.query(
        `
        UPDATE transactions
        SET status = 'COMPLETED'
        WHERE id = ?
          AND status = 'PENDING'
        `,
        [transactionId]
    );

    return result;
}

export async function markFailed(connection, transactionId) {
    const [result] = await connection.query(
        `
        UPDATE transactions
        SET status = 'FAILED'
        WHERE id = ?
          AND status = 'PENDING'
        `,
        [transactionId]
    );

    return result;
}

export async function findById(connection, transactionId){
    const [result] = await connection.query(
        `
        SELECT id, idempotency_key, request_hash, source_account_id, destination_account_id, amount, currency, status, created_at, updated_at
        FROM transactions
        WHERE id = ?
        `,
        [transactionId]
    );

    return result[0] || null;
}
