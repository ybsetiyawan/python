<template>
  <div class="workspace-dashboard">
    
    <!-- TOP CLEAN HEADER -->
    <div class="dashboard-header slide-up">
      <div class="header-content">
        <h1>EDPSBY Workspace</h1>
        <p class="welcome-text">
          Selamat datang di <strong>EDPSBY Workspace</strong>, ruang kerja internal PT Indomarco Adi Prima Cabang Surabaya. 
          Pusat kendali operasional terpadu untuk mengelola formulir cabang, repositori berkas, dan analitik data harian secara efisien.
        </p>
      </div>

      <!-- METRICS COUNTER CARD -->
      <div class="metrics-wrapper">
        <div class="metric-box">
          <span class="metric-value text-indigo">{{ loading ? '...' : totalForms }}</span>
          <span class="metric-name">Total Forms</span>
        </div>
        <div class="metric-separator"></div>
        <div class="metric-box">
          <span class="metric-value text-blue">{{ loading ? '...' : totalFiles }}</span>
          <span class="metric-name">Drive Files</span>
        </div>
        <div class="metric-separator"></div>
        <div class="metric-box">
          <span class="metric-value text-emerald">{{ loading ? '...' : totalSheets }}</span>
          <span class="metric-name">Spreadsheet</span>
        </div>
      </div>
    </div>

    <!-- SECTION TITLE -->
    <div class="section-title slide-up delay-1">
      <h3>Modul Layanan Utama</h3>
      <span>Pilih modul sistem operasional perusahaan</span>
    </div>

    <!-- MODULES LIGHT GRID (Dynamic from Database) -->
    <div class="modules-grid slide-up delay-2">
      
      <div 
        v-for="menu in allMenus" 
        :key="menu.id" 
        class="app-card clickable" 
        @click="handleMenuClick(menu.path, menu.is_active ?? true)"
      >
        <div class="card-top-row">
          <!-- Dinamis mengambil kelas warna background ikon dari database -->
          <div class="app-icon-wrap" :class="menu.icon_bg || 'indigo-bg'">
            <v-icon color="white" size="24">{{ menu.icon ? menu.icon.replace(':', '-') : 'mdi-folder-outline' }}</v-icon>
          </div>
          <!-- Dinamis teks dan warna chip diselaraskan dengan tema warna/icon_bg -->
          <span class="status-chip" :class="getChipClass(menu.icon_bg)">{{ menu.badge_text || 'Modul Utama' }}</span>
        </div>
        <div class="card-main">
          <h3>{{ menu.name }}</h3>
          <!-- Dinamis deskripsi dari database -->
          <p>{{ menu.description || 'Kelola operasional modul terkait dengan sistem terpusat.' }}</p>
        </div>
        <div class="card-bottom-row">
          <span class="action-label">Buka Aplikasi</span>
          <v-icon size="18" color="indigo-darken-2" class="nav-arrow">mdi-arrow-right</v-icon>
        </div>
      </div>

    </div>

    <!-- FOOTER -->
    <div class="dashboard-footer slide-up delay-3">
      <span>EDPSBY System &copy; 2026</span>
      <span class="dot-separator">&bull;</span>
      <span>PT Indomarco Adi Prima Surabaya</span>
    </div>

    <!-- MODAL NOTIFIKASI AKSES & PENGEMBANGAN -->
    <v-dialog v-model="dialog.show" max-width="400" transition="dialog-bottom-transition">
      <v-card class="rounded-2xl pa-6 text-center elevation-6">
        <div class="modal-icon-container mb-4" :class="dialog.type === 'auth' ? 'bg-red-light' : 'bg-amber-light'">
          <v-icon 
            :color="dialog.type === 'auth' ? 'error' : 'warning'" 
            size="32"
          >
            {{ dialog.type === 'auth' ? 'mdi-lock-alert' : 'mdi-hammer-wrench' }}
          </v-icon>
        </div>

        <h3 class="text-h6 font-weight-bold text-slate-900 mb-2">{{ dialog.title }}</h3>
        <p class="text-body-2 text-slate-600 mb-6 leading-relaxed">{{ dialog.message }}</p>

        <v-btn 
          color="indigo-darken-2" 
          block 
          height="42"
          class="rounded-xl text-none font-weight-bold elevation-0" 
          @click="dialog.show = false"
        >
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

