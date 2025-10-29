import mongoose from "mongoose";
import Cart from "../models/cart.js";
import Item from "../models/Item.js";

// ---------------- Add item to cart ----------------
export const addToCart = async (req, res) => {
  try {
    const { userId, itemId } = req.body;

    if (!userId || !itemId)
      return res.status(400).json({ error: "userId and itemId are required" });

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(itemId))
      return res.status(400).json({ error: "Invalid userId or itemId" });

    // Find and decrement item quantity atomically
    const item = await Item.findOneAndUpdate(
      { _id: itemId, quantity: { $gt: 0 } },
      { $inc: { quantity: -1 } },
      { new: true }
    ).populate("seller", "name email");

    if (!item) return res.status(404).json({ error: "Item not found or out of stock" });

    // Prevent adding your own item
    if (item.seller._id.toString() === userId)
      return res.status(403).json({ error: "Cannot add your own item to cart" });

    let cart = await Cart.findOne({ userId });

    const cartItem = {
      itemId: item._id,
      name: item.name,
      yearsUsed: item.yearsUsed,
      price: item.price,
      deliveryOption: item.deliveryOption,
      seller: {
        _id: item.seller._id,
        name: item.seller.name,
        email: item.seller.email,
      },
      quantity: 1,
    };

    if (!cart) {
      cart = new Cart({ userId, items: [cartItem] });
    } else {
      const existingItem = cart.items.find(i => i.itemId.toString() === itemId);
      if (existingItem) existingItem.quantity += 1;
      else cart.items.push(cartItem);
    }

    await cart.save();

    res.status(201).json({ message: "Item added to cart", cart });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ error: "Server error while adding to cart" });
  }
};

// ---------------- Get a user's cart ----------------
export const getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ error: "Invalid userId" });

    const cart = await Cart.findOne({ userId });

    if (!cart) return res.status(200).json({ items: [] });

    res.status(200).json(cart);
  } catch (err) {
    console.error("Fetch cart error:", err);
    res.status(500).json({ error: "Server error while fetching cart" });
  }
};

// ---------------- Remove item from cart ----------------
export const removeFromCart = async (req, res) => {
  try {
    const { userId, itemId } = req.body;

    if (!userId || !itemId)
      return res.status(400).json({ error: "userId and itemId are required" });

    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const itemIndex = cart.items.findIndex(i => i.itemId.toString() === itemId);
    if (itemIndex === -1) return res.status(404).json({ error: "Item not in cart" });

    // Restore quantity back to the item
    await Item.findByIdAndUpdate(itemId, { $inc: { quantity: cart.items[itemIndex].quantity } });

    cart.items.splice(itemIndex, 1);
    await cart.save();

    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (err) {
    console.error("Remove from cart error:", err);
    res.status(500).json({ error: "Server error while removing from cart" });
  }
};
