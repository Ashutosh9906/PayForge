import crypto from "crypto";

export function generateTransactionId() {
    return `txn_${crypto.randomUUID()}`;
}