import mongoose, { Schema, Document } from "mongoose";

export type ReportStatus = "open" | "resolved" | "dismissed";

export interface IReport extends Document {
  campaignId: mongoose.Types.ObjectId;
  campaignTitle: string;
  reporterName: string;
  reporterEmail: string;
  reason: string;
  status: ReportStatus;
  createdAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    campaignTitle: { type: String, required: true },
    reporterName: { type: String, required: true },
    reporterEmail: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "resolved", "dismissed"],
      default: "open",
    },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1 });

export default mongoose.model<IReport>("Report", reportSchema);