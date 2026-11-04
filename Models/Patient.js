import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    age: Number,
    gender: { type: String, enum: ["male", "female", "other"] },
    phone: { type: String, trim: true },
    bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
    address: { type: String, trim: true },
    medicalHistory: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Patient", patientSchema);