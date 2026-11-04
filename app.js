import helmet from "helmet";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRoutes from "./Routes/authRoutes.js";
import doctorRoutes from "./Routes/doctorRoutes.js";
import AppointmentRoutes from "./Routes/appointmentRoutes.js";
import { errorMiddleware, notFound } from "./Middleware/errorMiddlewares.js";

const app = express();

app.use(helmet());

// Aakhri "/" hata deta hai, kyunke origin match mein "http://x.com/" aur "http://x.com" alag hain
const clean = (url) => (url ? url.trim().replace(/\/+$/, "") : "");

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.CLIENT_URL || "http://localhost:5173",
        process.env.ADMIN_URL,
      ]
        .map(clean)
        .filter(Boolean);

      // Postman / curl (origin nahi hota) ya allowed origin
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);   // error nahi, sirf block
    },
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// api start
app.get("/", (req, res) => {
  res.send("Hospital Management Api running");
});

// routes (frontend ka baseURL: http://localhost:5000/api/v1)
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/doctors", doctorRoutes);
app.use("/api/v1/appointment", AppointmentRoutes);

app.use(notFound);
app.use(errorMiddleware);

export default app;