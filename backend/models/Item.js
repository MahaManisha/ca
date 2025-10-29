import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    yearsUsed: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    deliveryOption: {
      type: String,
      enum: ["buyer_pickup", "seller_delivery"],
      default: "buyer_pickup",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    photos: {
      type: [String],
      default: [],
    },
    available: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: "",
    },
    // ✅ Status field for approval workflow
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Automatically update availability before saving
itemSchema.pre("save", function (next) {
  this.available = this.quantity > 0;
  next();
});

// Ensure availability is updated on findOneAndUpdate
itemSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  if (!update) return next();

  // If using $set
  if (update.$set && typeof update.$set.quantity !== "undefined") {
    update.$set.available = update.$set.quantity > 0;
  } 
  // If updating root-level fields
  else if (typeof update.quantity !== "undefined") {
    update.available = update.quantity > 0;
  }

  next();
});

// Clean JSON output (keep _id for frontend consistency)
itemSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

const Item = mongoose.model("Item", itemSchema);
export default Item;