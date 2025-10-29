import express from "express";
import Request from "../models/Request.js";
import { protect } from "../middleware/Protect.js"; // your auth middleware

const router = express.Router();

// Create a request
router.post("/", protect, async (req, res) => {
  try {
    const { title, description } = req.body;
    const request = await Request.create({
      requester: req.user._id,
      title,
      description,
    });
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all requests (for users to see and reply)
router.get("/", protect, async (req, res) => {
  try {
    const requests = await Request.find()
      .populate("requester", "name email")
      .populate("replies.responder", "name email")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reply to a request
router.post("/:id/reply", protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const { message } = req.body;
    request.replies.push({
      responder: req.user._id,
      message,
    });
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get requests posted by the logged-in user (to see replies)
router.get("/my-requests", protect, async (req, res) => {
  try {
    const requests = await Request.find({ requester: req.user._id })
      .populate("replies.responder", "name email")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
