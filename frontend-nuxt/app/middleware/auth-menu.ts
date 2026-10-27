// // app/middleware/auth-menu.ts
// export default defineNuxtRouteMiddleware(async (to) => {
//   // Jalankan validasi di client maupun server agar aman secara utuh
//   try {
//     const { $api } = useNuxtApp()
//     const res: any = await $api('/auth/menus', { method: 'GET' })
//     const menuList = res?.data || res

//     if (Array.isArray(menuList)) {
//       const hasAccess = menuList.some((menu: any) => {
//         if (!menu.path) return false
//         return to.path === menu.path || to.path.startsWith(menu.path + '/')
//       })

//       // Jika mencoba masuk ke halaman admin utama tapi tidak ada hak akses
//       if (!hasAccess && to.path !== '/admin/dashboard') {
//         return navigateTo('/admin/dashboard?error=unauthorized', { replace: true })
//       }
//     } else {
//       if (to.path !== '/admin/dashboard') {
//         return navigateTo('/admin/dashboard?error=unauthorized', { replace: true })
//       }
//     }
//   } catch (err) {
//     console.error('Gagal memvalidasi hak akses middleware:', err)
//     if (to.path !== '/admin/dashboard') {
//       return navigateTo('/admin/dashboard?error=unauthorized', { replace: true })
//     }
//   }
// })

// app/middleware/auth-menu.ts
// app/middleware/auth-menu.ts
import { apiFetch } from '~/services/api'

export default defineNuxtRouteMiddleware(async (to) => {
  // Lewati pengecekan jika sedang berada di halaman login
  if (to.path === '/login') return

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token')
    // Jika token benar-benar kosong setelah di-refresh, arahkan ke login tanpa mencetak warning merah/kuning
    if (!token) {
      return navigateTo('/login', { replace: true })
    }
  }

  try {
    const res: any = await apiFetch('/auth/menus', { method: 'GET' })
    const menuList = res?.data || res

    if (Array.isArray(menuList)) {
      const hasAccess = menuList.some((menu: any) => {
        if (!menu.path) return false
        return to.path === menu.path || to.path.startsWith(menu.path + '/')
      })

      if (!hasAccess && to.path !== '/admin/dashboard') {
        return navigateTo('/admin/dashboard?error=unauthorized', { replace: true })
      }
    }
  } catch (err: any) {
    if (err.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token')
      }
      return navigateTo('/login', { replace: true })
    }
  }
})