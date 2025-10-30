// ============================================
// models/cart.js - Fixed Cart Model
// ============================================

import mongoose from "mongoose";

// Subdocument for items in cart
const cartItemSchema = new mongoose.Schema(
  {
    itemId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Item", 
      required: true 
    },
    name: { type: String, required: true },
    yearsUsed: { type: Number, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    deliveryOption: { type: String, required: true },
    photos: { type: [String], default: [] },
    seller: {
      _id: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
      photo: { type: String, default: "" },
      department: { type: String, default: "" },
      year: { type: String, default: "" },
    },
  },
  { _id: false } // Don't create _id for subdocuments
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One cart per user
    },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

// ✅ Removed duplicate manual index
// cartSchema.index({ userId: 1 });

// Clean JSON output
cartSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

// Prevent OverwriteModelError in dev
const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);

export default Cart;
