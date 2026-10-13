import User from "../models/user.model.js";
import jwt from "jsonwebtoken"

export const protectRoute = async (req, res, next) => {
    try {
        const token =
          req.cookies.jwt ||
          req.cookies.accessToken ||
          (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
            ? req.headers.authorization.split(" ")[1]
            : null);
        if(!token) {
            return res.status(401).json({error: "Unauthorized: no token provided"});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(!decoded){
            return res.status(401).json({error: "Unauthorized: invalid token"});
        }

        const user = await User.findById(decoded.userId).select("-password");
        console.log(decoded);
        if(!user){
            return res.status(401).json({error: "Unauthorized: user not found"});
        }
        req.user = user;
        next();
    } catch (error) {
        console.log('Error in protectRoute', error);
        res.status(500).json({error: "Internal Server Error"});
    }
}