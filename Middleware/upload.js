import multer from "multer"
import ErrorHandler from "../Utils/ErrorHandler.js";
const upload=multer({
    storage:multer.memoryStorage(),
    limits:{fileSize:2*1024*1024},
    fileFilter:(req,file,cb)=>{
        if(["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)){
            cb(null, true);
        }
        else{
            cb(new ErrorHandler("Only JPG, PNG or WEBP images are allowed", 400)); 
        }
    }
})
export default upload