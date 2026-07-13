import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.js";
import { register, login, OpenAILogin, getMe } from "../controllers/authController.js";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/OpenAI", asyncHandler(OpenAILogin));
router.get("/me", protect, asyncHandler(getMe));

export default router;