// models/User.js

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },

  // Verification & Security Controls
  is_verified: { type: Boolean, default: false },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  refreshToken: { type: String, default: null },

  // Additions for challenges
  completedChallenges: [
    {
      challengeId: { type: mongoose.Schema.Types.ObjectId, ref: "Challenge" },
      completedAt: Date,
    },
  ],
  totalPoints: { type: Number, default: 0 },
  dailyStreak: { type: Number, default: 0 },
  weeklyStreak: { type: Number, default: 0 },
  lastDailyChallenge: Date,
  lastWeeklyChallenge: Date,
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;
