// repositories/stockpointRepository.js
// repositories/stockpointRepository.js
const pool = require("../../../src/config/db"); // Sesuaikan path database pool Anda

class StockPointRepository {
  // Read: Mengambil semua data stock point yang aktif
  async getAllActive() {
    const query = `
      SELECT id, plant_cd, nama_cab, kode_spoint, nama_spoint, email, aktif, area 
      FROM stock_points 
      WHERE aktif = TRUE 
      ORDER BY kode_spoint ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Read: Mengambil semua data (termasuk yang tidak aktif untuk keperluan admin)
  async getAll() {
    const query = `
      SELECT id, plant_cd, nama_cab, kode_spoint, nama_spoint, email, aktif, area 
      FROM stock_points 
      ORDER BY id ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Read: Mengambil data berdasarkan kode stock point
  async getByKodeSpoint(kodeSpoint) {
    const query = `
      SELECT * FROM stock_points 
      WHERE kode_spoint = $1;
    `;
    const result = await pool.query(query, [kodeSpoint]);
    return result.rows[0];
  }

  // Create: Menambahkan data stock point baru
  async create(data) {
    const { plant_cd, nama_cab, kode_spoint, nama_spoint, email, aktif, area } = data;
    const query = `
      INSERT INTO stock_points (plant_cd, nama_cab, kode_spoint, nama_spoint, email, aktif, area)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [plant_cd, nama_cab, kode_spoint, nama_spoint, email, aktif ?? true, area];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update: Memperbarui data stock point berdasarkan kode_spoint atau id
  async update(kodeSpoint, data) {
    const { plant_cd, nama_cab, nama_spoint, email, aktif, area } = data;
    const query = `
      UPDATE stock_points 
      SET plant_cd = $1, nama_cab = $2, nama_spoint = $3, email = $4, aktif = $5, area = $6
      WHERE kode_spoint = $7
      RETURNING *;
    `;
    const values = [plant_cd, nama_cab, nama_spoint, email, aktif, area, kodeSpoint];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete: Menghapus data stock point
  async delete(kodeSpoint) {
    const query = `
      DELETE FROM stock_points 
      WHERE kode_spoint = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [kodeSpoint]);
    return result.rows[0];
  }
}

module.exports = new StockPointRepository();