import express from "express";
import {
  getMachines,
  addMachine,
  updateMachine,
  deleteMachine,
} from "../controllers/machineController.js";

const router = express.Router();

router.get("/", getMachines);
router.post("/", addMachine);
router.put("/:id", updateMachine);
router.delete("/:id", deleteMachine);

export default router;
