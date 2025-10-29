import jwt from "jsonwebtoken";
import User from "../models/User.js";

// -------------------- Protect Middleware --------------------
export const protect = async (req, res, next) => {
  let token;

  try {
    const authHeader = req.headers.authorization?.trim();
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");
      if (!user) return res.status(401).json({ message: "User not found" });

      req.user = user; // attach user to request
      return next();
    } else {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

// -------------------- Admin-only Middleware --------------------
export const adminProtect = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized, no user info" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied, admin only" });
  }
  return next();
};


export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};