import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import Item from "../models/Item.js";
import { getItems, searchItems, addItem, decrementQuantity } from "../controllers/itemController.js";
import { protect } from "../middleware/Protect.js";

const router = express.Router();

// ============ UPLOADS FOLDER SETUP ============
const uploadsDir = path.join(path.resolve(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// ============ MULTER SETUP ============
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit per file
});

// ---------------- GET ALL ITEMS ----------------
router.get("/", getItems);

// ---------------- ADD NEW ITEM ----------------
router.post("/", protect, upload.array("photos", 3), addItem);

// ---------------- SEARCH ITEMS ----------------
router.post("/search", searchItems);

// ---------------- GET USER'S OWN ITEMS ----------------
router.get("/user/:userId", protect, async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    // Security: Ensure user can only fetch their own items
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    // Fetch all items posted by this user (all statuses: pending, approved, rejected)
    const items = await Item.find({ seller: userId })
      .populate("seller", "name email contact department year photo") // ✅ Added photo
      .sort({ createdAt: -1 });

    console.log(`✅ Fetched ${items.length} items for user ${userId}`);
    res.status(200).json(items);
  } catch (error) {
    console.error("❌ Error fetching user items:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// ---------------- UPDATE ITEM (Only for pending items) ----------------
router.put("/:itemId", protect, upload.array("photos", 3), async (req, res) => {
  try {
    const { itemId } = req.params;

    // Validate itemId
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: "Invalid itemId" });
    }

    // Find the item
    const item = await Item.findById(itemId);
    
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Security: Ensure user owns the item
    if (item.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized: You can only edit your own items" });
    }

    // Only allow editing if status is pending
    if (item.status !== "pending") {
      return res.status(403).json({ 
        error: `Cannot edit ${item.status} items. Only pending items can be edited.` 
      });
    }

    // Update fields
    const { name, price, quantity, yearsUsed, deliveryOption, description } = req.body;
    
    if (name) item.name = name;
    if (price) item.price = Number(price);
    if (quantity !== undefined) item.quantity = Number(quantity);
    if (yearsUsed) item.yearsUsed = Number(yearsUsed);
    if (deliveryOption) item.deliveryOption = deliveryOption;
    if (description !== undefined) item.description = description;

    // Handle new photos if uploaded
    if (req.files && req.files.length > 0) {
      // Delete old photos from disk
      if (item.photos && item.photos.length > 0) {
        item.photos.forEach(photo => {
          const photoPath = path.join(uploadsDir, photo);
          if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
            console.log(`🗑️ Deleted old photo: ${photo}`);
          }
        });
      }
      // Add new photos
      item.photos = req.files.map(file => file.filename);
      console.log(`📸 Added ${req.files.length} new photo(s)`);
    }

    await item.save();

    // Return populated item
    const populatedItem = await Item.findById(itemId)
      .populate("seller", "name email contact department year photo"); // ✅ Added photo

    console.log(`✅ Item updated successfully: ${item.name}`);
    
    res.status(200).json({
      message: "Item updated successfully",
      item: populatedItem
    });
  } catch (error) {
    console.error("❌ Error updating item:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// ---------------- DELETE ITEM (Only for pending items) ----------------
router.delete("/:itemId", protect, async (req, res) => {
  try {
    const { itemId } = req.params;

    // Validate itemId
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: "Invalid itemId" });
    }

    // Find the item
    const item = await Item.findById(itemId);
    
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Security: Ensure user owns the item
    if (item.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized: You can only delete your own items" });
    }

    // Only allow deletion if status is pending
    if (item.status !== "pending") {
      return res.status(403).json({ 
        error: `Cannot delete ${item.status} items. Only pending items can be deleted.` 
      });
    }

    // Delete photos from disk
    if (item.photos && item.photos.length > 0) {
      item.photos.forEach(photo => {
        const photoPath = path.join(uploadsDir, photo);
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
          console.log(`🗑️ Deleted photo: ${photo}`);
        }
      });
    }

    // Delete the item from database
    await Item.findByIdAndDelete(itemId);

    console.log(`✅ Item deleted successfully: ${item.name}`);

    res.status(200).json({ 
      message: "Item deleted successfully",
      itemId: itemId 
    });
  } catch (error) {
    console.error("❌ Error deleting item:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// ---------------- DECREMENT ITEM QUANTITY ----------------
router.post("/decrement/:itemId", protect, async (req, res) => {
  const { itemId } = req.params;
  const { quantity = 1 } = req.body;

  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    return res.status(400).json({ error: "Invalid itemId" });
  }

  try {
    const updatedItem = await decrementQuantity(itemId, Number(quantity));

    if (!updatedItem) {
      return res.status(404).json({ error: "Item not found or already out of stock" });
    }

    res.status(200).json({
      message: "Item quantity updated",
      item: {
        _id: updatedItem._id.toString(),
        name: updatedItem.name,
        yearsUsed: updatedItem.yearsUsed,
        price: updatedItem.price,
        quantity: updatedItem.quantity,
        available: updatedItem.available,
        deliveryOption: updatedItem.deliveryOption,
        photos: updatedItem.photos || [],
      },
    });
  } catch (err) {
    console.error("❌ Decrement item quantity error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

export default router;