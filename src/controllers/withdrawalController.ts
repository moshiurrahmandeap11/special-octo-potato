import { Request, Response } from "express";
import Withdrawal, { CREDITS_PER_DOLLAR } from "../models/Withdrawal.js";
import Campaign from "../models/Campaign.js";
import { createNotification } from "../utils/notify.js";

// Creator earnings + minimum eligibility
export const withdrawalInfo = async (req: Request, res: Response): Promise<void> => {
  const raised = await Campaign.aggregate([
    { $match: { creatorEmail: req.user!.email, status: "approved" } },
    { $group: { _id: null, totalRaised: { $sum: "$amountRaised" } } },
  ]);
  const totalRaised = raised[0]?.totalRaised ?? 0;
  const withdrawalAmount = totalRaised / CREDITS_PER_DOLLAR;
  res.status(200).json({
    success: true,
    info: {
      totalRaised,
      withdrawalAmount,
      minCredits: 200,
      eligible: totalRaised >= 200,
    },
  });
};

// Creator: submit a withdrawal request
export const requestWithdrawal = async (req: Request, res: Response): Promise<void> => {
  const { withdrawalCredit, paymentSystem, accountNumber } = req.body;

  const credits = Number(withdrawalCredit);
  if (!credits || credits < 1) {
    res.status(400).json({ success: false, message: "Valid withdrawal credit amount is required." });
    return;
  }

  // Compute current raised credits for the creator
  const raised = await Campaign.aggregate([
    { $match: { creatorEmail: req.user!.email, status: "approved" } },
    { $group: { _id: null, totalRaised: { $sum: "$amountRaised" } } },
  ]);
  const totalRaised = raised[0]?.totalRaised ?? 0;

  if (credits > totalRaised) {
    res.status(400).json({ success: false, message: "Insufficient raised credits." });
    return;
  }

  const amount = credits / CREDITS_PER_DOLLAR;

  const withdrawal = await Withdrawal.create({
    creatorEmail: req.user!.email,
    creatorName: req.user!.name,
    withdrawalCredit: credits,
    withdrawalAmount: amount,
    paymentSystem: paymentSystem || "Stripe",
    accountNumber,
    status: "pending",
  });

  res.status(201).json({ success: true, withdrawal });
};

// Creator: payment history (their own withdrawals)
export const myWithdrawals = async (req: Request, res: Response): Promise<void> => {
  const withdrawals = await Withdrawal.find({ creatorEmail: req.user!.email }).sort({
    withdrawDate: -1,
  });
  res.status(200).json({ success: true, count: withdrawals.length, withdrawals });
};

// Admin: pending withdrawal requests
export const pendingWithdrawals = async (_req: Request, res: Response): Promise<void> => {
  const withdrawals = await Withdrawal.find({ status: "pending" }).sort({ withdrawDate: -1 });
  res.status(200).json({ success: true, count: withdrawals.length, withdrawals });
};

// Admin: mark withdrawal as paid (decrease creator's raised credits)
export const completeWithdrawal = async (req: Request, res: Response): Promise<void> => {
  const withdrawal = await Withdrawal.findById(req.params.id);
  if (!withdrawal) {
    res.status(404).json({ success: false, message: "Withdrawal request not found." });
    return;
  }
  if (withdrawal.status !== "pending") {
    res.status(400).json({ success: false, message: "Withdrawal already processed." });
    return;
  }

  withdrawal.status = "approved";
  await withdrawal.save();

  // Decrease the creator's raised credits across their campaigns proportionally
  // (simplest correct approach: subtract from the most-funded approved campaigns)
  let remaining = withdrawal.withdrawalCredit;
  const campaigns = await Campaign.find({
    creatorEmail: withdrawal.creatorEmail,
    status: "approved",
  }).sort({ amountRaised: -1 });

  for (const c of campaigns) {
    if (remaining <= 0) break;
    const deduct = Math.min(remaining, c.amountRaised);
    c.amountRaised -= deduct;
    remaining -= deduct;
    await c.save();
  }

  await createNotification({
    message: `Your withdrawal request of ${withdrawal.withdrawalCredit} credits ($${withdrawal.withdrawalAmount}) was processed successfully.`,
    toEmail: withdrawal.creatorEmail,
    actionRoute: "/dashboard/withdrawals",
  });

  res.status(200).json({ success: true, withdrawal });
};