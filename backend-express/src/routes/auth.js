const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware"); // Pastikan path ini sesuai dengan letak middleware Anda

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";

/*
=================================
REGISTER USER
=================================
*/
router.post("/register", async (req, res) => {
  try {
    // 1. Pastikan data selalu dalam bentuk Array agar logikanya konsisten
    const users = Array.isArray(req.body) ? req.body : [req.body];

    // 2. Validasi awal: Cek apakah semua field di setiap user ada
    for (const user of users) {
      if (!user.name || !user.email || !user.password) {
        return res.status(400).json({ error: "Semua field wajib diisi (ada data tidak lengkap)" });
      }
    }

    const results = [];

    // 3. Proses setiap user dalam loop
    for (const user of users) {
      const { name, email, password } = user;

      // Cek email sudah ada?
      const existing = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: `Email ${email} sudah terdaftar` });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert ke database
      await pool.query(
        `INSERT INTO users(id, name, email, password)
         VALUES($1, $2, $3, $4)`,
        [uuidv4(), name, email, hashedPassword]
      );
      
      results.push(email);
    }

    return res.json({ 
      message: "Proses berhasil", 
      count: results.length,
      users: results 
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/*
=================================
LOGIN USER
=================================
*/
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ error: "Email tidak ditemukan" });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    if (!validPassword) {
      return res.status(400).json({ error: "Password salah" });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.rows[0].id,
        email: user.rows[0].email,
      },
      JWT_SECRET,
      { expiresIn: "5h" }
    );

    return res.json({
      message: "Login berhasil",
      token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email
      }
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/*
=================================
GET MENUS BY LOGGED-IN USER
=================================
*/
router.get("/menus", authMiddleware, async (req, res) => {
  try {
    // Ambil user id dari token yang sudah didecode oleh authMiddleware
    const userId = req.user?.id || req.user?.userId || null;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized: User ID tidak ditemukan dalam token" 
      });
    }

    // Query untuk mengambil menu sesuai user_menus
    const query = `
      SELECT m.* 
      FROM menus m
      JOIN user_menus um ON m.id = um.menu_id
      WHERE um.user_id = $1
      ORDER BY m.sort_order ASC
    `;

    const result = await pool.query(query, [userId]);

    return res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error("Error mengambil menu user:", err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || "Internal Server Error" 
    });
  }
});

/*
=================================
GET ALL MENUS (For Dashboard Workspace / Admin)
=================================
*/
router.get("/menus/all", authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT id, name, path, icon, sort_order, is_publish, 
             description, icon_bg, badge_text, chip_color 
      FROM menus 
      WHERE is_publish = 'Y'
      ORDER BY sort_order ASC
    `;

    const result = await pool.query(query);

    return res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error("Error mengambil seluruh menu:", err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || "Internal Server Error" 
    });
  }
});

module.exports = router;