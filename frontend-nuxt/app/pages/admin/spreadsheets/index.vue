<template>
  <div class="admin-dashboard">
    <!-- Header Admin -->
    <div class="admin-header">
      <div class="header-text">
        <h1>Daftar E-Spreadsheet</h1>
        <p>Kelola lembar kerja digital, berbagi data, dan kolaborasi spreadsheet.</p>
      </div>
      <button @click="openCreateModal" class="btn-primary">
        + Buat Spreadsheet Baru
      </button>
    </div>

    <!-- State Loading -->
    <div v-if="pending" class="loading-state">
      <div class="spinner"></div>
      <p>Memuat lembaran spreadsheet...</p>
    </div>

    <!-- State Empty -->
    <div v-else-if="!spreadsheets || spreadsheets.length === 0" class="empty-paper">
      <div class="paper-clip-icon">📊</div>
      <h3>Arsip Spreadsheet Kosong</h3>
      <p>Belum ada lembar kerja spreadsheet yang dibuat dalam sistem.</p>
    </div>

    <!-- Grid Dokumen Paper Clip Warna-Warni -->
    <div v-else class="forms-paper-grid">
      <div 
        v-for="(sheet, idx) in spreadsheets" 
        :key="sheet.id" 
        class="paper-card"
        :class="getCardTheme(idx)"
      >
        <!-- PAPER CLIP BESAR BERWARNA (Atas Kanan) -->
        <div class="paper-clip-large" title="Dokumen Spreadsheet">
          <svg viewBox="0 0 32 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 10V46C22 52.6274 16.6274 58 10 58C3.37258 58 -2 52.6274 -2 46V14C-2 9.58172 1.58172 6 6 6C10.4183 6 14 9.58172 14 14V42C14 44.2091 12.2091 46 10 46C7.79086 46 6 44.2091 6 42V18" 
              stroke="rgba(0,0,0,0.18)" stroke-width="4.5" stroke-linecap="round" transform="translate(2, 3)" />
            <path d="M22 10V46C22 52.6274 16.6274 58 10 58C3.37258 58 -2 52.6274 -2 46V14C-2 9.58172 1.58172 6 6 6C10.4183 6 14 9.58172 14 14V42C14 44.2091 12.2091 46 10 46C7.79086 46 6 44.2091 6 42V18" 
              class="clip-path-stroke" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>

        <!-- Aksen Pita Warna Atas & Garis Lipatan Kertas -->
        <div class="top-color-bar"></div>
        <div class="corner-fold"></div>

        <!-- Top Meta (Badge Pembuat & Tanggal) -->
        <div class="paper-top-meta">
          <div class="meta-badges">
            <span class="field-badge">
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
              </svg>
              {{ sheet.creator_name || 'Admin' }}
            </span>

            <span :class="['status-badge', sheet.is_shared ? 'status-open' : 'status-closed']">
              {{ sheet.is_shared ? '🌐 Shared' : '🔒 Private' }}
            </span>
          </div>

          <span class="paper-date">{{ formatDate(sheet.updated_at || sheet.created_at) }}</span>
        </div>

        <!-- Isi Judul & Deskripsi Dokumen -->
        <div class="paper-content">
          <h3 class="paper-title" :title="sheet.title">{{ sheet.title }}</h3>
          <p class="paper-desc">{{ sheet.description || 'Tidak ada deskripsi lembar kerja.' }}</p>
        </div>

        <!-- Tombol Aksi (4 Tombol: Salin, Buka, Unduh, Hapus) -->
        <div class="paper-actions-4">
          <button @click="copySheetLink(sheet.id)" class="btn-action btn-salin" title="Salin Tautan">
            📋 Salin
          </button>

          <NuxtLink :to="`/admin/spreadsheets/${sheet.id}`" class="btn-action btn-edit" title="Buka Editor Spreadsheet">
            ✏️ Buka
          </NuxtLink>

          <button @click="downloadSheetExcel(sheet)" class="btn-action btn-download" title="Unduh Rekap Excel">
            📥 Unduh
          </button>

          <button @click="promptDelete(sheet)" class="btn-action btn-close-form" title="Hapus Spreadsheet">
            🗑️ Hapus
          </button>
        </div>

      </div>
    </div>

    <!-- Modal Buat Spreadsheet Baru -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal-card">
        <h2>Buat Spreadsheet Baru</h2>
        <p>Masukkan judul dan keterangan lembar kerja Anda.</p>
        
        <div class="form-group mt-4 text-left">
          <label class="form-label">Judul Spreadsheet <span class="required">*</span></label>
          <input v-model="newSheet.title" type="text" placeholder="Contoh: Rekap Absensi Cabang SBY" class="form-control" />
        </div>

        <div class="form-group text-left mt-3">
          <label class="form-label">Deskripsi</label>
          <textarea v-model="newSheet.description" rows="2" placeholder="Keterangan singkat..." class="form-control"></textarea>
        </div>

        <div class="modal-actions mt-4">
          <button @click="showCreateModal = false" class="btn-secondary">Batal</button>
          <button @click="createSpreadsheet" :disabled="isCreating" class="btn-primary">
            {{ isCreating ? 'Menyimpan...' : 'Simpan & Buat' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Konfirmasi Hapus Kustom (Tanpa Pop-up Localhost) -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-card delete-confirm-card">
        <div class="delete-icon-wrap">⚠️</div>
        <h2>Hapus Spreadsheet?</h2>
        <p>Apakah Anda yakin ingin menghapus lembar kerja <b>"{{ sheetToDelete?.title }}"</b>? Tindakan ini tidak dapat dibatalkan.</p>
        
        <div class="modal-actions mt-4">
          <button @click="showDeleteModal = false" class="btn-secondary">Batal</button>
          <button @click="executeDelete" :disabled="isDeleting" class="btn-danger">
            {{ isDeleting ? 'Menghapus...' : 'Ya, Hapus' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Hidden Input untuk Fallback Copy -->
    <input ref="hiddenInputRef" type="text" class="sr-only" aria-hidden="true" />

    <!-- Toast Notification Floating -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast-floating">
        📋 {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useNuxtApp } from '#imports'
import * as XLSX from 'xlsx'

definePageMeta({
  layout: 'admin',
  middleware: ['auth-menu']
})

const router = useRouter()
const spreadsheets = ref<any[]>([])
const pending = ref(true)
const showCreateModal = ref(false)
const isCreating = ref(false)
const hiddenInputRef = ref<HTMLInputElement | null>(null)

// State untuk Modal Konfirmasi Hapus Kustom
const showDeleteModal = ref(false)
const sheetToDelete = ref<any>(null)
const isDeleting = ref(false)

const newSheet = reactive({
  title: '',
  description: ''
})

const toast = reactive({ show: false, message: '' })

const fetchSpreadsheets = async () => {
  pending.value = true
  try {
    const { $api } = useNuxtApp()
    const res: any = await $api('/spreadsheets')
    spreadsheets.value = res.data || res || []
  } catch (err: any) {
    if (err.status === 401 || err.statusCode === 401) {
      router.push('/login')
      return
    }
    showToast('Gagal memuat daftar spreadsheet')
  } finally {
    pending.value = false
  }
}

onMounted(async () => {
  await fetchSpreadsheets()
})

const themes = ['theme-indigo', 'theme-emerald', 'theme-amber', 'theme-rose', 'theme-cyan']
const getCardTheme = (index: number) => {
  return themes[index % themes.length]
}

const showToast = (msg: string) => {
  toast.message = msg
  toast.show = true
  setTimeout(() => toast.show = false, 2500)
}

const openCreateModal = () => {
  newSheet.title = ''
  newSheet.description = ''
  showCreateModal.value = true
}

const createSpreadsheet = async () => {
  if (!newSheet.title.trim()) {
    showToast('Judul spreadsheet wajib diisi!')
    return
  }

  isCreating.value = true
  try {
    const { $api } = useNuxtApp()
    const res: any = await $api('/spreadsheets', {
      method: 'POST',
      body: newSheet
    })

    showToast('Spreadsheet berhasil dibuat!')
    showCreateModal.value = false
    
    const createdId = res.data?.id || res.id
    if (createdId) {
      router.push(`/admin/spreadsheets/${createdId}`)
    } else {
      fetchSpreadsheets()
    }
  } catch (err: any) {
    showToast(err.data?.error || 'Gagal membuat spreadsheet')
  } finally {
    isCreating.value = false
  }
}

// FUNGSI UNDUH REKAP KE EXCEL (.xlsx)
const downloadSheetExcel = (sheet: any) => {
  try {
    const workbook = XLSX.utils.book_new()
    const content = sheet.data_content

    if (content && content.sheets && typeof content.sheets === 'object') {
      for (const sheetName in content.sheets) {
        const sheetData = content.sheets[sheetName]
        const rows = sheetData.rows || []
        const ws = XLSX.utils.aoa_to_sheet(rows)
        XLSX.utils.book_append_sheet(workbook, ws, sheetName)
      }
    } else if (content && Array.isArray(content.rows)) {
      const ws = XLSX.utils.aoa_to_sheet(content.rows)
      XLSX.utils.book_append_sheet(workbook, ws, 'Sheet1')
    } else {
      const ws = XLSX.utils.aoa_to_sheet([['']])
      XLSX.utils.book_append_sheet(workbook, ws, 'Sheet1')
    }

    const safeTitle = (sheet.title || 'Rekap_Spreadsheet').replace(/[^a-zA-Z0-9_-]/g, '_')
    XLSX.writeFile(workbook, `${safeTitle}.xlsx`)
    showToast('File rekap berhasil diunduh!')
  } catch (err) {
    showToast('Gagal mengunduh file rekap')
  }
}

const copySheetLink = (id: string | number) => {
  const url = `${window.location.origin}/admin/spreadsheets/${id}`
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Tautan spreadsheet berhasil disalin!')
    }).catch(() => fallbackCopyText(url))
  } else {
    fallbackCopyText(url)
  }
}

const fallbackCopyText = (text: string) => {
  if (hiddenInputRef.value) {
    hiddenInputRef.value.value = text
    hiddenInputRef.value.select()
    try {
      document.execCommand('copy')
      showToast('Tautan berhasil disalin!')
    } catch {
      showToast('Gagal menyalin tautan')
    }
  }
}

// Membuka modal konfirmasi hapus kustom
const promptDelete = (sheet: any) => {
  sheetToDelete.value = sheet
  showDeleteModal.value = true
}

// Eksekusi hapus setelah dikonfirmasi via modal kustom
const executeDelete = async () => {
  if (!sheetToDelete.value) return
  isDeleting.value = true
  try {
    const { $api } = useNuxtApp()
    await $api(`/spreadsheets/${sheetToDelete.value.id}`, { method: 'DELETE' })
    showToast('Spreadsheet berhasil dihapus')
    showDeleteModal.value = false
    sheetToDelete.value = null
    fetchSpreadsheets()
  } catch (err: any) {
    showToast('Gagal menghapus spreadsheet')
  } finally {
    isDeleting.value = false
  }
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
</script>

<style scoped>
.admin-dashboard {
  max-width: 1080px;
  margin: 0 auto;
  padding: 32px 20px 80px 20px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #1e293b;
}

.sr-only {
  position: absolute;
  width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0;
}

.admin-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 36px;
}
.admin-header h1 { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; }
.admin-header p { color: #64748b; font-size: 14px; margin: 0; }

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 12px 24px;
  border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 14px; border: none; cursor: pointer;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35); transition: all 0.2s ease;
}
.btn-primary:hover { transform: translateY(-2px); }

