import { z } from "zod";

const paymentHeaderSchema = z.object({
    "idempotency-key": z
        .string({
            error: "Idempotency-Key is required",
        })
        .min(1, "Idempotency-Key cannot be empty")
        .refine(
            (value) => {
                if (!value.startsWith("idem_")) return false;

                const uuid = value.slice(5);
                return z.uuid().safeParse(uuid).success;
            },
            {
                error: "Idempotency-Key must be in the format idem_<valid UUID>",
            }
        ),
});

const paymentBodySchema = z.object({
    sourceAccountId: z
        .number({
            error: "sourceAccountId is required and must be a number",
        })
        .int("sourceAccountId must be an integer")
        .positive("sourceAccountId must be greater than 0"),

    destinationAccountId: z
        .number({
            error: "destinationAccountId is required and must be a number",
        })
        .int("destinationAccountId must be an integer")
        .positive("destinationAccountId must be greater than 0"),

    amount: z
        .string({
            error: "amount is required and must be a string",
        })
        .regex(
            /^(?:0\.\d{1,2}|[1-9]\d*(?:\.\d{1,2})?)$/,
            "amount must be a positive number with maximum 2 decimal places"
        )
        .refine(
            (value) => {
                const amount = Number(value);
                return amount > 0 && amount < 200000;
            },
            {
                error: "amount must be greater than 0 and less than ₹2,00,000",
            }
        ),

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

export const paymentSchema = z.object({
  body: paymentBodySchema,
  headers: paymentHeaderSchema
}).strict();