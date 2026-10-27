<template>
  <div class="monitor-page">
    
    <!-- INTERACTIVE CATEGORY CARDS (Atas langsung ringkasan kartu) -->
    <div class="overview-grid mb-5 slide-up">
      <div 
        class="interactive-card" 
        :class="{ active: selectedFilter === 'ALL' }"
        @click="filterByStatus('ALL')"
      >
        <div class="card-icon bg-slate-100 text-slate-700">
          <v-icon icon="mdi-server-network" size="20"></v-icon>
        </div>
        <div class="card-content">
          <span class="card-label">Total Nodes</span>
          <h3 class="card-count">{{ gatewayList.length }}</h3>
        </div>
        <v-icon icon="mdi-chevron-right" size="18" class="text-slate-400 ml-auto"></v-icon>
      </div>

      <div 
        class="interactive-card success-card" 
        :class="{ active: selectedFilter === 'ONLINE' }"
        @click="filterByStatus('ONLINE')"
      >
        <div class="card-icon bg-emerald-50 text-emerald-600">
          <v-icon icon="mdi-lan-connect" size="20"></v-icon>
        </div>
        <div class="card-content">
          <span class="card-label">Online Normal</span>
          <h3 class="card-count text-emerald-600">{{ onlineCount }}</h3>
        </div>
        <v-icon icon="mdi-chevron-right" size="18" class="text-slate-400 ml-auto"></v-icon>
      </div>

      <div 
        class="interactive-card warning-card" 
        :class="{ active: selectedFilter === 'LAG' }"
        @click="filterByStatus('LAG')"
      >
        <div class="card-icon bg-amber-50 text-amber-600">
          <v-icon icon="mdi-lan-pending" size="20"></v-icon>
        </div>
        <div class="card-content">
          <span class="card-label">High Latency</span>
          <h3 class="card-count text-amber-600">{{ lagCount }}</h3>
        </div>
        <v-icon icon="mdi-chevron-right" size="18" class="text-slate-400 ml-auto"></v-icon>
      </div>

      <div 
        class="interactive-card danger-card" 
        :class="{ active: selectedFilter === 'OFFLINE' }"
        @click="filterByStatus('OFFLINE')"
      >
        <div class="card-icon bg-rose-50 text-rose-600">
          <v-icon icon="mdi-lan-disconnect" size="20"></v-icon>
        </div>
        <div class="card-content">
          <span class="card-label">Offline / RTO</span>
          <h3 class="card-count text-rose-600">{{ offlineCount }}</h3>
        </div>
        <v-icon icon="mdi-chevron-right" size="18" class="text-slate-400 ml-auto"></v-icon>
      </div>
    </div>

    <!-- TABLE CONTAINER -->
    <v-card class="table-card rounded-2xl border elevation-0 slide-up delay-1">
      <v-data-table
        :headers="headers"
        :items="filteredGateways"
        :search="searchQuery"
        :loading="loading"
        class="clean-table"
        no-data-text="Tidak ada data gateway yang sesuai dengan filter"
      >
        <!-- Top Search Bar & Scan Button -->
      <!-- Top Search Bar & Scan Button -->
        <template v-slot:top>
          <div class="table-top-bar px-5 py-4 d-flex justify-space-between align-center flex-wrap" style="gap: 12px;">
              <div class="menu-description">
                <span class="text-subtitle-2 font-weight-bold text-slate-800 d-flex align-center" style="gap: 6px;">
                  <v-icon icon="mdi-router-wireless" size="18" color="indigo-darken-2"></v-icon>
                  Monitoring Gateway Stock Point
                </span>
              </div>
            <div class="d-flex align-center" style="gap: 14px; flex-wrap: wrap;">
              <!-- Keterangan Menu -->

              <v-divider vertical class="my-1 d-none d-md-flex"></v-divider>

              <v-text-field
                v-model="searchQuery"
                prepend-inner-icon="mdi-magnify"
                label="Cari S-Point, IP Gateway, atau area..."
                variant="outlined"
                density="compact"
                hide-details
                clearable
                style="min-width: 400px;"
                class="search-box rounded-lg bg-white"
              ></v-text-field>

              <v-chip v-if="selectedFilter !== 'ALL'" size="small" closable color="indigo" variant="tonal" @click:close="filterByStatus('ALL')">
                Filter: {{ selectedFilter }}
              </v-chip>
            </div>
            
            <div class="d-flex align-center" style="gap: 16px;">
              <div class="sync-info text-caption text-slate-500">
                Sinkronisasi: <span class="font-weight-bold text-slate-700">{{ lastSyncTime || 'Belum pernah' }}</span>
              </div>
              <v-btn
                prepend-icon="mdi-refresh"
                color="slate-900"
                variant="flat"
                class="rounded-xl px-4 text-none font-weight-bold text-white scan-btn"
                size="small"
                :loading="loading"
                @click="fetchMonitoringData"
              >
                Scan Network
              </v-btn>
            </div>
          </div>
        </template>

        <!-- Kode S-Point -->
        <template v-slot:item.kode_spoint="{ item }">
          <span class="font-weight-bold text-slate-800">{{ item.kode_spoint }}</span>
        </template>

        <!-- Nama Stock Point -->
        <template v-slot:item.nama_spoint="{ item }">
          <span class="font-weight-semibold text-slate-900">{{ item.nama_spoint }}</span>
        </template>

        <!-- IP Gateway -->
        <template v-slot:item.ip_gateway="{ item }">
          <span class="ip-text">{{ item.ip_gateway || '0.0.0.0' }}</span>
        </template>

        <!-- Area -->
        <template v-slot:item.area="{ item }">
          <span class="area-badge">{{ item.area || '-' }}</span>
        </template>

        <!-- Status Berwarna Pasti (Dipaksa Inline Color agar Terlihat) -->
        <template v-slot:item.status="{ item }">
          <div class="d-flex align-center" style="gap: 6px;">
            <v-icon 
              :icon="getStatusIcon(item.status)" 
              size="18" 
              :style="{ color: getStatusHexColor(item.status) }"
            ></v-icon>
            <span class="font-weight-bold" :style="{ color: getStatusHexColor(item.status), fontSize: '13px' }">
              {{ item.status || 'UNKNOWN' }}
            </span>
          </div>
        </template>

        <!-- Latency -->
        <template v-slot:item.latency="{ item }">
          <span class="font-weight-bold" :class="getLatencyColor(item.latency)">
            {{ item.latency || '-' }}
          </span>
        </template>

        <!-- Kolom Aksi Detail -->
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-information-outline"
            size="small"
            variant="text"
            color="slate-700"
            @click="openDetailModal(item)"
            title="Lihat Detail Perangkat"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- MODAL DETAIL PERANGKAT -->
    <v-dialog v-model="detailModal.show" max-width="480">
      <v-card class="rounded-2xl pa-6 elevation-4">
        <div class="d-flex justify-space-between align-center mb-4">
          <div class="d-flex align-center" style="gap: 10px;">
            <div class="modal-icon bg-indigo-50 text-indigo-700">
              <v-icon icon="mdi-router-wireless" size="20"></v-icon>
            </div>
            <div>
              <h3 class="text-subtitle-1 font-weight-bold text-slate-900 ma-0">Detail Telemetri Node</h3>
              <span class="text-caption text-slate-500">Informasi konektivitas gateway router</span>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="detailModal.show = false"></v-btn>
        </div>

        <div v-if="detailModal.item" class="detail-list">
          <div class="detail-row">
            <span class="d-label">Kode Stock Point</span>
            <span class="d-value font-weight-bold text-slate-800">{{ detailModal.item.kode_spoint }}</span>
          </div>
          <div class="detail-row">
            <span class="d-label">Nama Stock Point</span>
            <span class="d-value font-weight-semibold text-slate-900">{{ detailModal.item.nama_spoint }}</span>
          </div>
          <div class="detail-row">
            <span class="d-label">Area Operasional</span>
            <span class="d-value">{{ detailModal.item.area || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="d-label">Alamat IP Gateway</span>
            <span class="d-value ip-text">{{ detailModal.item.ip_gateway || 'Tidak diset' }}</span>
          </div>
          <div class="detail-row">
            <span class="d-label">Status Koneksi</span>
            <span class="d-value font-weight-bold" :style="{ color: getStatusHexColor(detailModal.item.status) }">
              <v-icon :icon="getStatusIcon(detailModal.item.status)" size="16" class="mr-1" :style="{ color: getStatusHexColor(detailModal.item.status) }"></v-icon>
              {{ detailModal.item.status }}
            </span>
          </div>
          <div class="detail-row">
            <span class="d-label">Latensi ICMP (RTT)</span>
            <span class="d-value font-weight-bold" :class="getLatencyColor(detailModal.item.latency)">
              {{ detailModal.item.latency }}
            </span>
          </div>
          <div class="detail-row">
            <span class="d-label">Waktu Pengecekan Terakhir</span>
            <span class="d-value text-slate-600">{{ detailModal.item.waktu }}</span>
          </div>
        </div>

        <div class="d-flex justify-end mt-5">
          <v-btn
            color="slate-900"
            variant="flat"
            class="text-none font-weight-bold rounded-xl px-5"
            @click="detailModal.show = false"
          >
            Tutup
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- TOAST -->
    <v-snackbar
      v-model="toast.show"
      :color="toast.color"
      location="top right"
      timeout="3000"
      elevation="2"
      rounded="pill"
    >
      <div class="d-flex align-center" style="gap: 8px;">
        <v-icon :icon="toast.icon" size="18"></v-icon>
        <span class="font-weight-medium text-body-2">{{ toast.message }}</span>
      </div>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useNuxtApp } from '#imports'
import { useAuth } from '~~/app/composables/useAuth'

definePageMeta({ 
  layout: 'admin',
  middleware: ['auth-menu']
})

const router = useRouter()
const { getToken } = useAuth()
const { $api } = useNuxtApp()

const gatewayList = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedFilter = ref('ALL')
const lastSyncTime = ref('')

const detailModal = reactive({
  show: false,
  item: null as any
})

const toast = reactive({
  show: false,
  message: '',
  color: 'success',
  icon: 'mdi-check-circle'
})

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.message = message
  toast.color = type === 'success' ? 'slate-900' : 'error'
  toast.icon = type === 'success' ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline'
  toast.show = true
}

