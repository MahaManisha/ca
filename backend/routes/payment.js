// backend/routes/payment.js
import express from "express";
const router = express.Router();

router.post("/initiate", async (req, res) => {
  const { userId, amount, items } = req.body;

  // 1. Validate input
  if (!userId || !amount) return res.status(400).json({ error: "Missing data" });

  // 2. Generate a dummy payment link (replace with real gateway)
  const paymentLink = `https://fake-payment.com/pay/${userId}-${Date.now()}`;

  // 3. Save order with status: pending (pseudo)
  // await Order.create({ userId, items, amount, status: "pending" });

  res.json({ paymentLink });
});

export default router;
