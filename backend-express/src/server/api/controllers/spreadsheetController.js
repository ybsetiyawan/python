const { v4: uuidv4 } = require("uuid");
const SpreadsheetRepository = require("../../repository/spreadsheetRepository");

class SpreadsheetController {
  static async getSpreadsheets(req, res) {
    try {
      // Jika ingin memfilter berdasarkan user yang login (atau parameter query creatorId), 
      // Anda bisa mengambilnya dari req.user?.id atau req.query.creatorId.
      const userId = req.user?.id || req.query.creatorId;

      let sheets;
      if (userId) {
        sheets = await SpreadsheetRepository.findByCreator(userId);
      } else {
        sheets = await SpreadsheetRepository.findAll();
      }

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

  // Endpoint untuk menambah baris secara aman (Append-Only)
  static async appendRow(req, res) {
    try {
      const { id } = req.params;
      const { sheetName, rowData } = req.body;

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

  // ==========================================
  // 🔒 FITUR BARU: PROTECTED RANGES CONTROLLER
  // ==========================================

  static async getProtectedRanges(req, res) {
    try {
      const { id } = req.params;
      const ranges = await SpreadsheetRepository.getProtectedRanges(id);
      return res.status(200).json({ success: true, data: ranges });
    } catch (err) {
      console.error("Error getProtectedRanges:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createProtectedRange(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.body.protected_by;
      const { sheet_name, start_row, end_row, start_col, end_col } = req.body;

      if (!sheet_name || start_row === undefined || end_row === undefined || start_col === undefined || end_col === undefined) {
        return res.status(400).json({ success: false, error: "Parameter rentang sel tidak lengkap" });
      }

      const newRange = await SpreadsheetRepository.createProtectedRange({
        spreadsheet_id: id,
        sheet_name,
        start_row,
        end_row,
        start_col,
        end_col,
        protected_by: userId || null
      });

      return res.status(201).json({
        success: true,
        message: "Rentang sel berhasil diproteksi",
        data: newRange
      });
    } catch (err) {
      console.error("Error createProtectedRange:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteProtectedRange(req, res) {
    try {
      const { rangeId } = req.params;
      await SpreadsheetRepository.deleteProtectedRange(rangeId);
      return res.status(200).json({
        success: true,
        message: "Proteksi rentang berhasil dilepaskan"
      });
    } catch (err) {
      console.error("Error deleteProtectedRange:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = SpreadsheetController;