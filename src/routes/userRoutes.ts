import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect, restrictTo } from "../middleware/auth.js";
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserStats,
} from "../controllers/userController.js";

const router = Router();

router.use(protect, restrictTo("admin"));

router.get("/stats", asyncHandler(getUserStats));
router.get("/", asyncHandler(getAllUsers));
router.patch("/:id/role", asyncHandler(updateUserRole));
router.delete("/:id", asyncHandler(deleteUser));

export default router;