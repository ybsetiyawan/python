const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const ExcelJS = require("exceljs")

/* =========================
   MULTER CONFIG
========================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const id = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, id + ext);
  },
});

const upload = multer({ storage });

/* =========================
   ROUTE
========================= */


router.get("/export", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        k.original_filename,
        k.nik,
        k.nama,
        k.status,
        k.updated_at,
        u.name AS user_name,
        u.email AS user_email
      FROM ktp_scans k
      JOIN users u ON u.id = k.user_id
      where k.status = 'verified'
      ORDER BY k.updated_at DESC
    `)

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("KTP Data")

    // Header
    worksheet.columns = [
      { header: "Original Filename", key: "original_filename", width: 30 },
      { header: "NIK", key: "nik", width: 20 },
      { header: "Nama", key: "nama", width: 25 },
      { header: "Status", key: "status", width: 15 },
      { header: "Updated At", key: "updated_at", width: 25 },
      { header: "User Name", key: "user_name", width: 20 },
      { header: "User Email", key: "user_email", width: 25 },
    ]

    result.rows.forEach(row => {
      worksheet.addRow(row)
    })

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=ktp_export.xlsx"
    )

    await workbook.xlsx.write(res)
    res.end()

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Gagal export data" })
  }
})

router.post("/",authMiddleware, upload.array("files", 5), async (req, res) => {
  let results = [];
  let success = 0;
  let failed = 0;

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Tidak ada file diupload" });
    }

    const formData = new FormData();

    req.files.forEach((file) => {
      formData.append(
        "files",
        fs.createReadStream(file.path),
        file.originalname,
      );
    });

    // Kirim ke FastAPI
    const response = await axios.post("http://localhost:8000/ocr", formData, {
      headers: formData.getHeaders(),
    });

    const ocrResults = response.data.results;

    for (let i = 0; i < ocrResults.length; i++) {
      const item = ocrResults[i];
      const file = req.files[i]; // 🔥 penting (sinkron index)
      const data = item.data || {};
      const nik = data.nik;

      try {
        // =============================
        // VALIDASI 1: NIK 16 DIGIT
        // =============================
        if (!nik || !/^\d{16}$/.test(nik)) {
          failed++;
          results.push({
            filename: file.originalname,
            error: "NIK tidak valid (harus 16 digit angka)",
          });
          continue;
        }

        // =============================
        // VALIDASI 2: CEK DUPLIKAT
        // =============================

        const existing = await pool.query(
          "SELECT id FROM ktp_scans WHERE original_filename = $1",
          [file.originalname],
        );

        if (existing.rows.length > 0) {
          failed++;
          results.push({
            filename: file.originalname,
            error: "File sudah pernah diupload",
          });
          continue;
        }

        // =============================
        // INSERT KE DATABASE
        // =============================
        await pool.query(
          `INSERT INTO ktp_scans(
            id,
            user_id,
            original_filename,
            image_path,
            nik,
            nama,
            tempat_tgl_lahir,
            jenis_kelamin,
            alamat,
            rt_rw,
            kecamatan,
            agama,
            status_perkawinan,
            pekerjaan,
            kewarganegaraan,
            berlaku_hingga,
            raw_response,
            status
          )
          VALUES(
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
          )`,
          [
            uuidv4(),
            req.user.id,
            file.originalname,
            file.path,
            data.nik,
            data.nama,
            data.tempat_tgl_lahir,
            data.jenis_kelamin,
            data.alamat,
            data.rt_rw,
            data.kecamatan,
            data.agama,
            data.status_perkawinan,
            data.pekerjaan,
            data.kewarganegaraan,
            data.berlaku_hingga,
            data,
            "draft",
          ],
        );

        success++;
        results.push({
          filename: file.originalname,
          status: "success",
          nik: nik,
        });
      } catch (err) {
        failed++;
        results.push({
          filename: file.originalname,
          error: err.message,
        });
      }
    }

    return res.json({
      total: req.files.length,
      success,
      failed,
      results,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Gagal proses OCR" });
  }
});

router.get("/drafts", authMiddleware,async (req, res) => {
  try {
    const result = await pool.query(
    `SELECT * FROM ktp_scans
     WHERE status = 'draft'
     AND user_id = $1
     ORDER BY created_at DESC`,
    [req.user.id]
  )
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE DATA DRAFT
router.put("/:id", authMiddleware,async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // =========================
    // VALIDASI NIK
    // =========================
    if (!data.nik || !/^\d{16}$/.test(data.nik)) {
      return res.status(400).json({
        error: "NIK tidak valid (harus 16 digit angka)",
      });
    }

    // =========================
    // CEK DUPLIKAT (selain dirinya sendiri)
    // =========================
    const duplicate = await pool.query(
      "SELECT id FROM ktp_scans WHERE nik = $1 AND id != $2",
      [data.nik, id],
    );

    if (duplicate.rows.length > 0) {
      return res.status(400).json({
        error: "NIK sudah digunakan data lain",
      });
    }

    // =========================
    // UPDATE DATABASE
    // =========================
    // await pool.query(
    //   `
    //   UPDATE ktp_scans SET
    //     nik=$1,
    //     nama=$2,
    //     tempat_tgl_lahir=$3,
    //     jenis_kelamin=$4,
    //     alamat=$5,
    //     rt_rw=$6,
    //     kecamatan=$7,
    //     agama=$8,
    //     status_perkawinan=$9,
    //     pekerjaan=$10,
    //     kewarganegaraan=$11,
    //     berlaku_hingga=$12,
    //     status='verified',
    //     updated_at=NOW()
    //   WHERE id=$13
    //   `,
    //   [
    //     data.nik,
    //     data.nama,
    //     data.tempat_tgl_lahir,
    //     data.jenis_kelamin,
    //     data.alamat,
    //     data.rt_rw,
    //     data.kecamatan,
    //     data.agama,
    //     data.status_perkawinan,
    //     data.pekerjaan,
    //     data.kewarganegaraan,
    //     data.berlaku_hingga,
    //     id,
    //   ],
    // );

    await pool.query(
  `UPDATE ktp_scans
   SET nik=$1, nama=$2, status='verified', updated_at=NOW()
   WHERE id=$3 AND user_id=$4`,
  [
    req.body.nik,
    req.body.nama,
    req.params.id,
    req.user.id
  ]
)

    return res.json({
      message: "Data berhasil diupdate",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Gagal update data",
    });
  }
});

router.patch("/:id/confirm", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      "UPDATE ktp_scans SET status='confirmed', updated_at=NOW() WHERE id=$1",
      [id],
    );

    res.json({ message: "Data dikonfirmasi" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/drafts", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM ktp_scans WHERE status = 'draft' ORDER BY created_at DESC",
    );

    const rows = result.rows.map((row) => {
      const cleanPath = row.image_path.replace(/\\/g, "/");

      return {
        ...row,
        image_url: `http://localhost:8090/${cleanPath}`,
      };
    });

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
