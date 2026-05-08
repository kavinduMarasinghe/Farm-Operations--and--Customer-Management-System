const express = require("express");
const { getCottageReport } = require("../../controllers/Admin/cottageReportController");

const router = express.Router();

router.get("/cottages", getCottageReport);

module.exports = router;
