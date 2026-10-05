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

// Konfigurasi Storage & Batasan Validasi File Multer di Backend
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Batas maksimal 5 MB per file
    files: 10                   // Batas total maksimum file dalam sekali submit
  },
  fileFilter: (req, file, cb) => {
    // Validasi Ekstensi / Mime Type yang diizinkan
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Format file tidak didukung! Harap unggah file berformat JPG, PNG, atau PDF.'), false)
    }
  }
})

// -------------------------------------------------------------
// 0. GET /api/forms (Ambil Daftar Master Form Milik User Login)
// -------------------------------------------------------------
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || null

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User ID tidak ditemukan dalam token' })
    }

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

const ExcelJS = require('exceljs');

// -------------------------------------------------------------
// GET /api/forms/:id/export-excel (Export Laporan Submission ke Excel)
// -------------------------------------------------------------
router.get('/:id/export-excel', authMiddleware, async (req, res) => {
  try {
    const formId = req.params.id;
    const form = await FormRepository.findById(formId);
    if (!form) {
      return res.status(404).json({ success: false, message: 'Form tidak ditemukan' });
    }

    const submissions = await SubmissionRepository.findByFormId(formId);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Submission');

    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Tanggal Submit', key: 'created_at', width: 20 },
      { header: 'Nama Pengisi', key: 'user_name', width: 25 },
      { header: 'Email', key: 'user_email', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'IP Address', key: 'ip_address', width: 15 }
    ];

    submissions.forEach((sub, index) => {
      worksheet.addRow({
        no: index + 1,
        created_at: sub.created_at,
        user_name: sub.user_name || 'Guest / Publik',
        user_email: sub.user_email || '-',
        status: sub.status,
        ip_address: sub.ip_address || '-'
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan-Submission-${formId}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error export excel:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// -------------------------------------------------------------
// 1. POST /api/forms (Buat Template Form Baru)
// -------------------------------------------------------------
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, slug, structure, status, is_public, allow_submission } = req.body

    if (!title) {
      return res.status(400).json({ success: false, message: 'Judul form wajib diisi' })
    }

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
      allow_submission: allow_submission ?? true,
      user_id: userId
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
// 2. GET /api/forms/:id (Ambil Detail Form - Blokir jika allow_submission false)
// -------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const form = await FormRepository.findById(id)

    if (!form) {
      return res.status(404).json({ success: false, message: 'Form tidak ditemukan' })
    }

    // Blokir akses GET detail form jika allow_submission bernilai false
    if (form.allow_submission === false) {
      return res.status(403).json({ 
        success: false, 
        message: 'Maaf, formulir ini sudah ditutup dan tidak menerima tanggapan baru.' 
      })
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
// 3. POST /api/forms/:id/submit (Submit Jawaban Form + Validasi Required & Allow Submission)
// -------------------------------------------------------------
router.post('/:id/submit', authMiddleware, upload.any(), async (req, res) => {
  try {
    const formId = req.params.id

    const formMaster = await FormRepository.findById(formId)
    if (!formMaster) {
      return res.status(404).json({ success: false, message: 'Form tidak ditemukan' })
    }
    
    if (formMaster.allow_submission === false) {
      return res.status(403).json({ 
        success: false, 
        message: 'Maaf, formulir ini sudah ditutup dan tidak menerima tanggapan baru.' 
      })
    }

    const structure = formMaster.structure || []
    const responses = { ...req.body }
    const uploadedFiles = req.files || []

    for (const field of structure) {
      if (field.required) {
        if (field.type === 'file') {
          const hasFile = uploadedFiles.some(f => f.fieldname === field.id)
          if (!hasFile) {
            return res.status(400).json({ 
              success: false, 
              message: `Validasi gagal: Lampiran untuk "${field.label}" wajib diisi.` 
            })
          }
        } else {
          const val = responses[field.id]
          if (val === undefined || val === null || val.toString().trim() === '') {
            return res.status(400).json({ 
              success: false, 
              message: `Validasi gagal: Kolom "${field.label}" wajib diisi.` 
            })
          }
        }
      }
    }

    const userId = req.user?.id || req.user?.userId || null
    const submissionId = crypto.randomUUID()
    const attachments = []

    if (uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
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

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'
    const userAgent = req.headers['user-agent'] || ''

    const result = await SubmissionRepository.createSubmissionWithAttachments({
      submission: {
        id: submissionId,
        form_id: formId,
        responses: responses,
        ip_address: ipAddress,
        user_agent: userAgent,
        user_id: userId
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
// 4. PUT /api/forms/:id (Update Master Form termasuk allow_submission)
// -------------------------------------------------------------
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, slug, structure, status, is_public, allow_submission } = req.body

    const existingForm = await FormRepository.findById(id)
    if (!existingForm) {
      return res.status(404).json({ success: false, message: 'Form tidak ditemukan' })
    }

    const updatedForm = await FormRepository.update(id, {
      title,
      description,
      slug,
      structure,
      status,
      is_public,
      allow_submission
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

    const form = await FormRepository.findById(formId)
    if (!form) {
      return res.status(404).json({ success: false, message: 'Form tidak ditemukan' })
    }

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