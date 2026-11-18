<template>
  <div class="workspace-enterprise">

    <!-- TOP PAGE TITLE BAR -->
    <div class="enterprise-topbar slide-up">
      <div class="title-group">
        <h1>EDPSBY Workspace</h1>
        <p class="welcome-text">
          Selamat datang di <strong>EDPSBY Workspace</strong>, ruang kerja internal PT Indomarco Adi Prima Cabang
          Surabaya.
        </p>
        <p class="welcome-text">
          Pusat kendali operasional terpadu untuk mengelola formulir cabang, repositori berkas, dan analitik data harian
          secara efisien.
        </p>
      </div>
      <div class="topbar-clock">
        <v-icon size="16" color="indigo-darken-2" class="mr-2">mdi-shield-check-outline</v-icon>
        <span>EDP Security Active</span>
      </div>
    </div>

    <!-- MAIN GRID CONTAINER (2 COLUMNS: SIDEBAR & CONTENT) -->
    <div class="enterprise-layout slide-up delay-1">

      <!-- KOLOM KIRI: STATISTIK & RINGKASAN SISTEM -->
      <div class="enterprise-sidebar">
        <div class="sidebar-card">
          <div class="sidebar-card-header">
            <v-icon size="18" color="indigo-darken-2">mdi-chart-box-outline</v-icon>
            <h3>Live Metrics</h3>
          </div>

          <div class="metrics-stack">
            <div class="metric-row">
              <div class="d-flex align-center" style="gap: 10px;">
                <div class="mini-icon bg-indigo-light">
                  <v-icon size="16" color="indigo-darken-2">mdi-file-document-outline</v-icon>
                </div>
                <span class="metric-label">Total Forms</span>
              </div>
              <span class="metric-val text-indigo">{{ loading ? '...' : totalForms }}</span>
            </div>

            <div class="metric-row">
              <div class="d-flex align-center" style="gap: 10px;">
                <div class="mini-icon bg-blue-light">
                  <v-icon size="16" color="blue-darken-2">mdi-cloud-outline</v-icon>
                </div>
                <span class="metric-label">Drive Files</span>
              </div>
              <span class="metric-val text-blue">{{ loading ? '...' : totalFiles }}</span>
            </div>

            <div class="metric-row">
              <div class="d-flex align-center" style="gap: 10px;">
                <div class="mini-icon bg-emerald-light">
                  <v-icon size="16" color="emerald-darken-2">mdi-table-account</v-icon>
                </div>
                <span class="metric-label">Spreadsheets</span>
              </div>
              <span class="metric-val text-emerald">{{ loading ? '...' : totalSheets }}</span>
            </div>
          </div>

          <div class="sidebar-info-box mt-4">
            <p>
              <v-icon size="14" color="slate-500" class="mr-1">mdi-information-outline</v-icon>
              Pastikan akses modul disesuaikan dengan otorisasi akun login Anda.
            </p>
          </div>
        </div>
      </div>

      <!-- KOLOM KANAN: GRID MODUL UTAMA (DILENGKAPI SCROLL INTERNAL) -->
      <div class="enterprise-main">
        <div class="modules-header-row">
          <h3>Modul Layanan</h3>
          <span class="text-caption text-slate-500 font-weight-bold">Total: {{ allMenus.length }} Modul Tersedia</span>
        </div>

        <div class="modules-scroll-container">
          <div class="modules-grid-split">
            <div v-for="menu in allMenus" :key="menu.id" class="enterprise-card clickable"
              @click="handleMenuClick(menu.path, menu.is_active ?? true)">
              <div class="card-top">
                <div class="app-icon-box" :class="menu.icon_bg || 'indigo-bg'">
                  <v-icon color="white" size="20">{{ menu.icon ? menu.icon.replace(':', '-') : 'mdi-folder-outline'
                    }}</v-icon>
                </div>
                <span class="badge-status" :class="getChipClass(menu.icon_bg)">
                  {{ menu.badge_text || 'Aktif' }}
                </span>
              </div>

              <div class="card-body">
                <h4>{{ menu.name }}</h4>
                <p>{{ menu.description || 'Kelola operasional modul terkait dengan sistem terpusat.' }}</p>
              </div>

              <div class="card-footer-row">
                <span class="action-text">Buka Modul</span>
                <v-icon size="16" color="indigo-darken-2" class="arrow-icon">mdi-arrow-right</v-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- DIALOG NOTIFIKASI AKSES -->
    <v-dialog v-model="dialog.show" max-width="400" transition="dialog-bottom-transition">
      <v-card class="rounded-2xl pa-6 text-center elevation-6 border">
        <div class="modal-icon-container mb-4 mx-auto"
          :class="dialog.type === 'auth' ? 'bg-red-light' : 'bg-amber-light'">
          <v-icon :color="dialog.type === 'auth' ? 'error' : 'warning'" size="28">
            {{ dialog.type === 'auth' ? 'mdi-shield-lock-outline' : 'mdi-wrench-clock' }}
          </v-icon>
        </div>

        <h3 class="text-h6 font-weight-bold text-slate-900 mb-2">{{ dialog.title }}</h3>
        <p class="text-body-2 text-slate-600 mb-6 leading-relaxed">{{ dialog.message }}</p>

        <v-btn color="indigo-darken-2" block height="42" class="rounded-xl text-none font-weight-bold elevation-0"
          @click="dialog.show = false">
          Mengerti
        </v-btn>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue"