.forms-paper-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 32px;
}

.paper-card {
  position: relative; background: #ffffff; border-radius: 14px 14px 14px 2px; border: 1px solid #e2e8f0;
  padding: 28px 24px 20px 24px; display: flex; flex-direction: column; justify-content: space-between;
  box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.06); transition: all 0.3s ease;
}
.paper-card:hover { transform: translateY(-6px); box-shadow: 0 20px 32px -8px rgba(0, 0, 0, 0.12); }

.paper-clip-large {
  position: absolute; top: -17px; right: -2px; width: 40px; height: 56px; z-index: 10; pointer-events: none;
  filter: drop-shadow(0 8px 4px rgba(0,0,0,0.22));
}
.top-color-bar { position: absolute; top: 0; left: 0; right: 0; height: 6px; border-radius: 14px 14px 0 0; }
.corner-fold {
  position: absolute; bottom: 0; left: 0; width: 0; height: 0; border-style: solid;
  border-width: 0 0 16px 16px; border-color: transparent transparent #f1f5f9 #cbd5e1;
}

.theme-indigo .top-color-bar { background: linear-gradient(90deg, #6366f1, #4f46e5); }
.theme-indigo .clip-path-stroke { stroke: #4f46e5; }
.theme-indigo .field-badge { background: #e0e7ff; color: #3730a3; }

.theme-emerald .top-color-bar { background: linear-gradient(90deg, #10b981, #059669); }
.theme-emerald .clip-path-stroke { stroke: #059669; }
.theme-emerald .field-badge { background: #d1fae5; color: #065f46; }

.theme-amber .top-color-bar { background: linear-gradient(90deg, #f59e0b, #d97706); }
.theme-amber .clip-path-stroke { stroke: #d97706; }
.theme-amber .field-badge { background: #fef3c7; color: #92400e; }

.theme-rose .top-color-bar { background: linear-gradient(90deg, #f43f5e, #e11d48); }
.theme-rose .clip-path-stroke { stroke: #e11d48; }
.theme-rose .field-badge { background: #ffe4e6; color: #9f1239; }

.theme-cyan .top-color-bar { background: linear-gradient(90deg, #06b6d4, #0891b2); }
.theme-cyan .clip-path-stroke { stroke: #0891b2; }
.theme-cyan .field-badge { background: #cffafe; color: #155e75; }

.paper-top-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; padding-right: 40px; }
.meta-badges { display: flex; align-items: center; gap: 6px; }
.field-badge, .status-badge { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px; }
.status-open { background-color: #d1fae5; color: #065f46; }
.status-closed { background-color: #f1f5f9; color: #475569; }
.paper-date { font-size: 11px; color: #94a3b8; font-weight: 500; }

.paper-content { margin-bottom: 20px; }
.paper-title { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0; line-height: 1.4; }
.paper-desc { font-size: 12px; color: #64748b; margin: 0; line-height: 1.45; }

/* Grid 4 Kolom Tombol Aksi */
.paper-actions-4 {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; padding-top: 14px; border-top: 1px dashed #e2e8f0;
}
.btn-action {
  display: inline-flex; align-items: center; justify-content: center; gap: 2px; padding: 8px 2px;
  border-radius: 8px; font-size: 10px; font-weight: 700; cursor: pointer; text-decoration: none; transition: all 0.2s;
}
.btn-salin { background-color: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe; }
.btn-edit { background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
.btn-download { background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
.btn-close-form { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

.loading-state, .empty-paper {
  text-align: center; padding: 60px 20px; background: #ffffff; border-radius: 12px; border: 2px dashed #cbd5e1;
}
.spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #4f46e5; border-radius: 50%; margin: 0 auto 12px auto; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6);
  display: flex; align-items: center; justify-content: center; z-index: 999; backdrop-filter: blur(4px);
}
.modal-card { background: white; padding: 32px; border-radius: 16px; max-width: 440px; width: 90%; text-align: center; }
.form-group { margin-bottom: 14px; }
.form-label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; }
.form-control { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
.btn-secondary { background: #f3f4f6; color: #374151; padding: 10px 18px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; }
.btn-danger { background: #dc2626; color: white; padding: 10px 18px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; }
.btn-danger:hover { background: #b91c1c; }

.delete-icon-wrap {
  font-size: 32px;
  margin-bottom: 8px;
}
.delete-confirm-card h2 {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}
.delete-confirm-card p {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 20px;
  line-height: 1.5;
}

.toast-floating {
  position: fixed; bottom: 30px; right: 30px; background: #0f172a; color: white; padding: 12px 22px;
  border-radius: 10px; font-size: 14px; font-weight: 500; z-index: 99; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(20px); }
</style>