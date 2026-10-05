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
    return result.rows
  }

  // Ambil semua daftar menu
  static async findAll(onlyPublished = false) {
    let query = `SELECT * FROM menus`
    if (onlyPublished) {
      query += ` WHERE is_publish = 'Y'`
    }
    query += ` ORDER BY sort_order ASC`
    
    const result = await pool.query(query)
    return result.rows
  }

  // Ambil menu berdasarkan ID
  static async findById(menuId) {
    const query = `SELECT * FROM menus WHERE id = $1`
    const result = await pool.query(query, [menuId])
    return result.rows[0]
  }

  // Tambah menu baru
  static async create(menuData) {
    const { id, name, path, icon, sort_order, is_publish, description, icon_bg, badge_text, chip_color } = menuData
    const query = `
      INSERT INTO menus (id, name, path, icon, sort_order, is_publish, description, icon_bg, badge_text, chip_color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `
    const values = [
      id, 
      name, 
      path, 
      icon || null, 
      sort_order ?? 0, 
      is_publish || 'Y',
      description || null,
      icon_bg || 'indigo-bg',
      badge_text || 'Modul Utama',
      chip_color || 'indigo'
    ]
    const result = await pool.query(query, values)
    return result.rows[0]
  }

  // Update menu berdasarkan ID
  static async update(menuId, menuData) {
    const { name, path, icon, sort_order, is_publish, description, icon_bg, badge_text, chip_color } = menuData
    const query = `
      UPDATE menus 
      SET name = COALESCE($1, name),
          path = COALESCE($2, path),
          icon = COALESCE($3, icon),
          sort_order = COALESCE($4, sort_order),
          is_publish = COALESCE($5, is_publish),
          description = COALESCE($6, description),
          icon_bg = COALESCE($7, icon_bg),
          badge_text = COALESCE($8, badge_text),
          chip_color = COALESCE($9, chip_color)
      WHERE id = $10
      RETURNING *
    `
    const values = [name, path, icon, sort_order, is_publish, description, icon_bg, badge_text, chip_color, menuId]
    const result = await pool.query(query, values)
    return result.rows[0]
  }

  // Hapus menu berdasarkan ID
  static async delete(menuId) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('DELETE FROM user_menus WHERE menu_id = $1', [menuId])
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

  // Sync hak akses menu user
  static async updateUserMenus(userId, menuIds) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('DELETE FROM user_menus WHERE user_id = $1', [userId])
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