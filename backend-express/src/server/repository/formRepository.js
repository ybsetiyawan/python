const pool = require("../../../src/config/db");



const FormRepository = {
  // 1. Create Master Form
  async create(data) {
    const sql = `
      INSERT INTO forms (id, title, description, slug, structure, status, is_public, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `
    const values = [
      data.id,
      data.title,
      data.description || null,
      data.slug || null,
      JSON.stringify(data.structure || []),
      data.status || 'published',
      data.is_public ?? true,
      data.user_id || null,
    ]

    const result = await pool.query(sql, values)
    return result.rows[0]
  },

  // 2. Get Form By ID
  async findById(id) {
    const sql = `SELECT * FROM forms WHERE id = $1 LIMIT 1`
    const result = await pool.query(sql, [id])
    return result.rows[0] || null
  },

  // 3. Get Form By Slug
  async findBySlug(slug) {
    const sql = `SELECT * FROM forms WHERE slug = $1 AND status = 'published' LIMIT 1`
    const result = await pool.query(sql, [slug])
    return result.rows[0] || null
  },

  // 4. Update Form
  async update(id, data) {
    const sql = `
      UPDATE forms
      SET title = COALESCE($2, title),
          description = COALESCE($3, description),
          slug = COALESCE($4, slug),
          structure = COALESCE($5, structure),
          status = COALESCE($6, status),
          is_public = COALESCE($7, is_public),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `
    const values = [
      id,
      data.title,
      data.description,
      data.slug,
      data.structure ? JSON.stringify(data.structure) : null,
      data.status,
      data.is_public,
    ]

    const result = await pool.query(sql, values)
    return result.rows[0] || null
  },

  // 5. List All Forms
  async findAll(userId = null) {
    let sql = `SELECT * FROM forms`
    const params = []

    if (userId) {
      sql += ` WHERE user_id = $1`
      params.push(userId)
    }

    sql += ` ORDER BY created_at DESC`
    const result = await pool.query(sql, params)
    return result.rows
  }
}

module.exports = { FormRepository }