import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdOutlineMail, MdPassword } from "react-icons/md";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "../../config/api";
import "./LoginPage.css";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: formData.identifier,
          username: formData.identifier,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "ACCOUNT_NOT_VERIFIED") {
          setUnverifiedEmail(data.email || formData.identifier);
          setErrorMessage(data.message || "Account not verified. Please enter the OTP sent to your email.");
        } else {
          setErrorMessage(data.message || data.error || "Login failed");
        }
      } else {
        await queryClient.invalidateQueries({ queryKey: ["authUser"] });
        navigate("/home");
      }
    } catch (err) {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: unverifiedEmail,
          otp: otpCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.message || data.error || "OTP verification failed");
      } else {
        await queryClient.invalidateQueries({ queryKey: ["authUser"] });
        navigate("/home");
      }
    } catch (err) {
      setOtpError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        {!unverifiedEmail ? (
          <form className="flex gap-4 flex-col" onSubmit={handleLoginSubmit}>
            <div className="logo-container mb-2" style={{ textAlign: "center" }}>
              <img
                src="/logo.svg"
                alt="KaushalAI Logo"
                className="h-12 sm:h-14 md:h-16 w-auto object-contain mx-auto"
              />
            </div>

            <h1 className="login-header">Login</h1>

            <label className="input-field">
              <MdOutlineMail />
              <input
                type="text"
                placeholder="Email or Username"
                name="identifier"
                onChange={handleInputChange}
                value={formData.identifier}
                required
              />
            </label>

            <label className="input-field">
              <MdPassword />
              <input
                type="password"
                placeholder="Password"
                name="password"
                onChange={handleInputChange}
                value={formData.password}
                required
              />
            </label>

            <button className="login-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login"}
            </button>

            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </form>
        ) : (
          <form className="flex gap-4 flex-col" onSubmit={handleVerifyOtp}>
            <div className="logo-container mb-2" style={{ textAlign: "center" }}>
              <img
                src="/logo.svg"
                alt="KaushalAI Logo"
                className="h-12 sm:h-14 md:h-16 w-auto object-contain mx-auto"
              />
            </div>

            <h1 className="login-header">Verify Account</h1>
            <p className="text-center text-sm text-gray-600">
              Enter the 6-digit OTP code sent to{" "}
              <span className="font-semibold">{unverifiedEmail}</span>
            </p>

            <label className="input-field">
              <input
                type="text"
                maxLength="6"
                placeholder="6-digit OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "4px" }}
                required
              />
            </label>

            <button
              className="login-button"
              type="submit"
              disabled={isSubmitting || otpCode.length !== 6}
            >
              {isSubmitting ? "Verifying..." : "Verify & Sign In"}
            </button>

            {otpError && <p className="error-message">{otpError}</p>}

            <button
              type="button"
              onClick={() => setUnverifiedEmail(null)}
              className="text-sm text-blue-600 underline mt-2 text-center"
            >
              Back to login
            </button>
          </form>
        )}

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
