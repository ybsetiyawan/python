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
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // FITUR BARU: Menambahkan baris secara aman tanpa menimpa baris milik user lain
  static async appendRow(id, sheetName, newRowData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Ambil data spreadsheet terbaru dengan penguncian baris (FOR UPDATE) agar aman dari race condition 141 client
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
      // Cari index baris terakhir yang terisi
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
}

module.exports = SpreadsheetRepository;