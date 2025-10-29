// routes/purchaseRoutes.js
import express from "express";
import { protect } from "../middleware/Protect.js";
import Purchase from "../models/Purchase.js";
import Knowledge from "../models/Knowledge.js";

const router = express.Router();

// ==================== CHECK PURCHASE STATUS ====================
// GET /api/purchases/check/:itemId
// Check if current user has purchased a specific item
router.get("/check/:itemId", protect, async (req, res) => {
  try {
    const { itemId } = req.params;

    // Validate item exists
    const item = await Knowledge.findById(itemId);
    if (!item) {
      return res.status(404).json({ 
        purchased: false,
        message: "Item not found" 
      });
    }

    // Check if user has purchased this item
    const purchase = await Purchase.findOne({
      user: req.user._id,
      item: itemId,
      status: "completed"
    });

    res.json({ 
      purchased: !!purchase,
      purchaseDate: purchase?.purchaseDate || null,
      transactionId: purchase?.transactionId || null
    });
  } catch (err) {
    console.error("Error checking purchase:", err);
    res.status(500).json({ 
      purchased: false,
      message: "Server error" 
    });
  }
});

// ==================== GET USER'S PURCHASES ====================
// GET /api/purchases/my-purchases
// Get all purchases made by the current user
router.get("/my-purchases", protect, async (req, res) => {
  try {
    const purchases = await Purchase.find({
      user: req.user._id,
      status: "completed"
    })
    .populate({
      path: "item",
      select: "title description subject fileUrl price isPaid"
    })
    .sort({ purchaseDate: -1 });

    res.json({
      count: purchases.length,
      purchases
    });
  } catch (err) {
    console.error("Error fetching purchases:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==================== CREATE PURCHASE ====================
// POST /api/purchases/create
// Record a new purchase after payment
router.post("/create", protect, async (req, res) => {
  try {
    const { itemId, transactionId, paymentMethod } = req.body;

    // Validate required fields
    if (!itemId) {
      return res.status(400).json({ message: "Item ID is required" });
    }

    // Check if item exists
    const item = await Knowledge.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Check if user already purchased this item
    const existingPurchase = await Purchase.findOne({
      user: req.user._id,
      item: itemId,
      status: "completed"
    });

    if (existingPurchase) {
      return res.status(400).json({ 
        message: "You have already purchased this item",
        purchase: existingPurchase
      });
    }

    // Generate transaction ID if not provided
    const txnId = transactionId || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create purchase record
    const purchase = new Purchase({
      user: req.user._id,
      item: itemId,
      amount: item.price,
      status: "completed",
      transactionId: txnId,
      paymentMethod: paymentMethod || "cash",
    });

    await purchase.save();

    // Populate item details
    await purchase.populate("item", "title description price");

    res.status(201).json({ 
      message: "Purchase recorded successfully", 
      purchase 
    });
  } catch (err) {
    console.error("Error creating purchase:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({ message: "Duplicate purchase detected" });
    }
    
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ==================== BULK PURCHASE ====================
// POST /api/purchases/bulk
// Create multiple purchases at once (for cart checkout)
router.post("/bulk", protect, async (req, res) => {
  try {
    const { items, paymentMethod, transactionIdPrefix } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items array is required" });
    }

    const purchases = [];
    const errors = [];
    const txnPrefix = transactionIdPrefix || `BULK-${Date.now()}`;

    for (let i = 0; i < items.length; i++) {
      const itemData = items[i];
      
      try {
        const item = await Knowledge.findById(itemData.itemId || itemData);
        
        if (!item) {
          errors.push({ 
            itemId: itemData.itemId || itemData, 
            error: "Item not found" 
          });
          continue;
        }

        // Check if already purchased
        const existing = await Purchase.findOne({
          user: req.user._id,
          item: item._id,
          status: "completed"
        });

        if (existing) {
          errors.push({ 
            itemId: item._id, 
            title: item.title,
            error: "Already purchased" 
          });
          continue;
        }

        const purchase = new Purchase({
          user: req.user._id,
          item: item._id,
          amount: item.price,
          status: "completed",
          transactionId: `${txnPrefix}-${i + 1}`,
          paymentMethod: paymentMethod || "cash",
        });

        await purchase.save();
        await purchase.populate("item", "title description price");
        purchases.push(purchase);
      } catch (err) {
        errors.push({ 
          itemId: itemData.itemId || itemData, 
          error: err.message 
        });
      }
    }

    const totalAmount = purchases.reduce((sum, p) => sum + p.amount, 0);

    res.status(201).json({
      message: `${purchases.length} purchase(s) recorded successfully`,
      totalPurchases: purchases.length,
      totalAmount,
      purchases,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error("Error creating bulk purchases:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ==================== GET PURCHASE DETAILS ====================
// GET /api/purchases/:id
// Get details of a specific purchase
router.get("/:id", protect, async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate("item", "title description subject price fileUrl")
      .populate("user", "name email username");

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Ensure user can only view their own purchases (unless admin)
    if (purchase.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.json(purchase);
  } catch (err) {
    console.error("Error fetching purchase:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==================== DELETE PURCHASE ====================
// DELETE /api/purchases/:id
// Delete a purchase (user can delete their own pending purchases)
router.delete("/:id", protect, async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Only allow deletion of own pending purchases or admin can delete any
    if (purchase.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    if (purchase.status === "completed" && req.user.role !== "admin") {
      return res.status(400).json({ message: "Cannot delete completed purchases" });
    }

    await Purchase.findByIdAndDelete(req.params.id);

    res.json({ message: "Purchase deleted successfully" });
  } catch (err) {
    console.error("Error deleting purchase:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==================== REFUND PURCHASE (Admin only) ====================
// PUT /api/purchases/:id/refund
// Refund a purchase (requires admin role)
router.put("/:id/refund", protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { reason } = req.body;

    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    if (purchase.status === "refunded") {
      return res.status(400).json({ message: "Purchase already refunded" });
    }

    purchase.status = "refunded";
    purchase.notes = reason || "Refunded by admin";
    await purchase.save();

    await purchase.populate("item", "title price");
    await purchase.populate("user", "name email");

    res.json({ 
      message: "Purchase refunded successfully", 
      purchase 
    });
  } catch (err) {
    console.error("Error refunding purchase:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==================== GET ALL PURCHASES (Admin only) ====================
// GET /api/purchases/admin/all
// Get all purchases (admin only)
router.get("/admin/all", protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { status, limit = 50, page = 1, userId, itemId } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (userId) query.user = userId;
    if (itemId) query.item = itemId;
    
    const purchases = await Purchase.find(query)
      .populate("user", "name email username")
      .populate("item", "title price subject")
      .sort({ purchaseDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Purchase.countDocuments(query);

    res.json({
      purchases,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Error fetching all purchases:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==================== PURCHASE STATISTICS (Admin only) ====================
// GET /api/purchases/admin/stats
// Get purchase statistics
router.get("/admin/stats", protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Total purchases
    const totalPurchases = await Purchase.countDocuments({ status: "completed" });
    
    // Total revenue
    const revenueData = await Purchase.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Purchases by status
    const byStatus = await Purchase.aggregate([
      { $group: { _id: "$status", count: { $count: {} } } }
    ]);

    // Recent purchases
    const recentPurchases = await Purchase.find({ status: "completed" })
      .sort({ purchaseDate: -1 })
      .limit(10)
      .populate("user", "name email username")
      .populate("item", "title price");

    // Top purchased items
    const topItems = await Purchase.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$item", count: { $count: {} }, revenue: { $sum: "$amount" } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Populate item details for top items
    const populatedTopItems = await Knowledge.populate(topItems, {
      path: "_id",
      select: "title price subject"
    });

    // Purchases this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonth = await Purchase.countDocuments({
      status: "completed",
      purchaseDate: { $gte: startOfMonth }
    });

    const thisMonthRevenue = await Purchase.aggregate([
      { $match: { status: "completed", purchaseDate: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.json({
      totalPurchases,
      totalRevenue: revenueData[0]?.total || 0,
      byStatus,
      thisMonth: {
        purchases: thisMonth,
        revenue: thisMonthRevenue[0]?.total || 0
      },
      recentPurchases,
      topItems: populatedTopItems
    });
  } catch (err) {
    console.error("Error fetching purchase stats:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==================== VERIFY PURCHASE BY TRANSACTION ID ====================
// GET /api/purchases/verify/:transactionId
// Verify a purchase by transaction ID
router.get("/verify/:transactionId", protect, async (req, res) => {
  try {
    const purchase = await Purchase.findOne({ 
      transactionId: req.params.transactionId 
    })
    .populate("item", "title price")
    .populate("user", "name email");

    if (!purchase) {
      return res.status(404).json({ 
        verified: false,
        message: "Purchase not found" 
      });
    }

    // Check if user is the purchaser or admin
    if (purchase.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.json({
      verified: true,
      purchase
    });
  } catch (err) {
    console.error("Error verifying purchase:", err);
    res.status(500).json({ 
      verified: false,
      message: "Server error" 
    });
  }
});

export default router;