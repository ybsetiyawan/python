<template>
  <div class="stockpoint-management-page">
    
    <!-- TOP HEADER -->
    <div class="page-header slide-up">
      <div class="header-info">
        <h1>Master Stock Point</h1>
        <p>Kelola data master stock point, cabang, email, dan area operasional PT Indomarco Adi Prima.</p>
      </div>
      
      <!-- Tombol Aksi Header -->
      <div class="header-actions-group">
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-plus"
              color="indigo-darken-2"
              variant="flat"
              class="rounded-xl elevation-1"
              size="large"
              @click="openAddDialog"
            ></v-btn>
          </template>
          <span>Tambah Stock Point Baru</span>
        </v-tooltip>
      </div>
    </div>

    <!-- MAIN CARD TABLE CONTAINER -->
    <v-card class="rounded-2xl border elevation-0 slide-up delay-1">
      <v-data-table
        :headers="headers"
        :items="filteredStockPoints"
        :search="searchQuery"
        :loading="loading"
        class="custom-table"
        no-data-text="Belum ada data stock point sistem"
      >
        <!-- Custom Top Search Bar Slot untuk Data Table jika diperlukan, atau taruh di atas tabel -->
        <template v-slot:top>
          <div class="px-4 pt-4 pb-2 d-flex justify-space-between align-center flex-wrap" style="gap: 12px;">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              label="Cari S-Point, kode, atau area..."
              variant="outlined"
              density="compact"
              hide-details
              clearable
              style="max-width: 340px;"
              class="rounded-lg"
            ></v-text-field>
            <div class="text-caption font-weight-bold text-slate-600">
              Total: <strong>{{ filteredStockPoints.length }}</strong> S-Point
            </div>
          </div>
        </template>

        <!-- Kolom Plant -->
        <template v-slot:item.plant_cd="{ item }">
          <span class="badge-plant">{{ item.plant_cd }}</span>
        </template>

        <!-- Kolom Cabang -->
        <template v-slot:item.nama_cab="{ item }">
          <span class="font-weight-bold text-slate-900">{{ item.nama_cab }}</span>
        </template>

        <!-- Kolom Kode S-Point -->
        <template v-slot:item.kode_spoint="{ item }">
          <code class="px-2 py-1 rounded bg-slate-100 text-indigo-darken-2 text-caption font-weight-medium">
            {{ item.kode_spoint }}
          </code>
        </template>

        <!-- Kolom Nama Stock Point -->
        <template v-slot:item.nama_spoint="{ item }">
          <span class="font-weight-semibold text-slate-900">{{ item.nama_spoint }}</span>
        </template>

        <!-- Kolom Email -->
        <template v-slot:item.email="{ item }">
          <span class="text-slate-600 text-body-2">{{ item.email || '-' }}</span>
        </template>

        <!-- Kolom Area -->
        <template v-slot:item.area="{ item }">
          <span class="area-tag">{{ item.area || '-' }}</span>
        </template>

        <!-- Kolom Status -->
        <template v-slot:item.aktif="{ item }">
          <v-chip
            :color="item.aktif ? 'success' : 'grey'"
            size="small"
            class="font-weight-bold px-3"
            variant="flat"
          >
            {{ item.aktif ? 'Aktif' : 'Non-Aktif' }}
          </v-chip>
        </template>

        <!-- Kolom Aksi -->
        <template v-slot:item.actions="{ item }">
          <div class="d-flex align-center" style="gap: 4px;">
            <v-btn
              icon="mdi-pencil-outline"
              size="small"
              variant="text"
              color="indigo-darken-2"
              @click="openEditDialog(item)"
              title="Edit Stock Point"
            ></v-btn>
            <v-btn
              icon="mdi-delete-outline"
              size="small"
              variant="text"
              color="error"
              @click="confirmDelete(item)"
              title="Hapus Stock Point"
            ></v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- DIALOG FORM TAMBAH / EDIT STOCK POINT -->
    <v-dialog v-model="dialog.show" max-width="560" persistent scrollable>
      <v-card class="rounded-2xl pa-5 elevation-4">
        <div class="d-flex justify-space-between align-center mb-4">
          <h3 class="text-subtitle-1 font-weight-bold text-slate-900">
            {{ dialog.isEdit ? 'Edit Data Stock Point' : 'Tambah Stock Point Baru' }}
          </h3>
          <v-btn icon="mdi-close" variant="text" size="small" @click="dialog.show = false"></v-btn>
        </div>

        <v-form ref="formRef" @submit.prevent="saveStockPoint">
          <div class="d-flex mb-3" style="gap: 12px;">
            <div class="flex-grow-1">
              <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">Plant Code</label>
              <v-text-field
                v-model="form.plant_cd"
                placeholder="5217"
                variant="outlined"
                density="comfortable"
                :rules="[(v: string) => !!v || 'Plant wajib diisi']"
                hide-details="auto"
              ></v-text-field>
            </div>
            <div class="flex-grow-1">
              <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">Nama Cabang</label>
              <v-text-field
                v-model="form.nama_cab"
                placeholder="IAPSBY"
                variant="outlined"
                density="comfortable"
                :rules="[(v: string) => !!v || 'Cabang wajib diisi']"
                hide-details="auto"
              ></v-text-field>
            </div>
          </div>

          <div class="d-flex mb-3" style="gap: 12px;">
            <div class="flex-grow-1">
              <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">Kode S-Point</label>
              <v-text-field
                v-model="form.kode_spoint"
                :disabled="dialog.isEdit"
                placeholder="001"
                variant="outlined"
                density="comfortable"
                :rules="[(v: string) => !!v || 'Kode S-Point wajib diisi']"
                hide-details="auto"
              ></v-text-field>
            </div>
            <div class="flex-grow-1">
              <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">Nama Stock Point</label>
              <v-text-field
                v-model="form.nama_spoint"
                placeholder="SP CANDI"
                variant="outlined"
                density="comfortable"
                :rules="[(v: string) => !!v || 'Nama S-Point wajib diisi']"
                hide-details="auto"
              ></v-text-field>
            </div>
          </div>

          <div class="mb-3">
            <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">Alamat Email</label>
            <v-text-field
              v-model="form.email"
              type="email"
              placeholder="spsby-candi@indomarco.co.id"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
            ></v-text-field>
          </div>

          <div class="d-flex mb-3" style="gap: 12px;">
            <div class="flex-grow-1">
              <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">Area</label>
              <v-text-field
                v-model="form.area"
                placeholder="RUNGKUT"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              ></v-text-field>
            </div>
            <div class="flex-grow-1">
              <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">Status Keaktifan</label>
              <v-select
                v-model="form.aktif"
                :items="[{ title: 'Aktif', value: true }, { title: 'Non-Aktif', value: false }]"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              ></v-select>
            </div>
          </div>

          <div class="d-flex justify-end mt-5" style="gap: 8px;">
            <v-btn
              variant="text"
              color="slate-600"
              class="text-none font-weight-bold rounded-xl px-4"
              @click="dialog.show = false"
            >
              Batal
            </v-btn>
            <v-btn
              color="indigo-darken-2"
              type="submit"
              class="text-none font-weight-bold rounded-xl px-6 elevation-0"
              :loading="saving"
            >
              Simpan Data
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- DIALOG KONFIRMASI HAPUS (KUSTOM TANPA LOCALHOST) -->
    <v-dialog v-model="deleteDialog.show" max-width="360">
      <v-card class="rounded-2xl pa-5 text-center elevation-4">
        <div class="modal-icon-container bg-red-light mb-3 mx-auto">
          <v-icon color="error" size="26">mdi-alert-circle-outline</v-icon>
        </div>
        <h3 class="text-subtitle-1 font-weight-bold text-slate-900 mb-1">Hapus Stock Point Ini?</h3>
        <p class="text-body-2 text-slate-600 mb-5">
          Stock Point <strong class="text-slate-900">{{ deleteDialog.item?.nama_spoint }}</strong> ({{ deleteDialog.item?.kode_spoint }}) akan dihapus permanen dari sistem.
        </p>
        <div class="d-flex justify-center" style="gap: 8px;">
          <v-btn
            variant="outlined"
            class="flex-grow-1 rounded-xl text-none font-weight-bold"
            @click="deleteDialog.show = false"
          >
            Batal
          </v-btn>
          <v-btn
            color="error"
            class="flex-grow-1 rounded-xl text-none font-weight-bold elevation-0"
            :loading="deleting"
            @click="executeDelete"
          >
            Ya, Hapus
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- GLOBAL TOAST NOTIFICATION -->
    <v-snackbar
      v-model="toast.show"
      :color="toast.color"
      location="top right"
      timeout="3500"
      elevation="4"
      rounded="pill"
    >
      <div class="d-flex align-center" style="gap: 8px;">
        <v-icon :icon="toast.icon" size="20"></v-icon>
        <span class="font-weight-semibold text-body-2">{{ toast.message }}</span>
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

