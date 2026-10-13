import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: documents expire when Date.now() reaches expiresAt
    },
    resendAvailableAt: {
      type: Date,
      required: true,
    },
    attemptsLeft: {
      type: Number,
      default: 3,
    },
    resendCount: {
      type: Number,
      default: 0,
    },
    tempUserData: {
      name: { type: String },
      username: { type: String },
      hashedPassword: { type: String },
    },
  },
  { timestamps: true }
);

const OtpVerification = mongoose.model("OtpVerification", otpSchema);
export default OtpVerification;
