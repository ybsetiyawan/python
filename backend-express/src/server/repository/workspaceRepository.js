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

    // 1. Cari di tabel forms (bisa difilter milik user tertentu atau global sesuai kebutuhan)
    const formsQuery = `
      SELECT id, title, 'form' as type 
      FROM forms 
      WHERE (title ILIKE $1 OR CAST(id AS TEXT) ILIKE $1)
      LIMIT 5
    `
    const formsResult = await pool.query(formsQuery, [searchPattern])

    // 2. Cari di tabel spreadsheets
    const sheetsQuery = `
      SELECT id, title, 'spreadsheet' as type 
      FROM spreadsheets 
      WHERE (title ILIKE $1 OR CAST(id AS TEXT) ILIKE $1)
      LIMIT 5
    `
    const sheetsResult = await pool.query(sheetsQuery, [searchPattern])

    // Gabungkan hasil pencarian form dan spreadsheet
    return [...formsResult.rows, ...sheetsResult.rows]
  }
}

module.exports = { WorkspaceRepository }