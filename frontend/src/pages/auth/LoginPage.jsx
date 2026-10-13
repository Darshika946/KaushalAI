import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MdOutlineMail, MdPassword, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "../../config/api";
import "./LoginPage.css";

const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, "Email or username is required")
    .trim(),
  password: z
    .string()
    .min(1, "Password is required"),
});

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP Verification Modal / Step state for unverified accounts
  const [showOtpView, setShowOtpView] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const otpInputsRef = useRef([]);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginFormSchema),
    mode: "onBlur",
  });

  const onLoginSubmit = async (formData) => {
    setServerError("");
    setUnverifiedEmail(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          username: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "ACCOUNT_NOT_VERIFIED") {
          setUnverifiedEmail(data.email || formData.email);
          setServerError("Your account is not verified. Please verify your email to continue.");
        } else {
          setServerError(data.message || data.error || "Login failed");
        }
      } else {
        await queryClient.invalidateQueries({ queryKey: ["authUser"] });
        navigate("/home");
      }
    } catch (err) {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Segmented OTP input handlers for unverified account verification
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = digit;
    setOtpValues(newOtp);

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
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

  const onVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError("");
    setOtpSuccess("");
    const fullOtp = otpValues.join("");

    if (fullOtp.length !== 6) {
      setOtpError("Please enter all 6 digits of the OTP.");
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: unverifiedEmail,
          otp: fullOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.message || data.error || "Verification failed");
      } else {
        setOtpSuccess("Account verified successfully! Logging you in...");
        await queryClient.invalidateQueries({ queryKey: ["authUser"] });
        setTimeout(() => {
          navigate("/home");
        }, 1000);
      }
    } catch (err) {
      setOtpError("Network error during verification. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        {/* Logo */}
        <div className="logo-container mb-2" style={{ textAlign: "center" }}>
          <img
            src="/logo.svg"
            alt="KaushalAI Logo"
            className="h-12 sm:h-14 md:h-16 w-auto object-contain mx-auto"
          />
        </div>

        {!showOtpView ? (
          <>
            <h1 className="login-header">Login</h1>

            {/* Error Banner for Unverified Accounts with direct 'Verify Now' CTA */}
            {unverifiedEmail && (
              <div
                role="alert"
                aria-live="assertive"
                className="bg-amber-50 border border-amber-300 rounded-lg p-3.5 mb-4 text-amber-900 text-sm flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-amber-950">Account Not Verified</p>
                  <p className="text-xs text-amber-800">
                    Your account needs email verification.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOtpView(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-all shadow-sm"
                >
                  Verify Now
                </button>
              </div>
            )}

            <form
              className="flex gap-4 flex-col"
              onSubmit={handleSubmit(onLoginSubmit)}
              noValidate
            >
              {/* Email / Username Input */}
              <div>
                <label className="input-field" htmlFor="login-email">
                  <MdOutlineMail aria-hidden="true" />
                  <input
                    id="login-email"
                    type="text"
                    placeholder="Email or Username"
                    {...register("email")}
                    aria-invalid={errors.email ? "true" : "false"}
                    aria-describedby={errors.email ? "email-login-error" : undefined}
                  />
                </label>
                {errors.email && (
                  <p
                    id="email-login-error"
                    role="alert"
                    className="text-red-500 text-xs mt-1 ml-1 font-medium"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Input with Show/Hide Toggle */}
              <div>
                <label className="input-field relative" htmlFor="login-password">
                  <MdPassword aria-hidden="true" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    {...register("password")}
                    aria-invalid={errors.password ? "true" : "false"}
                    aria-describedby={errors.password ? "password-login-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                  >
                    {showPassword ? (
                      <MdVisibilityOff className="w-5 h-5 text-gray-500" />
                    ) : (
                      <MdVisibility className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </label>
                {errors.password && (
                  <p
                    id="password-login-error"
                    role="alert"
                    className="text-red-500 text-xs mt-1 ml-1 font-medium"
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button with Accessible ARIA announcement */}
              <button
                className="login-button"
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </button>

              {/* Server Error Message */}
              {serverError && !unverifiedEmail && (
                <p
                  role="alert"
                  aria-live="assertive"
                  className="error-message"
                >
                  {serverError}
                </p>
              )}
            </form>
          </>
        ) : (
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-extrabold text-center text-gray-900 mb-1">
              Verify Account
            </h1>
            <p className="text-center text-gray-600 text-sm mb-4">
              Enter the 6-digit OTP code sent to{" "}
              <span className="font-semibold text-gray-800">{unverifiedEmail}</span>
            </p>

            <form onSubmit={onVerifyOtpSubmit} className="flex flex-col gap-4">
              <div
                className="flex justify-center gap-2 sm:gap-3"
                onPaste={handleOtpPaste}
              >
                {otpValues.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900"
                    aria-label={`Digit ${idx + 1} of verification code`}
                  />
                ))}
              </div>

              <button
                className="login-button"
                type="submit"
                disabled={isVerifyingOtp || otpValues.join("").length !== 6}
                aria-busy={isVerifyingOtp}
              >
                {isVerifyingOtp ? "Verifying..." : "Verify & Sign In"}
              </button>

              {otpError && (
                <p role="alert" className="error-message">
                  {otpError}
                </p>
              )}

              {otpSuccess && (
                <p role="status" className="text-green-600 text-sm text-center font-medium">
                  {otpSuccess}
                </p>
              )}

              <button
                type="button"
                onClick={() => setShowOtpView(false)}
                className="text-sm text-blue-600 hover:underline mt-2 text-center"
              >
                Back to login
              </button>
            </form>
          </div>
        )}

        {/* Signup Link */}
        <div className="signup-container">
          <p>Don't have an account?</p>
          <Link to="/signup" className="signup-link">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
