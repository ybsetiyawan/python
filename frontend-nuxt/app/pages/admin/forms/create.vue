<template>
  <div class="builder-wrapper">
    <!-- Toast Notification (Melayang di kanan atas) -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast-notification" :class="toast.type">
        <div class="toast-icon">
          <span v-if="toast.type === 'error'">⚠️</span>
          <span v-else-if="toast.type === 'success'">✅</span>
          <span v-else>ℹ️</span>
        </div>
        <div class="toast-content">
          <span class="toast-title">{{ toast.title }}</span>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
        <button class="toast-close" @click="toast.show = false">✕</button>
      </div>
    </Transition>

    <div class="builder-container">
      <!-- Card 1: Header & Informasi Master Form -->
      <div class="builder-card main-card">
        <div class="card-accent-bar"></div>
        <div class="builder-header">
          <h1>Buat Form Baru</h1>
          <p>Atur field form sesuai kebutuhan (Radio, Checkbox, Text, File, dll).</p>
        </div>

        <div class="form-section">
          <div class="form-group">
            <label class="form-label">Judul Form <span class="required">*</span></label>
            <input 
              ref="titleInputRef"
              v-model="formMeta.title" 
              type="text" 
              placeholder="Contoh: Formulir Permintaan Ban Baru" 
              class="form-control title-input"
              :class="{ 'is-invalid': titleError, 'shake-anim': isShaking }"
              @input="clearTitleError"
            />
            <!-- Pesan Error Validasi di Bawah Input -->
            <Transition name="fade">
              <span v-if="titleError" class="error-text">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                </svg>
                {{ titleError }}
              </span>
            </Transition>
          </div>
          <div class="form-group">
            <label class="form-label">Deskripsi Form</label>
            <textarea 
              v-model="formMeta.description" 
              rows="2" 
              placeholder="Tuliskan petunjuk pengisian..." 
              class="form-control"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Card 2: Daftar Field -->
      <div class="builder-card">
        <div class="section-title">
          <div>
            <h2>Struktur Field</h2>
            <span class="field-count-badge">{{ fields.length }} Field dikonfigurasi</span>
          </div>
          <button type="button" class="btn-primary-small" @click="addField">
            <span class="icon">+</span> Tambah Field
          </button>
        </div>

        <div v-if="fields.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <p>Belum ada field yang dibuat.</p>
          <button type="button" class="btn-outline" @click="addField">+ Tambah Field Pertama</button>
        </div>

        <div v-for="(field, index) in fields" :key="field._key || index" class="field-item-card">
          <div class="field-item-header">
            <div class="field-header-left">
              <span class="drag-handle">⋮⋮</span>
              <span class="field-number">#{{ index + 1 }}</span>
              <span class="field-type-tag">{{ getFieldTypeName(field.type) }}</span>
            </div>
            <button type="button" class="btn-delete" @click="removeField(index)" title="Hapus Field">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
              </svg>
              Hapus
            </button>
          </div>

          <div class="field-grid">
            <div class="form-group">
              <label class="form-label">Label Field <span class="required">*</span></label>
              <input 
                v-model="field.label" 
                type="text" 
                class="form-control" 
                @input="autoGenerateFieldId(field)" 
                placeholder="Masukkan nama label..." 
              />
            </div>

            <div class="form-group">
              <label class="form-label">Field ID / Key DB (Otomatis)</label>
              <input 
                v-model="field.id" 
                type="text" 
                class="form-control code-input readonly-input" 
                readonly 
              />
            </div>

            <div class="form-group">
              <label class="form-label">Tipe Field <span class="required">*</span></label>
              <select v-model="field.type" class="form-control" @change="handleTypeChange(field)">
                <option value="text">Short Text (Input Biasa)</option>
                <option value="textarea">Long Text (Textarea)</option>
                <option value="number">Angka</option>
                <option value="date">Tanggal</option>
                <option value="radio">Pilihan Tunggal (Radio Button)</option>
                <option value="checkbox">Pilihan Ganda (Checkbox Multi)</option>
                <option value="select">Dropdown (Select)</option>
                <option value="file">Upload File / Lampiran</option>
              </select>
            </div>
          </div>

          <!-- Setting Khusus Upload File -->
          <div v-if="field.type === 'file'" class="file-config-box">
            <label class="toggle-switch">
              <input type="checkbox" v-model="field.allowMultiple" />
              <span class="slider"></span>
            </label>
            <div class="toggle-text">
              <strong>Izinkan Upload Multi-File (Lebih dari 1 file)</strong>
              <p>Jika diaktifkan, user bisa mengunggah beberapa file dalam 1 pertanyaan ini.</p>
            </div>
          </div>

          <!-- Options Builder (Radio / Checkbox / Select) -->
          <div v-if="['select', 'radio', 'checkbox'].includes(field.type)" class="options-builder">
            <div class="options-header">
              <label class="form-label">Daftar Pilihan / Opsi <span class="required">*</span></label>
              <div class="options-header-actions">
                <!-- Tombol Pintasan Ambil Data Stock Point -->
                <button type="button" class="btn-small-master" @click="loadStockPointsIntoField(field)">
                  🏢 Ambil dari Master Stock Point
                </button>
                <button type="button" class="btn-small-add" @click="addOption(field)">+ Tambah Opsi</button>
              </div>
            </div>
            
            <div v-for="(opt, optIdx) in field.options" :key="optIdx" class="option-row">
              <input 
                v-model="opt.label" 
                type="text" 
                placeholder="Label Opsi" 
                class="form-control" 
                @input="autoGenerateOptionValue(opt)" 
              />
              <input 
                v-model="opt.value" 
                type="text" 
                placeholder="Value DB" 
                class="form-control code-input readonly-input" 
                readonly 
              />
              <button type="button" class="btn-opt-delete" @click="removeOption(field, optIdx)">✕</button>
            </div>
          </div>
        </div>

        <!-- Tombol Tambah Field di Bawah -->
        <div v-if="fields.length > 0" class="bottom-add-container">
          <button type="button" class="btn-add-block" @click="addField">
            + Tambah Field Baru
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="builder-actions">
        <button type="button" class="btn-submit" :disabled="isSaving" @click="saveForm">
          {{ isSaving ? 'Menyimpan Form...' : 'Simpan Form & Buat Link' }}
        </button>
      </div>
    </div>

    <!-- Modal Success -->
    <div v-if="createdFormId" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-icon">🎉</div>
        <h2>Form Berhasil Dibuat!</h2>
        <p>Formulir Anda siap digunakan. Silakan salin link berikut:</p>
        
        <div class="link-box">
          <input ref="linkInputRef" type="text" readonly :value="getPublicLink(createdFormId)" class="form-control code-input" />
          <button @click="copyLink(getPublicLink(createdFormId))" class="btn-copy">
            {{ copied ? 'Tersalin!' : 'Salin' }}
          </button>
        </div>

        <div class="modal-actions">
          <a :href="`/admin/forms/${createdFormId}`" target="_blank" class="btn-secondary">
            👁️ Preview Form
          </a>
          <button @click="resetBuilder" class="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useNuxtApp } from '#imports'
