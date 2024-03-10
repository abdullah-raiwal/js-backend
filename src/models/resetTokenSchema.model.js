import mongoose from "mongoose";

const tokenResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: { type: Date, expires: 3600, default: Date.now },
});

export const tokenReset = mongoose.model("tokenReset", tokenResetSchema);
