import express from "express";
import { generateIdempotencyKey } from "../controllers/devControllers.js";

const router = express.Router();

router.get("/idempotency-key", generateIdempotencyKey);

export default router;