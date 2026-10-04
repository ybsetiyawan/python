const pool = require("../../../src/config/db");


class MenuRepository {
  // Ambil daftar menu yang hanya diizinkan untuk user tertentu
  static async findByUserId(userId) {
    const query = `
      SELECT menu_id 
      FROM user_menus 
      WHERE user_id = $1
    `
    const result = await pool.query(query, [userId])
    // result.rows akan berisi array bersih seperti: [ { menu_id: '...' }, { menu_id: '...' } ]
    return result.rows
  }

  // Ambil semua daftar menu (untuk admin, termasuk yang draft/tidak publish jika diperlukan)
  static async findAll(onlyPublished = false) {
    let query = `SELECT * FROM menus`
    if (onlyPublished) {
      query += ` WHERE is_publish = 'Y'`
    }
    query += ` ORDER BY sort_order ASC`
    
    const result = await pool.query(query)
    return result.rows
  }

  // Ambil menu berdasarkan ID untuk mengelola menu tertentu (update/delete)
  static async findById(menuId) {
    const query = `SELECT * FROM menus WHERE id = $1`
    const result = await pool.query(query, [menuId])
    return result.rows[0]
  }

  // Tambah menu baru
  static async create(menuData) {
    const { id, name, path, icon, sort_order, is_publish } = menuData
    const query = `
      INSERT INTO menus (id, name, path, icon, sort_order, is_publish)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `
    const values = [
      id, 
      name, 
      path, 
      icon || null, 
      sort_order ?? 0, 
      is_publish || 'Y'
    ]
    const result = await pool.query(query, values)
    return result.rows[0]
  }

  // Update menu berdasarkan ID
  static async update(menuId, menuData) {
    const { name, path, icon, sort_order, is_publish } = menuData
    const query = `
      UPDATE menus 
      SET name = COALESCE($1, name),
          path = COALESCE($2, path),
          icon = COALESCE($3, icon),
          sort_order = COALESCE($4, sort_order),
          is_publish = COALESCE($5, is_publish)
      WHERE id = $6
      RETURNING *
    `
    const values = [name, path, icon, sort_order, is_publish, menuId]
    const result = await pool.query(query, values)
    return result.rows[0]
  }

  // Hapus menu berdasarkan ID
  static async delete(menuId) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 1. Hapus relasi di user_menus terlebih dahulu agar tidak kena foreign key constraint error
      await client.query('DELETE FROM user_menus WHERE menu_id = $1', [menuId])

      // 2. Hapus menu utama
      const result = await client.query('DELETE FROM menus WHERE id = $1 RETURNING *', [menuId])

      await client.query('COMMIT')
      return result.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  // Simpan/Update hak akses menu untuk user tertentu (Sync menu)
  static async updateUserMenus(userId, menuIds) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 1. Hapus semua akses menu lama user tersebut
      await client.query('DELETE FROM user_menus WHERE user_id = $1', [userId])

      // 2. Jika ada menu baru yang dicentang, masukkan satu per satu
      if (menuIds && menuIds.length > 0) {
        for (const menuId of menuIds) {
          await client.query(
            'INSERT INTO user_menus (user_id, menu_id) VALUES ($1, $2)',
            [userId, menuId]
          )
        }
      }

      await client.query('COMMIT')
      return true
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}

module.exports = { MenuRepository }