import { z } from "zod";

const createAccountBody = z.object({
    user_id: z
        .coerce
        .number({
            error: "account_id is required and must be a number",
        })
        .int("account_id must be an integer")
        .positive("account_id must be greater than 0"),

    currency: z
        .string({
            error: "currency is required and must be a string",
        })
        .length(3, "currency must contain exactly 3 characters")
        .regex(
            /^[A-Z]{3}$/,
            "currency must contain exactly 3 uppercase letters"
        ),
}).strict();

const accountIdParams = z.object({
    id: z
        .coerce
        .number({
            error: "account_id is required and must be a number",
        })
        .int("account_id must be an integer")
        .positive("account_id must be greater than 0"),
}).strict();

const accountActionBody = z.object({
    action: z.enum(
        ["FREEZE", "UNFREEZE", "CLOSE"],
        {
            error: "action is required and must be one of FREEZE, UNFREEZE, CLOSE",
        }
    ),
}).strict();

export const createAccountSchema = z.object({
    body: createAccountBody
});

export const getAccountSchema = z.object({
    params: accountIdParams
});

export const accountActionSchema = z.object({
    params: accountIdParams,
    body: accountActionBody
});