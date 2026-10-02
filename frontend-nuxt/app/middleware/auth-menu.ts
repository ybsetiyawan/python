// app/middleware/auth-menu.ts
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.client) {
    try {
      const { $api } = useNuxtApp()
      const res: any = await $api('/auth/menus', { method: 'GET' })
      const menuList = res?.data || res

      if (Array.isArray(menuList)) {
        // Cek apakah user punya hak akses ke path saat ini
        const hasAccess = menuList.some((menu: any) => {
          if (!menu.path) return false
          
          // 1. Cocokkan persis (exact match)
          // 2. Cocokkan jika to.path adalah sub-route turunan valid (pastikan setelah path ada karakter '/')
          return to.path === menu.path || to.path.startsWith(menu.path + '/')
        })

        if (!hasAccess) {
          // Jika tidak punya akses, arahkan aman ke halaman dashboard utama admin
          return navigateTo('/admin/dashboard')
        }
      } else {
        return navigateTo('/admin/dashboard')
      }
    } catch (err) {
      console.error('Gagal memvalidasi hak akses middleware:', err)
      return navigateTo('/admin/dashboard')
    }
  }
})