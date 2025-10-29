import Item from "../models/Item.js";
import mongoose from "mongoose";

// ============ GET ALL APPROVED ITEMS ============
export const getItems = async (req, res) => {
  try {
    const { userId } = req.query;

    // ✅ Only fetch approved items
    const query = { status: "approved" };

    // Optional: exclude items from the current user (if needed)
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.seller = { $ne: new mongoose.Types.ObjectId(userId) };
    }

    const items = await Item.find(query)
      .populate("seller", "name email contact photo department year") // ✅ Added photo
      .sort({ createdAt: -1 });

    console.log(`✅ Fetched ${items.length} approved items`);
    res.status(200).json(items);
  } catch (error) {
    console.error("❌ Error fetching items:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
};

// ============ ADD NEW ITEM (with pending status) ============
export const addItem = async (req, res) => {
  try {
    const { name, yearsUsed, price, quantity, deliveryOption } = req.body;
    const userId = req.user._id;

    if (!name || !yearsUsed || !price || !quantity || !deliveryOption) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const photos = req.files ? req.files.map((file) => file.filename) : [];

    const newItem = new Item({
      name,
      yearsUsed: Number(yearsUsed),
      price: Number(price),
      quantity: Number(quantity),
      deliveryOption,
      seller: userId,
      photos,
      status: "pending", // ✅ Set to pending by default
    });

    await newItem.save();
    await newItem.populate("seller", "name email contact photo department year"); // ✅ Added photo

    console.log(`✅ Item added successfully: ${newItem.name} (Status: ${newItem.status})`);

    res.status(201).json({
      message: "Item added successfully. Awaiting admin approval.",
      item: newItem,
    });
  } catch (error) {
    console.error("❌ Error adding item:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
};

// ============ SEARCH APPROVED ITEMS ============
export const searchItems = async (req, res) => {
  try {
    const { searchTerm, userId } = req.body;

    if (!searchTerm || searchTerm.trim() === "") {
      return res.status(400).json({ error: "Search term is required" });
    }

    const query = {
      status: "approved", // ✅ Only search approved items
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { deliveryOption: { $regex: searchTerm, $options: "i" } },
      ],
    };

    // Optional: exclude current user's items
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.seller = { $ne: new mongoose.Types.ObjectId(userId) };
    }

    const items = await Item.find(query)
      .populate("seller", "name email contact photo department year") // ✅ Added photo
      .sort({ createdAt: -1 });

    console.log(`✅ Search results: ${items.length} items found for "${searchTerm}"`);
    res.status(200).json(items);
  } catch (error) {
    console.error("❌ Search error:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
};

// ============ DECREMENT ITEM QUANTITY ============
export const decrementQuantity = async (itemId, quantity = 1) => {
  try {
    const item = await Item.findById(itemId);

    if (!item) {
      throw new Error("Item not found");
    }

    if (item.quantity < quantity) {
      throw new Error("Insufficient quantity available");
    }

    item.quantity -= quantity;
    item.available = item.quantity > 0;

    await item.save();
    console.log(`✅ Item quantity decremented: ${item.name} (Remaining: ${item.quantity})`);
    return item;
  } catch (error) {
    console.error("❌ Error decrementing quantity:", error);
    throw error;
  }
};