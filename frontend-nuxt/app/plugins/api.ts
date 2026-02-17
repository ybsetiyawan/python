export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const api = $fetch.create({
    baseURL: config.public.apiBase,

    onRequest({ options }) {
      if (import.meta.client) {
        const token = localStorage.getItem("admin_token")

        if (token) {
          // Pastikan headers berupa instance Headers
          if (!options.headers) {
            options.headers = new Headers()
          }

          if (options.headers instanceof Headers) {
            options.headers.set("Authorization", `Bearer ${token}`)
          }
        }
      }
    }
  })

  return {
    provide: {
      api
    }
  }
})
