export default defineNuxtConfig({
  modules: [
    [
      "vuetify-nuxt-module",
      {
        vuetifyOptions: {
          theme: {
            defaultTheme: "light",
          },
        },
      },
    ],
  ],

  css: [
    "vuetify/styles",
    "@mdi/font/css/materialdesignicons.css",
  ],

  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "/api",
      fileBase: process.env.NUXT_PUBLIC_FILE_BASE || ""
    },
  },
})
