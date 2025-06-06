import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { getAllUsers, login, register } from "../controllers/auth";

const router = Router();

router.get("/", authMiddleware, getAllUsers);
router.post("/register", register);
router.post("/login", login);
router.post("/verify", authMiddleware, async (req: Request, res: Response) => {
  res.status(200).json({ status: "success", data: "Token is valid" });
});

export default router;
