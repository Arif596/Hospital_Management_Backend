import express from "express";
import {register,login, getMe} from "../Controllers/authController.js"
import { protect } from "../Middleware/authMiddleware.js";
const router=express.Router();
router.post("/register",register)
router.post("/login", login);
router.get('/me',protect,getMe)
export default router