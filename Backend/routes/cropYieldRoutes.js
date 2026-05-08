const express = require("express");
const { getYields, addYield, updateYield, deleteYield } = require("../controllers/cropYieldController.js");

const router = express.Router();

router.get("/", getYields);
router.post("/", addYield);
router.put("/:id", updateYield);
router.delete("/:id", deleteYield);

module.exports = router;
