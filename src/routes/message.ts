import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { getMessagesBetweenUsers, sendMessage } from "../controllers/message";

const router = Router();

router
  .get("/", authMiddleware, getMessagesBetweenUsers)
  .post("/", authMiddleware, sendMessage);

export default router;
