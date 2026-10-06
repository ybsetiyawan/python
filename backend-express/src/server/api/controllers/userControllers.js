const { UserRepository } = require('../../repository/userRepository');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

class UserController {
  // Ambil semua user (Hanya yang belum dihapus)
  static async getAllUsers(req, res) {
    try {
      const users = await UserRepository.findAll();
      return res.json({ success: true, data: users });
    } catch (err) {
      console.error("Error getAllUsers:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // Ambil detail user berdasarkan ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await UserRepository.findById(id);
      
      if (!user) {
        return res.status(404).json({ success: false, error: "User tidak ditemukan" });
      }

      return res.json({ success: true, data: user });
    } catch (err) {
      console.error("Error getUserById:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // Tambah User Baru (Mendukung data tunggal maupun banyak/bulk sekaligus)
  static async createUser(req, res) {
  try {
    const users = Array.isArray(req.body) ? req.body : [req.body];

    for (const user of users) {
      if (!user.name || !user.email || !user.password) {
        return res.status(400).json({ success: false, error: "Semua field wajib diisi (ada data tidak lengkap)" });
      }
    }

    const results = [];
    const skipped = [];

    for (const user of users) {
      const email = user.email.toLowerCase().trim();
      const { name, password } = user;

      try {
        // Cek apakah email sudah terdaftar di database
        const existingUser = await UserRepository.findByEmail(email);
        if (existingUser) {
          // Lewati (skip) jika sudah ada dan catat sebagai data yang dilewati
          skipped.push({ email, reason: "Email sudah terdaftar" });
          continue;
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = {
          id: uuidv4(),
          name,
          email,
          hashedPassword
        };

        // Otomatis tersimpan dan mendapat akses menu Dashboard
        const created = await UserRepository.create(newUser);
        results.push(created);

      } catch (innerErr) {
        // Jika terjadi error saat proses insert (misal duplikat tak terduga), lewati dan catat
        if (innerErr.code === '23505') {
          skipped.push({ email, reason: "Duplicate key violation" });
        } else {
          // Lempar kembali jika error server lainnya
          throw innerErr;
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: `Berhasil menambahkan ${results.length} user (${skipped.length} data dilewati karena duplikat).`,
      count: results.length,
      skipped_count: skipped.length,
      skipped_data: skipped,
      data: Array.isArray(req.body) ? results : (results[0] || null)
    });

  } catch (err) {
    console.error("Error createUser:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
  // Update User
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, password } = req.body;

      const existingUser = await UserRepository.findById(id);
      if (!existingUser) {
        return res.status(404).json({ success: false, error: "User tidak ditemukan" });
      }

      if (email && email !== existingUser.email) {
        const emailCheck = await UserRepository.findByEmail(email);
        if (emailCheck) {
          return res.status(400).json({ success: false, error: "Email sudah digunakan oleh user lain" });
        }
      }

      let hashedPassword = null;
      if (password) {
        const saltRounds = 10;
        hashedPassword = await bcrypt.hash(password, saltRounds);
      }

      const updateData = {
        name: name !== undefined ? name : null,
        email: email !== undefined ? email : null,
        hashedPassword
      };

      const updated = await UserRepository.update(id, updateData);
      return res.json({
        success: true,
        message: "User berhasil diperbarui",
        data: updated
      });
    } catch (err) {
      console.error("Error updateUser:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // Hapus User (Soft Delete -> is_deleted = true)
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const existingUser = await UserRepository.findById(id);
      if (!existingUser) {
        return res.status(404).json({ success: false, error: "User tidak ditemukan atau sudah dihapus" });
      }

      await UserRepository.delete(id);
      return res.json({
        success: true,
        message: "User berhasil dihapus"
      });
    } catch (err) {
      console.error("Error deleteUser:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = UserController;