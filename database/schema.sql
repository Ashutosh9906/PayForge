CREATE DATABASE IF NOT EXISTS payment_platform;

USE payment_platform;


CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE accounts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    balance BIGINT NOT NULL DEFAULT 0,
    currency CHAR(3) NOT NULL,
    status ENUM('ACTIVE', 'FROZEN', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_accounts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT chk_account_non_negative_balance
        CHECK (balance >= 0)
);


CREATE TABLE transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    idempotency_key VARCHAR(100) NOT NULL UNIQUE,

    source_account_id BIGINT UNSIGNED NOT NULL,
    destination_account_id BIGINT UNSIGNED NOT NULL,

    amount BIGINT UNSIGNED NOT NULL,

    currency CHAR(3) NOT NULL,

    status ENUM('PENDING', 'COMPLETED', 'FAILED')
        NOT NULL DEFAULT 'PENDING',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transactions_source_account
        FOREIGN KEY (source_account_id)
        REFERENCES accounts(id),

    CONSTRAINT fk_transactions_destination_account
        FOREIGN KEY (destination_account_id)
        REFERENCES accounts(id),

    CONSTRAINT chk_transaction_different_accounts
        CHECK (source_account_id <> destination_account_id),

    CONSTRAINT chk_transaction_positive_amount
        CHECK (amount > 0)
);


CREATE TABLE ledger_entries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    transaction_id BIGINT UNSIGNED NOT NULL,
    account_id BIGINT UNSIGNED NOT NULL,

    amount BIGINT NOT NULL,

    entry_type ENUM('DEBIT', 'CREDIT') NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ledger_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(id),

    CONSTRAINT fk_ledger_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(id)
);


CREATE INDEX idx_transactions_source_account
    ON transactions(source_account_id);

CREATE INDEX idx_transactions_destination_account
    ON transactions(destination_account_id);

CREATE INDEX idx_ledger_account
    ON ledger_entries(account_id);

CREATE INDEX idx_ledger_transaction
    ON ledger_entries(transaction_id);