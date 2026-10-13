import bcrypt from "bcryptjs";
import { generateTokensAndSetCookies } from "../lib/utils/generateTokenAndSetCookie.js";
import { generateSecureOtp, hashOtp, verifyOtpHash } from "../lib/utils/otp.util.js";
import User from "../models/user.model.js";
import OtpVerification from "../models/otp.model.js";
import {
  signupSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  sanitizeString,
} from "../validation/auth.schema.js";
import {
  sendVerificationEmail,
  isEmailServiceConfigured,
} from "../lib/utils/email.service.js";

/**
 * Controller: Handles signup validation, password hashing, and immediate account creation (No OTP required)
 */
export const signup = async (req, res) => {
  try {
    const parseResult = signupSchema.safeParse(req.body);

    if (!parseResult.success) {
      const issues = parseResult.error.issues;
      const isMismatch = issues.some(
        (issue) =>
          issue.path.includes("confirmPassword") ||
          issue.message === "Passwords do not match"
      );

      if (isMismatch) {
        return res.status(400).json({
          success: false,
          code: "PASSWORDS_DO_NOT_MATCH",
          error: "Passwords do not match",
          message: "Confirm password does not match password",
        });
      }

      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: issues[0].message,
        message: issues[0].message,
        details: issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
    }

    const { name, email, password, username } = parseResult.data;
    const normalizedEmail = email.trim().toLowerCase();
    const sanitizedName = sanitizeString(name);

    // Check if an account already exists with this email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        code: "EMAIL_ALREADY_EXISTS",
        error: "Email already exists",
        message: "An account with this email address already exists. Please log in.",
      });
    }

    const derivedUsername =
      username ||
      normalizedEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") +
        "_" +
        Math.floor(1000 + Math.random() * 9000);

    const existingUsername = await User.findOne({ username: derivedUsername });
    const finalUsername = existingUsername
      ? `${derivedUsername}_${Date.now().toString().slice(-4)}`
      : derivedUsername;

    // Hash password with bcrypt cost factor 10
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user directly (No OTP required)
    const newUser = new User({
      name: sanitizedName,
      username: finalUsername,
      email: normalizedEmail,
      password: hashedPassword,
      is_verified: true,
      failedLoginAttempts: 0,
      lockUntil: null,
    });
    await newUser.save();

    // Issue secure Access and Refresh tokens and set HTTP-only cookies
    const tokens = generateTokensAndSetCookies(newUser._id, res);
    newUser.refreshToken = tokens.refreshToken;
    await newUser.save();

    return res.status(201).json({
      success: true,
      code: "ACCOUNT_CREATED",
      message: "Account created successfully.",
      user: {
        _id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        is_verified: true,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error("Error in signup controller:", error.message);
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      error: error.message || "Internal server error",
      message: "Failed to process registration request",
    });
  }
};

/**
 * Controller: Verifies the 6-digit numeric OTP and activates the user account
 */
