import express  from "express";
import {protect,authorize} from '../Middleware/authMiddleware.js'
import { createDoctor,getDoctor,getDoctors,updateDoctor,deleteDoctor } from "../Controllers/doctorController.js";    
import upload from "../Middleware/upload.js";


const router =express.Router();
router.get('/',getDoctors);
router.get("/:id",getDoctor);
// upload.single("image") runs AFTER auth checks, so unauthorized users can't upload
router.post("/",protect,authorize("admin"),upload.single("image"),createDoctor);
router.put("/:id",protect,authorize("admin"),upload.single("image"),updateDoctor)
router.delete("/:id", protect, authorize("admin"), deleteDoctor);

export default router