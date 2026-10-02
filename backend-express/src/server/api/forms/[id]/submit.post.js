import { readMultipartFormData, createError, defineEventHandler, getRequestIP, getHeader, getRouterParam } from 'h3'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { FormRepository } from '~/server/repository/formRepository'
import { SubmissionRepository } from '~/server/repository/submissionRepository'
// Import authMiddleware asli Anda (sesuaikan path foldernya jika berada di luar folder server)
import authMiddleware from '@/middleware/authMiddleware' 

// Helper untuk menjembatani middleware Express ke event handler Nuxt (H3)
const runExpressMiddleware = (middleware, event) => {
  return new Promise((resolve, reject) => {
    const req = event.node.req
    const res = event.node.res

    // Mock fungsi .status().json() pada res Express agar merespons error H3 jika gagal
    res.status = (statusCode) => {
      res.statusCode = statusCode
      return {
        json: (data) => {
          reject(createError({
            statusCode: statusCode,
            statusMessage: data.error || data.message || 'Unauthorized'
          }))
        }
      }
    }

    // Jalankan middleware asli Anda
    middleware(req, res, (err) => {
      if (err) return reject(err)
      resolve(req.user) // Mengembalikan data user yang disimpan ke req.user
    })
  })
}

export default defineEventHandler(async (event) => {
  try {
    // 1. Jalankan authMiddleware Anda secara aman di Nuxt
    const user = await runExpressMiddleware(authMiddleware, event)
    const userId = user?.id || user?.userId || null

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: User ID tidak ditemukan dalam token'
      })
    }

    const formId = getRouterParam(event, 'id')

    // 2. Cek keberadaan master form
    const formMaster = await FormRepository.findById(formId)
    if (!formMaster) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Form tidak ditemukan'
      })
    }

    // 3. Baca payload multipart (teks + file)
    const parts = await readMultipartFormData(event)
    if (!parts || parts.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Data form tidak boleh kosong'
      })
    }

    const responses = {}
    const attachments = []
    const submissionId = crypto.randomUUID()

    // Folder tujuan penyimpanan file fisik: public/uploads/forms/<formId>
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'forms', formId)
    await fs.mkdir(uploadDir, { recursive: true })

    // 4. Iterasi setiap part/field yang dikirim
    for (const part of parts) {
      const fieldName = part.name
      if (!fieldName) continue

      // Jika berupa file upload
      if (part.filename && part.filename.trim() !== '') {
        const ext = path.extname(part.filename)
        const storedFilename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`
        const filePath = path.join(uploadDir, storedFilename)
        const publicPath = `/uploads/forms/${formId}/${storedFilename}`

        // Simpan buffer file ke disk server
        await fs.writeFile(filePath, part.data)

        const attachmentId = crypto.randomUUID()

        attachments.push({
          id: attachmentId,
          field_id: fieldName,
          original_filename: part.filename,
          stored_filename: storedFilename,
          file_path: publicPath,
          file_size: part.data.length,
          mime_type: part.type || 'application/octet-stream'
        })

        // Path file disimpan pada JSON response
        responses[fieldName] = publicPath
      } else {
        // Jika berupa input teks/pilihan biasa
        responses[fieldName] = part.data.toString('utf-8')
      }
    }

    // 5. Client Request Meta
    const ipAddress = getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1'
    const userAgent = getHeader(event, 'user-agent') || ''

    // 6. Simpan Submission & Attachments ke Database menggunakan userId dari token
    const result = await SubmissionRepository.createSubmissionWithAttachments({
      submission: {
        id: submissionId,
        form_id: formId,
        responses: responses,
        ip_address: ipAddress,
        user_agent: userAgent,
        user_id: userId // <-- Berhasil masuk dengan aman dari middleware!
      },
      attachments: attachments
    })

    return {
      success: true,
      message: 'Jawaban form berhasil dikirim',
      submission_id: result.id
    }

  } catch (error) {
    // Teruskan error dari middleware atau createError ke client
    if (error.statusCode) {
      throw error
    }
    console.error('Error saat submit form:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal Server Error'
    })
  }
})