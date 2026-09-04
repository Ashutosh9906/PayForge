import express from "express";
import db from "./db.js";
import handleResponse from "./utils/handleResponse.js";
import errorHandling from "./middlewares/errorHandling.js";
import AppError from "./errors/appErrors.js";

const app = express();

app.use(express.json());

app.post("/users", async (req, res, next) => {
    try {
        const { name, email } = req.body || {};

        if (!name || !email) {
            return handleResponse(
                res,
                400,
                "Name and email are required",
                false,
                null,
                "INVALID_REQUEST"
            );
        }

        const [result] = await db.query(
            "CALL create_user(?, ?)",
            [name, email]
        );

        const user = result[0][0];

        return handleResponse(
            res,
            201,
            "User created successfully",
            true,
            user
        );

    } catch (error) {

        if (error.code === "ER_DUP_ENTRY") {
            return next(
                new AppError(
                    "Email already exists",
                    409,
                    "EMAIL_ALREADY_EXISTS"
                )
            );
        }

        next(error);
    }
});

app.get("/users/:id", async (req, res, next) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "CALL get_user_by_id(?)",
            [id]
        );

        const user = result[0][0];

        if (!user) {
            return next(
                new AppError(
                    "User not found",
                    404,
                    "USER_NOT_FOUND"
                )
            );
        }

        return handleResponse(
            res,
            200,
            "User fetched successfully",
            true,
            user
        );

    } catch (error) {
        next(error);
    }
});

app.get("/users", async (req, res, next) => {
    try {
        const [result] = await db.query(
            "CALL get_all_users()"
        );

        const users = result[0];

        return handleResponse(
            res,
            200,
            "Users fetched successfully",
            true,
            users
        );

    } catch (error) {
        next(error);
    }
});

app.patch("/users/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body || {};

        if (!name || !email) {
            return handleResponse(
                res,
                400,
                "Name and email are required",
                false,
                null,
                "INVALID_REQUEST"
            );
        }

        const [result] = await db.query(
            "CALL update_user(?, ?, ?)",
            [id, name, email]
        );

        const user = result[0][0];

        if (!user) {
            return next(
                new AppError(
                    "User not found",
                    404,
                    "USER_NOT_FOUND"
                )
            );
        }

        return handleResponse(
            res,
            200,
            "User updated successfully",
            true,
            user
        );

    } catch (error) {

        if (error.code === "ER_DUP_ENTRY") {
            return next(
                new AppError(
                    "Email already exists",
                    409,
                    "EMAIL_ALREADY_EXISTS"
                )
            );
        }

        next(error);
    }
});

app.delete("/users/:id", async (req, res, next) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "CALL delete_user(?)",
            [id]
        );

        const outcome = result[0][0].result;

        if (outcome === "USER_NOT_FOUND") {
            return next(
                new AppError(
                    "User not found",
                    404,
                    "USER_NOT_FOUND"
                )
            );
        }

        if (outcome === "USER_ALREADY_DELETED") {
            return next(
                new AppError(
                    "User is already deleted",
                    409,
                    "USER_ALREADY_DELETED"
                )
            );
        }

        if (outcome === "USER_DELETED") {
            return handleResponse(
                res,
                200,
                "User deleted successfully",
                true,
                null
            );
        }

    } catch (error) {
        next(error);
    }
});

app.post("/accounts", async (req, res, next) => {
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
});

app.get("/accounts/:id", async (req, res, next) => {
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
});

app.get("/users/:id/accounts", async (req, res, next) => {
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
});

app.post("/accounts/:id/action", async (req, res, next) => {
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
});

app.use(errorHandling);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});