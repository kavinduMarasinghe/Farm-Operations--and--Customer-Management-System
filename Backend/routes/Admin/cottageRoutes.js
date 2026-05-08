// Backend/routes/Admin/cottagesRoutes.js
const express = require("express");
const router = express.Router();

const { createCottage, getAllCottages, updateCottage, deleteCottage, getCottageById, } = require("../../controllers/Admin/cottageController");

// POST -> create cottage
router.post("/", createCottage);

// GET -> get all cottages
router.get("/", getAllCottages);

//get a cottage by id
router.get("/:id", getCottageById);

// PUT -> update cottage
router.put("/:id", updateCottage);

// DELETE -> delete a cottage
router.delete("/:id", deleteCottage);

module.exports = router;
