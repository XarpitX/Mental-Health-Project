import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  answers: [{ type: Number, min: 1, max: 5, required: true }],
  score: { type: Number, required: true, min: 10, max: 50 },
  status: {
    type: String,
    enum: ["good", "medium", "critical"],
    required: true,
    index: true,
  },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Assessment", assessmentSchema);
