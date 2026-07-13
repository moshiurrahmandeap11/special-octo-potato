import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect, restrictTo } from "../middleware/auth.js";
import {
  withdrawalInfo,
  requestWithdrawal,
  myWithdrawals,
  pendingWithdrawals,
  completeWithdrawal,
} from "../controllers/withdrawalController.js";

const router = Router();

// Creator
router.get("/info", protect, restrictTo("creator"), asyncHandler(withdrawalInfo));
router.post("/request", protect, restrictTo("creator"), asyncHandler(requestWithdrawal));
router.get("/my", protect, restrictTo("creator"), asyncHandler(myWithdrawals));

// Admin
router.get(
  "/pending",
  protect,
  restrictTo("admin"),
  asyncHandler(pendingWithdrawals)
);
router.patch(
  "/:id/complete",
  protect,
  restrictTo("admin"),
  asyncHandler(completeWithdrawal)
);

export default router;