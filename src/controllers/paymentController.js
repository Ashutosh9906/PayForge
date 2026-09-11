import { createPayment, getAccountTransactions, getPayment } from "../services/paymentService.js";
import handleResponse from "../utils/handleResponse.js";

export async function createPaymentController(req, res, next) {
    try {
        const idempotencyKey = res.locals.validated.headers["idempotency-key"];
        // console.log(idempotencyKey);

        const paymentData = {
            sourceAccountId: res.locals.validated.body.sourceAccountId,
            destinationAccountId: res.locals.validated.body.destinationAccountId,
            amount: res.locals.validated.body.amount,
            currency: res.locals.validated.body.currency,
            idempotencyKey
        }

        const result = await createPayment(paymentData);

        return handleResponse(
            res,
            201,
            "Payment created successfully",
            true,
            result
        );
    } catch (error) {
        next(error);
    }
}

export async function getTransactionController(req, res, next) {
    try {
        const { transactionId } = res.locals.validated.params;

        const transaction = await getPayment(transactionId);

        return handleResponse(
            res,
            200,
            "Payment retrieved successfully",
            true,
            transaction,
            "PAYMENT_RETRIEVED"
        );
    } catch (error) {
        next(error);
    }
}

export async function getAccountTransactionsController(req, res, next) {
    try {
        const accountId = res.locals.validated.params.id;

        const transactions =
            await getAccountTransactions(accountId);

        return handleResponse(
            res,
            200,
            "Account transactions retrieved successfully",
            true,
            transactions,
            "TRANSACTIONS_RETRIEVED"
        );
    } catch (error) {
        next(error);
    }
}