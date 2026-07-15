import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User, { IUser } from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import { verifyGoogleToken } from "../utils/GoogleAuth.js";

// Default credits granted on registration (once only)
const DEFAULT_CREDITS: Record<string, number> = {
  supporter: 50,
  creator: 20,
  admin: 0,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const sanitizeUser = (user: IUser) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  photoURL: user.photoURL,
  role: user.role,
  credits: user.credits,
  createdAt: user.createdAt,
});

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, photoURL, role } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({ success: false, message: "Name, email, password and role are required." });
    return;
  }

  if (!EMAIL_PATTERN.test(String(email))) {
    res.status(400).json({ success: false, message: "Please provide a valid email address." });
    return;
  }

  if (!STRONG_PASSWORD.test(String(password))) {
    res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters and include uppercase, lowercase, and a number.",
    });
    return;
  }

  if (role !== "supporter" && role !== "creator") {
    res.status(400).json({ success: false, message: "Role must be 'supporter' or 'creator'." });
    return;
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409).json({ success: false, message: "An account with this email already exists." });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashed,
    photoURL: photoURL || "https://i.ibb.co/0Q8c0cX/default.png",
    role,
    credits: DEFAULT_CREDITS[role] ?? 0,
  });

  const token = signToken({ id: String(user._id), name: user.name, email: user.email, role: user.role });
  res.status(201).json({ success: true, token, user: sanitizeUser(user) });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ success: false, message: "Email and password are required." });
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !user.password) {
    res.status(401).json({ success: false, message: "Invalid email or password." });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401).json({ success: false, message: "Invalid email or password." });
    return;
  }

  const token = signToken({ id: String(user._id), name: user.name, email: user.email, role: user.role });
  res.status(200).json({ success: true, token, user: sanitizeUser(user) });
};

/**
 * Google OAuth sign-in. The Next.js client performs the Google redirect to
 * GOOGLE_REDIRECT_URI, receives a Google ID token, and sends it here.
 * We verify it server-side, then upsert a supporter account (50 credits).
 */
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  const { idToken } = req.body;
  if (!idToken) {
    res.status(400).json({ success: false, message: "Google ID token is required." });
    return;
  }

  let profile;
  try {
    profile = await verifyGoogleToken(idToken);
  } catch (err) {
    res.status(401).json({ success: false, message: `Google auth failed: ${(err as Error).message}` });
    return;
  }

  const normalizedEmail = profile.email.toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    user = await User.create({
      name: profile.name,
      email: normalizedEmail,
      photoURL: profile.picture || "https://i.ibb.co/0Q8c0cX/default.png",
      role: "supporter",
      credits: DEFAULT_CREDITS.supporter,
    });
  }

  const token = signToken({ id: String(user._id), name: user.name, email: user.email, role: user.role });
  res.status(200).json({ success: true, token, user: sanitizeUser(user) });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found." });
    return;
  }
  res.status(200).json({ success: true, user: sanitizeUser(user) });
};
