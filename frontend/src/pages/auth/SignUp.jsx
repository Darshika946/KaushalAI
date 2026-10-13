import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "../../config/api";

const SignUp = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  // OTP Verification state
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(60);
  const [ttlSeconds, setTtlSeconds] = useState(300);

  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Immediate mismatch validation
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordMismatch(true);
    } else {
      setPasswordMismatch(false);
    }
  }, [password, confirmPassword]);

  // Timers for OTP screen
  useEffect(() => {
    let timer;
    if (isOtpStep) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        setTtlSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpStep]);

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
          username: username.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || "Signup failed");
      } else {
        setIsOtpStep(true);
        setCooldown(data.resendCooldownSeconds || 60);
        setTtlSeconds(data.expiresInSeconds || 300);
        setInfoMessage(data.message || "A 6-digit OTP code has been sent to your email.");
      }
    } catch (err) {
      setError("Network or server error. Please try again.");
      console.error("Signup Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    if (!otp || otp.trim().length !== 6) {
      setError("Please enter a valid 6-digit OTP code.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || "OTP verification failed");
      } else {
        await queryClient.invalidateQueries({ queryKey: ["authUser"] });
        navigate("/home");
      }
    } catch (err) {
      setError("Failed to verify OTP. Please try again.");
      console.error("Verify OTP Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isLoading) return;
    setError("");
    setInfoMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || "Failed to resend OTP");
      } else {
        setCooldown(data.resendCooldownSeconds || 60);
        setTtlSeconds(300);
        setInfoMessage("A fresh 6-digit OTP has been sent.");
      }
    } catch (err) {
      setError("Failed to resend OTP. Please try again.");
      console.error("Resend OTP Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4">
      <div className="bg-white p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300">
        <div className="flex justify-center mb-6">
          <img
            src="/logo.svg"
            alt="KaushalAI Logo"
            className="h-12 sm:h-14 md:h-16 w-auto object-contain"
          />
        </div>

        {!isOtpStep ? (
          <>
            <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-2 tracking-tight">
              Create an Account
            </h2>
            <p className="text-center text-gray-500 text-sm mb-6">
              Enter your details to register on KaushalAI
            </p>

            <form className="flex flex-col gap-4" onSubmit={handleSignupSubmit}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aditi Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-gray-50 text-gray-800 text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-gray-50 text-gray-800 text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Username (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. aditi_dev"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-gray-50 text-gray-800 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  placeholder="Min. 8 chars with Aa, 1-9, and !@#$"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-gray-50 text-gray-800 text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full p-3.5 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 text-gray-800 text-base transition-all ${
                    passwordMismatch
                      ? "border-red-500 focus:ring-red-300"
                      : "border-gray-200 focus:ring-blue-400 focus:border-blue-500"
                  }`}
                  required
                />
                {passwordMismatch && (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    Passwords do not match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || passwordMismatch}
                className="w-full bg-blue-600 text-white py-3.5 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-semibold text-lg transition-all mt-2 disabled:opacity-50"
              >
                {isLoading ? "Validating..." : "Sign Up & Verify Email"}
              </button>
            </form>
          </>
        ) : (
          <div>
            <h2 className="text-2xl font-extrabold text-center text-gray-900 mb-2 tracking-tight">
              Verify Email Address
            </h2>
            <p className="text-center text-gray-600 text-sm mb-6">
              A 6-digit numeric OTP was sent to{" "}
              <span className="font-semibold text-gray-800">{email}</span>. Code expires in{" "}
              <span className="font-semibold text-blue-600">
                {Math.floor(ttlSeconds / 60)}:
                {String(ttlSeconds % 60).padStart(2, "0")}
              </span>.
            </p>

            <form className="flex flex-col gap-4" onSubmit={handleVerifyOtp}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 text-center">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full p-4 border border-gray-300 rounded-lg text-center tracking-widest text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-blue-600 text-white py-3.5 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-semibold text-lg transition-all mt-2 disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify & Activate Account"}
              </button>
            </form>

            <div className="flex items-center justify-between mt-6 text-sm">
              <button
                type="button"
                onClick={() => setIsOtpStep(false)}
                className="text-gray-500 hover:text-gray-700 underline"
              >
                Change details
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={cooldown > 0 || isLoading}
                className={`font-semibold ${
                  cooldown > 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-blue-600 hover:text-blue-700"
                }`}
              >
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm text-center mt-4 font-medium bg-red-50 p-2.5 rounded-lg border border-red-200">
            {error}
          </p>
        )}

        {infoMessage && (
          <p className="text-green-700 text-sm text-center mt-4 font-medium bg-green-50 p-2.5 rounded-lg border border-green-200">
            {infoMessage}
          </p>
        )}

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