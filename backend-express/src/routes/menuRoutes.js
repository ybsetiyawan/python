const express = require("express");
const router = express.Router();
const MenuController = require("../server/api/controllers/menuController");
const authMiddleware = require("../middleware/authMiddleware");

// Semua route di bawah ini diproteksi oleh authMiddleware
router.use(authMiddleware);

// --- RUTE SPESIFIK & USER ACCESS ---
// Ambil daftar menu beserta status centang user tertentu
router.get("/user/:userId", MenuController.getMenusByUserId);

// Simpan/sync centang hak akses menu user tertentu
router.post("/user/:userId", MenuController.saveUserMenus);


// --- RUTE UTAMA MENU ---
// Ambil semua daftar menu
router.get("/", MenuController.getAllMenus);

// Tambah menu baru
router.post("/", MenuController.createMenu);


// --- RUTE DENGAN PARAMETER ID (Harus diletakkan di bawah agar tidak konflik) ---
// Update menu berdasarkan ID
router.put("/:id", MenuController.updateMenu);

// Hapus menu berdasarkan ID
router.delete("/:id", MenuController.deleteMenu);


module.exports = router;