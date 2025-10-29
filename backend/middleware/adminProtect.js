import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const adminProtect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Not authorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== "admin") {
      console.log("Access denied. User role:", user.role);
      return res.status(403).json({ message: "Access denied, admins only" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("adminProtect error:", err);
    res.status(401).json({ message: "Unauthorized" });
  }
};
