<template>
  <div class="responses-admin-container">
    <div class="header-section">
      <div>
        <h1>Rekapitulasi Jawaban (Responses)</h1>
        <p class="subtitle">Form: <strong>{{ formTitle || 'Memuat...' }}</strong></p>
      </div>
      <NuxtLink to="/admin/forms" class="btn-back">← Kembali ke Daftar Form</NuxtLink>
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
              <th>No</th>
              <th>Waktu Kirim</th>
              <th>IP Address / User Agent</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(sub, index) in submissions" :key="sub.id">
              <td>{{ index + 1 }}</td>
              <td>{{ formatDate(sub.created_at) }}</td>
              <td>
                <small class="text-muted">{{ sub.ip_address || 'N/A' }}</small>
              </td>
              <td>
                <button @click="openDetail(sub)" class="btn-detail">Lihat Detail</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Detail Submission -->
    <div v-if="selectedSubmission" class="modal-backdrop" @click.self="closeDetail">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Detail Jawaban Responden</h3>
          <button @click="closeDetail" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <p class="meta-info">Waktu: {{ formatDate(selectedSubmission.created_at) }}</p>
          
          <hr class="divider" />

          <!-- Render Isian Responses (JSONB) -->
          <div class="responses-list">
            <div v-for="(val, key) in parseResponses(selectedSubmission.responses)" :key="key" class="response-item">
              <span class="resp-key">{{ formatFieldLabel(key) }}:</span>
              <span class="resp-val">
                <template v-if="Array.isArray(val)">{{ val.join(', ') }}</template>
                <template v-else>{{ val || '-' }}</template>
              </span>
            </div>
          </div>

          <!-- Render Lampiran File Jika Ada -->
          <div v-if="selectedSubmission.attachments && selectedSubmission.attachments.length > 0" class="attachments-section">
            <h4>Lampiran File:</h4>
            <ul>
              <li v-for="att in selectedSubmission.attachments" :key="att.id">
                <a :href="getFileUrl(att.file_path)" target="_blank" class="file-link">
                  📎 {{ att.original_filename }} ({{ formatBytes(att.file_size) }})
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, useNuxtApp } from '#imports'
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
const submissions = ref([])
const pending = ref(true)
const errorMessage = ref('')
const selectedSubmission = ref(null)

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
    const res = await $api(`/forms/${formId}/submissions`)
    const responseData = res.data || res
    formTitle.value = responseData.form_title || 'Formulir'
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

const formatFieldLabel = (key) => {
  return key
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Fungsi untuk mengarahkan URL file menggunakan basis URL dinamis dari runtime config atau asal window
const getFileUrl = (filePath) => {
  if (!filePath) return '#'
  if (filePath.startsWith('http')) return filePath
  
  const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || 'http://localhost:8090'
  
  return `${baseURL.replace(/\/api\/?$/, '')}/${cleanPath}`
}
</script>

<style scoped>
.responses-admin-container { padding: 30px; max-width: 1000px; margin: 0 auto; font-family: 'Inter', sans-serif; }
.header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.header-section h1 { font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
.subtitle { font-size: 14px; color: #64748b; }
.btn-back { font-size: 14px; color: #2563eb; text-decoration: none; font-weight: 500; }

.state-box { background: #fff; padding: 40px; text-align: center; border-radius: 12px; border: 1px solid #e2e8f0; color: #64748b; }
.spinner { width: 30px; height: 30px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }

.stats-card { background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px 20px; border-radius: 10px; margin-bottom: 20px; display: inline-block; }
.stat-label { display: block; font-size: 12px; color: #1e40af; font-weight: 600; text-transform: uppercase; }
.stat-value { font-size: 24px; font-weight: 700; color: #1e3a8a; }

.table-responsive { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
.responses-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
.responses-table th { background: #f8fafc; padding: 12px 16px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
.responses-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #334155; }
.btn-detail { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; font-size: 13px; cursor: pointer; color: #334155; font-weight: 500; }
.btn-detail:hover { background: #e2e8f0; }

/* Modal Styling */
.modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 100; }
.modal-content { background: #fff; width: 100%; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
.modal-header { padding: 16px 20px; background: #f8fafc; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; }
.modal-header h3 { font-size: 16px; font-weight: 600; color: #1e293b; }
.btn-close { background: none; border: none; font-size: 20px; cursor: pointer; color: #64748b; }
.modal-body { padding: 20px; max-height: 70vh; overflow-y: auto; }
.meta-info { font-size: 13px; color: #64748b; margin-bottom: 12px; }
.divider { border: 0; border-top: 1px solid #e2e8f0; margin: 12px 0; }
.response-item { margin-bottom: 10px; font-size: 14px; }
.resp-key { font-weight: 600; color: #475569; display: inline-block; width: 150px; }
.resp-val { color: #1e293b; }
.attachments-section { margin-top: 20px; background: #f8fafc; padding: 12px; border-radius: 8px; }
.attachments-section h4 { font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #334155; }
.file-link { color: #2563eb; text-decoration: none; font-size: 13px; }
.file-link:hover { text-decoration: underline; }
</style>