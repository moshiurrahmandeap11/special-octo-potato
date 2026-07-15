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
  const normalizedEmail = email.toLowerCase();
  const hashed = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email: normalizedEmail }).select("+password");
  if (existing) {
    existing.name = name;
    existing.password = hashed;
    existing.photoURL = photo;
    existing.role = "admin";
    await existing.save();
    console.log(`Admin user synchronized: ${normalizedEmail}`);
  } else {
    await User.create({
      name,
      email: normalizedEmail,
      password: hashed,
      photoURL: photo,
      role: "admin",
      credits: 0,
    });
    console.log(`Admin user created: ${normalizedEmail}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
};

seedAdmin().catch(async (error) => {
  console.error("Seeding failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
