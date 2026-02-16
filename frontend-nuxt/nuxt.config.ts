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
      apiBase: "http://localhost:8090",
    },
  },
})
