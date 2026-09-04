USE payment_platform;

-- Create new account
DROP PROCEDURE IF EXISTS create_account;

DELIMITER //

CREATE PROCEDURE create_account(
    IN p_user_id BIGINT UNSIGNED,
    IN p_currency CHAR(3)
)
BEGIN

    DECLARE v_user_status VARCHAR(20);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SET v_user_status = NULL;

    SELECT status
    INTO v_user_status
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_user_status IS NULL THEN

        ROLLBACK;

        SELECT 'USER_NOT_FOUND' AS result;

    ELSEIF v_user_status <> 'ACTIVE' THEN

        ROLLBACK;

        SELECT 'USER_NOT_ACTIVE' AS result;

    ELSE

        INSERT INTO accounts (
            user_id,
            balance,
            currency
        )
        VALUES (
            p_user_id,
            0,
            p_currency
        );

        COMMIT;

        SELECT
            'ACCOUNT_CREATED' AS result,
            id,
            user_id,
            balance,
            currency,
            status,
            created_at
        FROM accounts
        WHERE id = LAST_INSERT_ID();

    END IF;

END //

DELIMITER ;

-- To get get account info by id
DROP PROCEDURE IF EXISTS get_account_by_id;

DELIMITER //

CREATE PROCEDURE get_account_by_id(
    IN p_id BIGINT UNSIGNED
)
BEGIN

    SELECT
        a.id,
        a.balance,
        a.currency,
        a.status,
        a.created_at,

        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.status AS user_status

    FROM accounts a

    JOIN users u
        ON a.user_id = u.id

    WHERE a.id = p_id;

END //

DELIMITER ;

-- TO get info all accounts by user id
DROP PROCEDURE IF EXISTS get_accounts_by_user_id;

DELIMITER //

CREATE PROCEDURE get_accounts_by_user_id(
    IN p_user_id BIGINT UNSIGNED
)
BEGIN

    DECLARE v_user_status VARCHAR(20);

    SET v_user_status = NULL;

    SELECT status
    INTO v_user_status
    FROM users
    WHERE id = p_user_id;

    IF v_user_status IS NULL THEN

        SELECT 'USER_NOT_FOUND' AS result;

    ELSEIF v_user_status <> 'ACTIVE' THEN

        SELECT 'USER_NOT_ACTIVE' AS result;

    ELSE

        SELECT
            'ACCOUNTS_FOUND' AS result,
            a.id,
            a.balance,
            a.currency,
            a.status,
            a.created_at
        FROM accounts a
        WHERE a.user_id = p_user_id
        ORDER BY a.id;

    END IF;

END //

DELIMITER ;

-- To chage the status between ( ACTIVE, FROZEN, CLOSED )
DROP PROCEDURE IF EXISTS account_action;

DELIMITER //

CREATE PROCEDURE account_action(
    IN p_account_id BIGINT UNSIGNED,
    IN p_action VARCHAR(20)
)
BEGIN

    DECLARE v_account_status VARCHAR(20);
    DECLARE v_balance BIGINT;

    /*
        If any unexpected SQL error occurs,
        undo the entire transaction and
        send the original error back.
    */
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    /*
        Get the account's current state and lock
        the account row.

        This prevents concurrent operations such as
        FREEZE, UNFREEZE, CLOSE, or TRANSFER from
        making decisions based on stale account state.
    */
    SET v_account_status = NULL;
    SET v_balance = NULL;

    SELECT status, balance
    INTO v_account_status, v_balance
    FROM accounts
    WHERE id = p_account_id
    FOR UPDATE;

    /*
        Account does not exist
    */
    IF v_account_status IS NULL THEN

        ROLLBACK;

        SELECT 'ACCOUNT_NOT_FOUND' AS result;

    /*
        Invalid action
    */
    ELSEIF p_action NOT IN ('FREEZE', 'UNFREEZE', 'CLOSE') THEN

        ROLLBACK;

        SELECT 'INVALID_ACCOUNT_ACTION' AS result;

    /*
        ACTIVE -> FROZEN
    */
    ELSEIF v_account_status = 'ACTIVE'
           AND p_action = 'FREEZE' THEN

        UPDATE accounts
        SET status = 'FROZEN'
        WHERE id = p_account_id;

        COMMIT;

        SELECT
            'ACCOUNT_FROZEN' AS result,
            id,
            balance,
            currency,
            status,
            created_at
        FROM accounts
        WHERE id = p_account_id;

    /*
        FROZEN -> ACTIVE
    */
    ELSEIF v_account_status = 'FROZEN'
           AND p_action = 'UNFREEZE' THEN

        UPDATE accounts
        SET status = 'ACTIVE'
        WHERE id = p_account_id;

        COMMIT;

        SELECT
            'ACCOUNT_UNFROZEN' AS result,
            id,
            balance,
            currency,
            status,
            created_at
        FROM accounts
        WHERE id = p_account_id;

    /*
        ACTIVE/FROZEN -> CLOSED
    */
    ELSEIF v_account_status IN ('ACTIVE', 'FROZEN')
           AND p_action = 'CLOSE' THEN

        /*
            Do not allow an account containing
            money to be closed.
        */
        IF v_balance <> 0 THEN

            ROLLBACK;

            SELECT 'ACCOUNT_HAS_BALANCE' AS result;

        ELSE

            UPDATE accounts
            SET status = 'CLOSED'
            WHERE id = p_account_id;

            COMMIT;

            SELECT
                'ACCOUNT_CLOSED' AS result,
                id,
                balance,
                currency,
                status,
                created_at
            FROM accounts
            WHERE id = p_account_id;

        END IF;

    /*
        CLOSED account
    */
    ELSEIF v_account_status = 'CLOSED' THEN

        ROLLBACK;

        SELECT 'ACCOUNT_ALREADY_CLOSED' AS result;

    /*
        All remaining combinations are invalid
    */
    ELSE

        ROLLBACK;

        SELECT 'INVALID_ACCOUNT_STATE_TRANSITION' AS result;

    END IF;

END //

DELIMITER ;