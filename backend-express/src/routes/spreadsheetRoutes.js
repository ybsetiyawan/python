const express = require("express");
const router = express.Router();
const SpreadsheetController = require("../server/api/controllers/spreadsheetController");
const authMiddleware = require("../middleware/authMiddleware");

// Semua route di bawah ini diproteksi oleh authMiddleware
router.use(authMiddleware);

// --- RUTE UTAMA SPREADSHEET ---
router.get("/", SpreadsheetController.getSpreadsheets);
router.post("/", SpreadsheetController.createSpreadsheet);

// --- RUTE DENGAN PARAMETER ID ---
router.get("/:id", SpreadsheetController.getSpreadsheetById);
router.put("/:id", SpreadsheetController.updateSpreadsheet);
router.delete("/:id", SpreadsheetController.deleteSpreadsheet);

module.exports = router;