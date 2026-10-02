import { createError, defineEventHandler } from 'h3'
import { MenuRepository } from '~/server/repository/menuRepository'
import authMiddleware from '@/middleware/authMiddleware'

// Helper bridge Express middleware ke H3 Nuxt
const runExpressMiddleware = (middleware, event) => {
  return new Promise((resolve, reject) => {
    const req = event.node.req
    const res = event.node.res

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

    middleware(req, res, (err) => {
      if (err) return reject(err)
      resolve(req.user)
    })
  })
}

export default defineEventHandler(async (event) => {
  try {
    // 1. Validasi token user yang sedang login
    const user = await runExpressMiddleware(authMiddleware, event)
    const userId = user?.id || user?.userId || null

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: User tidak dikenali'
      })
    }

    // 2. Ambil menu khusus berdasarkan user_id dari database
    const menus = await MenuRepository.findByUserId(userId)

    return {
      success: true,
      data: menus
    }
  } catch (error) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal Server Error'
    })
  }
})