// backend/controllers/adminController.js
import User from "../models/User.js";
import Item from "../models/Item.js";
import Notification from "../models/Notification.js"; // ✅ ADD THIS

// ============ GET ALL USERS ============
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// ============ GET ALL ITEMS (ALL STATUSES) ============
export const getAllItems = async (req, res) => {
  try {
    // ✅ Fetch ALL items regardless of status for admin view
    const items = await Item.find()
      .populate("seller", "name email contact")
      .sort({ createdAt: -1 });

    res.status(200).json(items);
  } catch (error) {
    console.error("❌ Error fetching items:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// ============ APPROVE OR REJECT ITEM ============
export const approveItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'." });
    }

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // ✅ Update status based on action
    item.status = action === "approve" ? "approved" : "rejected";
    await item.save();

    // ✅ CREATE NOTIFICATION FOR USER
    const notificationMessage =
      action === "approve"
        ? `Your item "${item.name}" has been approved and is now visible to other users.`
        : `Your item "${item.name}" has been rejected. Please contact admin for more details.`;

    await Notification.create({
      userId: item.seller,
      type: "item",
      message: notificationMessage,
      isRead: false,
      relatedItemId: item._id,
    });

    console.log(`✅ Notification created for user ${item.seller}: Item ${action}d`);

    res.status(200).json({
      message: `Item ${action}d successfully`,
      item,
    });
  } catch (error) {
    console.error("❌ Error updating item status:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};