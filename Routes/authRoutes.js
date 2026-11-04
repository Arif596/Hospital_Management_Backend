import express from "express";
import {register,login, getMe, logout, updateMe} from "../Controllers/authController.js"
import { protect } from "../Middleware/authMiddleware.js";
import upload from "../Middleware/upload.js";
const router=express.Router();
router.post("/register",register)
router.post("/login", login);
router.get('/me',protect,getMe)
router.post("/logout", logout);``
router.put("/update-profile",protect,upload.single("image"), updateMe); // Assuming you have an updateProfile controller function

export default router