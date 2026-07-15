import mongoose, { Schema, Document } from "mongoose";

export type PaymentStatus = "succeeded" | "pending" | "failed";

export interface IPayment extends Document {
  userEmail: string;
  userName: string;
  credits: number;
  amount: number; // dollars (10 credits = 1 dollar for purchase)
  paymentSystem: string;
  transactionId: string;
  status: PaymentStatus;
  date: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    credits: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
    paymentSystem: { type: String, default: "Stripe" },
    transactionId: { type: String, required: true },
    status: {
      type: String,
      enum: ["succeeded", "pending", "failed"],
      default: "succeeded",
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

paymentSchema.index({ userEmail: 1 });
paymentSchema.index({ transactionId: 1 }, { unique: true });

export const PURCHASE_CREDITS_PER_DOLLAR = 10;

export default mongoose.model<IPayment>("Payment", paymentSchema);
