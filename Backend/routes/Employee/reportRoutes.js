import express from "express";
import { summary } from "../controllers/reportController.js";

const router = express.Router();

// GET → Generate summary report
router.get("/summary", summary);

export default router;
