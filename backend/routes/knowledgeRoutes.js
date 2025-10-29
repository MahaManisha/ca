// routes/knowledgeRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protect } from "../middleware/Protect.js";
import {
  createKnowledge,
  getAllKnowledge,
  getKnowledgeById,
  unlockKnowledge,
  downloadKnowledge,
  downloadSample,
} from "../controllers/knowledgeController.js";

const router = express.Router();

// ----------- File Upload Setup -----------
const uploadDir = path.join(path.resolve(), "uploads", "knowledge");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// Enhanced file filter to allow PDFs and videos
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|png|jpg|jpeg|mp4|avi|mov|wmv|flv|mkv|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('video/') || 
                   file.mimetype === 'application/pdf' ||
                   file.mimetype.startsWith('image/');

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, images, and video files (MP4, AVI, MOV, WMV, FLV, MKV, WEBM) are allowed"));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit for videos
});

// ----------- Routes -----------
// Support uploading both main file and sample file
// IMPORTANT: The field names must match exactly what the frontend sends
router.post("/add", protect, upload.fields([
  { name: 'file', maxCount: 1 },           // Main file
  { name: 'sampleFile', maxCount: 1 }      // Sample file
]), createKnowledge);

router.get("/", getAllKnowledge);
router.get("/download/:id", protect, downloadKnowledge);
router.get("/sample/:id", downloadSample); // No auth required for samples
router.get("/:id", getKnowledgeById);
router.put("/unlock/:id", protect, unlockKnowledge);

export default router;