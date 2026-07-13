import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.js";
import {
  getPackages,
  createPaymentIntent,
  stripeWebhook,
  myPayments,
} from "../controllers/paymentController.js";

const router = Router();

// Public: list credit packages & start a payment (dummy fallback works unauthenticated)
router.get("/packages", asyncHandler(getPackages));
router.post("/create-intent", asyncHandler(createPaymentIntent));

// Stripe webhook must use raw body parsing (handled in index.ts for this path)
router.post("/webhook", stripeWebhook);

// Supporter: payment history
router.get("/my", protect, asyncHandler(myPayments));

export default router;