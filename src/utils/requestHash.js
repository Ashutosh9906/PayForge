import crypto from "crypto";

export function generateRequestHash(paymentData) {
    const normalizedAmount = Number(paymentData.amount).toFixed(2);

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