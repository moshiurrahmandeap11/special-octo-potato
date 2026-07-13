import mongoose, { Schema, Document } from "mongoose";

export type WithdrawalStatus = "pending" | "approved" | "rejected";
export type PaymentSystem = "Stripe" | "Bkash" | "Rocket" | "Nagad" | "Other";

export interface IWithdrawal extends Document {
  creatorEmail: string;
  creatorName: string;
  withdrawalCredit: number;
  withdrawalAmount: number; // in dollars (20 credits = 1 dollar)
  paymentSystem: PaymentSystem;
  accountNumber: string;
  status: WithdrawalStatus;
  withdrawDate: Date;
}

const withdrawalSchema = new Schema<IWithdrawal>(
  {
    creatorEmail: { type: String, required: true },
    creatorName: { type: String, required: true },
    withdrawalCredit: { type: Number, required: true, min: 1 },
    withdrawalAmount: { type: Number, required: true, min: 0 },
    paymentSystem: {
      type: String,
      enum: ["Stripe", "Bkash", "Rocket", "Nagad", "Other"],
      default: "Stripe",
    },
    accountNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    withdrawDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

withdrawalSchema.index({ creatorEmail: 1 });
withdrawalSchema.index({ status: 1 });

export const CREDITS_PER_DOLLAR = 20;

export default mongoose.model<IWithdrawal>("Withdrawal", withdrawalSchema);