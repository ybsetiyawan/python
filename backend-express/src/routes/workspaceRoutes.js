const express = require('express')
const router = express.Router()
const { WorkspaceRepository } = require('../server/repository/workspaceRepository')
const authMiddleware = require('../middleware/authMiddleware') // Sesuaikan path middleware auth Anda

// -------------------------------------------------------------
// GET /api/workspace/dashboard (Ambil Statistik Ringkasan Dashboard)
// -------------------------------------------------------------
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || null
    const stats = await WorkspaceRepository.getDashboardStats(userId)

    return res.json({
      success: true,
      ...stats
    })
  } catch (error) {
    console.error('Error fetching workspace dashboard stats:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
})

// -------------------------------------------------------------
// GET /api/workspace/search?q=keyword (Pencarian Cepat Dokumen Global)
// -------------------------------------------------------------
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const keyword = req.query.q || ''
    if (!keyword.trim()) {
      return res.json({ success: true, data: [] })
    }

    const userId = req.user?.id || req.user?.userId || null
    const results = await WorkspaceRepository.searchDocuments(keyword, userId)

    return res.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Error searching workspace documents:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router