const { v4: uuidv4 } = require("uuid");
const SpreadsheetRepository = require("../../repository/spreadsheetRepository");

class SpreadsheetController {
  static async getSpreadsheets(req, res) {
    try {
      const sheets = await SpreadsheetRepository.findAll();
      return res.status(200).json({ success: true, data: sheets });
    } catch (err) {
      console.error("Error getSpreadsheets:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getSpreadsheetById(req, res) {
    try {
      const { id } = req.params;
      const sheet = await SpreadsheetRepository.findById(id);
      if (!sheet) {
        return res.status(404).json({ success: false, error: "Spreadsheet tidak ditemukan" });
      }
      return res.status(200).json({ success: true, data: sheet });
    } catch (err) {
      console.error("Error getSpreadsheetById:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createSpreadsheet(req, res) {
    try {
      const { title, description, data_content } = req.body;
      const userId = req.user?.id || req.body.created_by;

      if (!title) {
        return res.status(400).json({ success: false, error: "Judul spreadsheet wajib diisi" });
      }

      const newSheetData = {
        id: uuidv4(),
        title,
        description: description || "",
        data_content: data_content || {},
        created_by: userId || null
      };

      const created = await SpreadsheetRepository.create(newSheetData);
      return res.status(201).json({
        success: true,
        message: "Spreadsheet berhasil dibuat",
        data: created
      });
    } catch (err) {
      console.error("Error createSpreadsheet:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateSpreadsheet(req, res) {
    try {
      const { id } = req.params;
      const { title, description, data_content, is_shared } = req.body;

      const existing = await SpreadsheetRepository.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Spreadsheet tidak ditemukan" });
      }

      const updated = await SpreadsheetRepository.update(id, {
        title,
        description,
        data_content,
        is_shared
      });

      return res.status(200).json({
        success: true,
        message: "Spreadsheet berhasil diperbarui",
        data: updated
      });
    } catch (err) {
      console.error("Error updateSpreadsheet:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // FITUR BARU: Endpoint untuk menambah baris secara aman (Append-Only) bagi 141 klien
  static async appendRow(req, res) {
    try {
      const { id } = req.params;
      const { sheetName, rowData } = req.body; // rowData berupa array sel, misal: ["Cabang A", "100", "Aktif"]

      if (!sheetName || !rowData || !Array.isArray(rowData)) {
        return res.status(400).json({ success: false, error: "Nama sheet dan data baris (array) wajib disertakan" });
      }

      const updatedSheet = await SpreadsheetRepository.appendRow(id, sheetName, rowData);

      return res.status(200).json({
        success: true,
        message: "Baris baru berhasil ditambahkan secara otomatis",
        data: updatedSheet
      });
    } catch (err) {
      console.error("Error appendRow:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteSpreadsheet(req, res) {
    try {
      const { id } = req.params;
      const existing = await SpreadsheetRepository.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Spreadsheet tidak ditemukan" });
      }

      await SpreadsheetRepository.delete(id);
      return res.status(200).json({
        success: true,
        message: "Spreadsheet berhasil dihapus"
      });
    } catch (err) {
      console.error("Error deleteSpreadsheet:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = SpreadsheetController;