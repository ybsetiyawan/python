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

 static async update(id, data, currentUserId) {
    const { title, description, data_content, is_shared } = data;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Ambil data spreadsheet lama
      const oldRes = await client.query(`SELECT data_content, created_by FROM spreadsheets WHERE id = $1 FOR UPDATE;`, [id]);
      if (oldRes.rows.length === 0) {
        throw new Error("Spreadsheet tidak ditemukan");
      }
      
      const spreadsheetOwnerId = oldRes.rows[0].created_by;
      const oldDataContent = oldRes.rows[0].data_content || { sheets: {} };
      const isSpreadsheetOwner = spreadsheetOwnerId && currentUserId && String(spreadsheetOwnerId) === String(currentUserId);

      // 2. Validasi & Proses rowOwners serta proteksi kolom utama (Kolom 0 & 1)
      if (data_content && data_content.sheets) {
        for (const sheetName in data_content.sheets) {
          const newSheet = data_content.sheets[sheetName];
          const oldSheet = oldDataContent.sheets?.[sheetName] || { rows: [], rowOwners: {} };
          
          const oldOwners = oldSheet.rowOwners || {};
          const incomingOwners = newSheet.rowOwners || {};
          const mergedOwners = { ...oldOwners, ...incomingOwners };

          const newRows = newSheet.rows || [];
          const oldRows = oldSheet.rows || [];

          for (let r = 0; r < newRows.length; r++) {
            const rowStr = String(r);
            const newRowData = newRows[r] || [];
            const oldRowData = oldRows[r] || [];

            // Jika bukan owner utama spreadsheet, lindungi Kolom 0 & 1 agar tidak diubah isinya
            if (!isSpreadsheetOwner) {
              for (let c = 0; c < 2; c++) {
                const oldVal = oldRows[r]?.[c];
                const newVal = newRowData[c];
                
                if (oldVal !== undefined && oldVal !== null && String(oldVal).trim() !== '' && oldVal !== newVal) {
                  throw new Error(`Aksi ditolak! Kolom utama pada baris ${r + 1} tidak boleh diubah.`);
                }
              }
            }

            // Kelola pemilik baris berdasarkan adanya data
            const hasDataAnywhere = newRowData.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
            let ownerOfRow = mergedOwners[rowStr] || mergedOwners[r] || oldOwners[rowStr] || oldOwners[r];

            if (hasDataAnywhere) {
              if (!ownerOfRow) {
                ownerOfRow = currentUserId || spreadsheetOwnerId;
              }
              mergedOwners[rowStr] = ownerOfRow;
            } else {
              delete mergedOwners[rowStr];
              delete mergedOwners[r];
            }
          }
          newSheet.rowOwners = mergedOwners;
        }
      }

      // 3. Simpan perubahan ke database
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

  static async appendRow(id, sheetName, newRowData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const selectQuery = `SELECT data_content FROM spreadsheets WHERE id = $1 FOR UPDATE;`;
      const selectRes = await client.query(selectQuery, [id]);
      
      if (selectRes.rows.length === 0) {
        throw new Error("Spreadsheet tidak ditemukan");
      }

      let dataContent = selectRes.rows[0].data_content || { sheets: {} };
      
      if (!dataContent.sheets) {
        dataContent.sheets = {};
      }
      if (!dataContent.sheets[sheetName]) {
        dataContent.sheets[sheetName] = { rows: [], styles: {}, rowOwners: {} };
      }

      const targetSheet = dataContent.sheets[sheetName];

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
      targetSheet.rows[targetRowIndex] = newRowData;

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
  // 🔒 PROTECTED RANGES (ADMIN)
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