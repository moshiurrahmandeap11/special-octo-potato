import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect, restrictTo } from "../middleware/auth.js";
import {
  createReport,
  getReports,
  resolveReport,
} from "../controllers/reportController.js";

const router = Router();

// Supporter
router.post("/", protect, restrictTo("supporter"), asyncHandler(createReport));

// Admin
router.get("/", protect, restrictTo("admin"), asyncHandler(getReports));
router.patch("/:id/resolve", protect, restrictTo("admin"), asyncHandler(resolveReport));

export default router;