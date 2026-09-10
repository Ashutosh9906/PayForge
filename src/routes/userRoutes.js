import express from "express";

import {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
} from "../controllers/userController.js";
import { getAccountByUserId } from "../controllers/accountController.js";
import { validateRequest } from "../middlewares/validationMiddleware.js";
import { createUserSchema, deleteUserSchema, updateUserSchema } from "../validators/userValidators.js";

const router = express.Router();

router.post("/", validateRequest(createUserSchema) , createUser);
router.get("/", getAllUsers);
router.get("/:id/accounts", getAccountByUserId);
router.get("/:id", getUserById);
router.patch("/:id", validateRequest(updateUserSchema), updateUser);
router.delete("/:id", validateRequest(deleteUserSchema), deleteUser);

export default router;