export const verifyOtp = async (req, res) => {
  try {
    const parseResult = verifyOtpSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: parseResult.error.issues[0].message,
        message: parseResult.error.issues[0].message,
      });
    }

    const { email, otp } = parseResult.data;
    const normalizedEmail = email.trim().toLowerCase();

    const otpRecord = await OtpVerification.findOne({ email: normalizedEmail });

    if (!otpRecord) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser && existingUser.is_verified) {
        return res.status(400).json({
          success: false,
          code: "ACCOUNT_ALREADY_VERIFIED",
          error: "Account already verified",
          message: "This account has already been verified. Please log in.",
        });
      }

      return res.status(400).json({
        success: false,
        code: "OTP_EXPIRED",
        error: "OTP expired or not found",
        message: "Verification code has expired or does not exist. Please request a new code.",
      });
    }

    // Check expiration
    if (new Date() > otpRecord.expiresAt) {
      await OtpVerification.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        code: "OTP_EXPIRED",
        error: "OTP expired",
        message: "The 6-digit OTP code has expired. Please request a new code.",
      });
    }

    // Check retry limits (max 3 attempts)
    if (otpRecord.attemptsLeft <= 0) {
      return res.status(429).json({
        success: false,
        code: "TOO_MANY_REQUESTS",
        error: "Attempts exceeded",
        message: "Maximum OTP verification attempts exceeded. Please request a new code.",
      });
    }

    // Constant-time HMAC hash verification
    const isValid = verifyOtpHash(otp, otpRecord.otpHash);

    if (!isValid) {
      otpRecord.attemptsLeft = Math.max(0, otpRecord.attemptsLeft - 1);
      await otpRecord.save();

      return res.status(400).json({
        success: false,
        code: "INVALID_OTP",
        error: "Invalid OTP",
        message: "The verification code entered is incorrect.",
        attemptsRemaining: otpRecord.attemptsLeft,
      });
    }

    // Persist verified user record
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      user.is_verified = true;
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      if (otpRecord.tempUserData?.hashedPassword) {
        user.password = otpRecord.tempUserData.hashedPassword;
      }
      if (otpRecord.tempUserData?.name) {
        user.name = otpRecord.tempUserData.name;
      }
      await user.save();
    } else {
      user = new User({
        name: otpRecord.tempUserData?.name || "KaushalAI User",
        username: otpRecord.tempUserData?.username || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        password: otpRecord.tempUserData?.hashedPassword,
        is_verified: true,
        failedLoginAttempts: 0,
        lockUntil: null,
      });
      await user.save();
    }

    // Remove used OTP record
    await OtpVerification.deleteOne({ _id: otpRecord._id });

    // Issue secure Access and Refresh tokens
    const tokens = generateTokensAndSetCookies(user._id, res);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      code: "ACCOUNT_VERIFIED",
      message: "Account verified and activated successfully.",
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        is_verified: true,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error("Error in verifyOtp controller:", error.message);
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      error: error.message || "Internal server error",
      message: "Failed to verify OTP code",
    });
  }
};

/**
 * Controller: Resends a fresh 6-digit OTP respecting the 60s cooldown and 3-attempt limit
 */
export const resendOtp = async (req, res) => {
  try {
    const parseResult = resendOtpSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: parseResult.error.issues[0].message,
        message: parseResult.error.issues[0].message,
      });
    }

    const { email } = parseResult.data;
    const normalizedEmail = email.trim().toLowerCase();

    let otpRecord = await OtpVerification.findOne({ email: normalizedEmail });

    if (!otpRecord) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser && (existingUser.is_verified || existingUser.is_verified === undefined)) {
        return res.status(400).json({
          success: false,
          code: "ACCOUNT_ALREADY_VERIFIED",
          error: "Account already verified",
          message: "This account is already verified. Please log in.",
        });
      }

      if (existingUser && existingUser.is_verified === false) {
        // Re-initialize OTP verification for registered unverified user
        const newOtp = generateSecureOtp();
        const otpHash = hashOtp(newOtp);
        const now = new Date();
        otpRecord = new OtpVerification({
          email: normalizedEmail,
          otpHash,
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          resendAvailableAt: new Date(now.getTime() + 60 * 1000),
          attemptsLeft: 3,
          resendCount: 1,
          tempUserData: {
            name: existingUser.name,
            username: existingUser.username,
            hashedPassword: existingUser.password,
          },
        });
        await otpRecord.save();

        console.log(`[KaushalAI Auth] Resent OTP for ${normalizedEmail}: ${newOtp}`);
        const emailDispatch = await sendVerificationEmail(normalizedEmail, newOtp);

        return res.status(200).json({
          success: true,
          code: "OTP_RESENT",
          message: emailDispatch.success
            ? "A new 6-digit verification code has been sent to your email."
            : "A new 6-digit verification code has been generated. (Email delivery: check code below or configure SMTP)",
          email: normalizedEmail,
          emailSent: emailDispatch.success,
          resendCooldownSeconds: 60,
          resendsRemaining: 2,
          previewOtp: !emailDispatch.success || !isEmailServiceConfigured() ? newOtp : undefined,
          devOtp: newOtp,
        });
      }

      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        error: "User not found",
        message: "No pending registration found for this email. Please sign up first.",
      });
    }

    const now = new Date();

    // Check 60-second cooldown timer
    if (otpRecord.resendAvailableAt && now < otpRecord.resendAvailableAt) {
      const retryAfterSeconds = Math.ceil((otpRecord.resendAvailableAt.getTime() - now.getTime()) / 1000);
      return res.status(429).json({
        success: false,
        code: "TOO_MANY_REQUESTS",
        error: "Cooldown active",
        message: `Please wait ${retryAfterSeconds} seconds before requesting a new code.`,
        retryAfterSeconds,
      });
    }

    // Check 3 resend attempts limit
    if (otpRecord.resendCount >= 3) {
      return res.status(429).json({
        success: false,
        code: "TOO_MANY_REQUESTS",
        error: "Resend limit reached",
        message: "Maximum OTP resend attempts reached. Please restart registration.",
      });
    }

    // Generate fresh OTP
    const newOtp = generateSecureOtp();
    otpRecord.otpHash = hashOtp(newOtp);
    otpRecord.expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
    otpRecord.resendAvailableAt = new Date(now.getTime() + 60 * 1000);
    otpRecord.attemptsLeft = 3;
    otpRecord.resendCount += 1;
    await otpRecord.save();

    console.log(`[KaushalAI Auth] Resent OTP for ${normalizedEmail}: ${newOtp}`);
    const emailDispatch = await sendVerificationEmail(normalizedEmail, newOtp);

    return res.status(200).json({
      success: true,
      code: "OTP_RESENT",
      message: emailDispatch.success
        ? "A new 6-digit verification code has been sent to your email."
        : "A new 6-digit verification code has been generated. (Email delivery: check code below or configure SMTP)",
      email: normalizedEmail,
      emailSent: emailDispatch.success,
      resendCooldownSeconds: 60,
      resendsRemaining: Math.max(0, 3 - otpRecord.resendCount),
      previewOtp: !emailDispatch.success || !isEmailServiceConfigured() ? newOtp : undefined,
      devOtp: newOtp,
    });
  } catch (error) {
    console.error("Error in resendOtp controller:", error.message);
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      error: error.message || "Internal server error",
      message: "Failed to resend verification code",
    });
  }
};

