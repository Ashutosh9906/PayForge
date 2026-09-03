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

app.use(errorHandling);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});