import { Router } from "express";
import { signup, login, getProfile, updateProfile } from "../controllers/authController.js";
import { protect } from "../middleware/Protect.js";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = Router();

// ================== UPLOAD DIRECTORY SETUP ==================
const uploadDir = path.join(path.resolve(), "uploads", "profiles");

// Create directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("✅ Created profiles upload directory:", uploadDir);
}

// ================== MULTER STORAGE CONFIG ==================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("📁 Multer destination:", uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const userId = req.user?.id || "guest";
    const filename = `${userId}-${uniqueSuffix}${path.extname(file.originalname)}`;
    console.log("📸 Generated filename:", filename);
    cb(null, filename);
  },
});

// ================== FILE FILTER ==================
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    console.log("✅ File accepted:", file.originalname);
    cb(null, true);
  } else {
    console.log("❌ File rejected:", file.originalname, "- Invalid type");
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

// ================== MULTER INSTANCE ==================
const upload = multer({
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1 // Only one file allowed
  },
  fileFilter,
});

// ================== ERROR HANDLER FOR MULTER ==================
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: "File too large. Maximum size is 5MB",
        error: err.message
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: "Too many files. Only 1 file allowed",
        error: err.message
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: "Unexpected field name. Use 'photo' as field name",
        error: err.message
      });
    }
    return res.status(400).json({
      message: "File upload error",
      error: err.message
    });
  } else if (err) {
    // Other errors (like file type validation)
    return res.status(400).json({
      message: err.message || "Error uploading file",
      error: err.message
    });
  }
  next();
};

// ================== ROUTES ==================

// Public routes (no authentication required)
router.post("/signup", signup);
router.post("/login", login);

// Protected routes (authentication required)
router.get("/profile", protect, getProfile);

// Profile update with photo upload
router.put(
  "/update-profile", 
  protect, 
  upload.single("photo"), 
  handleMulterError,
  updateProfile
);

// ================== ADDITIONAL USEFUL ROUTES ==================

// Get user by ID (admin or self only)
router.get("/:id", protect, async (req, res) => {
  try {
    // Import User model at the top if using this route
    // import User from "../models/User.js";
    
    const User = (await import("../models/User.js")).default;
    
    // Check if requesting own profile or if admin
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ 
        message: "Access denied. You can only view your own profile." 
      });
    }

    const user = await User.findById(req.params.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ 
      message: "Error fetching user", 
      error: error.message 
    });
  }
});

// Delete profile photo
router.delete("/profile/photo", protect, async (req, res) => {
  try {
    const User = (await import("../models/User.js")).default;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete photo file if it exists and is not default
    if (user.photo && user.photo !== "" && !user.photo.startsWith("http")) {
      const photoPath = path.join(uploadDir, user.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
        console.log("✅ Deleted photo:", photoPath);
      }
    }

    // Update user in database
    user.photo = "";
    await user.save();

    res.status(200).json({ 
      message: "✅ Profile photo deleted successfully",
      user: user.toJSON()
    });
  } catch (error) {
    console.error("Error deleting photo:", error);
    res.status(500).json({ 
      message: "Error deleting photo", 
      error: error.message 
    });
  }
});

// Change password (for email/password users only)
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const User = (await import("../models/User.js")).default;
    const bcrypt = (await import("bcryptjs")).default;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Current password and new password are required" 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        message: "New password must be at least 8 characters long" 
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has a password (Google OAuth users don't)
    if (!user.password) {
      return res.status(400).json({ 
        message: "Cannot change password for Google OAuth accounts" 
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        message: "Current password is incorrect" 
      });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ 
      message: "✅ Password changed successfully" 
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ 
      message: "Error changing password", 
      error: error.message 
    });
  }
});

// Get all users (admin only)
router.get("/", protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        message: "Access denied. Admin only." 
      });
    }

    const User = (await import("../models/User.js")).default;
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });

    res.status(200).json({ 
      count: users.length,
      users 
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ 
      message: "Error fetching users", 
      error: error.message 
    });
  }
});

export default router;