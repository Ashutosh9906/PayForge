import express from "express";
import { createPaymentController, getTransactionController } from "../controllers/paymentController.js";
import { validateRequest } from "../middlewares/validationMiddleware.js";
import { createPaymentSchema, getTransactionSchema } from "../validators/paymentValidators.js";

const router = express.Router();

router.post("/", validateRequest(createPaymentSchema), createPaymentController);
router.get("/:transactionId", validateRequest(getTransactionSchema), getTransactionController);

export default router;