import { useRouter, useNuxtApp } from "#imports"

definePageMeta({ layout: "admin" })

const router = useRouter()
const { $api } = useNuxtApp()

const totalForms = ref(0)
const totalFiles = ref(0)
const totalSheets = ref(0)
const loading = ref(true)

const allMenus = ref([])
const allowedMenuPaths = ref([])

const dialog = reactive({
  show: false,
  type: '',
  title: '',
  message: ''
})

const getChipClass = (iconBg) => {
  if (!iconBg) return 'chip-indigo'
  const prefix = iconBg.replace('-bg', '')
  return `chip-${prefix}`
}

const handleMenuClick = (path, isFeatureExists = true) => {
  if (!isFeatureExists) {
    dialog.type = 'dev'
    dialog.title = 'Fitur Segera Hadir'
    dialog.message = 'Modul ini sedang dalam tahap pengembangan oleh tim EDP Surabaya.'
    dialog.show = true
    return
  }

  const isAuthorized = allowedMenuPaths.value.some(allowedPath => path.startsWith(allowedPath))

  if (allowedMenuPaths.value.length > 0 && !isAuthorized) {
    dialog.type = 'auth'
    dialog.title = 'Akses Ditolak (Unauthorized)'
    dialog.message = 'Anda tidak memiliki hak akses ke menu ini. Silakan hubungi administrator IT.'
    dialog.show = true
    return
  }

  router.push(path)
}

