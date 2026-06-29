import express from "express";
import { requireAdmin, AuthedRequest } from "../middleware/auth";
import multer from "multer";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import ImageKit from "@imagekit/nodejs";

const uploadRouter = express.Router();

// Configure multer to store file in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

uploadRouter.post("/upload-image", requireAdmin as any, upload.single("file"), async (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    // Upload to ImageKit
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileName = uniqueSuffix + path.extname(req.file.originalname);

    const imageKitResponse = await imagekit.upload({
      file: req.file.buffer.toString("base64"),
      fileName,
      folder: "/sashvi-studio",
    });

    // Store ImageKit URL in Supabase (optional - if you have an uploads table)
    // Uncomment if you have an uploads table in Supabase
    /*
    await supabase.from("uploads").insert({
      file_name: fileName,
      imagekit_url: imageKitResponse.url,
      imagekit_file_id: imageKitResponse.fileId,
      uploaded_at: new Date().toISOString(),
    });
    */

    res.json({ url: imageKitResponse.url });
  } catch (error) {
    console.error("ImageKit upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

export { uploadRouter };
