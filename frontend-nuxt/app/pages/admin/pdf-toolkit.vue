<template>
  <div class="pdf-wrapper-container">
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h2 class="text-slate-900 font-weight-bold text-h5">BentoPDF Toolkit</h2>
        <p class="text-slate-500 text-caption">Kelola dokumen PDF perusahaan secara aman terintegrasi dengan workspace.</p>
      </div>
    </div>

    <div class="iframe-card rounded-2xl overflow-hidden border">
      <iframe 
        :src="pdfServiceUrl" 
        class="pdf-iframe"
        title="BentoPDF Toolkit"
      ></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

definePageMeta({ 
  layout: 'admin',
  middleware: ['auth-menu']
})

// Otomatis mendeteksi lingkungan tanpa perlu diubah manual:
// - Saat npm run dev (lokal): mengarah ke http://localhost:3002
// - Saat di server production: otomatis mengarah ke /pdf/ (Nginx)
const pdfServiceUrl = computed(() => {
  return import.meta.dev ? 'http://localhost:3002' : '/pdf/'
})

function openInNewTab() {
  window.open(pdfServiceUrl.value, '_blank');
}
</script>

<style scoped>
.pdf-wrapper-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
}
.iframe-card {
  flex-grow: 1;
  background: #ffffff;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}
.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>