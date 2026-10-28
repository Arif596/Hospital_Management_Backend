import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../Models/User.js";
import catchAsyncError from "../Middleware/CatchAsyncError.js";
import ErrorHandler from "../Utils/ErrorHandler.js";

// Generate a JWT for the given user id (expiry comes from .env, defaults to 7 days)
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// Validation schema for the register request body
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
});

// @desc    Register a new user (always created with the default "patient" role)
// @route   POST /api/auth/register
// @access  Public
export const register = catchAsyncError(async (req, res) => {
  // Validate the incoming data before touching the database
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ErrorHandler(parsed.error.issues[0].message, 400);
  }

  const { name, email, password } = parsed.data;

  // Prevent duplicate accounts with the same email
  if (await User.findOne({ email })) {
    throw new ErrorHandler("Email already registered", 400);
  }

  // Role is intentionally NOT taken from the request body,
  // otherwise anyone could register themselves as an admin.
  // The password is hashed automatically by the pre("save") hook in the User model.
  const user = await User.create({ name, email, password });

  res.status(201).json({
    success: true,
    token: signToken(user._id),
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// @desc    Log in an existing user and return a JWT
// @route   POST /api/auth/login
// @access  Public
export const login = catchAsyncError(async (req, res) => {
  const { email, password } = req.body;

  // Make sure both fields were sent
  if (!email || !password) {
    throw new ErrorHandler("Email and password are required", 400);
  }

  // Password has select: false in the schema, so it must be requested explicitly
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  // Use the same generic message for both cases so attackers can't tell
  // whether the email exists or the password was wrong
  if (!user || !(await user.matchPassword(password))) {
    throw new ErrorHandler("Invalid email or password", 401);
  }

  res.json({
    success: true,
    token: signToken(user._id),
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// @desc    Get the currently logged-in user's data
// @route   GET /api/auth/me
// @access  Private (requires the protect middleware, which sets req.user)
export const getMe = catchAsyncError(async (req, res) => {
  res.json({ success: true, user: req.user });
});