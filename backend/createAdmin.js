import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    const email = "admin@nec.edu.in"; // default admin email
    const existing = await User.findOne({ email });
    if (existing) {
      console.log("⚠️ Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("admin123", 10); // default password

    const admin = await User.create({
      name: "Super Admin",
      email,
      password: hashedPassword,
      contact: "0000000000",
      year: "NA",
      department: "NA",
      photo: "",
      role: "admin",
    });

    console.log("✅ Admin created successfully:", admin.email);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();
