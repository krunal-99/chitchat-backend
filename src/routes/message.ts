import { Router } from "express";
import { getAllMessages } from "../controllers/message";

const router = Router();

router.get("/", getAllMessages);

export default router;
