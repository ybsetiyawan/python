const { UserRepository } = require('../../repository/userRepository');

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

class UserController {
  // Ambil semua user
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

  // Tambah User Baru
  static async createUser(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: "Nama, email, dan password wajib diisi" });
      }

      // Cek apakah email sudah terdaftar
      const existingUser = await UserRepository.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, error: "Email sudah digunakan oleh user lain" });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = {
        id: uuidv4(),
        name,
        email,
        hashedPassword
      };

      const created = await UserRepository.create(newUser);
      return res.status(201).json({
        success: true,
        message: "User berhasil ditambahkan",
        data: created
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

      // Jika email diubah, pastikan email belum dipakai user lain
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

  // Hapus User
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const existingUser = await UserRepository.findById(id);
      if (!existingUser) {
        return res.status(404).json({ success: false, error: "User tidak ditemukan" });
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