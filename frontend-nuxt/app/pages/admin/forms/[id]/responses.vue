<template>
  <div class="responses-admin-container">
    <div class="header-section">
      <div>
        <h1>Rekapitulasi Jawaban (Responses)</h1>
        <p class="subtitle">Form: <strong>{{ formTitle || 'Memuat...' }}</strong></p>
      </div>
      <div class="header-actions">
        <!-- Tombol Export Excel / CSV Komprehensif -->
        <button @click="exportToExcel" class="btn-export" :disabled="submissions.length === 0">
          📊 Export Excel
        </button>
        <NuxtLink to="/admin/forms" class="btn-back">← Kembali</NuxtLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="state-box">
      <div class="spinner"></div>
      <p>Memuat data jawaban...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="state-box error">
      <p>⚠️ {{ errorMessage }}</p>
      <button @click="fetchResponses" class="btn-retry">Coba Lagi</button>
    </div>

    <!-- Content / Table State -->
    <div v-else>
      <div class="stats-card">
        <span class="stat-label">Total Responden</span>
        <span class="stat-value">{{ submissions.length }}</span>
      </div>

      <!-- Empty State -->
      <div v-if="submissions.length === 0" class="state-box empty">
        <p>Belum ada jawaban yang masuk untuk formulir ini.</p>
      </div>

      <!-- Table Submissions -->
      <div v-else class="table-responsive">
        <table class="responses-table">
          <thead>
            <tr>
              <th class="col-action text-center">Aksi</th>
              <th>No</th>
              <th>Waktu Kirim</th>
              <th>Nama Pengisi</th>
              <th>Email</th>
              <!-- Kolom Dinamis menggunakan Label dari struktur form -->
              <th v-for="key in dynamicHeaders" :key="key">{{ getFieldLabel(key) }}</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(sub, index) in submissions" :key="sub.id">
              <!-- Tombol Icon Mata (Lihat Detail) di Posisi Kiri -->
              <td class="col-action text-center">
                <button @click="openDetail(sub)" class="btn-action-detail">
                  <span class="action-icon">👁️</span>
                  <span class="action-text">Detail</span>
                </button>
              </td>
              <td>{{ index + 1 }}</td>
              <td>{{ formatDate(sub.created_at) }}</td>
              <td>
                <span class="font-weight-semibold text-slate-900">{{ sub.user_name || 'Guest / Publik' }}</span>
              </td>
              <td>{{ sub.user_email || '-' }}</td>
              
              <!-- Isi Kolom Dinamis (Mendukung multi-file: Gambar atau PDF) -->
              <td v-for="key in dynamicHeaders" :key="key">
                <template v-if="getAttachmentsForTable(sub, key).length > 0">
                  <div class="table-thumb-group">
                    <div v-for="att in getAttachmentsForTable(sub, key)" :key="att.id">
                      <!-- Jika PDF -->
                      <a v-if="isPdfFile(att.file_path)" :href="getFileUrl(att.file_path)" target="_blank" class="file-pdf-link" title="Buka Dokumen PDF">
                        📄 PDF
                      </a>
                      <!-- Jika Gambar -->
                      <a v-else :href="getFileUrl(att.file_path)" target="_blank">
                        <img :src="getFileUrl(att.file_path)" class="table-img-thumb" :alt="att.original_filename" title="Klik untuk memperbesar" />
                      </a>
                    </div>
                  </div>
                </template>

                <!-- Jika file tunggal berupa PDF -->
                <template v-else-if="isPdfFile(parseResponses(sub.responses)[key])">
                  <a :href="getFileUrl(parseResponses(sub.responses)[key])" target="_blank" class="file-pdf-link">
                    📄 Lihat PDF
                  </a>
                </template>

                <!-- Jika file tunggal berupa Gambar -->
                <template v-else-if="isImageFile(parseResponses(sub.responses)[key])">
                  <a :href="getFileUrl(parseResponses(sub.responses)[key])" target="_blank">
                    <img :src="getFileUrl(parseResponses(sub.responses)[key])" class="table-img-thumb" alt="Lampiran" />
                  </a>
                </template>

                <template v-else>
                  {{ formatCellVal(parseResponses(sub.responses)[key], key) }}
                </template>
              </td>

              <td>
                <small class="text-muted">{{ sub.ip_address || 'N/A' }}</small>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Detail Submission -->
    <div v-if="selectedSubmission" class="modal-backdrop" @click.self="closeDetail">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h3>Detail Jawaban Responden</h3>
            <p class="modal-sub">Dikirim pada {{ formatDate(selectedSubmission.created_at) }}</p>
          </div>
          <button @click="closeDetail" class="btn-close">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Info Pengisi -->
          <div class="info-grid-box mb-4">
            <div class="info-item">
              <span class="info-title">Nama Pengisi</span>
              <span class="info-content">{{ selectedSubmission.user_name || 'Guest / Publik' }}</span>
            </div>
            <div class="info-item">
              <span class="info-title">Email</span>
              <span class="info-content">{{ selectedSubmission.user_email || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-title">IP Address</span>
              <span class="info-content">{{ selectedSubmission.ip_address || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-title">Status</span>
              <span class="status-badge">{{ selectedSubmission.status }}</span>
            </div>
          </div>

          <h4 class="section-heading">Jawaban Formulir</h4>
          <div class="responses-grid-cards">
            <div v-for="(val, key) in parseResponses(selectedSubmission.responses)" :key="key" class="response-card-item">
              <span class="resp-label">{{ getFieldLabel(key) }}</span>
              <div class="resp-value">
                <template v-if="Array.isArray(val)">{{ val.join(', ') }}</template>
                
                <!-- Lampiran per Field (Multi-file di Modal: Gambar atau PDF) -->
<!-- Lampiran per Field (Mendukung multi-file: Gambar atau PDF) -->
<template v-else-if="getAttachmentsByField(key).length > 0">
  <div class="attachment-thumb-grid">
    <div v-for="att in getAttachmentsByField(key)" :key="att.id" class="thumb-item">
      <!-- Jika PDF: Tampilkan Kotak Dokumen PDF -->
      <a v-if="isPdfFile(att.file_path)" :href="getFileUrl(att.file_path)" target="_blank" class="pdf-card-thumb" title="Klik untuk membuka PDF">
        <div class="pdf-card-icon">📄</div>
        <span class="pdf-card-label">PDF</span>
      </a>
      <!-- Jika Gambar: Tampilkan Thumbnail Gambar -->
      <template v-else>
        <a :href="getFileUrl(att.file_path)" target="_blank">
          <img :src="getFileUrl(att.file_path)" class="img-preview-thumb" :alt="att.original_filename" />
        </a>
      </template>
      <small class="thumb-filename" :title="att.original_filename">{{ att.original_filename }}</small>
    </div>
  </div>
</template>

<!-- Jika file tunggal berupa PDF -->
<template v-else-if="isPdfFile(val)">
  <div class="attachment-thumb-grid">
    <div class="thumb-item">
      <a :href="getFileUrl(val)" target="_blank" class="pdf-card-thumb" title="Klik untuk membuka PDF">
        <div class="pdf-card-icon">📄</div>
        <span class="pdf-card-label">PDF</span>
      </a>
      <small class="thumb-filename" :title="val.split('/').pop()">{{ val.split('/').pop() }}</small>
    </div>
  </div>
</template>

<!-- Jika file tunggal berupa Gambar -->
<template v-else-if="isImageFile(val)">
  <a :href="getFileUrl(val)" target="_blank">
    <img :src="getFileUrl(val)" class="img-preview-thumb" alt="Lampiran Gambar" />
  </a>
</template>

                <!-- Jika file tunggal berupa Gambar -->
                <template v-else-if="isImageFile(val)">
                  <a :href="getFileUrl(val)" target="_blank">
                    <img :src="getFileUrl(val)" class="img-preview-thumb" alt="Lampiran Gambar" />
                  </a>
                </template>

                <template v-else>{{ formatCellVal(val, key) }}</template>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeDetail" class="btn-close-modal">Tutup</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, useNuxtApp, useRuntimeConfig } from '#imports'
import { useAuth } from '~~/app/composables/useAuth'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()
const { getToken } = useAuth()
const { $api } = useNuxtApp()

const formId = route.params.id

const formTitle = ref('')
const formStructure = ref([]) 
const submissions = ref([])
const pending = ref(true)
const errorMessage = ref('')
const selectedSubmission = ref(null)

const dynamicHeaders = computed(() => {
  const keysSet = new Set()
  submissions.value.forEach(sub => {
    const parsed = parseResponses(sub.responses)
    Object.keys(parsed).forEach(k => keysSet.add(k))
  })
  return Array.from(keysSet)
})

const getFieldLabel = (fieldId) => {
  const found = formStructure.value.find(item => item.id === fieldId)
  if (found && found.label) {
    return found.label
  }
  return fieldId.replace(/_/g, ' ').toUpperCase()
}

const getAttachmentsForTable = (sub, fieldId) => {
  if (!sub || !sub.attachments) return []
  return sub.attachments.filter(att => att.field_id === fieldId)
}

const getAttachmentsByField = (fieldId) => {
  if (!selectedSubmission.value || !selectedSubmission.value.attachments) return []
  return selectedSubmission.value.attachments.filter(att => att.field_id === fieldId)
}

const formatCellVal = (val, fieldId) => {
  if (Array.isArray(val)) return val.join(', ')
  if (typeof val === 'object' && val !== null) return JSON.stringify(val)
  if (!val) return '-'

  const fieldConfig = formStructure.value.find(item => item.id === fieldId)
  if (fieldConfig && Array.isArray(fieldConfig.options) && fieldConfig.options.length > 0) {
    const matchedOption = fieldConfig.options.find(opt => opt.value === val)
    if (matchedOption && matchedOption.label) {
      return matchedOption.label
    }
  }

  return val
}

const checkAuthAndRedirect = () => {
  const token = getToken()
  if (!token) {
    router.push('/login')
    return false
  }
  return true
}

const fetchResponses = async () => {
  if (!checkAuthAndRedirect()) return

  pending.value = true
  errorMessage.value = ''
  try {
    const formRes = await $api(`/forms/${formId}`)
    const formData = formRes.data || formRes
    formTitle.value = formData.title || 'Formulir'
    formStructure.value = formData.structure || []

    const res = await $api(`/forms/${formId}/submissions`)
    const responseData = res.data || res
    submissions.value = responseData.submissions || []
  } catch (err) {
    if (err.status === 401 || err.statusCode === 401) {
      router.push('/login')
      return
    }
    console.error('Gagal memuat responses:', err)
    errorMessage.value = 'Gagal terhubung ke server atau data tidak ditemukan.'
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  if (checkAuthAndRedirect()) {
    fetchResponses()
  }
})

const openDetail = async (sub) => {
  if (!checkAuthAndRedirect()) return

  try {
    const res = await $api(`/forms/submissions/${sub.id}`)
    selectedSubmission.value = res.data || res
  } catch (err) {
    if (err.status === 401 || err.statusCode === 401) {
      router.push('/login')
      return
    }
    selectedSubmission.value = sub 
  }
}

const closeDetail = () => {
  selectedSubmission.value = null
}

const parseResponses = (responses) => {
  if (!responses) return {}
  if (typeof responses === 'string') {
    try { return JSON.parse(responses) } catch { return {} }
  }
  return responses
}

// Format Tanggal disesuaikan dengan zona waktu Asia/Jakarta (WIB) dan penanganan format database
const formatDate = (dateString) => {
  if (!dateString) return '-'
  
  let isoString = dateString
  if (typeof dateString === 'string' && dateString.includes(' ')) {
    isoString = dateString.replace(' ', 'T')
  }

  const date = new Date(isoString)
  if (isNaN(date.getTime())) return dateString

  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

// Cek apakah file berupa PDF
const isPdfFile = (val) => {
  if (typeof val !== 'string') return false
  return val.match(/\.pdf$/i) || val.toLowerCase().includes('.pdf')
}

// Cek apakah file berupa Gambar (Mengecualikan PDF)
const isImageFile = (val) => {
  if (typeof val !== 'string') return false
  if (isPdfFile(val)) return false
  return val.match(/\.(jpeg|jpg|gif|png|webp)$/i) || val.includes('/uploads/')
}

const getFileUrl = (filePath) => {
  if (!filePath) return '#'
  if (filePath.startsWith('http')) return filePath

  const cleanPath = filePath.startsWith('/') ? filePath : '/' + filePath
  
  const config = useRuntimeConfig()
  const fileBase = config.public.fileBase
  
  if (fileBase) {
    return `${fileBase.replace(/\/$/, '')}${cleanPath}`
  }
  
  const protocol = window.location.protocol
  const hostname = window.location.hostname
  return `${protocol}//${hostname}${cleanPath}`
}

const exportToExcel = () => {
  if (submissions.value.length === 0) return

  const headers = ['No', 'Waktu Kirim', 'Nama Pengisi', 'Email', ...dynamicHeaders.value.map(k => getFieldLabel(k)), 'IP Address']
  let csvContent = "data:text/csv;charset=utf-8,"
  csvContent += headers.map(h => `"${h}"`).join(",") + "\r\n"

  submissions.value.forEach((sub, index) => {
    const parsed = parseResponses(sub.responses)
    
    const rowValues = [
      index + 1,
      formatDate(sub.created_at),
      sub.user_name || 'Guest',
      sub.user_email || '-'
    ]

    dynamicHeaders.value.forEach(key => {
      const fieldAttachments = sub.attachments ? sub.attachments.filter(att => att.field_id === key) : []
      
      if (fieldAttachments.length > 0) {
        const urls = fieldAttachments.map(att => getFileUrl(att.file_path))
        rowValues.push(urls.join(', '))
      } else {
        const val = parsed[key]
        if (typeof val === 'string' && (val.includes('/uploads/') || val.match(/\.(jpeg|jpg|gif|png|webp|pdf)$/i))) {
          rowValues.push(getFileUrl(val))
        } else {
          rowValues.push(formatCellVal(val, key))
        }
      }
    })

    rowValues.push(sub.ip_address || '-' )

    const formattedRow = rowValues.map(val => `"${(val || '').toString().replace(/"/g, '""')}"`)
    csvContent += formattedRow.join(",") + "\r\n"
  })

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", `Laporan-Lengkap-Responses-${formId}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.responses-admin-container { padding: 30px; max-width: 1400px; margin: 0 auto; font-family: 'Inter', sans-serif; }
.header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.header-section h1 { font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
.subtitle { font-size: 14px; color: #64748b; }
.header-actions { display: flex; align-items: center; gap: 12px; }
.btn-back { font-size: 14px; color: #2563eb; text-decoration: none; font-weight: 500; }
.btn-export { background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-export:hover { background: #059669; }

.state-box { background: #fff; padding: 40px; text-align: center; border-radius: 12px; border: 1px solid #e2e8f0; color: #64748b; }
.spinner { width: 30px; height: 30px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }

.stats-card { background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px 20px; border-radius: 10px; margin-bottom: 20px; display: inline-block; }
.stat-label { display: block; font-size: 12px; color: #1e40af; font-weight: 600; text-transform: uppercase; }
.stat-value { font-size: 24px; font-weight: 700; color: #1e3a8a; }

.table-responsive { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow-x: auto; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.responses-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; white-space: nowrap; }
.responses-table th { background: #f8fafc; padding: 14px 16px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
.responses-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }

/* Styling Kolom Aksi di Kiri & Tombol Icon Mata */
.col-action { width: 90px; min-width: 90px; text-align: center; }

.btn-action-detail {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s ease;
}

.btn-action-detail:hover {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.action-icon { font-size: 14px; }
.action-text { font-size: 11px; font-weight: 600; }

/* Styling Thumbnail Gambar & PDF di Tabel */
.table-thumb-group { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; max-width: 250px; }
.table-img-thumb { width: 38px; height: 38px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1; transition: transform 0.2s; }
.table-img-thumb:hover { transform: scale(1.08); }

.file-pdf-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #1e293b;
  text-decoration: none;
  transition: background 0.2s;
}
.file-pdf-link:hover { background: #e2e8f0; color: #0f172a; }

.file-pdf-link-modal {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #1e40af;
  text-decoration: none;
  transition: background 0.2s;
}
.file-pdf-link-modal:hover { background: #dbeafe; }

/* Modal Styling */
.modal-backdrop { 
  position: fixed; 
  top: 0; 
  left: 0; 
  width: 100vw; 
  height: 100vh; 
  background: rgba(0, 0, 0, 0.6); 
  backdrop-filter: blur(4px); 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  z-index: 99999; 
  padding: 20px; 
  box-sizing: border-box; 
}

.modal-card { 
  background: #fff; 
  width: 100%; 
  max-width: 800px; 
  border-radius: 16px; 
  overflow: hidden; 
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35); 
  display: flex; 
  flex-direction: column; 
  max-height: 90vh; 
  margin: auto;
}

.modal-header { padding: 20px 24px; background: #f8fafc; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; }
.modal-header h3 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0; }
.modal-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
.btn-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #64748b; line-height: 1; }
.modal-body { padding: 24px; overflow-y: auto; flex: 1; background: #fafafa; }

/* Grid Informasi Responden */
.info-grid-box { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; background: #fff; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
.info-item { display: flex; flex-direction: column; }
.info-title { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 2px; }
.info-content { font-size: 14px; font-weight: 600; color: #1e293b; }
.status-badge { display: inline-block; background: #ecfdf5; color: #059669; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; width: fit-content; text-transform: uppercase; }

.section-heading { font-size: 15px; font-weight: 700; color: #1e293b; margin: 20px 0 12px 0; }

.responses-grid-cards { display: grid; grid-template-columns: 1fr; gap: 10px; }
.response-card-item { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; }
.resp-label { font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px; }
.resp-value { font-size: 14px; color: #0f172a; word-break: break-word; }
.img-preview-thumb { width: 110px; height: 110px; border-radius: 8px; border: 1px solid #cbd5e1; object-fit: cover; display: block; }
.attachment-thumb-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px; }
.thumb-item { display: flex; flex-direction: column; width: 110px; }
.thumb-filename { font-size: 10px; color: #64748b; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.modal-footer { padding: 16px 24px; background: #fff; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; }
.btn-close-modal { background: #334155; color: white; border: none; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-close-modal:hover { background: #1e293b; }

/* Styling Kotak Kartu PDF di Modal (Menyesuaikan ukuran .img-preview-thumb) */
.pdf-card-thumb {
  width: 110px;
  height: 110px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.pdf-card-thumb:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  transform: scale(1.03);
}

.pdf-card-icon {
  font-size: 36px;
  margin-bottom: 4px;
}

.pdf-card-label {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
}
</style>