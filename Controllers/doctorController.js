import { z } from "zod";
import User from "../Models/User.js";
import Doctor from "../Models/Doctor.js";
import ErrorHandler from "../Utils/ErrorHandler.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../Utils/cloudinary.js";
import catchAsyncError from "../Middleware/CatchAsyncError.js";

// With multipart/form-data every field arrives as a string,
// so numbers are coerced and arrays are parsed from JSON strings
const jsonArray = z.preprocess((v) => {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v; // zod will reject it with a clear error
  }
}, z.array(z.string()));

const createSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  specialization: z.string().min(2),
  fee: z.coerce.number().positive(),
  experience: z.coerce.number().min(0).optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  availableDays: jsonArray.optional(),
  timeSlots: jsonArray.optional(),
});

// Only these fields can be changed through the update route
const updateSchema = createSchema
  .pick({
    specialization: true,
    fee: true,
    experience: true,
    phone: true,
    bio: true,
    availableDays: true,
    timeSlots: true,
  })
  .partial();

// @desc    Create a doctor account + profile (with optional image)
// @route   POST /api/doctors
// @access  Admin
export const createDoctor = catchAsyncError(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) throw new ErrorHandler(parsed.error.issues[0].message, 400);

  const { name, email, password, ...profile } = parsed.data;

  if (await User.findOne({ email: email.toLowerCase() })) {
    throw new ErrorHandler("Email already registered", 400);
  }

  // Upload the image first (if any)
  let image;
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer);
    image = { url: result.secure_url, publicId: result.public_id };
  }

  let user;
  try {
    user = await User.create({ name, email, password, role: "doctor" });
    const doctor = await Doctor.create({ user: user._id, ...profile, ...(image && { image }) });
    res.status(201).json({ success: true, doctor });
  } catch (error) {
    // Roll back so we don't leave orphan data behind
    if (user) await User.findByIdAndDelete(user._id);
    if (image) await deleteFromCloudinary(image.publicId);
    throw error;
  }
});

// @desc    List doctors (optional ?specialization=)
// @route   GET /api/doctors
// @access  Public
export const getDoctors =catchAsyncError(async (req, res) => {
  const filter = {};
  if (req.query.specialization) {
    // Escape regex characters so user input can't break the query
    const safe = String(req.query.specialization).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.specialization = new RegExp(safe, "i");
  }
  const doctors = await Doctor.find(filter).populate("user", "name email");
  res.json({ success: true, count: doctors.length, doctors });
});

// @desc    Get one doctor
// @route   GET /api/doctors/:id
// @access  Public
export const getDoctor = catchAsyncError(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate("user", "name email");
  if (!doctor) throw new ErrorHandler("Doctor not found", 404);
  res.json({ success: true, doctor });
});

// @desc    Update doctor profile (optionally replace the image)
// @route   PUT /api/doctors/:id
// @access  Admin
export const updateDoctor = catchAsyncError(async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) throw new ErrorHandler(parsed.error.issues[0].message, 400);

  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) throw new ErrorHandler("Doctor not found", 404);

  Object.assign(doctor, parsed.data);

  if (req.file) {
    const oldPublicId = doctor.image?.publicId;
    const result = await uploadToCloudinary(req.file.buffer);
    doctor.image = { url: result.secure_url, publicId: result.public_id };
    await doctor.save();
    await deleteFromCloudinary(oldPublicId); // remove the old image only after the new one is saved
  } else {
    await doctor.save();
  }

  res.json({ success: true, doctor });
});

// @desc    Delete doctor, their user account and Cloudinary image
// @route   DELETE /api/doctors/:id
// @access  Admin
export const deleteDoctor = catchAsyncError(async (req, res) => {
  const doctor = await Doctor.findByIdAndDelete(req.params.id);
  if (!doctor) throw new ErrorHandler("Doctor noSt found", 404);

  await User.findByIdAndDelete(doctor.user);
  await deleteFromCloudinary(doctor.image?.publicId);

  res.json({ success: true, message: "Doctor deleted" });
});