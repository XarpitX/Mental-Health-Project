import mongoose from "mongoose";

const consultRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "completed"],
    default: "pending",
    index: true,
  },
  consultantId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("ConsultRequest", consultRequestSchema);
