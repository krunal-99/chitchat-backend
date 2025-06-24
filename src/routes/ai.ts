import express from "express";
import dotenv from "dotenv";
import { messageIntelligence } from "../controllers/ai";
dotenv.config();

const router = express.Router();

router.post("/chat", messageIntelligence);

export default router;