const stockPoints = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const searchQuery = ref('')

const toast = reactive({
  show: false,
  message: '',
  color: 'success',
  icon: 'mdi-check-circle'
})

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.message = message
  toast.color = type === 'success' ? 'indigo-darken-2' : 'error'
  toast.icon = type === 'success' ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline'
  toast.show = true
}

const headers = [
  { title: 'Plant', key: 'plant_cd', width: '90px' },
  { title: 'Cabang', key: 'nama_cab', width: '110px' },
  { title: 'Kode S-Point', key: 'kode_spoint', width: '120px' },
  { title: 'Nama Stock Point', key: 'nama_spoint' },
  { title: 'Email', key: 'email' },
  { title: 'Area', key: 'area', width: '140px' },
  { title: 'Status', key: 'aktif', width: '100px' },
  { title: 'Aksi', key: 'actions', align: 'end' as const, sortable: false, width: '100px' }
]

const dialog = reactive({
  show: false,
  isEdit: false
})

const form = reactive({
  plant_cd: '5217',
  nama_cab: 'IAPSBY',
  kode_spoint: '',
  nama_spoint: '',
  email: '',
  aktif: true,
  area: ''
})

const deleteDialog = reactive({
  show: false,
  item: null as any
})

// Fetch Data Stock Point dengan proteksi otorisasi jika di-bypass via URL
const fetchStockPoints = async () => {
  loading.value = true
  try {
    const res: any = await $api('/stock-points', { method: 'GET' })
    stockPoints.value = res.data || res || []
  } catch (err: any) {
    const status = err.status || err.statusCode || err.response?.status
    if (status === 401 || status === 403) {
      showToast('Akses Ditolak: Anda tidak memiliki otoritas ke halaman ini.', 'error')
      setTimeout(() => {
        router.push('/')
      }, 1500)
      return
    }
    const backendMessage = err?.data?.message || err?.data?.error || err?.message || 'Gagal memuat data stock point'
    showToast(backendMessage, 'error')
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
  await fetchStockPoints()
})