import { useAuth } from '~~/app/composables/useAuth'

definePageMeta({
  middleware: ['auth-menu']
})

const router = useRouter()
const { getToken } = useAuth()

const formMeta = reactive({ title: '', description: '' })
const fields = ref<any[]>([])
const stockPoints = ref<any[]>([])
const isSaving = ref(false)
const createdFormId = ref<string | null>(null)
const copied = ref(false)
const linkInputRef = ref<HTMLInputElement | null>(null)

// State Error & Validation UI
const titleError = ref('')
const isShaking = ref(false)
const titleInputRef = ref<HTMLInputElement | null>(null)

// State Toast Notification
const toast = reactive({
  show: false,
  title: '',
  message: '',
  type: 'error' as 'error' | 'success' | 'info'
})

// Ambil master Stock Point dari API backend
const fetchStockPoints = async () => {
  try {
    const { $api } = useNuxtApp()
    const res: any = await $api('/stock-points')
    stockPoints.value = res.data || res || []
  } catch (err) {
    console.error('Gagal memuat master stock points:', err)
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

const showToast = (title: string, message: string, type: 'error' | 'success' | 'info' = 'error') => {
  toast.title = title
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => {
    toast.show = false
  }, 4000)
}

const clearTitleError = () => {
  if (formMeta.title.trim()) {
    titleError.value = ''
  }
}

const addField = () => {
  const newIndex = fields.value.length + 1
  const uniqueKey = `pertanyaan_${newIndex}`
  fields.value.push({
    _key: Date.now().toString(),
    id: uniqueKey,
    label: `Pertanyaan ${newIndex}`,
    type: 'text',
    required: true,
    allowMultiple: true,
    options: []
  })
}

const removeField = (index: number) => {
  fields.value.splice(index, 1)
}

const autoGenerateFieldId = (field: any) => {
  if (!field.label) {
    field.id = ''
    return
  }
  field.id = field.label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

const autoGenerateOptionValue = (opt: any) => {
  if (!opt.label) {
    opt.value = ''
    return
  }
  opt.value = opt.label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

const addOption = (field: any) => {
  if (!field.options) field.options = []
  const idx = field.options.length + 1
  const labelText = `Opsi ${idx}`
  field.options.push({ 
    label: labelText, 
    value: `opsi_${idx}` 
  })
}

// Fungsi untuk memasukkan data master Stock Point langsung ke opsi field (sudah diperbaiki)
const loadStockPointsIntoField = (field: any) => {
  if (stockPoints.value.length === 0) {
    showToast('Data Kosong', 'Master data Stock Point belum tersedia atau gagal dimuat.', 'error')
    return
  }
  
  field.options = stockPoints.value.map((sp: any) => ({
    label: `${sp.kode_spoint} - ${sp.nama_spoint} (${sp.nama_cab})`,
    value: sp.kode_spoint
  }))

  showToast('Berhasil', 'Daftar pilihan berhasil dimuat dari Master Stock Point!', 'success')
}

const removeOption = (field: any, optIdx: number | string) => {
  if (field.options.length > 1) {
    field.options.splice(Number(optIdx), 1)
  }
}

const handleTypeChange = (field: any) => {
  if (['select', 'radio', 'checkbox'].includes(field.type) && (!field.options || field.options.length === 0)) {
    field.options = [
      { label: 'Opsi 1', value: 'opsi_1' },
      { label: 'Opsi 2', value: 'opsi_2' }
    ]
  }
}

const getFieldTypeName = (type: string) => {
  const map: Record<string, string> = {
    text: 'Short Text',
    textarea: 'Long Text',
    number: 'Angka',
    date: 'Tanggal',
    radio: 'Radio Button',
    checkbox: 'Checkbox',
    select: 'Dropdown',
    file: 'Upload File'
  }
  return map[type] || type
}

const saveForm = async () => {
  if (!formMeta.title || !formMeta.title.trim()) {
    titleError.value = 'Judul Form wajib diisi!'
    isShaking.value = true
    setTimeout(() => { isShaking.value = false }, 500)
    
    titleInputRef.value?.focus()
    showToast('Validasi Gagal', 'Harap isi Judul Form terlebih dahulu sebelum menyimpan.', 'error')
    return
  }

  isSaving.value = true
  try {
    const { $api } = useNuxtApp()
    const token = getToken()

    let userId = null
    if (token) {
      try {
        const parts = token.split('.')
        if (parts.length > 1 && parts[1]) {
          const base64Url = parts[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          }).join(''))
          
          const payload = JSON.parse(jsonPayload)
          userId = payload.id || payload.sub || payload.userId
        }
      } catch (decodeErr) {
        console.error('Gagal mendecode token:', decodeErr)
      }
    }

    const res: any = await $api('/forms', {
      method: 'POST',
      body: { 
        ...formMeta, 
        structure: fields.value,
        user_id: userId 
      }
    })

    if (res.success || res.data) {
      createdFormId.value = res.data?.id || res.id
      showToast('Berhasil', 'Form berhasil dibuat!', 'success')
    }
  } catch (err: any) {
    if (err.status !== 401) {
      const errorMsg = err.data?.message || 'Terjadi kesalahan saat menyambung ke server.'
      showToast('Gagal Menyimpan', errorMsg, 'error')
    }
  } finally {
    isSaving.value = false
  }
}

const getPublicLink = (id: string) => `${window.location.origin}/admin/forms/${id}`

// Fungsi Copy Aman (Fallback HTTP/Production Non-HTTPS support)
const copyLink = (text: string) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      copied.value = true
      setTimeout(() => copied.value = false, 2000)
    }).catch(() => {
      fallbackCopyText(text)
    })
  } else {
    fallbackCopyText(text)
  }
}

