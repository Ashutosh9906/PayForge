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
    id: z.coerce.number().int().positive("ID must be a positive number"),
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