onMounted(async () => {
  try {
    const userMenuRes = await $api("/auth/menus", { method: "GET" }).catch(() => null)
    const userMenuList = userMenuRes?.data || userMenuRes
    if (Array.isArray(userMenuList)) {
      allowedMenuPaths.value = userMenuList.map(menu => menu.path)
    }

    const allMenuRes = await $api("/auth/menus/all", { method: "GET" }).catch(() => null)
    const allMenuList = allMenuRes?.data || allMenuRes
    if (Array.isArray(allMenuList)) {
      allMenus.value = allMenuList
    }
  } catch (err) {
    console.error("Gagal memuat data menu:", err)
  }

  try {
    const res = await $api("/workspace/dashboard", { method: "GET" }).catch(() => null)
    if (res) {
      totalForms.value = res.totalForms ?? 0
      totalFiles.value = res.totalFiles ?? 0
      totalSheets.value = res.totalSheets ?? 0
    }
  } catch (err) {
    console.error("Dashboard workspace error:", err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* KONTAINER UTAMA: DIKUNCI DI 95vh AGAR PAS DAN TIDAK ADA SCROLL LUAR */
.workspace-enterprise {
  max-width: 1200px;
  height: calc(95vh - 72px);
  margin: 0 auto;
  padding: 16px 24px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #1e293b;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

/* TOPBAR */
.enterprise-topbar {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  flex-shrink: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.01);
}



.title-group h1 {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 2px 0;
  letter-spacing: -0.4px;
}

.welcome-text {
  font-size: 12.5px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.topbar-clock {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  padding: 8px 14px;
  border-radius: 12px;
  display: flex;
  align-items: center;
}

/* LAYOUT SPLIT */
.enterprise-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
  flex-grow: 1;
  overflow: hidden;
  min-height: 0;
}

/* SIDEBAR KIRI */
.enterprise-sidebar {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.01);
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}

.sidebar-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.sidebar-card-header h3 {
  font-size: 14.5px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.metrics-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
}

.mini-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-indigo-light {
  background: #eef2ff;
}

.bg-blue-light {
  background: #eff6ff;
}

.bg-emerald-light {
  background: #ecfdf5;
}

.metric-label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.metric-val {
  font-size: 15px;
  font-weight: 800;
}

.text-indigo {
  color: #4f46e5;
}

.text-blue {
  color: #2563eb;
}

.text-emerald {
  color: #059669;
}

.sidebar-info-box {
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
  border: 1px dashed #cbd5e1;
  margin-top: auto;
  flex-shrink: 0;
}

.sidebar-info-box p {
  font-size: 11.5px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

/* KANAN: MAIN CONTENT */
.enterprise-main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modules-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.modules-header-row h3 {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

/* AREA SCROLL KHUSUS MODUL */
.modules-scroll-container {
  overflow-y: auto;
  flex-grow: 1;
  padding-right: 6px;
  padding-bottom: 10px;
}

.modules-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.modules-scroll-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.modules-grid-split {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

/* KARTU MODUL UTAMA */
.enterprise-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
}

.enterprise-card:hover {
  transform: translateY(-3px);
  border-color: #94a3b8;
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.05);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.app-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
}

/* Gradasi Warna Ikon Premium */
.indigo-bg {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
}

.blue-bg {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

.cyan-bg {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
}

.emerald-bg {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.teal-bg {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
}

.amber-bg {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.orange-bg {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

.purple-bg {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.pink-bg {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
}

.rose-bg {
  background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
}

.badge-status {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
}

.chip-indigo {
  background: #eef2ff;
  color: #4f46e5;
}

.chip-blue {
  background: #eff6ff;
  color: #2563eb;
}

.chip-cyan {
  background: #ecfeff;
  color: #0891b2;
}

.chip-emerald {
  background: #ecfdf5;
  color: #059669;
}

.chip-teal {
  background: #f0fdf4;
  color: #0d9488;
}

.chip-amber {
  background: #fffbeb;
  color: #d97706;
}

.chip-orange {
  background: #fff7ed;
  color: #ea580c;
}

.chip-purple {
  background: #f5f3ff;
  color: #7c3aed;
}

.chip-pink {
  background: #fdf2f8;
  color: #db2777;
}

.chip-rose {
  background: #fff1f2;
  color: #e11d48;
}

.card-body h4 {
  font-size: 14.5px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 3px 0;
}

.card-body p {
  font-size: 11.5px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.card-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.action-text {
  font-size: 11.5px;
  font-weight: 600;
  color: #4f46e5;
  transition: color 0.2s;
}

.enterprise-card:hover .action-text {
  color: #3730a3;
}

.enterprise-card:hover .arrow-icon {
  transform: translateX(3px);
}

.arrow-icon {
  transition: transform 0.2s ease;
}

.clickable {
  cursor: pointer;
}

.slide-up {
  opacity: 0;
  transform: translateY(10px);
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.delay-1 {
  animation-delay: 0.05s;
}

@keyframes slideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 900px) {
  .workspace-enterprise {
    height: auto;
    overflow: visible;
  }

  .enterprise-layout {
    grid-template-columns: 1fr;
    overflow: visible;
  }

  .modules-scroll-container {
    overflow-y: visible;
  }
}
</style>