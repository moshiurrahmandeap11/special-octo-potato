import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect, restrictTo } from "../middleware/auth.js";
import {
  getTopFunded,
  getPlatformStats,
  exploreCampaigns,
  getCampaignById,
  createCampaign,
  myCampaigns,
  updateCampaign,
  deleteCampaign,
  creatorHomeStats,
  getPendingCampaigns,
  approveCampaign,
  rejectCampaign,
  getAllCampaigns,
} from "../controllers/campaignController.js";

const router = Router();

// Public / supporter-facing
router.get("/top-funded", asyncHandler(getTopFunded));
router.get("/platform/stats", asyncHandler(getPlatformStats));
router.get("/explore", asyncHandler(exploreCampaigns));
router.get("/:id", asyncHandler(getCampaignById));

// Creator
router.post("/", protect, restrictTo("creator"), asyncHandler(createCampaign));
router.get("/my/list", protect, restrictTo("creator"), asyncHandler(myCampaigns));
router.get("/creator/stats", protect, restrictTo("creator"), asyncHandler(creatorHomeStats));
router.patch("/:id", protect, restrictTo("creator"), asyncHandler(updateCampaign));
router.delete("/:id", protect, restrictTo("creator", "admin"), asyncHandler(deleteCampaign));

// Admin
router.get(
  "/admin/pending",
  protect,
  restrictTo("admin"),
  asyncHandler(getPendingCampaigns)
);
router.get("/admin/all", protect, restrictTo("admin"), asyncHandler(getAllCampaigns));
router.patch(
  "/:id/approve",
  protect,
  restrictTo("admin"),
  asyncHandler(approveCampaign)
);
router.patch(
  "/:id/reject",
  protect,
  restrictTo("admin"),
  asyncHandler(rejectCampaign)
);

export default router;
