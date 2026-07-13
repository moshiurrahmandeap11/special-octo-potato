import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.js";
import {
  getMyNotifications,
  markRead,
  markAllRead,
} from "../controllers/notificationController.js";

const router = Router();

router.use(protect);

router.get("/", asyncHandler(getMyNotifications));
router.patch("/read-all", asyncHandler(markAllRead));
router.patch("/:id/read", asyncHandler(markRead));

export default router;