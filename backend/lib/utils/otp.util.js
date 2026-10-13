import crypto from "crypto";

/**
 * Generates a cryptographically secure 6-digit numeric OTP
 * @returns {string} 6-digit OTP string
 */
export const generateSecureOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Hashes an OTP using HMAC-SHA256 with the application secret
 * @param {string} otp 
 * @returns {string} Hex encoded hash
 */
export const hashOtp = (otp) => {
  const secret = process.env.JWT_SECRET || "kaushalai_secure_otp_salt";
  return crypto.createHmac("sha256", secret).update(String(otp).trim()).digest("hex");
};

/**
 * Constant-time comparison of OTP against stored hash
 * @param {string} candidateOtp 
 * @param {string} storedHash 
 * @returns {boolean}
 */
export const verifyOtpHash = (candidateOtp, storedHash) => {
  if (!candidateOtp || !storedHash) return false;
  const candidateHash = hashOtp(candidateOtp);
  const candidateBuf = Buffer.from(candidateHash, "hex");
  const storedBuf = Buffer.from(storedHash, "hex");
  if (candidateBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(candidateBuf, storedBuf);
};
