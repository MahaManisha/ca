// models/Knowledge.js
import mongoose from "mongoose";

const knowledgeSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true,
      trim: true
    },
    description: { 
      type: String, 
      required: false,
      default: ""
    },
    subject: {
      type: String,
      required: false,
      trim: true,
      default: ""
    },
    // Main file (full content)
    fileUrl: { 
      type: String, 
      required: true 
    },
    // Sample file (preview for paid content)
    sampleFileUrl: {
      type: String,
      required: false,
      default: null
    },
    isPaid: { 
      type: Boolean, 
      default: false 
    },
    price: { 
      type: Number, 
      default: 0,
      min: 0
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    locked: { 
      type: Boolean, 
      default: false 
    },
    downloads: {
      type: Number,
      default: 0,
      min: 0
    },
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    sampleDownloads: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for faster queries
knowledgeSchema.index({ uploadedBy: 1 });
knowledgeSchema.index({ subject: 1 });
knowledgeSchema.index({ isPaid: 1 });
knowledgeSchema.index({ createdAt: -1 });

// Virtual for checking if content is free
knowledgeSchema.virtual('isFree').get(function() {
  return !this.isPaid || this.price === 0;
});

// Virtual for checking if sample is available
knowledgeSchema.virtual('hasSample').get(function() {
  return this.isPaid && this.sampleFileUrl !== null && this.sampleFileUrl !== '';
});

// Virtual for author name (populated)
knowledgeSchema.virtual('authorName').get(function() {
  return this.uploadedBy?.name || this.uploadedBy?.username || 'Unknown';
});

const Knowledge = mongoose.model("Knowledge", knowledgeSchema);
export default Knowledge;