const headers = [
  { title: 'Kode', key: 'kode_spoint', width: '90px' },
  { title: 'Stock Point', key: 'nama_spoint' },
  { title: 'IP Gateway', key: 'ip_gateway', width: '200px' },
  { title: 'Area', key: 'area', width: '200px' },
  { title: 'Status', key: 'status', width: '160px' },
  { title: 'Latency', key: 'latency', width: '100px' },
  { title: 'Aksi', key: 'actions', align: 'end' as const, sortable: false, width: '80px' }
]

const onlineCount = computed(() => gatewayList.value.filter(i => i.status === 'ONLINE').length)
const lagCount = computed(() => gatewayList.value.filter(i => i.status === 'ONLINE (LAG)').length)
const offlineCount = computed(() => gatewayList.value.filter(i => i.status === 'OFFLINE').length)

// Helper mapping ikon status jaringan sesuai permintaan
const getStatusIcon = (status: string) => {
  if (status === 'ONLINE') return 'mdi-lan-connect'
  if (status?.includes('LAG')) return 'mdi-lan-pending'
  return 'mdi-lan-disconnect'
}

// Helper warna hex langsung agar pasti berwarna
const getStatusHexColor = (status: string) => {
  if (status === 'ONLINE') return '#10b981' // Hijau Emerald
  if (status?.includes('LAG')) return '#f59e0b' // Kuning Amber
  return '#f43f5e' // Merah Rose
}

