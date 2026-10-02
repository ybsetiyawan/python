const { MenuRepository } = require('../../repository/menuRepository');
const { v4: uuidv4 } = require('uuid');

class MenuController {
  // Ambil semua menu untuk Admin
  static async getAllMenus(req, res) {
    try {
      const onlyPublished = req.query.published === 'true';
      const menus = await MenuRepository.findAll(onlyPublished);
      return res.json({ success: true, data: menus });
    } catch (err) {
      console.error("Error getAllMenus:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // Tambah Menu Baru
  static async createMenu(req, res) {
    try {
      const { name, path, icon, sort_order, is_publish } = req.body;

      if (!name || !path) {
        return res.status(400).json({ success: false, error: "Nama menu dan path wajib diisi" });
      }

      const newMenuData = {
        id: uuidv4(),
        name,
        path,
        icon: icon || null,
        sort_order: sort_order !== undefined ? parseInt(sort_order) : 0,
        is_publish: is_publish || 'Y'
      };

      const created = await MenuRepository.create(newMenuData);
      return res.status(201).json({ 
        success: true, 
        message: "Menu berhasil ditambahkan", 
        data: created 
      });
    } catch (err) {
      console.error("Error createMenu:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // Update Menu
  static async updateMenu(req, res) {
    try {
      const { id } = req.params;
      const { name, path, icon, sort_order, is_publish } = req.body;

      const existing = await MenuRepository.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Menu tidak ditemukan" });
      }

      const updateData = {
        name: name !== undefined ? name : null,
        path: path !== undefined ? path : null,
        icon: icon !== undefined ? icon : null,
        sort_order: sort_order !== undefined ? parseInt(sort_order) : null,
        is_publish: is_publish !== undefined ? is_publish : null
      };

      const updated = await MenuRepository.update(id, updateData);
      return res.json({ 
        success: true, 
        message: "Menu berhasil diperbarui", 
        data: updated 
      });
    } catch (err) {
      console.error("Error updateMenu:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // Hapus Menu
  static async deleteMenu(req, res) {
    try {
      const { id } = req.params;

      const existing = await MenuRepository.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Menu tidak ditemukan" });
      }

      await MenuRepository.delete(id);
      return res.json({ 
        success: true, 
        message: "Menu berhasil dihapus" 
      });
    } catch (err) {
      console.error("Error deleteMenu:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // Ambil daftar menu beserta status apakah user tertentu memiliki akses atau tidak
  static async getMenusByUserId(req, res) {
    try {
      const { userId } = req.params;
      const allMenus = await MenuRepository.findAll();
      const userMenus = await MenuRepository.findByUserId(userId);
      const userMenuIds = userMenus.map(m => m.id);

      const data = allMenus.map(menu => ({
        ...menu,
        is_assigned: userMenuIds.includes(menu.id)
      }));

      return res.json({ success: true, data });
    } catch (err) {
      console.error("Error getMenusByUserId:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // Simpan / Sync hak akses menu user
  static async saveUserMenus(req, res) {
    try {
      const { userId } = req.params;
      const { menuIds } = req.body; // Array berisi ID-ID menu yang dicentang

      await MenuRepository.updateUserMenus(userId, menuIds);
      return res.json({ success: true, message: "Hak akses menu berhasil diperbarui" });
    } catch (err) {
      console.error("Error saveUserMenus:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = MenuController;