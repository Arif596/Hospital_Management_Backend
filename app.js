import helmet from "helmet";
import express from "express";
import cors from "cors"
import morgan from "morgan";
import authRoutes  from './Routes/authRoutes.js'
import doctorRoutes from './Routes/doctorRoutes.js'
import AppointmentRoutes from './Routes/appointmentRoutes.js'
import { errorMiddleware, notFound } from "./Middleware/errorMiddlewares.js";
const app=express();
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// api start
app.get('/',(req,res)=>{
    res.send("Hospital Management Api running")
})
// user routes
app.use('/api/auth',authRoutes)
app.use('/api/doctors',doctorRoutes)
app.use('/api/appointment',AppointmentRoutes)
app.use(notFound);
app.use(errorMiddleware)

export default app