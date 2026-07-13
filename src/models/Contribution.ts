import mongoose, { Schema, Document } from "mongoose";

export type ContributionStatus = "pending" | "approved" | "rejected";

export interface IContribution extends Document {
  campaignId: mongoose.Types.ObjectId;
  campaignTitle: string;
  contributionAmount: number;
  supporterEmail: string;
  supporterName: string;
  creatorName: string;
  creatorEmail: string;
  message?: string;
  status: ContributionStatus;
  date: Date;
}

const contributionSchema = new Schema<IContribution>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    campaignTitle: { type: String, required: true },
    contributionAmount: { type: Number, required: true, min: 1 },
    supporterEmail: { type: String, required: true },
    supporterName: { type: String, required: true },
    creatorName: { type: String, required: true },
    creatorEmail: { type: String, required: true },
    message: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

contributionSchema.index({ creatorEmail: 1, status: 1 });
contributionSchema.index({ supporterEmail: 1, status: 1 });
contributionSchema.index({ campaignId: 1 });

export default mongoose.model<IContribution>("Contribution", contributionSchema);