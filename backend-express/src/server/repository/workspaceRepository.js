const pool = require("../../../src/config/db"); // Sesuaikan path database pool Anda

const WorkspaceRepository = {
  async getDashboardStats(userId = null) {
    // 1. Hitung total form milik user yang sedang login
    let formQuery = `SELECT COUNT(*) as total_forms FROM forms`
    let formParams = []
    
    if (userId) {
      formQuery += ` WHERE user_id = $1`
      formParams.push(userId)
    }
    const formResult = await pool.query(formQuery, formParams)
    const totalForms = parseInt(formResult.rows[0]?.total_forms || 0)

    // 2. Karena aplikasi Drive belum ada, diset 0
    const totalFiles = 0

    // 3. Hitung total spreadsheet dari tabel spreadsheets berdasarkan created_by
    let sheetQuery = `SELECT COUNT(*) as total_sheets FROM spreadsheets`
    let sheetParams = []

    if (userId) {
      sheetQuery += ` WHERE created_by = $1`
      sheetParams.push(userId)
    }
    
    const sheetResult = await pool.query(sheetQuery, sheetParams)
    const totalSheets = parseInt(sheetResult.rows[0]?.total_sheets || 0)

    return {
      totalForms,
      totalFiles,
      totalSheets
    }
  },

  // TAMBAHAN: Fungsi untuk pencarian global dokumen (Form & Spreadsheet)
 async searchDocuments(keyword, userId = null) {
    const searchPattern = `%${keyword}%`

    // 1. Cari di tabel forms dengan mengambil nama pembuat dari tabel users
    const formsQuery = `
      SELECT f.id, f.title, 'form' as type, u.name as created_by 
      FROM forms f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE f.allow_submission = true 
        AND (f.title ILIKE $1 OR CAST(f.id AS TEXT) ILIKE $1)
      LIMIT 5
    `;
    const formsResult = await pool.query(formsQuery, [searchPattern])

    // 2. Cari di tabel spreadsheets dengan mengambil nama pembuat dari tabel users
    const sheetsQuery = `
      SELECT s.id, s.title, 'spreadsheet' as type, u.name as created_by 
      FROM spreadsheets s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE (s.title ILIKE $1 OR CAST(s.id AS TEXT) ILIKE $1)
      LIMIT 5
    `
    const sheetsResult = await pool.query(sheetsQuery, [searchPattern])

    // Gabungkan hasil pencarian form dan spreadsheet
    return [...formsResult.rows, ...sheetsResult.rows]
  }
}

module.exports = { WorkspaceRepository }