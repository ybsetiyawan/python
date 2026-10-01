import { readBody, createError, defineEventHandler } from 'h3'
import crypto from 'node:crypto'
import { FormRepository } from '~/server/repository/formRepository'
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
            statusMessage: data.error || 'Unauthorized'
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

    // 2. Baca body request
    const body = await readBody(event)

    if (!body.title) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Judul form wajib diisi'
      })
    }

    const formId = crypto.randomUUID()

    // 3. Simpan ke database dengan user.id yang didapat dari middleware Anda
    const newForm = await FormRepository.create({
      id: formId,
      title: body.title,
      description: body.description || '',
      slug: body.slug || null,
      structure: body.structure || [],
      status: body.status || 'published',
      is_public: body.is_public ?? true,
      user_id: user.id // Berhasil masuk ke database!
    })

    return {
      success: true,
      data: newForm
    }

  } catch (error) {
    // Teruskan error dari middleware (seperti 401 token tidak ditemukan/expired) ke client
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal Server Error'
    })
  }
})