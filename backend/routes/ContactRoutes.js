import express from "express";
import User from "../models/User.js";  // make sure your User model has name, email, and contact fields

const router = express.Router();

// 🔍 Search user by name
router.get("/search", async (req, res) => {
  try {
    const { name } = req.query;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Name is required for search" });
    }

    // Case-insensitive search using regex
    const users = await User.find({
      name: { $regex: name, $options: "i" },
    }).select("name email contact"); // only return needed fields

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.json(users);
  } catch (err) {
    console.error("❌ Contact search error:", err);
    res.status(500).json({ message: "Server error while searching contacts" });
  }
});

export default router;
