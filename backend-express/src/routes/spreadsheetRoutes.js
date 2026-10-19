const express = require("express");
const router = express.Router();
const SpreadsheetController = require("../server/api/controllers/spreadsheetController");
const authMiddleware = require("../middleware/authMiddleware");

// Semua route di bawah ini diproteksi oleh authMiddleware
router.use(authMiddleware);

// --- RUTE UTAMA SPREADSHEET ---
router.get("/", SpreadsheetController.getSpreadsheets);
router.post("/", SpreadsheetController.createSpreadsheet);

// --- RUTE PROTECTED RANGES ---
router.get("/:id/protected-ranges", SpreadsheetController.getProtectedRanges);
router.post("/:id/protected-ranges", SpreadsheetController.createProtectedRange);
router.delete("/protected-ranges/:rangeId", SpreadsheetController.deleteProtectedRange);

// --- RUTE APPEND ROW (Opsional jika ingin dipakai via API) ---
router.post("/:id/append-row", SpreadsheetController.appendRow);

// --- RUTE DENGAN PARAMETER ID ---
router.get("/:id", SpreadsheetController.getSpreadsheetById);
router.put("/:id", SpreadsheetController.updateSpreadsheet);
router.delete("/:id", SpreadsheetController.deleteSpreadsheet);

module.exports = router;