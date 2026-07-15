import { Request, Response } from "express";
import mongoose from "mongoose";
import Contribution from "../models/Contribution.js";
import Campaign from "../models/Campaign.js";
import User from "../models/User.js";
import { createNotification } from "../utils/notify.js";

// ---------- SUPPORTER ----------

// Create a pending contribution
export const createContribution = async (req: Request, res: Response): Promise<void> => {
  const { campaignId, contributionAmount, message } = req.body;

  if (!campaignId || !contributionAmount) {
    res.status(400).json({ success: false, message: "campaignId and contributionAmount are required." });
    return;
  }

  const amount = Number(contributionAmount);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    res.status(400).json({ success: false, message: "Contribution must be a positive whole number of credits." });
    return;
  }
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    res.status(404).json({ success: false, message: "Campaign not found." });
    return;
  }
  if (campaign.status !== "approved") {
    res.status(400).json({ success: false, message: "This campaign is not open for contributions." });
    return;
  }
  if (campaign.deadline < new Date()) {
    res.status(400).json({ success: false, message: "This campaign's deadline has passed." });
    return;
  }
  if (amount < campaign.minimumContribution) {
    res.status(400).json({
      success: false,
      message: `Minimum contribution is ${campaign.minimumContribution} credits.`,
    });
    return;
  }

  // Deduct from supporter's available credits
  const supporter = await User.findOneAndUpdate(
    { email: req.user!.email, credits: { $gte: amount } },
    { $inc: { credits: -amount } },
    { new: true }
  );
  if (!supporter) {
    res.status(400).json({ success: false, message: "Insufficient credits." });
    return;
  }
  let contribution;
  try {
    contribution = await Contribution.create({
      campaignId: campaign._id,
      campaignTitle: campaign.title,
      contributionAmount: amount,
      supporterEmail: req.user!.email,
      supporterName: req.user!.name,
      creatorName: campaign.creatorName,
      creatorEmail: campaign.creatorEmail,
      message,
      status: "pending",
    });
  } catch (error) {
    await User.updateOne({ email: req.user!.email }, { $inc: { credits: amount } });
    throw error;
  }

  // Notify the creator about the new pending contribution
  await createNotification({
    message: `${req.user!.name} contributed ${amount} credits to "${campaign.title}".`,
    toEmail: campaign.creatorEmail,
    actionRoute: "/dashboard/creator-home",
  });

  res.status(201).json({ success: true, contribution });
};

// Supporter: approved contributions + stats
export const myApprovedContributions = async (req: Request, res: Response): Promise<void> => {
  const contributions = await Contribution.find({
    supporterEmail: req.user!.email,
    status: "approved",
  }).sort({ date: -1 });
  res.status(200).json({ success: true, count: contributions.length, contributions });
};

// Supporter: all contributions with pagination (challenge requirement)
export const myContributions = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
  const skip = (page - 1) * limit;

  const filter = { supporterEmail: req.user!.email };
  const [contributions, total] = await Promise.all([
    Contribution.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
    Contribution.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    contributions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

export const supporterHomeStats = async (req: Request, res: Response): Promise<void> => {
  const email = req.user!.email;
  const [total, pending, approved] = await Promise.all([
    Contribution.countDocuments({ supporterEmail: email }),
    Contribution.countDocuments({ supporterEmail: email, status: "pending" }),
    Contribution.aggregate([
      { $match: { supporterEmail: email, status: "approved" } },
      { $group: { _id: null, total: { $sum: "$contributionAmount" } } },
    ]),
  ]);
  const totalAmount = approved[0]?.total ?? 0;
  res.status(200).json({ success: true, stats: { total, pending, totalAmount } });
};

// ---------- CREATOR ----------

// Pending contributions to the creator's campaigns
export const creatorPendingContributions = async (req: Request, res: Response): Promise<void> => {
  const contributions = await Contribution.find({
    creatorEmail: req.user!.email,
    status: "pending",
  }).sort({ date: -1 });
  res.status(200).json({ success: true, count: contributions.length, contributions });
};

export const approveContribution = async (req: Request, res: Response): Promise<void> => {
  const contribution = await Contribution.findOneAndUpdate({
    _id: req.params.id,
    creatorEmail: req.user!.email,
    status: "pending",
  }, { status: "approved" }, { new: true });
  if (!contribution) {
    res.status(404).json({ success: false, message: "Contribution not found." });
    return;
  }
  // Add the amount to the campaign's raised total
  await Campaign.updateOne(
    { _id: contribution.campaignId },
    { $inc: { amountRaised: contribution.contributionAmount } }
  );

  await createNotification({
    message: `Your contribution of ${contribution.contributionAmount} credits to "${contribution.campaignTitle}" was approved by ${req.user!.name}.`,
    toEmail: contribution.supporterEmail,
    actionRoute: "/dashboard/supporter-home",
  });

  res.status(200).json({ success: true, contribution });
};

export const rejectContribution = async (req: Request, res: Response): Promise<void> => {
  const contribution = await Contribution.findOneAndUpdate({
    _id: req.params.id,
    creatorEmail: req.user!.email,
    status: "pending",
  }, { status: "rejected" }, { new: true });
  if (!contribution) {
    res.status(404).json({ success: false, message: "Contribution not found." });
    return;
  }
  // Refund the supporter's credits
  await User.updateOne(
    { email: contribution.supporterEmail },
    { $inc: { credits: contribution.contributionAmount } }
  );

  await createNotification({
    message: `Your contribution of ${contribution.contributionAmount} credits to "${contribution.campaignTitle}" was rejected by ${req.user!.name}. Credits were refunded.`,
    toEmail: contribution.supporterEmail,
    actionRoute: "/dashboard/supporter-home",
  });

  res.status(200).json({ success: true, contribution });
};
