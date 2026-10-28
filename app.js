import helmet from "helmet";
import express from "express";
import cors from "cors"
import morgan from "morgan";
import authRoutes  from './Routes/authRoutes.js'
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

app.use(notFound);
app.use(errorMiddleware)

export default app