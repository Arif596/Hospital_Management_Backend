import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    specialization: { type: String, required: true, trim: true },
    experience: { type: Number, default: 0 },
    fee: { type: Number, required: true },
    phone: { type: String, trim: true },
    bio: { type: String, trim: true },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" }, // needed later to delete/replace the image
    },
    availableDays: {
      type: [String],
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      default: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    },
    timeSlots: {
      type: [String],
      default: ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00"],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Doctor", doctorSchema);
