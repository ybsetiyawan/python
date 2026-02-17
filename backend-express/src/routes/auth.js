const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const pool = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";

/*
=================================
REGISTER USER
=================================
*/
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Semua field wajib diisi" });
    }

    // Cek email sudah ada?
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email sudah terdaftar" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users(id, name, email, password)
       VALUES($1,$2,$3,$4)`,
      [uuidv4(), name, email, hashedPassword]
    );

    return res.json({ message: "User berhasil dibuat" });

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
      { expiresIn: "2h" }
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

module.exports = router;
