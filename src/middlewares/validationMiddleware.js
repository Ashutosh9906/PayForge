import { z } from "zod";
import { buildValidationFields } from "../utils/validator.js";
import AppError from "../errors/appErrors.js";

export function validateRequest(schema) {
    return (req, res, next) => {
        try {
            const validationFields = buildValidationFields(schema, req);

            const result = schema.safeParse(validationFields);

            if (!result.success) {
                const error = new AppError(
                    "Validation Failed",
                    400,
                    "VALIDATION_ERROR"
                );
                error.details = z.treeifyError(result.error);
                throw error;
            }

            res.locals.validated = result.data;

            next();
        } catch (err) {
            next(err);
        }
    };
}