import { createPayment } from "../services/paymentService.js";
import handleResponse from "../utils/handleResponse.js";

export async function createPaymentController(req, res, next){
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