// Filter pencarian data
const filteredStockPoints = computed(() => {
  if (!searchQuery.value) return stockPoints.value
  const q = searchQuery.value.toLowerCase()
  return stockPoints.value.filter(item => 
    item.nama_spoint?.toLowerCase().includes(q) ||
    item.kode_spoint?.toLowerCase().includes(q) ||
    item.area?.toLowerCase().includes(q) ||
    item.email?.toLowerCase().includes(q) ||
    item.nama_cab?.toLowerCase().includes(q)
  )
})

const openAddDialog = () => {
  dialog.isEdit = false
  form.plant_cd = '5217'
  form.nama_cab = 'IAPSBY'
  form.kode_spoint = ''
  form.nama_spoint = ''
  form.email = ''
  form.aktif = true
  form.area = ''
  dialog.show = true
}

const openEditModal = (item: any) => {} // fallback

const openEditDialog = (item: any) => {
  dialog.isEdit = true
  form.plant_cd = item.plant_cd
  form.nama_cab = item.nama_cab
  form.kode_spoint = item.kode_spoint
  form.nama_spoint = item.nama_spoint
  form.email = item.email
  form.aktif = item.aktif
  form.area = item.area
  dialog.show = true
}

const closeModal = () => {
  dialog.show = false
}

// Proses Simpan (Create / Update) dengan proteksi otorisasi & feedback UI
const saveStockPoint = async () => {
  if (!form.kode_spoint || !form.nama_spoint) {
    showToast('Kode dan Nama S-Point wajib diisi!', 'error')
    return
  }

  saving.value = true
  try {
    if (dialog.isEdit) {
      await $api(`/stock-points/${form.kode_spoint}`, {
        method: 'PUT',
        body: form
      })
      showToast('Stock point berhasil diperbarui!')
    } else {
      await $api('/stock-points', {
        method: 'POST',
        body: form
      })
      showToast('Stock point baru berhasil ditambahkan!')
    }
    dialog.show = false
    await fetchStockPoints()
  } catch (err: any) {
    const status = err.status || err.statusCode || err.response?.status
    if (status === 401 || status === 403) {
      showToast('Akses Ditolak: Anda tidak memiliki otoritas melakukan aksi ini.', 'error')
    } else {
      const backendMessage = err?.data?.message || err?.data?.error || err?.message || 'Gagal menyimpan data stock point'
      showToast(backendMessage, 'error')
    }
  } finally {
    saving.value = false
  }
}

