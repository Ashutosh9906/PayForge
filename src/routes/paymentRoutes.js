import express from "express";
import { createPaymentController, getTransactionController, getTransactionLedgerController, reconcileTransactionController } from "../controllers/paymentController.js";
import { validateRequest } from "../middlewares/validationMiddleware.js";
import { createPaymentSchema, getTransactionSchema } from "../validators/paymentValidators.js";
import { reconcileTransaction } from "../services/transactionService.js";

const router = express.Router();

router.post("/", validateRequest(createPaymentSchema), createPaymentController);
router.get(
    "/:transactionId/ledger",
    validateRequest(getTransactionSchema),
    getTransactionLedgerController
);
router.get("/:transactionId", validateRequest(getTransactionSchema), getTransactionController);
router.post(
    "/:transactionId/reconcile",
    validateRequest(getTransactionSchema),
    reconcileTransactionController
);

export default router;