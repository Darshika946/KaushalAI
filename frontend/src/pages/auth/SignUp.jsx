import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "../../config/api";

const signupFormSchema = z
  .object({
    name: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(50, "Full name cannot exceed 50 characters"),
    email: z
      .string()
      .email("Please enter a valid email address")
      .toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[a-z]/, "Must contain at least 1 lowercase letter")
      .regex(/[A-Z]/, "Must contain at least 1 uppercase letter")
      .regex(/[0-9]/, "Must contain at least 1 digit")
      .regex(/[!@#$%^&*]/, "Must contain at least 1 special symbol (!@#$%^&*)"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const SignUp = () => {
  const [step, setStep] = useState(1);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(60);
  const [ttlSeconds, setTtlSeconds] = useState(300);
  const [serverError, setServerError] = useState("");
  const [serverInfo, setServerInfo] = useState("");
  const [fallbackOtp, setFallbackOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otpInputsRef = useRef([]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupFormSchema),
    mode: "onChange",
  });

  const watchedPassword = watch("password", "");
  const watchedConfirmPassword = watch("confirmPassword", "");

  // Password strength meter calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "None", color: "bg-gray-200" };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[!@#$%^&*]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: "Weak", color: "bg-red-500", text: "text-red-600" };
      case 2:
        return { score: 2, label: "Fair", color: "bg-orange-400", text: "text-orange-500" };
      case 3:
        return { score: 3, label: "Good", color: "bg-yellow-400", text: "text-yellow-600" };
      case 4:
        return { score: 4, label: "Strong", color: "bg-green-500", text: "text-green-600" };
      default:
        return { score: 0, label: "Very Weak", color: "bg-red-400", text: "text-red-500" };
    }
  };

  const passwordStrength = getPasswordStrength(watchedPassword);

  // Real-time inline confirm password match check
  const isConfirmFilled = watchedConfirmPassword.length > 0;
  const isPasswordMatching =
    isConfirmFilled && watchedPassword === watchedConfirmPassword;
  const isPasswordMismatched =
    isConfirmFilled && watchedPassword !== watchedConfirmPassword;

  // Step 2 Countdown Timer
  useEffect(() => {
    let timer;
    if (step === 2) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        setTtlSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  // Step 1: Submit primary details and trigger OTP
  const onSignupSubmit = async (formData) => {
    setServerError("");
    setServerInfo("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || data.error || "Signup failed");
      } else {
        setRegisteredEmail(formData.email.trim().toLowerCase());
        setCooldown(data.resendCooldownSeconds || 60);
        setTtlSeconds(data.expiresInSeconds || 300);
        if (data.previewOtp || data.devOtp) {
          setFallbackOtp(data.previewOtp || data.devOtp);
        }
        setServerInfo(data.message || "A 6-digit OTP code has been sent to your email.");
        setStep(2);
      }
    } catch (err) {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Segmented OTP Input Handling
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = digit;
    setOtpValues(newOtp);

    // Auto-focus next input box
    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        otpInputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otpValues];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtpValues(newOtp);

    const targetIndex = Math.min(pasted.length, 5);
    otpInputsRef.current[targetIndex]?.focus();
  };

  // Step 2: Verify OTP
  const onVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setServerInfo("");
    const fullOtp = otpValues.join("");

    if (fullOtp.length !== 6) {
      setServerError("Please enter all 6 digits of the OTP.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: registeredEmail,
          otp: fullOtp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || data.error || "OTP verification failed");
      } else {
        await queryClient.invalidateQueries({ queryKey: ["authUser"] });
        navigate("/home");
      }
    } catch (err) {
      setServerError("Failed to verify OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Resend OTP
  const onResendOtpClick = async () => {
    if (cooldown > 0 || isSubmitting) return;
    setServerError("");
    setServerInfo("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: registeredEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || data.error || "Failed to resend OTP");
      } else {
        setCooldown(data.resendCooldownSeconds || 60);
        setTtlSeconds(300);
        setOtpValues(["", "", "", "", "", ""]);
        if (data.previewOtp || data.devOtp) {
          setFallbackOtp(data.previewOtp || data.devOtp);
        }
        setServerInfo(data.message || "A fresh 6-digit OTP code has been sent.");
        otpInputsRef.current[0]?.focus();
      }
    } catch (err) {
      setServerError("Failed to resend code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Circular progress calculation for cooldown timer (radius 18, circumference ~113.1)
  const circleCircumference = 2 * Math.PI * 18;
  const cooldownOffset =
    circleCircumference - (cooldown / 60) * circleCircumference;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4">
      <div className="bg-white p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300">
        {/* Header Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo.svg"
            alt="KaushalAI Logo"
            className="h-12 sm:h-14 md:h-16 w-auto object-contain"
          />
        </div>

        {step === 1 ? (
          <>
            <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-2 tracking-tight">
              Create an Account
            </h2>
            <p className="text-center text-gray-500 text-sm mb-6">
              Step 1 of 2: Primary Account Credentials
            </p>

            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSignupSubmit)}
              noValidate
            >
              {/* Full Name Field */}
              <div>
                <label
                  htmlFor="name-input"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Full Name *
                </label>
                <input
                  id="name-input"
                  type="text"
                  placeholder="e.g. Aditi Sharma"
                  {...register("name")}
                  className={`w-full p-3.5 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 text-gray-800 text-base transition-all ${
                    errors.name
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-200 focus:ring-blue-400 focus:border-blue-500"
                  }`}
                  aria-invalid={errors.name ? "true" : "false"}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
                {errors.name && (
                  <p
                    id="name-error"
                    role="alert"
                    className="text-red-500 text-xs mt-1 font-medium"
                  >
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email Address Field */}
              <div>
                <label
                  htmlFor="email-input"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Email Address *
                </label>
                <input
                  id="email-input"
                  type="email"
                  placeholder="name@example.com"
                  {...register("email")}
                  className={`w-full p-3.5 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 text-gray-800 text-base transition-all ${
                    errors.email
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-200 focus:ring-blue-400 focus:border-blue-500"
                  }`}
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p
                    id="email-error"
                    role="alert"
                    className="text-red-500 text-xs mt-1 font-medium"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field with Strength Meter */}
              <div>
                <label
                  htmlFor="password-input"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Password *
                </label>
                <input
                  id="password-input"
                  type="password"
                  placeholder="Min. 8 chars with uppercase, lowercase, number, & symbol"
                  {...register("password")}
                  className={`w-full p-3.5 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 text-gray-800 text-base transition-all ${
                    errors.password
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-200 focus:ring-blue-400 focus:border-blue-500"
                  }`}
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby="password-strength"
                />

                {/* Password Strength Meter */}
                {watchedPassword && (
                  <div id="password-strength" className="mt-2" aria-live="polite">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-gray-500 font-medium">Strength:</span>
                      <span className={`font-semibold ${passwordStrength.text}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                      <div
                        className={`rounded-full transition-all duration-300 ${
                          passwordStrength.score >= 1
                            ? passwordStrength.color
                            : "bg-gray-200"
                        }`}
                      />
                      <div
                        className={`rounded-full transition-all duration-300 ${
                          passwordStrength.score >= 2
                            ? passwordStrength.color
                            : "bg-gray-200"
                        }`}
                      />
                      <div
                        className={`rounded-full transition-all duration-300 ${
                          passwordStrength.score >= 3
                            ? passwordStrength.color
                            : "bg-gray-200"
                        }`}
                      />
                      <div
                        className={`rounded-full transition-all duration-300 ${
                          passwordStrength.score >= 4
                            ? passwordStrength.color
                            : "bg-gray-200"
                        }`}
                      />
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p role="alert" className="text-red-500 text-xs mt-1 font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Field with Real-Time Inline Match Indicator */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label
                    htmlFor="confirm-password-input"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Confirm Password *
                  </label>
                  {isConfirmFilled && (
                    <span
                      aria-live="polite"
                      className={`text-xs font-semibold flex items-center gap-1 ${
                        isPasswordMatching ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isPasswordMatching ? (
                        <>
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Passwords match
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Passwords do not match
                        </>
                      )}
                    </span>
                  )}
                </div>

                <input
                  id="confirm-password-input"
                  type="password"
                  placeholder="Re-enter your password"
                  {...register("confirmPassword")}
                  className={`w-full p-3.5 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 text-gray-800 text-base transition-all ${
                    isPasswordMismatched
                      ? "border-red-400 focus:ring-red-200"
                      : isPasswordMatching
                      ? "border-green-400 focus:ring-green-200"
                      : "border-gray-200 focus:ring-blue-400 focus:border-blue-500"
                  }`}
                  aria-invalid={isPasswordMismatched ? "true" : "false"}
                />

                {errors.confirmPassword && (
                  <p role="alert" className="text-red-500 text-xs mt-1 font-medium">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isPasswordMismatched}
                aria-busy={isSubmitting}
                className="w-full bg-blue-600 text-white py-3.5 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-semibold text-lg transition-all mt-3 disabled:opacity-50"
              >
                {isSubmitting ? "Validating & Sending OTP..." : "Continue to Verification"}
              </button>
            </form>
          </>
        ) : (
          <div>
            <h2 className="text-2xl font-extrabold text-center text-gray-900 mb-2 tracking-tight">
              Verify Your Email
            </h2>
            <p className="text-center text-gray-600 text-sm mb-4">
              Enter the 6-digit verification code sent to{" "}
              <span className="font-semibold text-gray-800">{registeredEmail}</span>. Code expires
              in{" "}
              <span className="font-semibold text-blue-600">
                {Math.floor(ttlSeconds / 60)}:{String(ttlSeconds % 60).padStart(2, "0")}
              </span>
            </p>

            {fallbackOtp && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 text-center mb-5 shadow-sm">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-0.5">
                  Verification Code
                </p>
                <p className="text-3xl font-mono font-extrabold text-blue-900 tracking-widest my-1">
                  {fallbackOtp}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const digits = fallbackOtp.split("").slice(0, 6);
                    setOtpValues(digits);
                    otpInputsRef.current[5]?.focus();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline mt-1"
                >
                  Click to auto-fill code
                </button>
              </div>
            )}

            <form className="flex flex-col gap-5" onSubmit={onVerifyOtpSubmit}>
              {/* 6-Digit Segmented OTP Input Box */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                  6-Digit Verification Code
                </label>
                <div
                  className="flex justify-center gap-2 sm:gap-3"
                  onPaste={handleOtpPaste}
                >
                  {otpValues.map((val, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-14 sm:w-12 sm:h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900 transition-all"
                      aria-label={`Digit ${idx + 1} of verification code`}
                    />
                  ))}
                </div>
              </div>

              {/* Verify Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || otpValues.join("").length !== 6}
                aria-busy={isSubmitting}
                className="w-full bg-blue-600 text-white py-3.5 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-semibold text-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Verifying Code..." : "Verify & Activate Account"}
              </button>
            </form>

            {/* Circular Countdown & Resend Section */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Change details
              </button>

              <div className="flex items-center gap-2">
                {/* Circular 60-Second Countdown Graphic */}
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <svg className="w-10 h-10 transform -rotate-90">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      stroke="#E5E7EB"
                      strokeWidth="3"
                      fill="transparent"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      stroke={cooldown > 0 ? "#2563EB" : "#9CA3AF"}
                      strokeWidth="3"
                      fill="transparent"
                      strokeDasharray={circleCircumference}
                      strokeDashoffset={cooldownOffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <span className="absolute text-xs font-semibold text-gray-700">
                    {cooldown}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onResendOtpClick}
                  disabled={cooldown > 0 || isSubmitting}
                  className={`text-sm font-semibold transition-all ${
                    cooldown > 0
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-blue-600 hover:text-blue-800 underline"
                  }`}
                >
                  Resend OTP
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Error & Info Announcements */}
        {serverError && (
          <div
            role="alert"
            aria-live="assertive"
            className="text-red-600 text-sm text-center mt-4 font-medium bg-red-50 p-3 rounded-lg border border-red-200"
          >
            {serverError}
          </div>
        )}

        {serverInfo && (
          <div
            aria-live="polite"
            className="text-green-700 text-sm text-center mt-4 font-medium bg-green-50 p-3 rounded-lg border border-green-200"
          >
            {serverInfo}
          </div>
        )}

        {/* Back to Login Link */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;