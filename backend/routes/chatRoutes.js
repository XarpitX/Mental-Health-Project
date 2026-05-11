import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getChats, getChat, sendMessage } from "../controllers/chatController.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getChats);
router.get("/:id", getChat);
router.post("/", sendMessage);

export default router;
