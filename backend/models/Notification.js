// backend/models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["purchase", "message", "item", "system"],
      default: "purchase",
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
    },
    relatedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    purchaseDetails: {
      buyerName: String,
      itemName: String,
      quantity: Number,
      amount: Number,
      paymentMethod: String,
      paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "completed",
      },
    },
  },
  { timestamps: true }
);

// Compound indexes for faster queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

export default mongoose.model("Notification", notificationSchema);
