import jwt from "jsonwebtoken";

/**
 * Generates secure Access and Refresh tokens, sets HttpOnly cookies,
 * and returns tokens for authorization headers or client-side use.
 *
 * @param {string|mongoose.Types.ObjectId} userId 
 * @param {express.Response} res 
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export const generateTokensAndSetCookies = (userId, res) => {
  const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);

  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET || "kaushalai_jwt_secret",
    { expiresIn: "1h" }
  );

  const refreshToken = jwt.sign(
    { userId, type: "refresh" },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "kaushalai_jwt_secret",
    { expiresIn: "15d" }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
  };

  // Primary JWT / Access token cookie (legacy and standard)
  res.cookie("jwt", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days cookie lifetime
  });

  // Access token cookie
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 1000, // 1 hour
  });

  // Refresh token cookie
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
  });

  return { accessToken, refreshToken };
};

export const generateTokenAndSetCookie = (userId, res) => {
  return generateTokensAndSetCookies(userId, res).accessToken;
};

export default generateTokenAndSetCookie;
