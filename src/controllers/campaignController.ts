import { Request, Response } from "express";
import mongoose from "mongoose";
import Campaign from "../models/Campaign.js";
import Contribution from "../models/Contribution.js";
import { createNotification } from "../utils/notify.js";
import User from "../models/User.js";

// Convert a value to a Date, or return undefined when invalid
const toDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? undefined : d;
};

// ---------- PUBLIC / SUPPORTER ----------

// Top 6 funded (approved) campaigns by amount raised
export const getTopFunded = async (_req: Request, res: Response): Promise<void> => {
  const campaigns = await Campaign.find({ status: "approved" })
    .sort({ amountRaised: -1 })
    .limit(6);
  res.status(200).json({ success: true, campaigns });
};

// Explore: approved campaigns whose deadline has not passed, with optional search/filter
export const exploreCampaigns = async (req: Request, res: Response): Promise<void> => {
  const { category, search, sort, minGoal, maxGoal, deadlineDays } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(24, Math.max(1, Number(req.query.limit) || 8));
  const filter: Record<string, unknown> = { status: "approved", deadline: { $gte: new Date() } };

  if (category && category !== "All") filter.category = category;
  if (search) {
    filter.$or = [
      { title: { $regex: search as string, $options: "i" } },
      { story: { $regex: search as string, $options: "i" } },
    ];
  }

  const goalFilter: Record<string, number> = {};
  if (minGoal !== undefined && minGoal !== "" && Number(minGoal) >= 0) goalFilter.$gte = Number(minGoal);
  if (maxGoal !== undefined && maxGoal !== "" && Number(maxGoal) > 0) goalFilter.$lte = Number(maxGoal);
  if (Object.keys(goalFilter).length) filter.fundingGoal = goalFilter;
  if (Number(deadlineDays) > 0) {
    const end = new Date();
    end.setDate(end.getDate() + Number(deadlineDays));
    filter.deadline = { $gte: new Date(), $lte: end };
  }

  let query = Campaign.find(filter);
  if (sort === "newest") query = query.sort({ createdAt: -1 });
  else if (sort === "deadline") query = query.sort({ deadline: 1 });
  else query = query.sort({ amountRaised: -1 });

  const [campaigns, total] = await Promise.all([
    query.skip((page - 1) * limit).limit(limit),
    Campaign.countDocuments(filter),
  ]);
  res.status(200).json({
    success: true,
    count: campaigns.length,
    campaigns,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

export const getPlatformStats = async (_req: Request, res: Response): Promise<void> => {
  const [supporters, creators, approvedCampaigns, pledged, fundedCampaigns] = await Promise.all([
    User.countDocuments({ role: "supporter" }),
    User.countDocuments({ role: "creator" }),
    Campaign.countDocuments({ status: "approved" }),
    Campaign.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, total: { $sum: "$amountRaised" } } },
    ]),
    Campaign.countDocuments({
      status: "approved",
      $expr: { $gte: ["$amountRaised", "$fundingGoal"] },
    }),
  ]);
  res.status(200).json({
    success: true,
    stats: {
      supporters,
      creators,
      approvedCampaigns,
      creditsPledged: pledged[0]?.total ?? 0,
      fundedCampaigns,
    },
  });
};

export const getCampaignById = async (req: Request, res: Response): Promise<void> => {
  const campaign = await Campaign.findOne({ _id: req.params.id, status: "approved" });
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
    shortDescription,
    story,
    category,
    fundingGoal,
    minimumContribution,
    deadline,
    rewardInfo,
    imageURL,
  } = req.body;

  if (!title || !shortDescription || !story || !fundingGoal || !minimumContribution || !deadline) {
    res.status(400).json({ success: false, message: "Missing required campaign fields." });
    return;
  }

  const dl = toDate(deadline);
  const goal = Number(fundingGoal);
  const minimum = Number(minimumContribution);
  if (!dl || dl <= new Date()) {
    res.status(400).json({ success: false, message: "Deadline must be a future date." });
    return;
  }
  if (!Number.isFinite(goal) || goal <= 0 || !Number.isFinite(minimum) || minimum <= 0) {
    res.status(400).json({ success: false, message: "Funding goal and minimum contribution must be positive numbers." });
    return;
  }

  const campaign = await Campaign.create({
    title,
    shortDescription,
    story,
    category: category || "Other",
    fundingGoal: goal,
    minimumContribution: minimum,
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
  const { title, shortDescription, story, rewardInfo } = req.body;
  const campaign = await Campaign.findOneAndUpdate(
    { _id: req.params.id, creatorEmail: req.user!.email },
    { title, shortDescription, story, rewardInfo },
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
  const filter = req.user!.role === "admin"
    ? { _id: req.params.id }
    : { _id: req.params.id, creatorEmail: req.user!.email };
  const campaign = await Campaign.findOne(filter);
  if (!campaign) {
    res.status(404).json({ success: false, message: "Campaign not found or not available to delete." });
    return;
  }

  // Find approved contributions to refund supporters
  const refundable = await Contribution.find({
    campaignId: campaign._id,
    status: { $in: ["approved", "pending"] },
  });
  for (const c of refundable) {
    await User_creditRefund(c.supporterEmail, c.contributionAmount);
  }
  await Contribution.deleteMany({ campaignId: campaign._id });
  await Campaign.findByIdAndDelete(campaign._id);

  res.status(200).json({ success: true, message: "Campaign deleted and contributors refunded." });
};

// Small helper kept local to avoid circular import noise
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
  const campaign = await Campaign.findOneAndUpdate(
    { _id: req.params.id, status: "pending" },
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
  const campaign = await Campaign.findOneAndUpdate(
    { _id: req.params.id, status: "pending" },
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
