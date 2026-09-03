USE payment_platform;

-- Procedure to add new user to the database
DROP PROCEDURE IF EXISTS create_user;

DELIMITER //

CREATE PROCEDURE create_user(
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(255)
)
BEGIN

    INSERT INTO users (
        name,
        email
    )
    VALUES (
        p_name,
        p_email
    );

    SELECT
        id,
        name,
        email,
        status,
        created_at
    FROM users
    WHERE id = LAST_INSERT_ID();

END //

DELIMITER ;

-- Procedure to get teh user by ID
DROP PROCEDURE IF EXISTS get_user_by_id;

DELIMITER //

CREATE PROCEDURE get_user_by_id(
    IN p_id BIGINT UNSIGNED
)
BEGIN

    SELECT
        id,
        name,
        email,
        status,
        created_at
    FROM users
    WHERE id = p_id
      AND status = 'ACTIVE';

END //

DELIMITER ;

-- Procedure for get all usre 
DROP PROCEDURE IF EXISTS get_all_users;

DELIMITER //

CREATE PROCEDURE get_all_users()
BEGIN

    SELECT
        id,
        name,
        email,
        status,
        created_at
    FROM users
    WHERE status = 'ACTIVE'
    ORDER BY id;

END //

DELIMITER ;

-- Upadte user information like name or email
DROP PROCEDURE IF EXISTS update_user;

DELIMITER //

CREATE PROCEDURE update_user(
    IN p_id BIGINT UNSIGNED,
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(255)
)
BEGIN

    UPDATE users
    SET
        name = p_name,
        email = p_email
    WHERE id = p_id
      AND status = 'ACTIVE';

    SELECT
        id,
        name,
        email,
        status,
        created_at
    FROM users
    WHERE id = p_id
      AND status = 'ACTIVE';

END //

DELIMITER ;

-- To soft delete teh user by giving status DELETEd
DROP PROCEDURE IF EXISTS delete_user;

DELIMITER //

CREATE PROCEDURE delete_user(
    IN p_id BIGINT UNSIGNED
)
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM users
        WHERE id = p_id
    ) THEN

        SELECT
            'USER_NOT_FOUND' AS result;

    ELSEIF EXISTS (
        SELECT 1
        FROM users
        WHERE id = p_id
          AND status = 'DELETED'
    ) THEN

        SELECT
            'USER_ALREADY_DELETED' AS result;

    ELSE

        UPDATE users
        SET status = 'DELETED'
        WHERE id = p_id;

        SELECT
            'USER_DELETED' AS result;

    END IF;

END //

DELIMITER ;