import express from "express";
import { createPaymentController } from "../controllers/paymentController.js";
import { validateRequest } from "../middlewares/validationMiddleware.js";
import { paymentSchema } from "../validators/paymentValidators.js";

const router = express.Router();

router.post("/", validateRequest(paymentSchema), createPaymentController);

export default router;