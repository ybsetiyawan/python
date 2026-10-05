// app/middleware/auth-menu.ts
export default defineNuxtRouteMiddleware(async (to) => {
  // Jalankan validasi di client maupun server agar aman secara utuh
  try {
    const { $api } = useNuxtApp()
    const res: any = await $api('/auth/menus', { method: 'GET' })
    const menuList = res?.data || res

    if (Array.isArray(menuList)) {
      const hasAccess = menuList.some((menu: any) => {
        if (!menu.path) return false
        return to.path === menu.path || to.path.startsWith(menu.path + '/')
      })

      // Jika mencoba masuk ke halaman admin utama tapi tidak ada hak akses
      if (!hasAccess && to.path !== '/admin/dashboard') {
        return navigateTo('/admin/dashboard?error=unauthorized', { replace: true })
      }
    } else {
      if (to.path !== '/admin/dashboard') {
        return navigateTo('/admin/dashboard?error=unauthorized', { replace: true })
      }
    }
  } catch (err) {
    console.error('Gagal memvalidasi hak akses middleware:', err)
    if (to.path !== '/admin/dashboard') {
      return navigateTo('/admin/dashboard?error=unauthorized', { replace: true })
    }
  }
})