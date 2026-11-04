import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },
     phone: { type: String, trim: true, default: "" },
    address: {
      line1: { type: String, trim: true, default: "" },
      line2: { type: String, trim: true, default: "" },
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Not Selected"],
      default: "Not Selected",
    },
    dob: { type: String, default: "" },                          // "2000-01-20"
    image: { type: String, default: "" },                        // Cloudinary URL
    imagePublicId: { type: String, default: "", select: false },
  },
  { timestamps: true }
);

// Schema ke BAHAR
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);