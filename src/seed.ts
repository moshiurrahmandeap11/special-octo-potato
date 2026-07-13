import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const seedAdmin = async (): Promise<void> => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL ?? "admin@crowdfund.com";
  const password = process.env.ADMIN_PASSWORD ?? "Admin@12345";
  const name = process.env.ADMIN_NAME ?? "Platform Admin";
  const photo = process.env.ADMIN_PHOTO ?? "https://i.ibb.co/0Q8c0cX/admin.png";

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log("ℹ️  Admin user already exists. Skipping.");
  } else {
    const hashed = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      photoURL: photo,
      role: "admin",
      credits: 0,
    });
    console.log(`✅ Admin user created: ${email}`);
  }

  await mongoose.disconnect();
  console.log("👋 Done.");
};

seedAdmin().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});