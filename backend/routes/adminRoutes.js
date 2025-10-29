import express from "express";
import { adminProtect } from "../middleware/adminProtect.js";
import { getAllUsers, getAllItems, approveItem } from "../controllers/adminController.js";

const router = express.Router();

// -------------------- Users --------------------
router.get("/users", adminProtect, getAllUsers);

// -------------------- Items --------------------
router.get("/items", adminProtect, getAllItems);
router.put("/items/approve/:id", adminProtect, approveItem);

export default router;