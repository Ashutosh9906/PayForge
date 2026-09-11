import express from "express";

import {
    createAccount,
    getAccountById,
    accountAction
} from "../controllers/accountController.js";
import { validateRequest } from "../middlewares/validationMiddleware.js";
import { accountActionSchema, createAccountSchema, getAccountSchema } from "../validators/accountValidators.js";
import { getAccountTransactionsController } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/", validateRequest(createAccountSchema), createAccount);
router.get("/:id", validateRequest(getAccountSchema), getAccountById);
router.post("/:id/action", validateRequest(accountActionSchema), accountAction);
router.get("/:id/transactions", validateRequest(getAccountSchema), getAccountTransactionsController);

export default router;