import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  responder: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const requestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  replies: [replySchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Request", requestSchema);
