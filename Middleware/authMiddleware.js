import jwt from "jsonwebtoken";
import User from "../Models/User.js";
import catchAsyncError from "./CatchAsyncError.js";
import ErrorHandler from "../Utils/ErrorHandler.js";

// Checks that the request has a valid JWT and attaches the user to req.user
export const protect = catchAsyncError(async (req, res, next) => {
  let token;

  // Token is expected in the header: Authorization: Bearer <token>
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ErrorHandler("Not authorized, no token", 401);
  }

  // Throws JsonWebTokenError / TokenExpiredError if invalid (handled by errorMiddleware)
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Make sure the user still exists in the database
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ErrorHandler("User no longer exists", 401);
  }

  req.user = user;
  next();
});

// Role check. Usage: authorize("admin") or authorize("doctor", "admin")
// Must be used AFTER protect, because it reads req.user
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ErrorHandler(
        `Role '${req.user.role}' is not allowed to access this route`,
        403
      );
    }
    next();
  };
};