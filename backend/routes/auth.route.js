import express from "express";
import {
  login,
  logout,
  signup,
  verifyOtp,
  resendOtp,
  getUser,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/user", protectRoute, getUser);
router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/logout", logout);

export default router;