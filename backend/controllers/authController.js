
// ============================================
// 2. AUTH CONTROLLER (controllers/authController.js)
// ============================================
import User from "../models/User.js";
import { hash, compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import fs from "fs";
import path from "path";

// -------------------- SIGNUP --------------------
export async function signup(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!email.endsWith("@nec.edu.in")) {
      return res.status(400).json({ message: "❌ Please use a valid @nec.edu.in email address." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "❌ Email already in use" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "❌ Username already taken" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "❌ Password must be at least 8 characters long." });
    }

    const hashedPassword = await hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: "user",
    });

    await user.save();

    const token = sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const { password: _, ...userData } = user._doc;

    return res.status(201).json({
      message: "✅ Account created successfully! Redirecting to login...",
      user: userData,
      token,
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({
      message: "❌ Server error. Try again later.",
      error: err.message,
    });
  }
}

// -------------------- LOGIN --------------------
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const { password: _, ...userData } = user._doc;

    return res.status(200).json({
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      message: "Server error. Try again later.",
      error: err.message,
    });
  }
}

// -------------------- GET PROFILE --------------------
export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}

// -------------------- UPDATE PROFILE --------------------
export async function updateProfile(req, res) {
  try {
    const { name, contact, department, year } = req.body;
    const userId = req.user.id;

    console.log("Update Profile Request:", { name, contact, department, year, userId });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare update data
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (contact !== undefined) updateData.contact = contact;
    if (department !== undefined) updateData.department = department;
    if (year !== undefined) updateData.year = year;

    // Handle photo upload
    if (req.file) {
      // Delete old photo if exists
      if (user.photo) {
        const oldPhotoPath = path.join(path.resolve(), "uploads", "profiles", user.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
          console.log("Old photo deleted:", oldPhotoPath);
        }
      }
      // Save new photo filename
      updateData.photo = req.file.filename;
      console.log("New photo uploaded:", req.file.filename);
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    console.log("Updated User:", updatedUser);

    return res.status(200).json({
      message: "✅ Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      message: "❌ Error updating profile",
      error: error.message,
    });
  }
}