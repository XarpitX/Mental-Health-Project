import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import consultantRoutes from "./routes/consultantRoutes.js";
import consultRequestChatRoutes from "./routes/consultRequestChatRoutes.js";
import moodRoutes from "./routes/moodRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "MindCare API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/consultant", consultantRoutes);
app.use("/api/consult", consultRequestChatRoutes);
app.use("/api/moods", moodRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

async function main() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`MindCare API listening on http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error("\nMindCare API failed to start:\n", e.message || e);
  console.error(
    "\nCheck: (1) MongoDB is running, (2) backend/.env exists with MONGODB_URI and JWT_SECRET, (3) run the API from the backend folder: npm run dev\n"
  );
  process.exit(1);
});
