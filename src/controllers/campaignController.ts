import { Request, Response } from "express";
import mongoose from "mongoose";
import Campaign from "../models/Campaign.js";
import Contribution from "../models/Contribution.js";
import { createNotification } from "../utils/notify.js";

// Convert a value to a Date, or return undefined when invalid
const toDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? undefined : d;
};

// ---------- PUBLIC / SUPPORTER ----------

// Top 6 funded (approved) campaigns by amount raised
export const getTopFunded = async (_req: Request, res: Response): Promise<void> => {
  const now = new Date();
  const campaigns = await Campaign.find({ status: "approved", deadline: { $gte: now } })
    .sort({ amountRaised: -1 })
    .limit(6);
  res.status(200).json({ success: true, campaigns });
};

// Explore: approved campaigns whose deadline has not passed, with optional search/filter
export const exploreCampaigns = async (req: Request, res: Response): Promise<void> => {
  const { category, search, sort } = req.query;
  const filter: Record<string, unknown> = { status: "approved", deadline: { $gte: new Date() } };

  if (category && category !== "All") filter.category = category;
  if (search) {
    filter.$or = [
      { title: { $regex: search as string, $options: "i" } },
      { story: { $regex: search as string, $options: "i" } },
    ];
  }

  let query = Campaign.find(filter);
  if (sort === "newest") query = query.sort({ createdAt: -1 });
  else if (sort === "deadline") query = query.sort({ deadline: 1 });
  else query = query.sort({ amountRaised: -1 });

  const campaigns = await query;
  res.status(200).json({ success: true, count: campaigns.length, campaigns });
};

export const getCampaignById = async (req: Request, res: Response): Promise<void> => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    res.status(404).json({ success: false, message: "Campaign not found." });
    return;
  }
  res.status(200).json({ success: true, campaign });
};

// ---------- CREATOR ----------

export const createCampaign = async (req: Request, res: Response): Promise<void> => {
  const {
    title,
    story,
    category,
    fundingGoal,
    minimumContribution,
    deadline,
    rewardInfo,
    imageURL,
  } = req.body;

  if (!title || !story || !fundingGoal || !minimumContribution || !deadline) {
    res.status(400).json({ success: false, message: "Missing required campaign fields." });
    return;
  }

  const dl = toDate(deadline);
  if (!dl) {
    res.status(400).json({ success: false, message: "Invalid deadline date." });
    return;
  }

  const campaign = await Campaign.create({
    title,
    story,
    category: category || "Other",
    fundingGoal: Number(fundingGoal),
    minimumContribution: Number(minimumContribution),
    deadline: dl,
    rewardInfo: rewardInfo || "",
    imageURL: imageURL || "",
    creatorName: req.user!.name,
    creatorEmail: req.user!.email,
    status: "pending",
  });

  res.status(201).json({ success: true, campaign });
};

export const myCampaigns = async (req: Request, res: Response): Promise<void> => {
  const campaigns = await Campaign.find({ creatorEmail: req.user!.email }).sort({ deadline: -1 });
  res.status(200).json({ success: true, count: campaigns.length, campaigns });
};

export const updateCampaign = async (req: Request, res: Response): Promise<void> => {
  const { title, story, rewardInfo } = req.body;
  const campaign = await Campaign.findOneAndUpdate(
    { _id: req.params.id, creatorEmail: req.user!.email },
    { title, story, rewardInfo },
    { new: true, runValidators: true }
  );
  if (!campaign) {
    res.status(404).json({ success: false, message: "Campaign not found or not owned by you." });
    return;
  }
  res.status(200).json({ success: true, campaign });
};

// Delete a campaign and refund all approved contributors
export const deleteCampaign = async (req: Request, res: Response): Promise<void> => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    res.status(404).json({ success: false, message: "Campaign not found." });
    return;
  }

  // Find approved contributions to refund supporters
  const approved = await Contribution.find({ campaignId: campaign._id, status: "approved" });
  for (const c of approved) {
    await User_creditRefund(c.supporterEmail, c.contributionAmount);
  }
  await Contribution.deleteMany({ campaignId: campaign._id });
  await Campaign.findByIdAndDelete(campaign._id);

  res.status(200).json({ success: true, message: "Campaign deleted and contributors refunded." });
};

// Small helper kept local to avoid circular import noise
import User from "../models/User.js";
const User_creditRefund = async (email: string, amount: number) => {
  await User.updateOne({ email }, { $inc: { credits: amount } });
};

// ---------- CREATOR HOME STATE ----------
export const creatorHomeStats = async (req: Request, res: Response): Promise<void> => {
  const email = req.user!.email;
  const [total, active, contributions] = await Promise.all([
    Campaign.countDocuments({ creatorEmail: email }),
    Campaign.countDocuments({ creatorEmail: email, deadline: { $gte: new Date() } }),
    Campaign.aggregate([
      { $match: { creatorEmail: email } },
      { $group: { _id: null, totalRaised: { $sum: "$amountRaised" } } },
    ]),
  ]);
  const totalRaised = contributions[0]?.totalRaised ?? 0;
  res.status(200).json({ success: true, stats: { total, active, totalRaised } });
};

// ---------- ADMIN ----------

// Pending campaigns for approval
export const getPendingCampaigns = async (_req: Request, res: Response): Promise<void> => {
  const campaigns = await Campaign.find({ status: "pending" }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, campaigns });
};

export const approveCampaign = async (req: Request, res: Response): Promise<void> => {
  const campaign = await Campaign.findByIdAndUpdate(
    req.params.id,
    { status: "approved" },
    { new: true }
  );
  if (!campaign) {
    res.status(404).json({ success: false, message: "Campaign not found." });
    return;
  }
  await createNotification({
    message: `Your campaign "${campaign.title}" has been approved by the admin.`,
    toEmail: campaign.creatorEmail,
    actionRoute: "/dashboard/my-campaigns",
  });
  res.status(200).json({ success: true, campaign });
};

export const rejectCampaign = async (req: Request, res: Response): Promise<void> => {
  const campaign = await Campaign.findByIdAndUpdate(
    req.params.id,
    { status: "rejected" },
    { new: true }
  );
  if (!campaign) {
    res.status(404).json({ success: false, message: "Campaign not found." });
    return;
  }
  await createNotification({
    message: `Your campaign "${campaign.title}" was rejected by the admin.`,
    toEmail: campaign.creatorEmail,
    actionRoute: "/dashboard/my-campaigns",
  });
  res.status(200).json({ success: true, campaign });
};

// Admin: all campaigns
export const getAllCampaigns = async (_req: Request, res: Response): Promise<void> => {
  const campaigns = await Campaign.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: campaigns.length, campaigns });
};