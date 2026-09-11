import { z } from "zod";

const UserInfoBody = z.object({
    name: z.string().min(1, "Name is required"),

    email: z
        .string()
        .min(1, "Email is required")
        .regex(
            /^[^@\s]+@[^@\s]+\.com$/,
            "Invalid email format"
        ),
}).strict();

const userIdParams = z.object({
    id: z
        .coerce
        .number({
            error: "account_id is required and must be a number",
        })
        .int("account_id must be an integer")
        .positive("account_id must be greater than 0"),
}).strict();

export const createUserSchema = z.object({
    body: UserInfoBody
});

export const updateUserSchema = z.object({
    body: UserInfoBody,
    params: userIdParams
});

export const deleteUserSchema = z.object({
    params: userIdParams
});

export const getUserSchema = z.object({
    params: userIdParams
});
