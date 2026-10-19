const pool = require("../../config/db");

class SpreadsheetRepository {
  static async create(data) {
    const { id, title, description, data_content, created_by } = data;
    const query = `
      INSERT INTO spreadsheets (id, title, description, data_content, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [id, title, description, data_content ? JSON.stringify(data_content) : null, created_by];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT s.*, u.name as creator_name 
      FROM spreadsheets s
      LEFT JOIN users u ON s.created_by = u.id
      ORDER BY s.updated_at DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // FITUR BARU: Mengambil daftar spreadsheet berdasarkan ID pembuatnya (created_by)
  static async findByCreator(userId) {
    const query = `
      SELECT s.*, u.name as creator_name 
      FROM spreadsheets s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.created_by = $1
      ORDER BY s.updated_at DESC;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT s.*, u.name as creator_name 
      FROM spreadsheets s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const { title, description, data_content, is_shared } = data;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Ambil data spreadsheet lama untuk dibandingkan
      const oldRes = await client.query(`SELECT data_content FROM spreadsheets WHERE id = $1 FOR UPDATE;`, [id]);
      if (oldRes.rows.length === 0) {
        throw new Error("Spreadsheet tidak ditemukan");
      }
      const oldDataContent = oldRes.rows[0].data_content || { sheets: {} };

      // 2. Ambil daftar protected ranges untuk spreadsheet ini
      const protectedRes = await client.query(`SELECT * FROM spreadsheet_protected_ranges WHERE spreadsheet_id = $1;`, [id]);
      const protectedRanges = protectedRes.rows;

      // 3. Validasi keamanan: Pastikan data yang dilindungi tidak dihapus/diubah oleh user non-admin
      if (protectedRanges.length > 0 && data_content && data_content.sheets) {
        for (const pr of protectedRanges) {
          const targetSheetName = pr.sheet_name;
          const oldSheet = oldDataContent.sheets?.[targetSheetName];
          const newSheet = data_content.sheets[targetSheetName];

          if (oldSheet && newSheet) {
            // Cek baris DAN kolom yang dilindungi agar tidak boleh terhapus/hilang isinya
            for (let r = pr.start_row; r <= pr.end_row; r++) {
              for (let c = pr.start_col; c <= pr.end_col; c++) {
                const oldVal = oldSheet.rows?.[r]?.[c];
                const newVal = newSheet.rows?.[r]?.[c];

                if (oldVal !== undefined && oldVal !== null && String(oldVal).trim() !== '' && 
                    (newVal === undefined || newVal === null || String(newVal).trim() === '')) {
                  throw new Error(`Aksi ditolak! Area sel pada rentang yang dilindungi Administrator tidak boleh dihapus.`);
                }
              }
            }
          }
        }
      }

      // 4. Jika aman, lanjutkan proses update ke database
      const query = `
        UPDATE spreadsheets 
        SET title = COALESCE($1, title),
            description = COALESCE($2, description),
            data_content = COALESCE($3, data_content),
            is_shared = COALESCE($4, is_shared),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *;
      `;
      const values = [
        title, 
        description, 
        data_content ? JSON.stringify(data_content) : null, 
        is_shared, 
        id
      ];
      const result = await client.query(query, values);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // FITUR BARU: Menambahkan baris secara aman tanpa menimpa baris milik user lain
  static async appendRow(id, sheetName, newRowData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Ambil data spreadsheet terbaru dengan penguncian baris (FOR UPDATE) agar aman dari race condition
      const selectQuery = `SELECT data_content FROM spreadsheets WHERE id = $1 FOR UPDATE;`;
      const selectRes = await client.query(selectQuery, [id]);
      
      if (selectRes.rows.length === 0) {
        throw new Error("Spreadsheet tidak ditemukan");
      }

      let dataContent = selectRes.rows[0].data_content || { sheets: {} };
      
      // Pastikan struktur sheets ada
      if (!dataContent.sheets) {
        dataContent.sheets = {};
      }
      if (!dataContent.sheets[sheetName]) {
        dataContent.sheets[sheetName] = { rows: [], styles: {} };
      }

      const targetSheet = dataContent.sheets[sheetName];

      // 2. Cari baris kosong pertama dari bawah atau langsung push ke baris kosong berikutnya
      let lastFilledIndex = -1;
      for (let i = targetSheet.rows.length - 1; i >= 0; i--) {
        const row = targetSheet.rows[i];
        const hasData = row && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
        if (hasData) {
          lastFilledIndex = i;
          break;
        }
      }

      const targetRowIndex = lastFilledIndex + 1;

      // Masukkan data baru ke baris kosong tersebut
      targetSheet.rows[targetRowIndex] = newRowData;

      // 3. Simpan kembali ke database
      const updateQuery = `
        UPDATE spreadsheets 
        SET data_content = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *;
      `;
      const updateRes = await client.query(updateQuery, [JSON.stringify(dataContent), id]);

      await client.query('COMMIT');
      return updateRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async delete(id) {
    const query = `DELETE FROM spreadsheets WHERE id = $1 RETURNING id;`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // ==========================================
  // 🔒 FITUR BARU: PROTECTED RANGES (ADMIN)
  // ==========================================

  static async getProtectedRanges(spreadsheetId) {
    const query = `SELECT * FROM spreadsheet_protected_ranges WHERE spreadsheet_id = $1;`;
    const result = await pool.query(query, [spreadsheetId]);
    return result.rows;
  }

  static async createProtectedRange(data) {
    const { spreadsheet_id, sheet_name, start_row, end_row, start_col, end_col, protected_by } = data;
    const query = `
      INSERT INTO spreadsheet_protected_ranges 
      (spreadsheet_id, sheet_name, start_row, end_row, start_col, end_col, protected_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [spreadsheet_id, sheet_name, start_row, end_row, start_col, end_col, protected_by];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async deleteProtectedRange(rangeId) {
    const query = `DELETE FROM spreadsheet_protected_ranges WHERE id = $1 RETURNING id;`;
    const result = await pool.query(query, [rangeId]);
    return result.rows[0];
  }
}

module.exports = SpreadsheetRepository;