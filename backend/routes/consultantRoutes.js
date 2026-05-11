import { Router } from "express";
import {
  acceptConsultRequest,
  completeConsultRequest,
  listConsultRequests,
} from "../controllers/consultantController.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware, roleMiddleware("consultant"));

router.get("/requests", listConsultRequests);
router.patch("/requests/:id/accept", acceptConsultRequest);
router.patch("/requests/:id/complete", completeConsultRequest);

export default router;
