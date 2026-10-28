import ErrorHandler from "../Utils/ErrorHandler.js";

export const notFound = (req, res, next) => {
  next(new ErrorHandler(`Route not found: ${req.originalUrl}`, 404));
};

export const errorMiddleware = (err, req, res, next) => {
  let message = err.message || "Internal Server Error";
  let statusCode = err.statusCode || 500;

  // Duplicate key (jaise same email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field || "Field"} already exists`;
    statusCode = 400;
  }

  // Galat ObjectId
  if (err.name === "CastError") {
    message = `Invalid ${err.path}`;
    statusCode = 400;
  }

  // JWT
  if (err.name === "JsonWebTokenError") {
    message = "Invalid JSON Web Token, try again";
    statusCode = 401;
  }
  if (err.name === "TokenExpiredError") {
    message = "JSON Web Token has expired, try again";
    statusCode = 401;
  }

  // Mongoose validation
  if (err.name === "ValidationError") {
    message = Object.values(err.errors).map((e) => e.message).join(", ");
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};