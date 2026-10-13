import nodemailer from "nodemailer";

/**
 * Checks if email transport is configured in environment variables
 * @returns {boolean}
 */
export const isEmailServiceConfigured = () => {
  return Boolean(
    (process.env.EMAIL_USER && process.env.EMAIL_PASS) ||
    (process.env.SMTP_USER && process.env.SMTP_PASS) ||
    (process.env.SMTP_HOST && process.env.SMTP_PORT)
  );
};

/**
 * Creates a nodemailer transporter from environment variables
 */
const getTransporter = () => {
  if (process.env.EMAIL_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER || process.env.SMTP_USER,
        pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
      },
    });
  }

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
    });
  }

  // Fallback default: Gmail if user/pass exists
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return null;
};

/**
 * Dispatches a 6-digit OTP email to the recipient
 * @param {string} toEmail 
 * @param {string} otp 
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const sendVerificationEmail = async (toEmail, otp) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(
      `[KaushalAI Email] SMTP not configured. OTP for ${toEmail}: ${otp} (Displayed on screen fallback)`
    );
    return {
      success: false,
      isConfigured: false,
      message: "SMTP transporter not configured on server",
    };
  }

  const senderAddress =
    process.env.EMAIL_FROM ||
    process.env.EMAIL_USER ||
    process.env.SMTP_USER ||
    "noreply@kaushalai.com";

  const mailOptions = {
    from: `"KaushalAI Support" <${senderAddress}>`,
    to: toEmail,
    subject: `${otp} is your KaushalAI verification code`,
    text: `Your KaushalAI 6-digit verification code is: ${otp}. It will expire in 5 minutes.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2563eb; font-size: 26px; font-weight: 800; margin: 0;">KaushalAI</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Empowering Skills with AI</p>
        </div>
        <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-bottom: 12px; text-align: center;">Verify Your Email Address</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.5; text-align: center; margin-bottom: 24px;">
          Use the 6-digit verification code below to complete your registration or login on KaushalAI:
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; letter-spacing: 8px; font-size: 34px; font-weight: 800; color: #1e293b; background-color: #f1f5f9; padding: 16px 28px; border-radius: 10px; border: 1px dashed #cbd5e1;">
            ${otp}
          </div>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center; margin-top: 24px;">
          This code is strictly valid for <strong>5 minutes</strong>. If you did not request this verification code, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
          &copy; ${new Date().getFullYear()} KaushalAI. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[KaushalAI Email] Verification email dispatched to ${toEmail}: ${info.messageId}`);
    return { success: true, isConfigured: true, message: "Email sent successfully" };
  } catch (error) {
    console.error(`[KaushalAI Email] Failed to send email to ${toEmail}:`, error.message);
    return { success: false, isConfigured: true, message: error.message };
  }
};
