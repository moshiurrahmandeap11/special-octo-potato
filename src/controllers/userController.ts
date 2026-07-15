import { Request, Response } from "express";
import User from "../models/User.js";
import Payment from "../models/Payment.js";

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: users.length, users });
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  const { role } = req.body;
  if (!["supporter", "creator", "admin"].includes(role)) {
    res.status(400).json({ success: false, message: "Invalid role." });
    return;
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select("-password");
  if (!user) {
    res.status(404).json({ success: false, message: "User not found." });
    return;
  }
  res.status(200).json({ success: true, user });
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found." });
    return;
  }
  res.status(200).json({ success: true, message: "User deleted successfully." });
};

// Admin dashboard stats
export const getUserStats = async (_req: Request, res: Response): Promise<void> => {
  const [supporters, creators, all, totalPayments] = await Promise.all([
    User.countDocuments({ role: "supporter" }),
    User.countDocuments({ role: "creator" }),
    User.find({}, "credits"),
    Payment.countDocuments({ status: "succeeded" }),
  ]);
  const totalCredits = all.reduce((sum, u) => sum + (u.credits ?? 0), 0);
  res.status(200).json({
    success: true,
    stats: { totalSupporters: supporters, totalCreators: creators, totalCredits, totalPayments },
  });
};
