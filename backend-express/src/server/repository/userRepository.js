const pool = require("../../config/db");

class UserRepository {
  // Ambil semua daftar user (tanpa mengembalikan password demi keamanan)
  static async findAll() {
    const query = `
      SELECT id, name, email, created_at 
      FROM users 
      WHERE is_deleted = false
      ORDER BY name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Ambil user berdasarkan ID
  static async findById(userId) {
    const query = `
      SELECT id, name, email, created_at 
      FROM users 
      WHERE id = $1 AND is_deleted = false
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

 // Contoh di UserRepository.js
static async findByEmail(email) {
  const query = `SELECT * FROM users WHERE email = $1 AND is_deleted = false`;
  const result = await pool.query(query, [email]);
  return result.rows[0];
}

  // Tambah user baru
  static async create(userData) {
  const { id, name, email, hashedPassword } = userData;
  const dashboardMenuId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // ID Menu Dashboard

  // Gunakan client pool untuk transaksi
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert data user baru
    const userQuery = `
      INSERT INTO users (id, name, email, password)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, created_at
    `;
    const userValues = [id, name, email, hashedPassword];
    const userResult = await client.query(userQuery, userValues);
    const newUser = userResult.rows[0];

    // 2. Otomatis berikan akses ke menu Dashboard
    const menuQuery = `
      INSERT INTO user_menus (user_id, menu_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `;
    await client.query(menuQuery, [newUser.id, dashboardMenuId]);

    await client.query('COMMIT');
    return newUser;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

  // Update user berdasarkan ID
  static async update(userId, userData) {
    const { name, email, hashedPassword } = userData;
    
    // Jika password diubah atau tidak
    let query = '';
    let values = [];

    if (hashedPassword) {
      query = `
        UPDATE users 
        SET name = COALESCE($1, name),
            email = COALESCE($2, email),
            password = COALESCE($3, password)
        WHERE id = $4
        RETURNING id, name, email, created_at
      `;
      values = [name, email, hashedPassword, userId];
    } else {
      query = `
        UPDATE users 
        SET name = COALESCE($1, name),
            email = COALESCE($2, email)
        WHERE id = $3
        RETURNING id, name, email, created_at
      `;
      values = [name, email, userId];
    }

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Hapus user beserta relasinya di user_menus (menggunakan transaction)
  static async delete(userId) {
    const query = `UPDATE users SET is_deleted = true WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }
}

module.exports = { UserRepository };