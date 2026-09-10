import crypto from "crypto";
import { normalizeAmount } from "./money";

export function generateRequestHash(paymentData) {
    const normalizedAmount = normalizeAmount(paymentData.amount);

    const data = [
        paymentData.sourceAccountId,
        paymentData.destinationAccountId,
        normalizedAmount,
        paymentData.currency.toUpperCase()
    ].join("|");

    return crypto
        .createHash("sha256")
        .update(data)
        .digest("hex");
}