import React, { useState } from "react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setServerError(data.message || data.error || "Login failed");
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

        <h1 className="login-header">Login</h1>

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
          {serverError && (
            <p
              role="alert"
              aria-live="assertive"
              className="error-message"
            >
              {serverError}
            </p>
          )}
        </form>

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
