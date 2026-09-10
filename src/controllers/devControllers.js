import crypto from "crypto";
import handleResponse from "../utils/handleResponse.js";

export function generateIdempotencyKey(req, res) {
    const idempotencyKey = `idem_${crypto.randomUUID()}`;

    return handleResponse(
        res,
        200,
        "Idempotency key generated successfully",
        true,
        {
            idempotencyKey
        }
    );
}