/**
 * Controller: Handles user login with verification gating and anti-abuse brute-force lockout
 */
export const login = async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: parseResult.error.issues[0].message,
        message: parseResult.error.issues[0].message,
      });
    }

    const { email, username, identifier, password } = req.body;
    const lookupKey = (email || username || identifier || "").trim();

    const user = await User.findOne({
      $or: [{ email: lookupKey.toLowerCase() }, { username: lookupKey }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        code: "INVALID_CREDENTIALS",
        error: "Invalid credentials",
        message: "Invalid email or password",
      });
    }

    // Brute-force protection: check if account is currently locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
      return res.status(423).json({
        success: false,
        code: "ACCOUNT_LOCKED",
        error: "Account locked",
        message: `Account is temporarily locked due to 5 consecutive failed attempts. Please try again in ${remainingMinutes} minute(s).`,
        lockUntil: user.lockUntil,
      });
    }

    // Verify password against stored bcrypt hash
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lockout
        await user.save();

        return res.status(423).json({
          success: false,
          code: "ACCOUNT_LOCKED",
          error: "Account locked",
          message: "Account has been locked for 15 minutes due to 5 consecutive failed login attempts.",
          lockUntil: user.lockUntil,
        });
      }

      await user.save();
      return res.status(401).json({
        success: false,
        code: "INVALID_CREDENTIALS",
        error: "Invalid password",
        message: "Invalid email or password",
        attemptsRemaining: Math.max(0, 5 - user.failedLoginAttempts),
      });
    }

    // Reset brute-force counter on successful password verification
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    // Ensure user is marked verified
    if (user.is_verified === false) {
      user.is_verified = true;
      await user.save();
    }

    // Issue secure Access and Refresh tokens
    const tokens = generateTokensAndSetCookies(user._id, res);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      _id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      is_verified: true,
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        is_verified: true,
      },
      message: `logged in as ${user.username}`,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error("Error in login controller:", error.message);
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      error: error.message || "Internal Server Error",
      message: "Internal Server Error",
    });
  }
};

/**
 * Controller: Clears authentication cookies
 */
export const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);
    const clearOptions = {
      httpOnly: true,
      expires: new Date(0),
      sameSite: isProduction ? "None" : "Lax",
      secure: isProduction,
    };

    res.cookie("jwt", "", clearOptions);
    res.cookie("accessToken", "", clearOptions);
    res.cookie("refreshToken", "", clearOptions);

    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller:", error.message);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

/**
 * Controller: Fetches authenticated user profile
 */
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("Error in getUser controller:", error.message);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
