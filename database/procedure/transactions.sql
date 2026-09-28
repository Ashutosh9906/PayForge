USE payment_platform;

-- get ledger entries based on transactioId
DELIMITER $$

CREATE PROCEDURE reconcile_transaction(
    IN p_transaction_id VARCHAR(50)
)
BEGIN

    SELECT
        t.id,
        t.source_account_id,
        t.destination_account_id,
        t.amount,
        t.currency,
        t.status,

        COUNT(le.id) AS ledger_count,

        SUM(
            CASE
                WHEN le.entry_type = 'DEBIT' THEN 1
                ELSE 0
            END
        ) AS debit_count,

        SUM(
            CASE
                WHEN le.entry_type = 'CREDIT' THEN 1
                ELSE 0
            END
        ) AS credit_count,

        SUM(
            CASE
                WHEN le.entry_type = 'DEBIT' THEN le.amount
                ELSE 0
            END
        ) AS debit_amount,

        SUM(
            CASE
                WHEN le.entry_type = 'CREDIT' THEN le.amount
                ELSE 0
            END
        ) AS credit_amount,

        MAX(
            CASE
                WHEN le.entry_type = 'DEBIT'
                THEN le.account_id
            END
        ) AS debit_account_id,

        MAX(
            CASE
                WHEN le.entry_type = 'CREDIT'
                THEN le.account_id
            END
        ) AS credit_account_id

    FROM transactions t

    LEFT JOIN ledger_entries le
        ON le.transaction_id = t.id

    WHERE t.id = p_transaction_id

    GROUP BY
        t.id,
        t.source_account_id,
        t.destination_account_id,
        t.amount,
        t.currency,
        t.status;

END $$

DELIMITER ;