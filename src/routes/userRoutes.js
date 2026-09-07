import express from "express";

import {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
} from "../controllers/userController.js";
import { getAccountByUserId } from "../controllers/accountController.js";

const router = express.Router();

router.post("/", createUser);
router.get("/", getAllUsers);
router.get("/:id/accounts", getAccountByUserId);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;