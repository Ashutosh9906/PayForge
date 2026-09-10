export function normalizeAmount(amount) {
    const value = String(amount).trim();

    if (!/^\d+(\.\d{1,2})?$/.test(value)) {
        throw new Error("Invalid monetary amount");
    }

    const [whole, fraction = ""] = value.split(".");

    const normalizedWhole = String(BigInt(whole));
    const normalizedFraction = fraction.padEnd(2, "0");

    return `${normalizedWhole}.${normalizedFraction}`;
}