// Fungsi untuk mencocokkan kelas chip agar warnanya senada dengan icon_bg
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
    dialog.message = 'Anda tidak memiliki hak akses ke menu ini. Silakan hubungi administrator IT untuk penambahan permission.'
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
.workspace-dashboard {
  max-width: 1140px;
  margin: 0 auto;
  padding: 36px 24px 60px 24px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #1e293b;
  background-color: #f8fafc;
  min-height: 100vh;
}

.dashboard-header {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  padding: 32px 36px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
  margin-bottom: 36px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.02);
}

.header-content { flex: 1; }

.system-badge {
  background: #eef2ff;
  color: #4f46e5;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  margin-bottom: 12px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.header-content h1 {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.welcome-text {
  font-size: 13.5px;
  color: #475569;
  margin: 0;
  line-height: 1.6;
}

.metrics-wrapper {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 18px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.metric-box { text-align: center; }

.metric-value {
  font-size: 22px;
  font-weight: 800;
  display: block;
}

.text-indigo { color: #4f46e5; }
.text-blue { color: #2563eb; }
.text-emerald { color: #059669; }

.metric-name {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-separator {
  width: 1px;
  height: 30px;
  background: #e2e8f0;
}

.section-title { margin-bottom: 20px; }

.section-title h3 {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 2px 0;
}

.section-title span {
  font-size: 13px;
  color: #64748b;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
  gap: 22px;
  margin-bottom: 40px;
}

.app-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 26px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
  position: relative;
}

.app-card:hover {
  transform: translateY(-4px);
  border-color: #cbd5e1;
  box-shadow: 0 16px 30px -10px rgba(0, 0, 0, 0.06);
}

.card-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.app-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 12px -3px rgba(0, 0, 0, 0.08);
}

/* Gradasi Warna Ikon */
.indigo-bg { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
.blue-bg { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
.cyan-bg { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); }
.emerald-bg { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.teal-bg { background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); }
.amber-bg { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.orange-bg { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
.purple-bg { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
.pink-bg { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); }
.rose-bg { background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); }

.status-chip {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
  letter-spacing: 0.3px;
}

/* Tema Warna Chip / Badge yang Selaras dengan Latar Ikon */
.chip-indigo { background: #eef2ff; color: #4f46e5; }
.chip-blue { background: #eff6ff; color: #2563eb; }
.chip-cyan { background: #ecfeff; color: #0891b2; }
.chip-emerald { background: #ecfdf5; color: #059669; }
.chip-teal { background: #f0fdf4; color: #0d9488; }
.chip-amber { background: #fffbeb; color: #d97706; }
.chip-orange { background: #fff7ed; color: #ea580c; }
.chip-purple { background: #f5f3ff; color: #7c3aed; }
.chip-pink { background: #fdf2f8; color: #db2777; }
.chip-rose { background: #fff1f2; color: #e11d48; }

.card-main h3 {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
}

.card-main p {
  font-size: 13px;
  color: #64748b;
  line-height: 1.55;
  margin: 0;
}

.card-bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.action-label {
  font-size: 13px;
  font-weight: 600;
  color: #4f46e5;
  transition: color 0.2s;
}

.app-card:hover .action-label { color: #3730a3; }
.nav-arrow { transition: transform 0.2s ease; }
.app-card:hover .nav-arrow { transform: translateX(4px); }

.dashboard-footer {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  border-top: 1px dashed #cbd5e1;
  padding-top: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.dot-separator { font-size: 16px; line-height: 0; }
.clickable { cursor: pointer; }

.slide-up {
  opacity: 0;
  transform: translateY(12px);
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.delay-1 { animation-delay: 0.05s; }
.delay-2 { animation-delay: 0.1s; }
.delay-3 { animation-delay: 0.15s; }

@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 900px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 24px;
  }
  .metrics-wrapper {
    width: 100%;
    justify-content: space-around;
  }
}
</style>