// ============================================
// server.js – Campus Aggregator Backend (Updated with Razorpay)
// ============================================

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import multer from "multer";
import fs from "fs";
import session from "express-session";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import crypto from "crypto";

// ✅ Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Detect Google OAuth availability
const hasGoogleOAuth = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (!hasGoogleOAuth) {
  console.log("\n❌ ================================================");
  console.log("❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
  console.log("❌ Google OAuth login will NOT work");
  console.log("❌ Add these to your .env file");
  console.log("❌ ================================================\n");
}

let passportConfig = null;
if (hasGoogleOAuth) {
  const { default: importedPassport } = await import("./config/passport.js");
  passportConfig = importedPassport;
  console.log("✅ Google OAuth strategy loaded successfully");
}

// ✅ Models
import User from "./models/User.js";

// ✅ Routes
import itemRoutes from "./routes/itemRoutes.js";
import cartRoutes from "./routes/CartRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import knowledgeRoutes from "./routes/knowledgeRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import authRoutes from "./routes/auth.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { protect } from "./middleware/Protect.js";

// ================== EXPRESS APP ==================
const app = express();

// ================== CORE MIDDLEWARE ==================
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================== SESSION SETUP ==================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// ================== PASSPORT SETUP ==================
if (hasGoogleOAuth && passportConfig) {
  app.use(passportConfig.initialize());
  app.use(passportConfig.session());
  console.log("✅ Passport initialized with Google OAuth");
} else {
  console.log("⚠️  Passport NOT initialized (Google OAuth disabled)");
}

// ================== FILE UPLOAD SETUP ==================
const uploadsDir = path.join(__dirname, "uploads");
const profilesDir = path.join(uploadsDir, "profiles");
const knowledgeDir = path.join(uploadsDir, "knowledge");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(profilesDir)) fs.mkdirSync(profilesDir, { recursive: true });
if (!fs.existsSync(knowledgeDir)) fs.mkdirSync(knowledgeDir, { recursive: true });

app.use("/uploads", express.static(uploadsDir));

// ================== MULTER SETUP ==================
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profilesDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const userId = req.user?.id || "guest";
    cb(null, `${userId}-${unique}${path.extname(file.originalname)}`);
  },
});

const profileFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  if (allowed.test(file.mimetype)) cb(null, true);
  else cb(new Error("Only image files allowed"));
};

const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: profileFileFilter,
});

const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const userId = req.user?.id || "guest";
    cb(null, `${userId}-${unique}${path.extname(file.originalname)}`);
  },
});

const generalUpload = multer({
  storage: generalStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: profileFileFilter,
});

// ================== ROOT TEST ROUTE ==================
app.get("/", (req, res) => {
  res.json({
    message: "🟢 Campus Aggregator API running",
    status: "OK",
    timestamp: new Date().toISOString(),
    googleOAuth: hasGoogleOAuth ? "Enabled" : "Disabled",
  });
});

// ================== AUTH ROUTES ==================
app.post("/api/users/signup", generalUpload.single("photo"), async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const photo = req.file?.filename || "";

    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    if (!email.endsWith("@nec.edu.in"))
      return res.status(400).json({ message: "Use a valid @nec.edu.in email" });

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ message: "User already exists" });

    if (password.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 chars" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashed,
      photo,
      role: "user",
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const { password: _, ...data } = user._doc;
    res.status(201).json({ message: "Account created", user: data, token });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!user.password)
      return res.status(400).json({ message: "Login with Google for this account" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const { password: _, ...data } = user._doc;
    res.status(200).json({ message: "Login success", user: data, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ================== PROFILE ROUTES ==================
app.get("/api/users/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/users/update-profile", protect, profileUpload.single("photo"), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.photo = req.file.filename;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================== ROUTES ==================
if (hasGoogleOAuth && passportConfig) {
  app.use("/api/auth", authRoutes);
  console.log("✅ Google OAuth routes enabled");
} else {
  app.get("/api/auth/google", (req, res) =>
    res.status(503).json({
      message: "Google OAuth not configured",
      hint: "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env",
    })
  );
  console.log("⚠️ Google OAuth routes disabled");
}

app.use("/api/items", itemRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", analyticsRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/notifications", notificationRoutes);

// ================== ✅ RAZORPAY PAYMENT ROUTES ==================
app.post("/api/payment/create-order", async (req, res) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: req.body.amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ success: false, message: "Payment creation failed" });
  }
});

app.post("/api/payment/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature sent!" });
    }
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
});

// ================== 404 HANDLER ==================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found", path: req.path });
});

// ================== GLOBAL ERROR HANDLER ==================
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({ message: err.message });
});

// ================== DATABASE CONNECTION ==================
const PORT = process.env.PORT || 5000;
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("❌ Missing MONGO_URI or JWT_SECRET in .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");

    const adminEmail = "admin@nec.edu.in";
    const admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const hash = await bcrypt.hash("Admin@123", 10);
      await User.create({
        username: "admin",
        email: adminEmail,
        password: hash,
        role: "admin",
      });
      console.log("👑 Default admin created");
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`🔗 Google OAuth: ${hasGoogleOAuth ? "Enabled" : "Disabled"}`);
      console.log(`📁 Uploads: ${uploadsDir}`);
      console.log(`💳 Razorpay Payments: Enabled`);
      console.log(`🔔 Notifications: Enabled`);
      console.log(`📊 Analytics: Enabled`);
    });
  })
  .catch((err) => {
    console.error("❌ DB Connection Error:", err);
    process.exit(1);
  });

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  process.exit(1); 
});