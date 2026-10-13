import React, { useState } from "react";
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
  const [serverError, setServerError] = useState("");
  const [serverSuccess, setServerSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Submit handler: Direct registration without OTP
  const onSignupSubmit = async (formData) => {
    setServerError("");
    setServerSuccess("");
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
        setServerSuccess("Account created successfully! Redirecting...");
        await queryClient.invalidateQueries({ queryKey: ["authUser"] });
        setTimeout(() => {
          navigate("/home");
        }, 500);
      }
    } catch (err) {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-2 tracking-tight">
          Create an Account
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          Join KaushalAI and start your career upskilling journey
        </p>

        {serverError && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4"
          >
            {serverError}
          </div>
        )}

        {serverSuccess && (
          <div
            role="status"
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4"
          >
            {serverSuccess}
          </div>
        )}

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
            {isSubmitting ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="text-center mt-6 text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 font-semibold hover:underline"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;