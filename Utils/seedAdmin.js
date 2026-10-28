import User from "../Models/User.js";

// Creates the default admin from .env values when the server starts
const seedAdmin = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  // Skip if credentials are missing in .env
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log("Admin seed skipped: ADMIN_EMAIL / ADMIN_PASSWORD missing in .env");
    return;
  }

  const email = ADMIN_EMAIL.toLowerCase();
  const exists = await User.findOne({ email });

  if (exists) {
    // User already exists: make sure it has the admin role
    if (exists.role !== "admin") {
      exists.role = "admin";
      await exists.save();
      console.log(`Existing user promoted to admin: ${email}`);
    } else {
      console.log("Admin already exists");
    }
    return;
  }

  // Password is hashed automatically by the pre("save") hook in the User model
  await User.create({
    name: ADMIN_NAME || "Admin",
    email,
    password: ADMIN_PASSWORD,
    role: "admin", // set directly here, register API can never do this
  });

  console.log(`Admin created: ${email}`);
};

export default seedAdmin;