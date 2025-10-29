// ============================================
// cartRoutes.js - Complete Cart Management
// ============================================

import express from "express";
import mongoose from "mongoose";
import Cart from "../models/cart.js";
import Item from "../models/Item.js";

const router = express.Router();

// ================== ADD ITEM TO CART ==================
router.post("/add", async (req, res) => {
  try {
    console.log("=== ADD TO CART REQUEST ===");
    console.log("Request body:", req.body);
    
    const { userId, itemId } = req.body;

    // ✅ Validation
    if (!userId || !itemId) {
      console.error("Missing userId or itemId");
      return res.status(400).json({ error: "userId and itemId are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid userId:", userId);
      return res.status(400).json({ error: "Invalid userId" });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      console.error("Invalid itemId:", itemId);
      return res.status(400).json({ error: "Invalid itemId" });
    }

    // ✅ Find item and populate seller details with photo
    console.log("Finding item with ID:", itemId);
    const item = await Item.findById(itemId).populate("seller", "name email username photo department year");
    
    if (!item) {
      console.error("Item not found:", itemId);
      return res.status(404).json({ error: "Item not found" });
    }

    console.log("Item found:", {
      name: item.name,
      quantity: item.quantity,
      available: item.available,
      photos: item.photos,
      seller: item.seller
    });

    // ✅ Check if seller exists
    if (!item.seller) {
      console.error("Item has no seller associated with it");
      return res.status(400).json({ 
        error: "Item data is incomplete - missing seller information"
      });
    }

    // ✅ Prevent adding your own item
    if (item.seller._id.toString() === userId) {
      console.error("User trying to add own item");
      return res.status(403).json({ error: "Cannot add your own item to cart" });
    }

    // ✅ Check if item is available and has quantity
    if (!item.available || item.quantity <= 0) {
      console.error("Item out of stock");
      return res.status(400).json({ error: "Item out of stock" });
    }

    // ✅ Find or create cart
    console.log("Finding cart for user:", userId);
    let cart = await Cart.findOne({ userId });
    console.log("Cart found:", cart ? "Yes" : "No");

    // ✅ Create cart item with ALL necessary fields including photos and seller info
    const cartItem = {
      itemId: item._id,
      name: item.name,
      yearsUsed: item.yearsUsed,
      price: item.price,
      quantity: 1,
      deliveryOption: item.deliveryOption,
      photos: Array.isArray(item.photos) ? item.photos : [], // ✅ Include photos
      seller: {
        _id: item.seller._id,
        name: item.seller.name || item.seller.username || "Unknown Seller",
        email: item.seller.email || "no-email@example.com",
        photo: item.seller.photo || "", // ✅ Include seller photo
        department: item.seller.department || "",
        year: item.seller.year || ""
      }
    };

    console.log("Cart item prepared:", cartItem);

    if (!cart) {
      // ✅ Create new cart
      console.log("Creating new cart");
      
      cart = new Cart({ 
        userId: new mongoose.Types.ObjectId(userId), 
        items: [cartItem] 
      });
      
      await cart.save();
      console.log("New cart created with ID:", cart._id);
      
    } else {
      // ✅ Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        (i) => i.itemId.toString() === itemId
      );
      
      if (existingItemIndex !== -1) {
        console.log("Item already in cart, incrementing quantity");
        
        // ✅ Check if there's enough quantity
        const requestedQuantity = cart.items[existingItemIndex].quantity + 1;
        if (item.quantity < requestedQuantity) {
          console.error("Not enough quantity available");
          return res.status(400).json({ 
            error: "Not enough quantity available",
            available: item.quantity,
            requested: requestedQuantity
          });
        }
        
        cart.items[existingItemIndex].quantity += 1;
      } else {
        console.log("Adding new item to existing cart");
        cart.items.push(cartItem);
      }
      
      await cart.save();
      console.log("Cart updated successfully");
    }

    // ✅ Decrement item quantity (only after successful cart save)
    console.log("Decrementing item quantity...");
    item.quantity -= 1;
    if (item.quantity <= 0) {
      item.available = false;
    }
    await item.save();
    console.log("Item quantity updated. New quantity:", item.quantity);

    console.log("=== ADD TO CART SUCCESS ===");
    res.status(201).json({ 
      message: "Item added to cart successfully", 
      cart,
      updatedQuantity: item.quantity 
    });
    
  } catch (err) {
    console.error("=== ADD TO CART ERROR ===");
    console.error("Error:", err);
    res.status(500).json({ 
      error: "Server error while adding to cart",
      details: err.message 
    });
  }
});

