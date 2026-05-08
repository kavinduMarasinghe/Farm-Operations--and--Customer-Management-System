import express from "express";
import {
  listWorkGuides,
  getWorkGuide,
  createWorkGuide,
  updateWorkGuide,
  deleteWorkGuide,
} from "../controllers/workGuideController.js";

const router = express.Router();

// GET → List all work guides
router.get("/", listWorkGuides);

// GET → Get a single work guide by ID
router.get("/:id", getWorkGuide);

// POST → Create a new work guide
router.post("/", createWorkGuide);

// PUT → Update a work guide by ID
router.put("/:id", updateWorkGuide);

// DELETE → Remove a work guide by ID
router.delete("/:id", deleteWorkGuide);

export default router;
