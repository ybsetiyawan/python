// controllers/stockPointController.js

// Perbaikan: Hapus tanda kurung kurawal {} karena repository diekspor secara langsung
const stockPointRepo = require('../../repository/stockpointRepository');



// controllers/stockpointController.js

class StockPointController {
  // Read All (Aktif)
  async getStockPoints(req, res) {
    try {
      const data = await stockPointRepo.getAllActive();
      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil data stock point",
        data: data
      });
    } catch (err) {
      console.error("Error getStockPoints:", err);
      return res.status(500).json({
        success: false,
        message: "Gagal memuat data stock point dari server",
        error: err.message
      });
    }
  }

  // Read By ID / Kode
  async getStockPointByCode(req, res) {
    try {
      const { kode } = req.params;
      const data = await stockPointRepo.getByKodeSpoint(kode);
      if (!data) {
        return res.status(404).json({ success: false, message: "Stock point tidak ditemukan" });
      }
      return res.status(200).json({ success: true, data: data });
    } catch (err) {
      console.error("Error getStockPointByCode:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Create
  async createStockPoint(req, res) {
    try {
      const newData = await stockPointRepo.create(req.body);
      return res.status(201).json({
        success: true,
        message: "Stock point berhasil ditambahkan",
        data: newData
      });
    } catch (err) {
      console.error("Error createStockPoint:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Update
  async updateStockPoint(req, res) {
    try {
      const { kode } = req.params;
      const updatedData = await stockPointRepo.update(kode, req.body);
      if (!updatedData) {
        return res.status(404).json({ success: false, message: "Stock point tidak ditemukan untuk diperbarui" });
      }
      return res.status(200).json({
        success: true,
        message: "Stock point berhasil diperbarui",
        data: updatedData
      });
    } catch (err) {
      console.error("Error updateStockPoint:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Delete
  async deleteStockPoint(req, res) {
    try {
      const { kode } = req.params;
      const deletedData = await stockPointRepo.delete(kode);
      if (!deletedData) {
        return res.status(404).json({ success: false, message: "Stock point tidak ditemukan untuk dihapus" });
      }
      return res.status(200).json({
        success: true,
        message: "Stock point berhasil dihapus",
        data: deletedData
      });
    } catch (err) {
      console.error("Error deleteStockPoint:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new StockPointController();