// Buka Modal Kustom Konfirmasi Hapus
const confirmDelete = (item: any) => {
  deleteDialog.item = item
  deleteDialog.show = true
}

// Eksekusi Hapus Data
const executeDelete = async () => {
  if (!deleteDialog.item) return
  deleting.value = true
  try {
    await $api(`/stock-points/${deleteDialog.item.kode_spoint}`, { method: 'DELETE' })
    deleteDialog.show = false
    showToast('Stock point berhasil dihapus!')
    await fetchStockPoints()
  } catch (err: any) {
    const status = err.status || err.statusCode || err.response?.status
    if (status === 401 || status === 403) {
      showToast('Akses Ditolak: Anda tidak memiliki otoritas untuk menghapus data.', 'error')
    } else {
      const backendMessage = err?.data?.message || err?.data?.error || err?.message || 'Gagal menghapus stock point'
      showToast(backendMessage, 'error')
    }
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.stockpoint-management-page {
  max-width: 1140px;
  margin: 0 auto;
  padding: 10px 0 40px 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #1e293b;
  box-sizing: border-box;
}

.stockpoint-management-page .page-header {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px 26px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px -2px rgba(0, 0, 0, 0.02);
}

.stockpoint-management-page .header-actions-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.stockpoint-management-page .header-info h1 {
  font-size: 19px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 2px 0;
  letter-spacing: -0.3px;
}

.stockpoint-management-page .header-info p {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.stockpoint-management-page .modal-icon-container {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stockpoint-management-page .bg-red-light { 
  background-color: #ffeeec; 
}

/* Badge Plant & Area */
.badge-plant {
  background: #eef2ff;
  color: #4f46e5;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}

.area-tag {
  background: #f1f5f9;
  color: #475569;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

/* Tabel Styling */
.stockpoint-management-page :deep(.v-data-table) {
  background: transparent !important;
}

.stockpoint-management-page :deep(.v-data-table-header th) {
  font-weight: 700 !important;
  color: #475569 !important;
  background-color: #f8fafc !important;
  text-transform: uppercase;
  font-size: 11px !important;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e2e8f0 !important;
}

.stockpoint-management-page :deep(.v-data-table td) {
  border-bottom: 1px solid #f1f5f9 !important;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
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
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 800px) {
  .stockpoint-management-page .page-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
  }
  .stockpoint-management-page .header-actions-group {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>