import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "supporter" | "creator" | "admin";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // not set for Google-only accounts
  photoURL: string;
  role: UserRole;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    photoURL: { type: String, default: "https://i.ibb.co/0Q8c0cX/default.png" },
    role: {
      type: String,
      enum: ["supporter", "creator", "admin"],
      default: "supporter",
    },
    credits: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