const fallbackCopyText = (text: string) => {
  if (linkInputRef.value) {
    linkInputRef.value.select()
    try {
      document.execCommand('copy')
      copied.value = true
      setTimeout(() => copied.value = false, 2000)
    } catch (err) {
      showToast('Gagal', 'Gagal menyalin link ke clipboard', 'error')
    }
  }
}

const resetBuilder = () => {
  createdFormId.value = null
  formMeta.title = ''
  formMeta.description = ''
  fields.value = []
  titleError.value = ''
  navigateTo('/admin/forms')
}
</script>

<style scoped>
.builder-wrapper {
  width: 100%;
  min-height: 100vh;
  height: auto;
  overflow-y: auto !important;
  box-sizing: border-box;
  padding: 30px 16px 80px 16px;
  background-color: #f8fafc;
  position: relative;
}

.toast-notification {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
  max-width: 420px;
  padding: 14px 18px;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  border-left: 5px solid #ef4444;
}

.toast-notification.error {
  border-left-color: #ef4444;
}

.toast-notification.success {
  border-left-color: #10b981;
}

.toast-icon {
  font-size: 20px;
  display: flex;
  align-items: center;
}

.toast-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.toast-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
}

.toast-message {
  font-size: 13px;
  color: #4b5563;
  margin-top: 2px;
}

