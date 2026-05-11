import { Router } from "express";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";
import {
  consultantGetRequestMessages,
  consultantSendMessage,
  userGetMyRequestMessages,
  userSendMessage,
} from "../controllers/consultRequestChatController.js";

const router = Router();

// User side: messages for their own request
router.get("/user/me/messages", authMiddleware, roleMiddleware("user"), userGetMyRequestMessages);
router.post("/user/requests/:id/messages", authMiddleware, roleMiddleware("user"), userSendMessage);

// Consultant side: messages by request id
router.get(
  "/consultant/requests/:id/messages",
  authMiddleware,
  roleMiddleware("consultant"),
  consultantGetRequestMessages
);
router.post(
  "/consultant/requests/:id/messages",
  authMiddleware,
  roleMiddleware("consultant"),
  consultantSendMessage
);

export default router;

