import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    date: { type: String, required: true },      // "2026-11-05"
    timeSlot: { type: String, required: true },  // "10:00"
    reason: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    notes: { type: String, trim: true }, // doctor ke notes
  },
  { timestamps: true }
);

// Ek doctor, ek din, ek slot par sirf ek active appointment (double booking se bachata hai)
appointmentSchema.index(
  { doctor: 1, date: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["pending", "confirmed"] } } }
);

export default mongoose.model("Appointment", appointmentSchema);