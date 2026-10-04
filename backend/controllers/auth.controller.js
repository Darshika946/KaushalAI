import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../lib/utils/generateTokenAndSetCookie.js";
import User from "../models/user.model.js";

export const signup = async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    console.log("Signup request body:", req.body); // Debug

    // Field validation
    if (!username || !email || !password || !name) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username,
      password: hashedPassword,
      email,
      name,
    });

    await user.save();
    generateTokenAndSetCookie(user._id, res);

    return res.status(201).json({
      success: true,
      _id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error(`Error in signup controller: ${error.message}`);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: "Username and password are required", message: "Username and password are required" });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found", message: "User not found" });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: "Invalid password", message: "Invalid password" });
    }
    generateTokenAndSetCookie(user._id, res);
    return res.status(200).json({
      success: true,
      _id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      message: `logged in as ${user.username}`,
    });
  } catch (error) {
    console.error(`error in login controller: ${error.message}`);
    return res.status(500).json({ success: false, error: "Internal Server Error", message: "Internal Server Error" });
  }
};

export const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production" || !!process.env.RENDER;
    res.cookie("jwt", "", {
      httpOnly: true,
      expires: new Date(0),
      sameSite: isProduction ? "None" : "Lax",
      secure: isProduction,
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getuser controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
