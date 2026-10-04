import jwt from 'jsonwebtoken';

const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });

  const isProduction = process.env.NODE_ENV === "production" || !!process.env.RENDER;

  res.cookie("jwt", token, {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: isProduction, // must be true for cross-site cookies over https
    sameSite: isProduction ? "None" : "Lax", // None required for cross-site cookies between Vercel and Render
  });
};

export default generateTokenAndSetCookie;
