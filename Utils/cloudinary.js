import { v2 as cloudinary } from "cloudinary";

// Configured lazily so process.env is already loaded from .env
const configure = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

// Uploads an image buffer (from multer memory storage) to Cloudinary
export const uploadToCloudinary = (buffer, folder = "hospital/doctors") => {
  configure();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
};

// Deletes an image from Cloudinary by its publicId
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  configure();
  await cloudinary.uploader.destroy(publicId);
};