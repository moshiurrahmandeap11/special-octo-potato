import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect, restrictTo } from "../middleware/auth.js";
import {
  getPackages,
  createPaymentIntent,
  stripeWebhook,
  myPayments,
} from "../controllers/paymentController.js";

const router = Router();

// Package prices are public; purchasing and history are supporter-only.
router.get("/packages", asyncHandler(getPackages));
router.post("/create-intent", protect, restrictTo("supporter"), asyncHandler(createPaymentIntent));

// Stripe webhook must use raw body parsing (handled in index.ts for this path)
router.post("/webhook", stripeWebhook);

// Supporter: payment history
router.get("/my", protect, restrictTo("supporter"), asyncHandler(myPayments));

export default router;
