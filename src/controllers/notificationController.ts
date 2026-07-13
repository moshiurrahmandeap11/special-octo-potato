import { Request, Response } from "express";
import Notification from "../models/Notification.js";

// Notifications for the current user (newest first)
export const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
  const notifications = await Notification.find({ toEmail: req.user!.email }).sort({ time: -1 });
  res.status(200).json({ success: true, count: notifications.length, notifications });
};

export const markRead = async (req: Request, res: Response): Promise<void> => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, toEmail: req.user!.email },
    { isRead: true },
    { new: true }
  );
  if (!notification) {
    res.status(404).json({ success: false, message: "Notification not found." });
    return;
  }
  res.status(200).json({ success: true, notification });
};

export const markAllRead = async (req: Request, res: Response): Promise<void> => {
  await Notification.updateMany({ toEmail: req.user!.email, isRead: false }, { isRead: true });
  res.status(200).json({ success: true, message: "All notifications marked as read." });
};