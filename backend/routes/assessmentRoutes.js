import { Router } from "express";
import {
  assessmentHistory,
  latestAssessment,
  myConsultRequest,
  submitAssessment,
} from "../controllers/assessmentController.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware, roleMiddleware("user"));

router.get("/me/latest", latestAssessment);
router.get("/me/history", assessmentHistory);
router.get("/me/request", myConsultRequest);
router.post("/", submitAssessment);

export default router;
