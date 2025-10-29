import User from "../models/User.js";

// 🔍 Search user by name
export const searchUserByName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Name is required for search" });
    }

    const users = await User.find({
      name: { $regex: name, $options: "i" }, // case-insensitive
    }).select("name email contact");

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.json(users);
  } catch (err) {
    console.error("❌ Contact search error:", err);
    res.status(500).json({ message: "Server error while searching contacts" });
  }
};
