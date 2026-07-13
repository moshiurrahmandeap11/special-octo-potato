import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect, restrictTo } from "../middleware/auth.js";
import {
  createContribution,
  myApprovedContributions,
  myContributions,
  supporterHomeStats,
  creatorPendingContributions,
  approveContribution,
  rejectContribution,
} from "../controllers/contributionController.js";

const router = Router();

// Supporter
router.post("/", protect, restrictTo("supporter"), asyncHandler(createContribution));
router.get("/approved", protect, restrictTo("supporter"), asyncHandler(myApprovedContributions));
router.get("/my", protect, restrictTo("supporter"), asyncHandler(myContributions));
router.get("/supporter/stats", protect, restrictTo("supporter"), asyncHandler(supporterHomeStats));

// Creator
router.get(
  "/pending",
  protect,
  restrictTo("creator"),
  asyncHandler(creatorPendingContributions)
);
router.patch(
  "/:id/approve",
  protect,
  restrictTo("creator"),
  asyncHandler(approveContribution)
);
router.patch(
  "/:id/reject",
  protect,
  restrictTo("creator"),
  asyncHandler(rejectContribution)
);

export default router;