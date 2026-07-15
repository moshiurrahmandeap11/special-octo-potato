import "dotenv/config";
import { Request, Response } from "express";
import Stripe from "stripe";
import Payment from "../models/Payment.js";
import User from "../models/User.js";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

interface CreditPackage {
  credits: number;
  amount: number; // dollars
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { credits: 100, amount: 10 },
  { credits: 300, amount: 25 },
  { credits: 800, amount: 60 },
  { credits: 1500, amount: 110 },
];

// Public: list purchasable credit packages (10 credits = $1)
export const getPackages = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({ success: true, packages: CREDIT_PACKAGES });
};

// Public (or user): create a Stripe checkout session, or dummy fallback
export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
  const credits = Number(req.body.credits);
  const requestedPackage = CREDIT_PACKAGES.find((item) => item.credits === credits);
  if (!requestedPackage) {
    res.status(400).json({ success: false, message: "Please select a valid credit package." });
    return;
  }
  const amount = requestedPackage.amount;

  // Dummy payment fallback when Stripe is not configured (per spec)
  if (!stripe) {
    if (process.env.NODE_ENV === "production") {
      res.status(503).json({
        success: false,
        message: "Payments are temporarily unavailable because Stripe is not configured.",
      });
      return;
    }
    const transactionId = `dummy_${Date.now()}`;
    await Payment.create({
      userEmail: req.user!.email,
      userName: req.user!.name,
      credits,
      amount,
      paymentSystem: "Dummy",
      transactionId,
      status: "succeeded",
    });
    await User.updateOne({ email: req.user!.email }, { $inc: { credits } });
    res.status(200).json({
      success: true,
      dummy: true,
      transactionId,
      message: "Dummy payment successful. Credits added.",
    });
    return;
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `${credits} Crowdfunding Credits` },
          unit_amount: Math.round(Number(amount) * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.CLIENT_URL}/dashboard/payment-history?status=success`,
    cancel_url: `${process.env.CLIENT_URL}/dashboard/purchase-credit?status=cancel`,
    metadata: { credits: String(credits), userEmail: req.user!.email, userName: req.user!.name },
  });

  res.status(200).json({ success: true, url: session.url });
};

// Stripe webhook to confirm successful payments (only used when Stripe is configured)
export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  if (!stripe) {
    res.status(400).json({ success: false, message: "Stripe is not configured." });
    return;
  }
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch (err) {
    res.status(400).json({ success: false, message: `Webhook error: ${(err as Error).message}` });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const credits = Number(session.metadata?.credits ?? 0);
    const email = session.metadata?.userEmail ?? "";
    if (credits && email) {
      if (await Payment.exists({ transactionId: session.id })) {
        res.json({ received: true });
        return;
      }
      await Payment.create({
        userEmail: email,
        userName: session.metadata?.userName || email,
        credits,
        amount: Number(session.amount_total) / 100,
        paymentSystem: "Stripe",
        transactionId: session.id,
        status: "succeeded",
      });
      await User.updateOne({ email }, { $inc: { credits } });
    }
  }

  res.json({ received: true });
};

// Supporter: payment history
export const myPayments = async (req: Request, res: Response): Promise<void> => {
  const payments = await Payment.find({ userEmail: req.user!.email }).sort({ date: -1 });
  res.status(200).json({ success: true, count: payments.length, payments });
};
