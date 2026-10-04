// app/middleware/auth-menu.ts
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.client) {
    try {
      const { $api } = useNuxtApp()
      const res: any = await $api('/auth/menus', { method: 'GET' })
      const menuList = res?.data || res

      if (Array.isArray(menuList)) {
        const hasAccess = menuList.some((menu: any) => {
          if (!menu.path) return false
          return to.path === menu.path || to.path.startsWith(menu.path + '/')
        })

        if (!hasAccess) {
          // Redirect ke dashboard dengan membawa query parameter peringatan
          return navigateTo('/admin/dashboard?error=unauthorized')
        }
      } else {
        return navigateTo('/admin/dashboard?error=unauthorized')
      }
    } catch (err) {
      console.error('Gagal memvalidasi hak akses middleware:', err)
      return navigateTo('/admin/dashboard?error=unauthorized')
    }
  }
})