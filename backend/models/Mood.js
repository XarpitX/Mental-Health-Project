import mongoose from "mongoose";

const moodSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    moodType: {
      type: String,
      enum: [
        "happy",
        "sad",
        "anxious",
        "stressed",
        "Depression",
        "Suicidal",
        "Personality Disorder",
        "Stress",
        "Normal",
        "Bi-Polar",
        "Anxiety",
      ],
      required: true,
    },
    score: { type: Number, required: true, min: 1, max: 10 },
    date: { type: Date, required: true, default: () => new Date() },
    source: { type: String, enum: ["manual", "chat"], default: "manual" },
  },
  { timestamps: true }
);

moodSchema.index({ user: 1, date: -1 });

export default mongoose.model("Mood", moodSchema);