.toast-close {
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 16px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.toast-close:hover {
  color: #374151;
  background-color: #f3f4f6;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.shake-anim {
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

.builder-container {
  max-width: 760px;
  margin: 0 auto;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1f2937;
}

.builder-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  padding: 28px;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
  position: relative;
}

.main-card {
  border-top: none;
}

.card-accent-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 8px;
  background: linear-gradient(90deg, #6366f1, #4f46e5);
}

.builder-header {
  margin-bottom: 24px;
}

.builder-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px 0;
}

.builder-header p {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title h2 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: #111827;
}

.field-count-badge {
  font-size: 12px;
  color: #6b7280;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #373151;
  margin-bottom: 6px;
}

.required {
  color: #ef4444;
}

.form-control {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.title-input {
  font-size: 16px;
  font-weight: 600;
}

.form-control:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.form-control.is-invalid {
  border-color: #ef4444 !important;
  background-color: #fef2f2;
}

.form-control.is-invalid:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.error-text {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #dc2626;
  font-weight: 500;
  margin-top: 6px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.code-input {
  font-family: monospace;
}

.readonly-input {
  background-color: #f8fafc;
  color: #64748b;
  cursor: not-allowed;
  border-color: #e2e8f0;
}

.field-item-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 16px;
  transition: border-color 0.2s;
}

.field-item-card:hover {
  border-color: #cbd5e1;
}

.field-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #cbd5e1;
}

.field-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drag-handle {
  color: #94a3b8;
  cursor: grab;
  font-size: 16px;
}

.field-number {
  font-weight: 700;
  color: #4f46e5;
  font-size: 14px;
}

.field-type-tag {
  background: #e0e7ff;
  color: #4338ca;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.file-config-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 12px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #cbd5e1;
  transition: .3s;
  border-radius: 22px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #6366f1;
}

input:checked + .slider:before {
  transform: translateX(18px);
}

.toggle-text strong {
  display: block;
  font-size: 13px;
  color: #1e293b;
}

.toggle-text p {
  margin: 0;
  font-size: 11px;
  color: #64748b;
}

.options-builder {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  margin-top: 12px;
}

.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.options-header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.option-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.btn-primary-small {
  background-color: #4f46e5;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary-small:hover {
  background-color: #4338ca;
}

.btn-small-master {
  background-color: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-small-master:hover {
  background-color: #fde68a;
}

.btn-small-add {
  background-color: #e0e7ff;
  color: #4338ca;
  border: none;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-delete {
  background-color: #fee2e2;
  color: #b91c1c;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-delete:hover {
  background-color: #fecaca;
}

.btn-opt-delete {
  background: transparent;
  color: #ef4444;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
}

.btn-add-block {
  width: 100%;
  padding: 12px;
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  color: #475569;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-block:hover {
  background: #f1f5f9;
  border-color: #6366f1;
  color: #6366f1;
}

.builder-actions {
  margin-top: 24px;
}

.btn-submit {
  width: 100%;
  background-color: #10b981;
  color: white;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
  transition: background 0.2s;
}

.btn-submit:hover {
  background-color: #059669;
}

.btn-submit:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
  box-shadow: none;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.btn-outline {
  background: transparent;
  border: 1px solid #cbd5e1;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-card {
  background: white;
  padding: 32px;
  border-radius: 16px;
  max-width: 480px;
  width: 90%;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.modal-card h2 {
  margin: 0 0 8px 0;
  color: #111827;
}

.modal-card p {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.link-box {
  display: flex;
  gap: 8px;
  margin: 20px 0;
}

.btn-copy {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-secondary {
  text-decoration: none;
  background: #f3f4f6;
  color: #374151;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  display: inline-block;
  font-size: 14px;
}

.btn-primary {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
}
</style>