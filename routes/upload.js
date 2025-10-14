import express from "express";
import upload from "../config/multer.js";
import { deleteImage } from "../config/cloudinary.js";

const router = express.Router();

// Multiple file upload route
// We use upload.array("images", 10) to accept up to 10 files with the field name "images"
router.post("/upload", upload.array("images", 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: "No files uploaded." });
  }

  try {
    // Map over the array of files to get their Cloudinary URLs
    const imageUrls = req.files.map((file) => file.path);
    res.json({
      success: true,
      imageUrls: imageUrls, // Return an array of URLs
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error during upload." });
  }
});

// Image deletion route
router.delete("/upload/delete", async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ success: false, message: "Image URL is required." });
  }

  try {
    // Extract public_id from the Cloudinary URL
    // Example URL: http://res.cloudinary.com/cloud_name/image/upload/v12345/folder/public_id.jpg
    const parts = imageUrl.split("/");
    const publicIdWithExtension = parts.slice(-2).join("/"); // "folder/public_id.jpg"
    const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf("."));

    if (!publicId) {
      throw new Error("Could not extract public_id from URL.");
    }

    await deleteImage(publicId);
    res.json({ success: true, message: "Image deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Server error during image deletion." });
  }
});

export default router;
