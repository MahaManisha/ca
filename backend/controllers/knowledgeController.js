// controllers/knowledgeController.js
import Knowledge from "../models/Knowledge.js";
import Purchase from "../models/Purchase.js";
import fs from "fs";
import path from "path";

// ==================== CREATE KNOWLEDGE ====================
export const createKnowledge = async (req, res) => {
  try {
    const { title, description, subject, isPaid, price } = req.body;
    
    if (!req.files || !req.files.file || !req.files.file[0]) {
      return res.status(400).json({ message: "Main file is required" });
    }

    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Title is required" });
    }

    // Convert string values to proper types
    const isPaidValue = isPaid === "true" || isPaid === true;
    const priceValue = isPaidValue ? parseFloat(price) || 0 : 0;

    // Get file URLs
    const mainFile = req.files.file[0];
    const sampleFile = req.files.sampleFile ? req.files.sampleFile[0] : null;

    // Validate: if paid, sample file should be provided
    if (isPaidValue && priceValue > 0 && !sampleFile) {
      // Clean up uploaded main file
      const mainFilePath = path.join(path.resolve(), "uploads", "knowledge", mainFile.filename);
      if (fs.existsSync(mainFilePath)) {
        fs.unlinkSync(mainFilePath);
      }
      return res.status(400).json({ 
        message: "Sample file is required for paid content" 
      });
    }

    const newNote = new Knowledge({
      title: title.trim(),
      description: description || "",
      subject: subject || "",
      isPaid: isPaidValue,
      price: priceValue,
      fileUrl: mainFile.filename,
      sampleFileUrl: sampleFile ? sampleFile.filename : null,
      uploadedBy: req.user._id,
      locked: isPaidValue,
    });

    await newNote.save();
    
    res.status(201).json({ 
      message: "Knowledge shared successfully", 
      note: newNote 
    });
  } catch (err) {
    console.error("Error creating knowledge:", err);
    
    // Clean up uploaded files if database save fails
    if (req.files) {
      if (req.files.file && req.files.file[0]) {
        const filePath = path.join(path.resolve(), "uploads", "knowledge", req.files.file[0].filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (unlinkErr) {
            console.error("Error deleting file:", unlinkErr);
          }
        }
      }
      if (req.files.sampleFile && req.files.sampleFile[0]) {
        const samplePath = path.join(path.resolve(), "uploads", "knowledge", req.files.sampleFile[0].filename);
        if (fs.existsSync(samplePath)) {
          try {
            fs.unlinkSync(samplePath);
          } catch (unlinkErr) {
            console.error("Error deleting sample file:", unlinkErr);
          }
        }
      }
    }
    
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ==================== GET ALL KNOWLEDGE ====================
export const getAllKnowledge = async (req, res) => {
  try {
    const notes = await Knowledge.find()
      .populate("uploadedBy", "name email username")
      .sort({ createdAt: -1 });
    
    res.json(notes);
  } catch (err) {
    console.error("Error fetching knowledge:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==================== GET SINGLE KNOWLEDGE ====================
export const getKnowledgeById = async (req, res) => {
  try {
    const note = await Knowledge.findById(req.params.id)
      .populate("uploadedBy", "name email username");
    
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    
    // Increment view count
    note.views = (note.views || 0) + 1;
    await note.save();
    
    res.json(note);
  } catch (err) {
    console.error("Error fetching note:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==================== DOWNLOAD SAMPLE ====================
export const downloadSample = async (req, res) => {
  try {
    const note = await Knowledge.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Check if sample exists
    if (!note.sampleFileUrl) {
      return res.status(404).json({ message: "Sample file not available for this content" });
    }

    // Construct file path
    const filePath = path.join(path.resolve(), "uploads", "knowledge", note.sampleFileUrl);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error("Sample file not found:", filePath);
      return res.status(404).json({ message: "Sample file not found on server" });
    }

    // Increment sample download count
    note.sampleDownloads = (note.sampleDownloads || 0) + 1;
    await note.save();

    // Get file extension to set appropriate content type
    const ext = path.extname(note.sampleFileUrl).toLowerCase();
    let contentType = "application/octet-stream";
    
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".mp4") contentType = "video/mp4";
    else if (ext === ".webm") contentType = "video/webm";
    else if ([".avi", ".mov", ".wmv", ".flv", ".mkv"].includes(ext)) {
      contentType = "video/x-msvideo";
    }

    // Get file stats
    const stats = fs.statSync(filePath);

    // Set headers for file download
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="SAMPLE-${encodeURIComponent(note.title)}${ext}"`);
    res.setHeader("Content-Length", stats.size);

    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on("error", (error) => {
      console.error("File stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Error reading sample file" });
      }
    });

    fileStream.pipe(res);

  } catch (err) {
    console.error("Error downloading sample file:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
};

// ==================== DOWNLOAD KNOWLEDGE ====================
export const downloadKnowledge = async (req, res) => {
  try {
    const note = await Knowledge.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Check if content is paid and user has purchased it
    if (note.isPaid && note.price > 0) {
      // Check if user has purchased this item
      const purchase = await Purchase.findOne({
        user: req.user._id,
        item: note._id,
        status: "completed"
      });

      if (!purchase) {
        return res.status(403).json({ 
          message: "Please purchase this content before downloading",
          requiresPurchase: true,
          price: note.price
        });
      }
    }

    // Construct file path
    const filePath = path.join(path.resolve(), "uploads", "knowledge", note.fileUrl);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error("File not found:", filePath);
      return res.status(404).json({ message: "File not found on server" });
    }

    // Increment download count
    note.downloads = (note.downloads || 0) + 1;
    await note.save();

    // Get file extension to set appropriate content type
    const ext = path.extname(note.fileUrl).toLowerCase();
    let contentType = "application/octet-stream";
    
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".mp4") contentType = "video/mp4";
    else if (ext === ".webm") contentType = "video/webm";
    else if ([".avi", ".mov", ".wmv", ".flv", ".mkv"].includes(ext)) {
      contentType = "video/x-msvideo";
    }

    // Get file stats
    const stats = fs.statSync(filePath);

    // Set headers for file download
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(note.title)}${ext}"`);
    res.setHeader("Content-Length", stats.size);

    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on("error", (error) => {
      console.error("File stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Error reading file" });
      }
    });

    fileStream.pipe(res);

  } catch (err) {
    console.error("Error downloading file:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
};

// ==================== UNLOCK KNOWLEDGE ====================
export const unlockKnowledge = async (req, res) => {
  try {
    const note = await Knowledge.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    note.locked = false;
    await note.save();
    
    res.json({ message: "Note unlocked", note });
  } catch (err) {
    console.error("Error unlocking note:", err);
    res.status(500).json({ message: "Server error" });
  }
};