// ================== GET USER'S CART ==================
router.get("/:userId", async (req, res) => {
  try {
    console.log("=== GET CART REQUEST ===");
    const { userId } = req.params;
    console.log("User ID:", userId);
    
    // ✅ Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid userId");
      return res.status(400).json({ error: "Invalid userId" });
    }

    // ✅ Find cart
    const cart = await Cart.findOne({ userId });
    console.log("Cart found:", cart ? `Yes (${cart.items.length} items)` : "No");
    
    if (!cart) {
      return res.status(200).json({ items: [] });
    }

    // ✅ Return cart with proper structure including photos and seller info
    res.status(200).json({ 
      items: cart.items,
      userId: cart.userId,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt
    });
    
  } catch (err) {
    console.error("GET CART ERROR:", err);
    res.status(500).json({ 
      error: "Server error while fetching cart",
      details: err.message 
    });
  }
});

// ================== REMOVE ITEM FROM CART ==================
router.post("/remove", async (req, res) => {
  try {
    console.log("=== REMOVE FROM CART REQUEST ===");
    const { userId, itemId } = req.body;
    console.log("User ID:", userId, "Item ID:", itemId);
    
    // ✅ Validation
    if (!userId || !itemId) {
      return res.status(400).json({ error: "userId and itemId are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: "Invalid userId or itemId" });
    }

    // ✅ Find cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    // ✅ Find the item in cart
    const cartItem = cart.items.find((i) => i.itemId.toString() === itemId);
    if (!cartItem) {
      return res.status(404).json({ error: "Item not in cart" });
    }

    console.log("Removing item, quantity to restore:", cartItem.quantity);

    // ✅ Remove item from cart
    cart.items = cart.items.filter((i) => i.itemId.toString() !== itemId);
    await cart.save();
    console.log("Item removed from cart");

    // ✅ Restore item quantity
    const item = await Item.findById(itemId);
    if (item) {
      item.quantity += cartItem.quantity;
      item.available = true;
      await item.save();
      console.log("Item quantity restored. New quantity:", item.quantity);
    } else {
      console.warn("Item not found in database, skipping quantity restore");
    }

    res.status(200).json({ 
      message: "Item removed from cart and availability restored",
      cart 
    });
    
  } catch (err) {
    console.error("REMOVE FROM CART ERROR:", err);
    res.status(500).json({ 
      error: "Server error while removing from cart",
      details: err.message 
    });
  }
});

// ================== CHECKOUT ==================
router.post("/checkout", async (req, res) => {
  try {
    console.log("=== CHECKOUT REQUEST ===");
    const { userId, paymentMethod } = req.body;
    console.log("User ID:", userId, "Payment method:", paymentMethod);
    
    // ✅ Validation
    if (!userId || !paymentMethod) {
      return res.status(400).json({ error: "userId and paymentMethod are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    // ✅ Find cart
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // ✅ Calculate total
    const totalAmount = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    console.log("Total amount:", totalAmount);

    // ✅ Store order details before clearing cart
    const orderDetails = {
      userId,
      items: cart.items.map(item => ({
        itemId: item.itemId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        seller: item.seller,
        photos: item.photos
      })),
      totalAmount,
      paymentMethod,
      date: new Date()
    };

    // ✅ Clear cart after successful checkout
    await Cart.findOneAndDelete({ userId });
    console.log("Cart cleared after checkout");

    res.status(200).json({ 
      message: "Payment successful", 
      order: orderDetails
    });
    
  } catch (err) {
    console.error("CHECKOUT ERROR:", err);
    res.status(500).json({ 
      error: "Server error during checkout",
      details: err.message 
    });
  }
});

export default router;