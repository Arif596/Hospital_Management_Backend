import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../Models/User.js";
import catchAsyncError from "../Middleware/CatchAsyncError.js";
import ErrorHandler from "../Utils/ErrorHandler.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../Utils/cloudinary.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// Cookie set aur clear dono mein same options chahiye
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

// Frontend ko sirf zaroori fields (password kabhi nahi)
const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  phone: u.phone || "",
  address: { line1: u.address?.line1 || "", line2: u.address?.line2 || "" },
  gender: u.gender || "Not Selected",
  dob: u.dob || "",
  image: u.image || "",
});

// Cookie set karke user bhejta hai
const sendAuth = (res, user, status = 200) => {
  res.cookie("token", signToken(user._id), {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.status(status).json({ success: true, user: publicUser(user) });
};

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// POST /api/v1/auth/register
export const register = catchAsyncError(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) throw new ErrorHandler(parsed.error.issues[0].message, 400);

  const { name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  if (await User.findOne({ email })) {
    throw new ErrorHandler("Email already registered", 400);
  }

  // Role body se nahi liya (warna koi khud ko admin bana leta)
  const user = await User.create({ name, email, password });
  sendAuth(res, user, 201);
});

// POST /api/v1/auth/login
export const login = catchAsyncError(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ErrorHandler("Email and password are required", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    throw new ErrorHandler("Invalid email or password", 401);
  }
  sendAuth(res, user);
});

// POST /api/v1/auth/logout
export const logout = catchAsyncError(async (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.json({ success: true });
});

// GET /api/v1/auth/me
export const getMe = catchAsyncError(async (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

// Profile update validation (email aur role yahan nahi, to badle nahi ja sakte)
const updateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z.string().trim().max(20, "Phone is too long").optional(),
  addressLine1: z.string().trim().max(100).optional(),
  addressLine2: z.string().trim().max(100).optional(),
  gender: z.enum(["Male", "Female", "Not Selected"]).optional(),
  dob: z.string().optional(),
});

// PUT /api/v1/auth/update-profile  (multipart/form-data, image optional)
export const updateMe = catchAsyncError(async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) throw new ErrorHandler(parsed.error.issues[0].message, 400);

  const user = await User.findById(req.user._id).select("+imagePublicId");
  const { name, phone, addressLine1, addressLine2, gender, dob } = parsed.data;

  user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (gender !== undefined) user.gender = gender;
  if (dob !== undefined) user.dob = dob;
  user.address = {
    line1: addressLine1 ?? user.address?.line1 ?? "",
    line2: addressLine2 ?? user.address?.line2 ?? "",
  };

  // req.file multer middleware se aati hai (route mein uploadImage lagana zaroori)
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, "hospital/profiles");
    await deleteFromCloudinary(user.imagePublicId).catch(() => {});
    user.image = result.secure_url;
    user.imagePublicId = result.public_id;
  }

  await user.save();
  res.json({ success: true, user: publicUser(user) });
});