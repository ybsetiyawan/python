// routes/stockpointRoutes.js
const express = require("express");
const router = express.Router();
const StockPointController = require("../server/api/controllers/stockpointController");
const authMiddleware = require("../middleware/authMiddleware");

// Semua route di bawah ini diproteksi oleh authMiddleware
router.use(authMiddleware);

// --- RUTE UTAMA STOCK POINT ---
// Ambil semua stock point aktif
router.get("/", StockPointController.getStockPoints);

// Tambah stock point baru
router.post("/", StockPointController.createStockPoint);


// --- RUTE DENGAN PARAMETER KODE ---
// Ambil detail stock point berdasarkan kode
router.get("/:kode", StockPointController.getStockPointByCode);

// Update stock point berdasarkan kode
router.put("/:kode", StockPointController.updateStockPoint);

// Hapus stock point berdasarkan kode
router.delete("/:kode", StockPointController.deleteStockPoint);

module.exports = router;