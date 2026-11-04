import { z } from "zod";
import Appointment from "../Models/Appointment.js";
import Doctor from "../Models/Doctor.js";
import catchAsyncError from "../Middleware/CatchAsyncError.js";
import ErrorHandler from "../Utils/ErrorHandler.js";
import mongoose from "mongoose";

const bookSchema = z.object({
  doctorId: z.string().length(24, "Invalid doctor id"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date format must be YYYY-MM-DD"),
  timeSlot: z.string().min(1, "timeSlot is required"),
  reason: z.string().optional(),
});
// Index matches Date.getDay(): 0 = Sunday
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// @desc    Book an appointment
// @route   POST /api/appointments
// @access  Patient
export const bookAppointment = catchAsyncError(async (req, res) => {
  const parsed = bookSchema.safeParse(req.body);
  if (!parsed.success)
    throw new ErrorHandler(parsed.error.issues[0].message, 400);
  const { doctorId, date, timeSlot, reason } = parsed.data;

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new ErrorHandler("Doctor not found", 400);
  // Block past dates (string comparison works because of the YYYY-MM-DD format)
  const today = new Date().toISOString().slice(0, 10);
  if (date < today)
    throw new ErrorHandler("Cannot book an appointment in the past", 400);
  // Doctor must work on that weekday
  const day = DAYS[new Date(`${date}T00:00:00`).getDay()];
  if (!doctor.availableDays.includes(day)) {
    throw new ErrorHandler(`Doctor is not available on ${day}`, 400);
  }
   // Slot must be one of the doctor's slots
  if (!doctor.timeSlots.includes(timeSlot)) {
    throw new ErrorHandler(`Invalid slot. Available: ${doctor.timeSlots.join(", ")}`, 400);
  }
   // Friendly check; the unique index in the model is the real protection against races
  const taken = await Appointment.findOne({
    doctor: doctorId,
    date,
    timeSlot,
    status: { $in: ["pending", "confirmed"] },
  });
  if (taken) throw new ErrorHandler("This slot is already booked", 409);

  const appointment = await Appointment.create({
    patient: req.user._id,
    doctor: doctorId,
    date,
    timeSlot,
    reason,
  });

  res.status(201).json({ success: true, appointment });
});
// @desc    Logged-in patient's own appointments
// @route   GET /api/appointments/my
// @access  Patient
export const myAppointments = catchAsyncError(async (req, res) => {
  const appointments = await Appointment.find({ patient: req.user._id })
    .populate({ path: "doctor", populate: { path: "user", select: "name" } })
    .sort({ date: -1 });

  res.json({ success: true, count: appointments.length, appointments });
});

// @desc    Appointments of the logged-in doctor
// @route   GET /api/appointments/doctor
// @access  Doctor
export const doctorAppointments = catchAsyncError(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw new ErrorHandler("Doctor profile not found", 404);

  const appointments = await Appointment.find({ doctor: doctor._id })
    .populate("patient", "name email")
    .sort({ date: 1, timeSlot: 1 });

  res.json({ success: true, count: appointments.length, appointments });
});

// @desc    All appointments
// @route   GET /api/appointments
// @access  Admin
export const allAppointments = catchAsyncError(async (req, res) => {
  const appointments = await Appointment.find()
    .populate("patient", "name email")
    .populate({ path: "doctor", populate: { path: "user", select: "name" } })
    .sort({ createdAt: -1 });

  res.json({ success: true, count: appointments.length, appointments });
});

// @desc    Change appointment status
// @route   PATCH /api/appointments/:id/status
// @access  Patient (cancel own only), Doctor (own), Admin
export const updateStatus = catchAsyncError(async (req, res) => {
  const { status, notes } = req.body;

  if (!["confirmed", "completed", "cancelled"].includes(status)) {
    throw new ErrorHandler("Status must be confirmed, completed or cancelled", 400);
  }

  const appointment = await Appointment.findById(req.params.id).populate("doctor");
  if (!appointment) throw new ErrorHandler("Appointment not found", 404);

  const role = req.user.role;

  if (role === "patient") {
    // A patient can only cancel their own appointment
    const isOwner = appointment.patient.equals(req.user._id);
    if (!isOwner || status !== "cancelled") {
      throw new ErrorHandler("Patients can only cancel their own appointments", 403);
    }
  } else if (role === "doctor") {
    // A doctor can only manage appointments booked with them
    if (!appointment.doctor.user.equals(req.user._id)) {
      throw new ErrorHandler("This is not your appointment", 403);
    }
  }

  if (["completed", "cancelled"].includes(appointment.status)) {
    throw new ErrorHandler(`Appointment is already ${appointment.status}`, 400);
  }

  appointment.status = status;
  if (notes && role !== "patient") appointment.notes = notes;
  await appointment.save();

  res.json({ success: true, appointment });
});
// @desc    Booked slots of a doctor (sirf date + slot, patient ka koi data nahi)
// @route   GET /api/v1/appointment/booked/:doctorId
// @access  Public
export const bookedSlots = catchAsyncError(async (req, res) => {
  const { doctorId } = req.params;
  if (!mongoose.isValidObjectId(doctorId)) {
    throw new ErrorHandler("Invalid doctor id", 400);
  }

  const today = new Date().toISOString().slice(0, 10);
  const slots = await Appointment.find({
    doctor: doctorId,
    date: { $gte: today },
    status: { $in: ["pending", "confirmed"] },
  })
    .select("date timeSlot -_id")
    .lean();

  res.json({ success: true, slots });
});