const pool = require("../../../src/config/db");

const SubmissionRepository = {
  // Create Submission beserta File Attachments dalam satu transaksi
  async createSubmissionWithAttachments(payload) {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const insertSubmissionSql = `
        INSERT INTO form_submissions (id, form_id, responses, status, user_id, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `
      const submissionValues = [
        payload.submission.id,
        payload.submission.form_id,
        JSON.stringify(payload.submission.responses || {}),
        'submitted',
        payload.submission.user_id || null,
        payload.submission.ip_address || null,
        payload.submission.user_agent || null,
      ]

      const subRes = await client.query(insertSubmissionSql, submissionValues)
      const newSubmission = subRes.rows[0]

      if (Array.isArray(payload.attachments) && payload.attachments.length > 0) {
        const insertAttachmentSql = `
          INSERT INTO form_attachments (
            id, submission_id, form_id, field_id, original_filename, stored_filename, file_path, file_size, mime_type, user_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `

        for (const att of payload.attachments) {
          await client.query(insertAttachmentSql, [
            att.id,
            newSubmission.id,
            payload.submission.form_id,
            att.field_id,
            att.original_filename,
            att.stored_filename,
            att.file_path,
            att.file_size,
            att.mime_type,
            payload.submission.user_id || null,
          ])
        }
      }

      await client.query('COMMIT')
      return newSubmission
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },


  // Mendapatkan riwayat jawaban beserta data user dan attachments
  async findByFormId(formId) {
    const sql = `
      SELECT 
        fs.*,
        u.name AS user_name,
        u.email AS user_email
      FROM form_submissions fs
      LEFT JOIN users u ON fs.user_id = u.id
      WHERE fs.form_id = $1 
      ORDER BY fs.created_at DESC
    `
    const result = await pool.query(sql, [formId])
    const submissions = result.rows

    // Ambil lampiran file untuk setiap submission agar tabel bisa mendeteksi multi-foto
    for (const sub of submissions) {
      const attSql = `SELECT * FROM form_attachments WHERE submission_id = $1`
      const attRes = await pool.query(attSql, [sub.id])
      sub.attachments = attRes.rows
    }

    return submissions
  },

  // Mendapatkan detail submission beserta data user dan daftar lampiran filenya
  async findDetailById(submissionId) {
    const subSql = `
      SELECT 
        fs.*,
        u.name AS user_name,
        u.email AS user_email
      FROM form_submissions fs
      LEFT JOIN users u ON fs.user_id = u.id
      WHERE fs.id = $1 
      LIMIT 1
    `
    const attSql = `SELECT * FROM form_attachments WHERE submission_id = $1`

    const subRes = await pool.query(subSql, [submissionId])
    if (subRes.rows.length === 0) return null

    const attRes = await pool.query(attSql, [submissionId])

    return {
      ...subRes.rows[0],
      attachments: attRes.rows,
    }
  }
}

module.exports = { SubmissionRepository }