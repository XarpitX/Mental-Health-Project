import { Router } from "express";
import { adminOverview } from "../controllers/adminController.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware, roleMiddleware("admin"));

router.get("/overview", adminOverview);

export default router;
