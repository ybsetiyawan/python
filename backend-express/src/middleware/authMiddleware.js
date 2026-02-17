const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // 1️⃣ Tidak ada header Authorization
    if (!authHeader) {
      return res.status(401).json({ error: "Token tidak ditemukan" });
    }

    // 2️⃣ Format harus: Bearer TOKEN
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ error: "Format token salah" });
    }

    const token = parts[1];

    // 3️⃣ Verifikasi token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4️⃣ Simpan user ke request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ error: "Token tidak valid atau expired" });
  }
}

module.exports = authMiddleware;
