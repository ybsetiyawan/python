export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  const api = $fetch.create({
    baseURL: config.public.apiBase,

    onRequest({ options }) {
      if (import.meta.client) {
        const token = localStorage.getItem("admin_token")
        if (token) {
          if (!options.headers) options.headers = new Headers()
          if (options.headers instanceof Headers) {
            options.headers.set("Authorization", `Bearer ${token}`)
          }
        }
      }
    },

    onResponseError({ response }) {
      const errorMessage = response._data?.message || ""
      
      if (import.meta.client) {
        // 1. Tangkap Sesi Expired (401)
        if (
          response.status === 401 || 
          errorMessage.toLowerCase().includes("expired") || 
          errorMessage.toLowerCase().includes("tidak valid")
        ) {
          localStorage.removeItem("admin_token")
          localStorage.removeItem("user_data")
          // Redirect dengan pesan agar user tidak bingung
          window.location.href = "/login?msg=session_expired"
        }

        // 2. Tangkap Server Error (500)
        else if (response.status >= 500) {
          // Kamu bisa gunakan alert atau sistem toast/snackbar di sini
          alert("Terjadi kesalahan pada server (500). Silakan coba beberapa saat lagi.")
        }
      }
    }
  })

  return { provide: { api } }
})