const pool = require("../../../src/config/db");

class MonitorRepository {
  // Mengambil seluruh stock point aktif yang memiliki IP Gateway
  static async getActiveStockPointGateways() {
    const query = `
      SELECT kode_spoint, nama_spoint, ip_gateway, area 
      FROM stock_points 
      WHERE aktif = true AND ip_gateway IS NOT NULL AND ip_gateway != ''
      ORDER BY kode_spoint ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = MonitorRepository;