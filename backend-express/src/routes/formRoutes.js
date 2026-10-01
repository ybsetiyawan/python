const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const multer = require('multer')

const { FormRepository } = require('../server/repository/formRepository')
const { SubmissionRepository } = require('../server/repository/submissionRepository')
const authMiddleware = require('../middleware/authMiddleware') // Pastikan path middleware ini sesuai dengan struktur project Anda

// -------------------------------------------------------------
// Konfigurasi Storage Multer untuk Disk Storage
// -------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const formId = req.params.id
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'forms', formId)
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const storedFilename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`
    cb(null, storedFilename)
  }
})

const upload = multer({ storage: storage })

// -------------------------------------------------------------
// 0. GET /api/forms (Ambil Semua Daftar Master Form)
// -------------------------------------------------------------


// jika findAll tanpa userID
// router.get('/', async (req, res) => {
//   try {
//     const forms = await FormRepository.findAll()

//     return res.json({
//       success: true,
//       data: forms || []
//     })
//   } catch (error) {
//     console.error('Error get all forms:', error)
//     return res.status(500).json({ success: false, message: error.message })
//   }
// })


// -------------------------------------------------------------
// 0. GET /api/forms (Ambil Daftar Master Form Milik User Login)
// -------------------------------------------------------------
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Ambil user_id secara aman dari token JWT
    const userId = req.user?.id || req.user?.userId || null

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User ID tidak ditemukan dalam token' })
    }

    // Panggil findAll dengan menyertakan userId agar data terfilter otomatis
    const forms = await FormRepository.findAll(userId)

    return res.json({
      success: true,
      data: forms || []
    })
  } catch (error) {
    console.error('Error get all forms:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
})

// -------------------------------------------------------------
// 1. POST /api/forms (Buat Template Form Baru)
// -------------------------------------------------------------
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, slug, structure, status, is_public } = req.body

    if (!title) {
      return res.status(400).json({ success: false, message: 'Judul form wajib diisi' })
    }

    // Ambil user_id SECARA AMAN dari token yang sudah diverifikasi oleh middleware
    const userId = req.user?.id || req.user?.userId || null

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User ID tidak ditemukan dalam token' })
    }

    const formId = crypto.randomUUID()

    const newForm = await FormRepository.create({
      id: formId,
      title,
      description: description || '',
      slug: slug || null,
      structure: structure || [],
      status: status || 'published',
      is_public: is_public ?? true,
      user_id: userId // <-- Menggunakan user_id yang aman dari token
    })

    return res.status(201).json({
      success: true,
      message: 'Master form berhasil dibuat',
      data: newForm
    })
  } catch (error) {
    console.error('Error create form:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
})

// -------------------------------------------------------------
// 2. GET /api/forms/:id (Ambil Detail Form)
// -------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const form = await FormRepository.findById(id)

    if (!form) {
      return res.status(404).json({ success: false, message: 'Form tidak ditemukan' })
    }

    return res.json({
      success: true,
      data: form
    })
  } catch (error) {
    console.error('Error get form:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
})

// -------------------------------------------------------------
// 3. POST /api/forms/:id/submit (Submit Jawaban Form + Upload File)
// -------------------------------------------------------------
// Menggunakan authMiddleware (opsional: jika form harus diisi oleh user login, pertahankan authMiddleware. 
// Jika form bisa diisi publik/guest, hapus authMiddleware dan tangani req.user?.id sebagai null)
router.post('/:id/submit', authMiddleware, upload.any(), async (req, res) => {
  try {
    const formId = req.params.id

    // 1. Cek keberadaan master form
    const formMaster = await FormRepository.findById(formId)
    if (!formMaster) {
      return res.status(404).json({ success: false, message: 'Form tidak ditemukan' })
    }

    // Ambil user_id aman dari token jika wajib login, atau biarkan null jika publik
    const userId = req.user?.id || req.user?.userId || null

    const submissionId = crypto.randomUUID()
    const responses = { ...req.body } 
    const attachments = []

    // 2. Olah file yang ter-upload (jika ada)
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fieldName = file.fieldname
        const publicPath = `/uploads/forms/${formId}/${file.filename}`

        attachments.push({
          id: crypto.randomUUID(),
          field_id: fieldName,
          original_filename: file.originalname,
          stored_filename: file.filename,
          file_path: publicPath,
          file_size: file.size,
          mime_type: file.mimetype
        })

        responses[fieldName] = publicPath
      }
    }

    // 3. Ambil Meta Client
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'
    const userAgent = req.headers['user-agent'] || ''

    // 4. Simpan ke database via Repository (Transaction)
    const result = await SubmissionRepository.createSubmissionWithAttachments({
      submission: {
        id: submissionId,
        form_id: formId,
        responses: responses,
        ip_address: ipAddress,
        user_agent: userAgent,
        user_id: userId // <-- Aman dari token
      },
      attachments: attachments
    })

    return res.status(201).json({
      success: true,
      message: 'Jawaban form berhasil dikirim',
      submission_id: result.id
    })
  } catch (error) {
    console.error('Error submit form:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
})

// -------------------------------------------------------------
// 4. PUT /api/forms/:id (Update Master Form)
// -------------------------------------------------------------
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, slug, structure, status, is_public } = req.body

    // Cek apakah form ada terlebih dahulu
    const existingForm = await FormRepository.findById(id)
    if (!existingForm) {
      return res.status(404).json({ success: false, message: 'Form tidak ditemukan' })
    }

    // Opsional: Validasi apakah user yang mengedit adalah pemilik form (jika tabel form menyimpan created_by / user_id)
    // const userId = req.user?.id
    // if (existingForm.user_id !== userId) {
    //   return res.status(403).json({ success: false, message: 'Anda tidak memiliki hak untuk mengubah form ini' })
    // }

    // Jalankan fungsi update dari FormRepository
    const updatedForm = await FormRepository.update(id, {
      title,
      description,
      slug,
      structure,
      status,
      is_public
    })

    return res.json({
      success: true,
      message: 'Master form berhasil diperbarui',
      data: updatedForm
    })
  } catch (error) {
    console.error('Error update form:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
})

// -------------------------------------------------------------
// 5. GET /api/forms/:id/submissions (Ambil Semua Daftar Jawaban Form)
// -------------------------------------------------------------
router.get('/:id/submissions', authMiddleware, async (req, res) => {
  try {
    const formId = req.params.id

    // Cek keberadaan form master
    const form = await FormRepository.findById(formId)
    if (!form) {
      return res.status(404).json({ success: false, message: 'Form tidak ditemukan' })
    }

    // Ambil daftar submission menggunakan method repository Anda
    const submissions = await SubmissionRepository.findByFormId(formId)

    return res.json({
      success: true,
      data: {
        form_title: form.title,
        total_submissions: submissions.length,
        submissions: submissions
      }
    })
  } catch (error) {
    console.error('Error get submissions:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
})

// -------------------------------------------------------------
// 6. GET /api/forms/submissions/:submissionId (Ambil Detail 1 Jawaban + Lampiran)
// -------------------------------------------------------------
router.get('/submissions/:submissionId', authMiddleware, async (req, res) => {
  try {
    const { submissionId } = req.params

    const submission = await SubmissionRepository.findDetailById(submissionId)

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Data submission tidak ditemukan' })
    }

    return res.json({
      success: true,
      data: submission
    })
  } catch (error) {
    console.error('Error get detail submission:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router