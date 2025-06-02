import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { getMessagesBetweenUsers } from "../controllers/message";

const router = Router();

router.route("/").get(authMiddleware, getMessagesBetweenUsers);

export default router;
