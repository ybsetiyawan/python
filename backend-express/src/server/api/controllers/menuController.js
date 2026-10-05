const { MenuRepository } = require('../../repository/menuRepository');
const { v4: uuidv4 } = require('uuid');

class MenuController {
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

  static async createMenu(req, res) {
    try {
      const { name, path, icon, sort_order, is_publish, description, icon_bg, badge_text, chip_color } = req.body;

      if (!name || !path) {
        return res.status(400).json({ success: false, error: "Nama menu dan path wajib diisi" });
      }

      const newMenuData = {
        id: uuidv4(),
        name,
        path,
        icon: icon || null,
        sort_order: sort_order !== undefined ? parseInt(sort_order) : 0,
        is_publish: is_publish || 'Y',
        description: description || null,
        icon_bg: icon_bg || 'indigo-bg',
        badge_text: badge_text || 'Modul Utama',
        chip_color: chip_color || 'indigo'
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

  static async updateMenu(req, res) {
    try {
      const { id } = req.params;
      const { name, path, icon, sort_order, is_publish, description, icon_bg, badge_text, chip_color } = req.body;

      const existing = await MenuRepository.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Menu tidak ditemukan" });
      }

      const updateData = {
        name: name !== undefined ? name : null,
        path: path !== undefined ? path : null,
        icon: icon !== undefined ? icon : null,
        sort_order: sort_order !== undefined ? parseInt(sort_order) : null,
        is_publish: is_publish !== undefined ? is_publish : null,
        description: description !== undefined ? description : null,
        icon_bg: icon_bg !== undefined ? icon_bg : null,
        badge_text: badge_text !== undefined ? badge_text : null,
        chip_color: chip_color !== undefined ? chip_color : null
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

  static async deleteMenu(req, res) {
    try {
      const { id } = req.params;
      const existing = await MenuRepository.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Menu tidak ditemukan" });
      }

      await MenuRepository.delete(id);
      return res.json({ success: true, message: "Menu berhasil dihapus" });
    } catch (err) {
      console.error("Error deleteMenu:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getMenusByUserId(req, res) {
    try {
      const { userId } = req.params;
      const allMenus = await MenuRepository.findAll();
      const userMenus = await MenuRepository.findByUserId(userId);
      const userMenuIds = userMenus.map(m => m.menu_id);

      const data = allMenus.map(menu => ({
        ...menu,
        is_assigned: userMenuIds.includes(menu.id),
        is_checked: userMenuIds.includes(menu.id)
      }));

      return res.json({ success: true, data });
    } catch (err) {
      console.error("Error getMenusByUserId:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async saveUserMenus(req, res) {
    try {
      const { userId } = req.params;
      const { menuIds } = req.body;
      await MenuRepository.updateUserMenus(userId, menuIds);
      return res.json({ success: true, message: "Hak akses menu berhasil diperbarui" });
    } catch (err) {
      console.error("Error saveUserMenus:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = MenuController;