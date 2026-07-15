import { Request, Response } from "express";
import Report from "../models/Report.js";
import Campaign from "../models/Campaign.js";
import Contribution from "../models/Contribution.js";
import User from "../models/User.js";

// Supporter: report a campaign as suspicious/fraudulent
export const createReport = async (req: Request, res: Response): Promise<void> => {
  const { campaignId, reason } = req.body;
  if (!campaignId || !reason) {
    res.status(400).json({ success: false, message: "campaignId and reason are required." });
    return;
  }
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    res.status(404).json({ success: false, message: "Campaign not found." });
    return;
  }
  const report = await Report.create({
    campaignId: campaign._id,
    campaignTitle: campaign.title,
    reporterName: req.user!.name,
    reporterEmail: req.user!.email,
    reason,
    status: "open",
  });
  res.status(201).json({ success: true, report });
};

// Admin: all open reports
export const getReports = async (_req: Request, res: Response): Promise<void> => {
  const reports = await Report.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: reports.length, reports });
};

// Admin: resolve a report and suspend/delete the campaign
export const resolveReport = async (req: Request, res: Response): Promise<void> => {
  const { action } = req.body; // "suspend" | "delete"
  const report = await Report.findById(req.params.id);
  if (!report) {
    res.status(404).json({ success: false, message: "Report not found." });
    return;
  }

  if (action === "delete") {
    const refundable = await Contribution.find({
      campaignId: report.campaignId,
      status: { $in: ["approved", "pending"] },
    });
    for (const contribution of refundable) {
      await User.updateOne(
        { email: contribution.supporterEmail },
        { $inc: { credits: contribution.contributionAmount } }
      );
    }
    await Contribution.deleteMany({ campaignId: report.campaignId });
    await Campaign.findByIdAndDelete(report.campaignId);
  } else if (action === "suspend") {
    await Campaign.findByIdAndUpdate(report.campaignId, { status: "rejected" });
  }

  report.status = "resolved";
  await report.save();
  res.status(200).json({ success: true, report });
};
