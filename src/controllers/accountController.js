import db from "../db.js";
import AppError from "../errors/appErrors.js";
import handleResponse from "../utils/handleResponse.js";

export const createAccount = async (req, res, next) => {
    try {
        const { user_id, currency } = req.body || {};

        // Basic request validation
        if (!user_id || !currency) {
            return handleResponse(
                res,
                400,
                "user_id and currency are required",
                false,
                null,
                "INVALID_REQUEST"
            );
        }

        const [result] = await db.query(
            "CALL create_account(?, ?)",
            [user_id, currency]
        );

        const outcome = result[0][0];

        if (outcome.result === "USER_NOT_FOUND") {
            return next(
                new AppError(
                    "User not found",
                    404,
                    "USER_NOT_FOUND"
                )
            );
        }

        if (outcome.result === "USER_NOT_ACTIVE") {
            return next(
                new AppError(
                    "User is not active",
                    409,
                    "USER_NOT_ACTIVE"
                )
            );
        }

        if (outcome.result === "ACCOUNT_CREATED") {
            const account = {
                id: outcome.id,
                user_id: outcome.user_id,
                balance: outcome.balance,
                currency: outcome.currency,
                status: outcome.status,
                created_at: outcome.created_at
            };

            return handleResponse(
                res,
                201,
                "Account created successfully",
                true,
                account
            );
        }

    } catch (error) {
        next(error);
    }
}

export const getAccountById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "CALL get_account_by_id(?)",
            [id]
        );

        const account = result[0][0];

        if (!account) {
            return next(
                new AppError(
                    "Account not found",
                    404,
                    "ACCOUNT_NOT_FOUND"
                )
            );
        }

        const responseData = {
            id: account.id,
            balance: account.balance,
            currency: account.currency,
            status: account.status,
            created_at: account.created_at,

            user: {
                id: account.user_id,
                name: account.user_name,
                email: account.user_email,
                status: account.user_status
            }
        };

        return handleResponse(
            res,
            200,
            "Account fetched successfully",
            true,
            responseData
        );

    } catch (error) {
        next(error);
    }
}

export const getAccountByUserId = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "CALL get_accounts_by_user_id(?)",
            [id]
        );

        const outcome = result[0][0];

        if (outcome.result === "USER_NOT_FOUND") {
            return next(
                new AppError(
                    "User not found",
                    404,
                    "USER_NOT_FOUND"
                )
            );
        }

        if (outcome.result === "USER_NOT_ACTIVE") {
            return next(
                new AppError(
                    "User is not active",
                    409,
                    "USER_NOT_ACTIVE"
                )
            );
        }

        if (outcome.result === "ACCOUNTS_FOUND") {
            const accounts = result[0].map(account => ({
                id: account.id,
                balance: account.balance,
                currency: account.currency,
                status: account.status,
                created_at: account.created_at
            }));

            return handleResponse(
                res,
                200,
                "Accounts fetched successfully",
                true,
                accounts
            );
        }

    } catch (error) {
        next(error);
    }
}

export const accountAction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action } = req.body || {};

        // Basic request validation
        if (!action) {
            return handleResponse(
                res,
                400,
                "action is required",
                false,
                null,
                "INVALID_REQUEST"
            );
        }

        // Normalize input
        const normalizedAction = action.toUpperCase();

        // API-level validation
        const allowedActions = ["FREEZE", "UNFREEZE", "CLOSE"];

        if (!allowedActions.includes(normalizedAction)) {
            return handleResponse(
                res,
                400,
                "Invalid account action",
                false,
                null,
                "INVALID_ACCOUNT_ACTION"
            );
        }

        const [result] = await db.query(
            "CALL account_action(?, ?)",
            [id, normalizedAction]
        );

        const outcome = result[0][0];

        /*
         * Database-level outcomes
         */

        if (outcome.result === "ACCOUNT_NOT_FOUND") {
            return next(new AppError(
                "Account not found",
                404,
                "ACCOUNT_NOT_FOUND"
            ));
        }

        if (outcome.result === "ACCOUNT_HAS_BALANCE") {
            return next(new AppError(
                "Account cannot be closed because it has a balance",
                409,
                "ACCOUNT_HAS_BALANCE"
            ));
        }

        if (outcome.result === "ACCOUNT_ALREADY_CLOSED") {
            return next(new AppError(
                "Account is already closed",
                409,
                "ACCOUNT_ALREADY_CLOSED"
            ));
        }

        if (outcome.result === "INVALID_ACCOUNT_STATE_TRANSITION") {
            return next(new AppError(
                "Invalid account state transition",
                409,
                "INVALID_ACCOUNT_STATE_TRANSITION"
            ));
        }

        /*
         * Successful transitions
         */

        if (
            outcome.result === "ACCOUNT_FROZEN" ||
            outcome.result === "ACCOUNT_UNFROZEN" ||
            outcome.result === "ACCOUNT_CLOSED"
        ) {
            const account = {
                id: outcome.id,
                balance: outcome.balance,
                currency: outcome.currency,
                status: outcome.status,
                created_at: outcome.created_at
            };

            const messages = {
                ACCOUNT_FROZEN: "Account frozen successfully",
                ACCOUNT_UNFROZEN: "Account unfrozen successfully",
                ACCOUNT_CLOSED: "Account closed successfully"
            };

            return handleResponse(
                res,
                200,
                messages[outcome.result],
                true,
                account
            );
        }

    } catch (error) {
        next(error);
    }
}