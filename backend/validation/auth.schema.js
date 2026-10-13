import { z } from "zod";

/**
 * Strips HTML tags and normalizes whitespace
 * @param {string} str 
 * @returns {string}
 */
export const sanitizeString = (str) => {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>?/gm, "").trim();
};

const passwordRules = z
  .string({ required_error: "Password is required" })
  .min(8, { message: "Password must be at least 8 characters long" })
  .regex(/[a-z]/, { message: "Password must contain at least 1 lowercase letter" })
  .regex(/[A-Z]/, { message: "Password must contain at least 1 uppercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least 1 digit" })
  .regex(/[!@#$%^&*]/, { message: "Password must contain at least 1 special symbol (!@#$%^&*)" });

export const signupSchema = z
  .object({
    name: z
      .string({ required_error: "Full name is required" })
      .transform(sanitizeString)
      .refine((val) => val.length >= 2 && val.length <= 50, {
        message: "Full name must be between 2 and 50 characters",
      }),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .email({ message: "Invalid email format" })
      .toLowerCase(),
    password: passwordRules,
    confirmPassword: z.string().optional(),
    username: z
      .string()
      .trim()
      .min(3, { message: "Username must be at least 3 characters" })
      .max(30, { message: "Username cannot exceed 30 characters" })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export const verifyOtpSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email({ message: "Invalid email format" })
    .toLowerCase(),
  otp: z
    .string({ required_error: "OTP code is required" })
    .trim()
    .regex(/^\d{6}$/, { message: "OTP must be a 6-digit numeric code" }),
});

export const resendOtpSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email({ message: "Invalid email format" })
    .toLowerCase(),
});

export const loginSchema = z
  .object({
    email: z.string().trim().optional(),
    username: z.string().trim().optional(),
    identifier: z.string().trim().optional(),
    password: z
      .string({ required_error: "Password is required" })
      .min(1, { message: "Password cannot be empty" }),
  })
  .refine((data) => Boolean(data.email || data.username || data.identifier), {
    message: "Email or username is required",
    path: ["email"],
  });
