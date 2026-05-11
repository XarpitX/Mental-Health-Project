import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  analyzeMoodFromNote,
  createMood,
  listMoods,
  dashboardStats,
} from "../controllers/moodController.js";

const router = Router();

router.use(authMiddleware);

router.get("/stats", dashboardStats);
router.get("/", listMoods);
router.post("/analyze", analyzeMoodFromNote);
router.post("/", createMood);

export default router;
