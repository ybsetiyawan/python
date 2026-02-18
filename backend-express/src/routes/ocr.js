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
const ExcelJS = require("exceljs");

/* =========================
   MULTER CONFIG
========================= */

const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
const allowedExtensions = [".jpg", ".jpeg", ".png"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const id = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, id + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Hanya file JPG, JPEG, PNG yang diperbolehkan"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // max 2MB
  },
});

/* =========================
   EXPORT VERIFIED
========================= */

// router.get("/export", authMiddleware, async (req, res) => {
//   try {
//     const result = await pool.query(`
//       SELECT
//         k.original_filename,
//         k.nik,
//         k.nama,
//         k.status,
//         k.updated_at,
//         u.name AS user_name,
//         u.email AS user_email
//       FROM ktp_scans k
//       JOIN users u ON u.id = k.user_id
//       WHERE k.status = 'verified'
//       ORDER BY k.updated_at DESC
//     `);

//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet("KTP Data");

//     worksheet.columns = [
//       { header: "Original Filename", key: "original_filename", width: 30 },
//       { header: "NIK", key: "nik", width: 20 },
//       { header: "Nama", key: "nama", width: 25 },
//       { header: "Status", key: "status", width: 15 },
//       { header: "Updated At", key: "updated_at", width: 25 },
//       { header: "User Name", key: "user_name", width: 20 },
//       { header: "User Email", key: "user_email", width: 25 },
//     ];

//     result.rows.forEach((row) => worksheet.addRow(row));

//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );
//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=ktp_export.xlsx"
//     );

//     await workbook.xlsx.write(res);
//     res.end();
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Gagal export data" });
//   }
// });

router.get("/export", authMiddleware, async (req, res) => {
  try {
    const { password } = req.query;
    // console.log("Password diterima:", password);
    // console.log("Password env:", process.env.EXPORT_PASSWORD);

    // =============================
    // VALIDASI PASSWORD EXPORT
    // =============================
    if (!password || password !== process.env.EXPORT_PASSWORD) {
      return res.status(403).json({
        error: "Password export tidak valid",
      });
    }

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
      WHERE k.status = 'verified'
      ORDER BY k.updated_at DESC
    `);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("KTP Data");

    worksheet.columns = [
      { header: "Original Filename", key: "original_filename", width: 30 },
      { header: "NIK", key: "nik", width: 20 },
      { header: "Nama", key: "nama", width: 25 },
      { header: "Status", key: "status", width: 15 },
      { header: "Updated At", key: "updated_at", width: 25 },
      { header: "User Name", key: "user_name", width: 20 },
      { header: "User Email", key: "user_email", width: 25 },
    ];

    result.rows.forEach((row) => worksheet.addRow(row));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=ktp_export.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal export data" });
  }
});

/* =========================
   DASHBOARD SUMMARY
========================= */

router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total_data,
        COUNT(*) FILTER (WHERE status = 'draft') AS total_draft,
        COUNT(*) FILTER (WHERE status = 'verified') AS total_verified,
        COUNT(*) FILTER (
          WHERE DATE(created_at) = CURRENT_DATE
        ) AS total_today,
        COUNT(*) FILTER (
          WHERE status = 'verified'
          AND DATE(updated_at) = CURRENT_DATE
        ) AS verified_today
      FROM ktp_scans
    `);

    res.json({
      total: Number(result.rows[0].total_data),
      draft: Number(result.rows[0].total_draft),
      verified: Number(result.rows[0].total_verified),
      today: Number(result.rows[0].total_today),
      verifiedToday: Number(result.rows[0].verified_today),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data dashboard" });
  }
});

/* =========================
   UPLOAD OCR (MAX 5 FILES)
========================= */

router.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    upload.array("files", 5)(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "Ukuran file maksimal 2MB",
          });
        }
      } else if (err) {
        return res.status(400).json({
          error: err.message,
        });
      }
      next();
    });
  },
  async (req, res) => {
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

      const response = await axios.post("http://localhost:8000/ocr", formData, {
        headers: formData.getHeaders(),
      });

      const ocrResults = response.data.results;

      for (let i = 0; i < ocrResults.length; i++) {
        const item = ocrResults[i];
        const file = req.files[i];
        const data = item.data || {};
        const nik = data.nik;

        try {
          // VALIDASI NIK
          if (!nik || !/^\d{12,16}$/.test(nik)) {
            fs.unlinkSync(file.path);
            failed++;
            results.push({
              filename: file.originalname,
              error:
                "NIK tidak dapat dikenali. Silakan upload ulang gambar dengan kualitas lebih jelas.",
            });
            continue;
          }

          // CEK DUPLIKAT BERDASARKAN NIK
          const duplicate = await pool.query(
            "SELECT id FROM ktp_scans WHERE nik = $1",
            [nik],
          );

          if (duplicate.rows.length > 0) {
            fs.unlinkSync(file.path);
            failed++;
            results.push({
              filename: file.originalname,
              error: "NIK sudah terdaftar",
            });
            continue;
          }

          await pool.query(
            `INSERT INTO ktp_scans(
              id,user_id,original_filename,image_path,
              nik,nama,tempat_tgl_lahir,jenis_kelamin,
              alamat,rt_rw,kecamatan,agama,
              status_perkawinan,pekerjaan,kewarganegaraan,
              berlaku_hingga,raw_response,status
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
            nik,
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
      console.error(error);
      return res.status(500).json({ error: "Gagal proses OCR" });
    }
  },
);

/* =========================
   GET DRAFT USER
========================= */

router.get("/drafts", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ktp_scans
       WHERE status = 'draft'
       AND user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id],
    );

    const rows = result.rows.map((row) => ({
      ...row,
      image_url: `http://localhost:8090/${row.image_path.replace(/\\/g, "/")}`,
    }));

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   UPDATE & VERIFY
========================= */

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nik, nama } = req.body;

    if (!nik || !/^\d{16}$/.test(nik)) {
      return res.status(400).json({
        error: "NIK tidak valid (harus 16 digit angka)",
      });
    }

    const duplicate = await pool.query(
      "SELECT id FROM ktp_scans WHERE nik = $1 AND id != $2",
      [nik, id],
    );

    if (duplicate.rows.length > 0) {
      return res.status(400).json({
        error: "NIK sudah digunakan data lain",
      });
    }

    await pool.query(
      `UPDATE ktp_scans
       SET nik=$1, nama=$2, status='verified', updated_at=NOW()
       WHERE id=$3 AND user_id=$4`,
      [nik, nama, id, req.user.id],
    );

    res.json({ message: "Data berhasil diupdate & diverifikasi" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal update data" });
  }
});

/* =========================
   CONFIRM ADMIN
========================= */

router.patch("/:id/confirm", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      "UPDATE ktp_scans SET status='confirmed', updated_at=NOW() WHERE id=$1",
      [req.params.id],
    );

    res.json({ message: "Data dikonfirmasi" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
