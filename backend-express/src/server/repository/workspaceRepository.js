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

    // 3. Karena aplikasi Spreadsheet belum ada, diset 0
    const totalSheets = 0

    return {
      totalForms,
      totalFiles,
      totalSheets
    }
  }
}

module.exports = { WorkspaceRepository }