const filterByStatus = (status: string) => {
  selectedFilter.value = status
}

const filteredGateways = computed(() => {
  let list = gatewayList.value
  if (selectedFilter.value === 'ONLINE') {
    list = list.filter(i => i.status === 'ONLINE')
  } else if (selectedFilter.value === 'LAG') {
    list = list.filter(i => i.status === 'ONLINE (LAG)')
  } else if (selectedFilter.value === 'OFFLINE') {
    list = list.filter(i => i.status === 'OFFLINE')
  }
  return list
})

const getLatencyColor = (latency: string) => {
  if (!latency || latency === '-') return 'text-slate-400'
  const val = parseInt(latency)
  if (isNaN(val)) return 'text-slate-600'
  if (val > 300) return 'text-amber-600'
  if (val > 100) return 'text-orange-600'
  return 'text-emerald-600'
}

const openDetailModal = (item: any) => {
  detailModal.item = item
  detailModal.show = true
}

const fetchMonitoringData = async () => {
  loading.value = true
  try {
    const res: any = await $api('/monitor/ping', { method: 'GET' })
    gatewayList.value = res.data || res || []
    lastSyncTime.value = new Date().toLocaleTimeString()
    showToast('Pemindaian jaringan selesai!')
  } catch (err: any) {
    console.error("ERROR SAAT FETCH MONITORING:", err)
    const status = err.status || err.statusCode || err.response?.status
    if (status === 401 || status === 403) {
      showToast('Sesi habis, silakan login ulang.', 'error')
      setTimeout(() => router.push('/'), 1500)
      return
    }
    showToast('Gagal memuat data monitoring', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const token = getToken()
  if (!token) {
    router.push('/login')
    return
  }
  await fetchMonitoringData()
})
</script>

<style scoped>
.monitor-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 0 40px 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #0f172a;
}

.scan-btn {
  background-color: #0f172a !important;
}

/* Interactive Category Cards */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.interactive-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.interactive-card:hover {
  border-color: #cbd5e1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.interactive-card.active {
  border-color: #0f172a;
  background: #f8fafc;
  box-shadow: 0 0 0 2px #0f172a;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  display: block;
}

.card-count {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.success-card { border-left: 4px solid #10b981; }
.warning-card { border-left: 4px solid #f59e0b; }
.danger-card { border-left: 4px solid #f43f5e; }

/* Table Card */
.table-card {
  border: 1px solid #e2e8f0 !important;
  background: #ffffff !important;
}

.table-top-bar {
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.ip-text {
  font-family: monospace;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  background: #f1f5f9;
  padding: 3px 6px;
  border-radius: 4px;
}

.area-badge {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
}

/* Modal Detail */
.modal-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.d-label {
  color: #64748b;
  font-weight: 500;
}

/* Vuetify Table Customization */
.clean-table :deep(.v-data-table) {
  background: transparent !important;
}

.clean-table :deep(.v-data-table-header th) {
  font-weight: 700 !important;
  color: #475569 !important;
  background-color: #ffffff !important;
  text-transform: uppercase;
  font-size: 11px !important;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e2e8f0 !important;
}

.clean-table :deep(.v-data-table td) {
  border-bottom: 1px solid #f8fafc !important;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}

.slide-up {
  opacity: 0;
  transform: translateY(8px);
  animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.delay-1 { animation-delay: 0.08s; }

@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}
</style>