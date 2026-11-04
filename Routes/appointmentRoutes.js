import express from "express";
import { protect, authorize } from "../Middleware/authMiddleware.js";
import {
  bookAppointment,
  myAppointments,
  doctorAppointments,
  allAppointments,
  updateStatus,
  bookedSlots
} from "../Controllers/appointmentController.js";

const router = express.Router();

// Every appointment route requires login
router.use(protect);

router.post("/", authorize("patient"), bookAppointment);
router.get("/my", authorize("patient"), myAppointments);
router.get("/doctor", authorize("doctor"), doctorAppointments);
router.get("/", authorize("admin"), allAppointments);
router.patch("/:id/status", authorize("patient", "doctor", "admin"), updateStatus);
router.get("/booked/:doctorId", bookedSlots);
export default router;