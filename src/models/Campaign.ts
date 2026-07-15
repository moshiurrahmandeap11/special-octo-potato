import mongoose, { Schema, Document } from "mongoose";

export type CampaignStatus = "pending" | "approved" | "rejected";
export type CampaignCategory =
  | "Technology"
  | "Art"
  | "Community"
  | "Health"
  | "Education"
  | "Environment"
  | "Other";

export interface ICampaign extends Document {
  title: string;
  shortDescription: string;
  story: string;
  category: CampaignCategory;
  fundingGoal: number;
  minimumContribution: number;
  deadline: Date;
  rewardInfo: string;
  imageURL: string;
  creatorName: string;
  creatorEmail: string;
  amountRaised: number;
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    title: { type: String, required: true },
    shortDescription: { type: String, required: true, maxlength: 220, default: "" },
    story: { type: String, required: true },
    category: {
      type: String,
      enum: ["Technology", "Art", "Community", "Health", "Education", "Environment", "Other"],
      default: "Other",
    },
    fundingGoal: { type: Number, required: true, min: 0 },
    minimumContribution: { type: Number, required: true, min: 1 },
    deadline: { type: Date, required: true },
    rewardInfo: { type: String, default: "" },
    imageURL: { type: String, default: "" },
    creatorName: { type: String, required: true },
    creatorEmail: { type: String, required: true },
    amountRaised: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Indexes for frequent queries
campaignSchema.index({ status: 1, deadline: 1 });
campaignSchema.index({ creatorEmail: 1 });

export default mongoose.model<ICampaign>("Campaign", campaignSchema);
