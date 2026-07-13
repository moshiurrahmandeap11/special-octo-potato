import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  message: string;
  toEmail: string;
  actionRoute: string;
  isRead: boolean;
  time: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    message: { type: String, required: true },
    toEmail: { type: String, required: true },
    actionRoute: { type: String, default: "/" },
    isRead: { type: Boolean, default: false },
    time: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

notificationSchema.index({ toEmail: 1, time: -1 });

export default mongoose.model<INotification>("Notification", notificationSchema);