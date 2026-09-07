import express from "express";

import {
    createAccount,
    getAccountById,
    accountAction
} from "../controllers/accountController.js";

const router = express.Router();

router.post("/", createAccount);
router.get("/:id", getAccountById);
router.post("/:id/action", accountAction);

export default router;