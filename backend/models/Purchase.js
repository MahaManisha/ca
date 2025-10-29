// models/Purchase.js
import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Knowledge",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "completed",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet", "cash"],
      required: false,
    },
    transactionId: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      required: false,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index to prevent duplicate purchases
purchaseSchema.index({ user: 1, item: 1 }, { unique: true });

// Index for faster status queries
purchaseSchema.index({ status: 1 });

// Index for date-based queries
purchaseSchema.index({ purchaseDate: -1 });

// Virtual for checking if purchase is active
purchaseSchema.virtual('isActive').get(function() {
  return this.status === 'completed';
});

// Static method to check if user purchased an item
purchaseSchema.statics.hasPurchased = async function(userId, itemId) {
  const purchase = await this.findOne({
    user: userId,
    item: itemId,
    status: 'completed'
  });
  return !!purchase;
};

// Instance method to mark as completed
purchaseSchema.methods.markCompleted = async function(transactionId = null) {
  this.status = 'completed';
  if (transactionId) {
    this.transactionId = transactionId;
  }
  return await this.save();
};

// Instance method to refund
purchaseSchema.methods.refund = async function(reason = '') {
  this.status = 'refunded';
  this.notes = reason;
  return await this.save();
};

// Pre-save middleware to validate purchase
purchaseSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Check if user has already purchased this item
    const existing = await mongoose.model('Purchase').findOne({
      user: this.user,
      item: this.item,
      status: 'completed'
    });
    
    if (existing) {
      const error = new Error('User has already purchased this item');
      error.code = 'DUPLICATE_PURCHASE';
      return next(error);
    }
  }
  next();
});

const Purchase = mongoose.model("Purchase", purchaseSchema);
export default Purchase;