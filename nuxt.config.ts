export default defineNuxtConfig({
  compatibilityDate: "2026-03-31",
  srcDir: "app/",
  css: ["~/assets/css/main.css"],
  devtools: {
    enabled: false
  },
  future: {
    compatibilityVersion: 4
  },
  runtimeConfig: {
    podcastIndexApiKey: process.env.NUXT_PODCAST_INDEX_API_KEY ?? "",
    podcastIndexApiSecret: process.env.NUXT_PODCAST_INDEX_API_SECRET ?? "",
    useMockCatalog: process.env.POD_SHIFT_USE_MOCK_CATALOG ?? "false",
    requestTimeoutMs: process.env.POD_SHIFT_REQUEST_TIMEOUT_MS ?? "8000",
    public: {
      appName: "Pod Shift"
    }
  },
  app: {
    head: {
      title: "Pod Shift",
      meta: [
        {
          name: "description",
          content:
            "Convert public podcast links between podcast apps without keeping your history."
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1"
        }
      ]
    }
  }
});
