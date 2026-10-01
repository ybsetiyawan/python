<template>
  <div class="form-container">
    <!-- 1. State Loading -->
    <div v-if="pending" class="loading-state">
      <div class="spinner"></div>
      <p>Memuat formulir...</p>
    </div>

    <!-- 2. State Error / Form Tidak Ditemukan -->
    <div v-else-if="error || !form" class="error-card">
      <div class="error-icon">⚠️</div>
      <h2>Form Tidak Ditemukan</h2>
      <p>{{ error?.message || 'Formulir tidak tersedia atau telah dihapus.' }}</p>
    </div>

    <!-- 3. State BERHASIL SUBMIT (Success State View) -->
    <div v-else-if="isSubmitted" class="form-card success-card">
      <div class="card-accent-bar success-accent"></div>
      <div class="success-content">
        <div class="success-icon">🎉</div>
        <h2>Jawaban Berhasil Dikirim!</h2>
        <p class="success-message">
          Terima kasih telah mengisi <strong>{{ form.title }}</strong>. Tanggapan Anda telah berhasil direkam oleh sistem.
        </p>

        <div class="success-actions">
          <button type="button" class="btn-submit-another" @click="resetFormForNewSubmit">
            🔄 Kirim Jawaban Lainnya
          </button>
        </div>
      </div>
    </div>

    <!-- 4. State Pengisian Formulir Utama -->
    <div v-else class="form-card">
      <div class="card-accent-bar"></div>

      <div class="form-header">
        <h1>{{ form.title }}</h1>
        <p v-if="form.description" class="form-description">{{ form.description }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="form-body">
        <div 
          v-for="field in form.structure" 
          :key="field.id" 
          class="form-group"
        >
          <label :for="field.id" class="field-label">
            {{ field.label }}
            <span v-if="field.required" class="required-asterisk">*</span>
          </label>

          <!-- Input Text / Email / Number / Date -->
          <input
            v-if="['text', 'email', 'number', 'date'].includes(field.type)"
            :id="field.id"
            v-model="formData[field.id]"
            :type="field.type"
            :placeholder="field.placeholder || `Masukkan ${field.label.toLowerCase()}...`"
            :required="field.required"
            class="form-control"
          />

          <!-- Textarea -->
          <textarea
            v-else-if="field.type === 'textarea'"
            :id="field.id"
            v-model="formData[field.id]"
            :placeholder="field.placeholder || `Masukkan ${field.label.toLowerCase()}...`"
            :required="field.required"
            rows="4"
            class="form-control"
          ></textarea>

          <!-- Select Dropdown -->
          <select
            v-else-if="field.type === 'select'"
            :id="field.id"
            v-model="formData[field.id]"
            :required="field.required"
            class="form-control"
          >
            <option value="" disabled selected>-- Pilih opsi --</option>
            <option 
              v-for="(opt, idx) in field.options" 
              :key="idx" 
              :value="typeof opt === 'object' ? opt.value : opt"
            >
              {{ typeof opt === 'object' ? opt.label : opt }}
            </option>
          </select>

          <!-- Radio Group -->
          <div v-else-if="field.type === 'radio'" class="options-group">
            <label 
              v-for="(opt, idx) in field.options" 
              :key="idx" 
              class="option-item"
            >
              <input
                type="radio"
                :name="field.id"
                :value="typeof opt === 'object' ? opt.value : opt"
                v-model="formData[field.id]"
                :required="field.required && !formData[field.id]"
              />
              <span>{{ typeof opt === 'object' ? opt.label : opt }}</span>
            </label>
          </div>

          <!-- Checkbox Group (Multi Selection) -->
          <div v-else-if="field.type === 'checkbox'" class="options-group">
            <label 
              v-for="(opt, idx) in field.options" 
              :key="idx" 
              class="option-item"
            >
              <input
                type="checkbox"
                :value="typeof opt === 'object' ? opt.value : opt"
                v-model="formData[field.id]"
              />
              <span>{{ typeof opt === 'object' ? opt.label : opt }}</span>
            </label>
          </div>

          <!-- Multi-File Upload Component -->
          <div v-else-if="field.type === 'file'" class="file-upload-wrapper">
            <div 
              class="dropzone-area"
              :class="{ 'is-dragging': activeDragField === field.id }"
              @dragover.prevent="activeDragField = field.id"
              @dragleave.prevent="activeDragField = null"
              @drop.prevent="handleDrop($event, field.id)"
              @click="triggerFileInput(field.id)"
            >
              <input
                :ref="(el) => setFileRef(el, field.id)"
                type="file"
                :multiple="field.allowMultiple !== false"
                class="hidden-file-input"
                @change="(e) => handleFileSelect(e, field.id)"
              />
              
              <div class="dropzone-content">
                <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p class="upload-text"><strong>Klik untuk memilih file</strong> atau tarik & lepas di sini</p>
                <span class="upload-hint">
                  {{ field.allowMultiple !== false ? 'Bisa memilih lebih dari 1 file' : 'Maksimal 1 file' }}
                </span>
              </div>
            </div>

            <!-- List Preview File yang Dipilih -->
            <div v-if="fileData[field.id]?.length" class="file-preview-list">
              <div 
                v-for="(file, fIdx) in fileData[field.id]" 
                :key="fIdx" 
                class="file-preview-item"
              >
                <div class="file-info">
                  <span class="file-icon">📄</span>
                  <div class="file-details">
                    <span class="file-name" :title="file.name">{{ file.name }}</span>
                    <span class="file-size">{{ formatFileSize(file.size) }}</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  class="btn-remove-file" 
                  @click.stop="removeFile(field.id, fIdx)"
                  title="Hapus file"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Alert Jika Terjadi Error saat Submit -->
        <div v-if="submitMessage && !isSuccess" class="alert alert-error">
          {{ submitMessage }}
        </div>

        <div class="form-actions">
          <button type="submit" :disabled="isSubmitting" class="btn-submit">
            <span v-if="isSubmitting" class="spinner-small"></span>
            {{ isSubmitting ? 'Mengirim Jawaban...' : 'Kirim Jawaban' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute, useNuxtApp } from '#imports'
import { useAuth } from '~~/app/composables/useAuth'

// Daftarkan metadata halaman agar menggunakan layout admin dan proteksi middleware jika ada
definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()
const { getToken } = useAuth()
const { $api } = useNuxtApp()

const formId = route.params.id

const form = ref(null)
const pending = ref(true)
const error = ref(null)

const formData = reactive({})
const fileData = reactive({})
const fileInputRefs = ref({})
const activeDragField = ref(null)

const isSubmitting = ref(false)
const isSubmitted = ref(false)
const submitMessage = ref('')
const isSuccess = ref(false)

const setFileRef = (el, fieldId) => {
  if (el) fileInputRefs.value[fieldId] = el
}

const triggerFileInput = (fieldId) => {
  if (fileInputRefs.value[fieldId]) {
    fileInputRefs.value[fieldId].click()
  }
}

// Fetch Master Structure Form dengan validasi Token Auth
const fetchFormDetail = async () => {
  const token = getToken()
  if (!token) {
    router.push('/login')
    return
  }

  try {
    pending.value = true
    // Menggunakan plugin $api yang sudah otomatis membawa token dari header
    const res = await $api(`/forms/${formId}`)
    if (res.success) {
      form.value = res.data
      initFormState(res.data.structure)
    }
  } catch (err) {
    if (err.status === 401 || err.statusCode === 401) {
      router.push('/login')
      return
    }
    error.value = err.data || { message: 'Gagal memuat form' }
  } finally {
    pending.value = false
  }
}

// Init Form Data
const initFormState = (structure) => {
  if (!Array.isArray(structure)) return

  structure.forEach((field) => {
    if (field.type === 'checkbox') {
      formData[field.id] = []
    } else if (field.type === 'file') {
      fileData[field.id] = []
    } else {
      formData[field.id] = ''
    }
  })
}

// Handling File Input & Multi Append
const appendFiles = (fieldId, newFiles) => {
  if (!fileData[fieldId]) {
    fileData[fieldId] = []
  }
  
  const filesArray = Array.from(newFiles)
  filesArray.forEach((file) => {
    const isDuplicate = fileData[fieldId].some(f => f.name === file.name && f.size === file.size)
    if (!isDuplicate) {
      fileData[fieldId].push(file)
    }
  })
}

const handleFileSelect = (event, fieldId) => {
  if (event.target.files && event.target.files.length > 0) {
    appendFiles(fieldId, event.target.files)
    event.target.value = ''
  }
}

const handleDrop = (event, fieldId) => {
  activeDragField.value = null
  if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
    appendFiles(fieldId, event.dataTransfer.files)
  }
}

const removeFile = (fieldId, fileIndex) => {
  if (fileData[fieldId]) {
    fileData[fieldId].splice(fileIndex, 1)
  }
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Submit Form Payload
const handleSubmit = async () => {
  const token = getToken()
  if (!token) {
    router.push('/login')
    return
  }

  isSubmitting.value = true
  submitMessage.value = ''

  try {
    const payload = new FormData()

    Object.keys(formData).forEach((key) => {
      const val = formData[key]
      if (Array.isArray(val)) {
        val.forEach((item) => payload.append(key, item))
      } else if (val !== null && val !== undefined && val !== '') {
        payload.append(key, val)
      }
    })

    Object.keys(fileData).forEach((key) => {
      const files = fileData[key]
      if (Array.isArray(files)) {
        files.forEach((file) => payload.append(key, file))
      }
    })

    const response = await $api(`/forms/${formId}/submit`, {
      method: 'POST',
      body: payload
    })

    if (response.success) {
      isSuccess.value = true
      isSubmitted.value = true
    }
  } catch (err) {
    if (err.status === 401 || err.statusCode === 401) {
      router.push('/login')
      return
    }
    isSuccess.value = false
    submitMessage.value = err.data?.message || 'Terjadi kesalahan saat mengirim jawaban.'
  } finally {
    isSubmitting.value = false
  }
}

const resetFormForNewSubmit = () => {
  if (form.value && form.value.structure) {
    initFormState(form.value.structure)
  }
  isSubmitted.value = false
  isSuccess.value = false
  submitMessage.value = ''
}

onMounted(() => {
  const token = getToken()
  if (!token) {
    router.push('/login')
    return
  }
  fetchFormDetail()
})
</script>

<style scoped>
.form-container {
  max-width: 680px;
  margin: 40px auto;
  padding: 0 16px;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1f2937;
}

.form-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  position: relative;
  overflow: hidden;
}

.card-accent-bar {
  height: 8px;
  background: linear-gradient(90deg, #6366f1, #4f46e5);
}

.form-header {
  padding: 32px 32px 20px 32px;
  border-bottom: 1px solid #f3f4f6;
}

.form-header h1 {
  font-size: 26px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.form-description {
  color: #4b5563;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.form-body {
  padding: 24px 32px 32px 32px;
}

.form-group {
  margin-bottom: 24px;
}

.field-label {
  display: block;
  font-weight: 600;
  font-size: 14px;
  color: #374151;
  margin-bottom: 8px;
}

.required-asterisk {
  color: #ef4444;
  margin-left: 2px;
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

.form-control:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.options-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  cursor: pointer;
  color: #374151;
  user-select: none;
}

.option-item input[type="radio"],
.option-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #4f46e5;
  cursor: pointer;
}

.hidden-file-input {
  display: none;
}

.dropzone-area {
  border: 2px dashed #cbd5e1;
  border-radius: 10px;
  padding: 24px 16px;
  text-align: center;
  background-color: #f8fafc;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropzone-area:hover,
.dropzone-area.is-dragging {
  border-color: #6366f1;
  background-color: #eef2ff;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-icon {
  width: 38px;
  height: 38px;
  color: #6366f1;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
  color: #334155;
  margin: 0 0 4px 0;
}

.upload-hint {
  font-size: 12px;
  color: #94a3b8;
}

.file-preview-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-preview-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 8px 12px;
  border-radius: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.file-icon {
  font-size: 18px;
}

.file-details {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 320px;
}

.file-size {
  font-size: 11px;
  color: #64748b;
}

.btn-remove-file {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-remove-file:hover {
  background-color: #fee2e2;
}

.form-actions {
  margin-top: 28px;
}

.btn-submit {
  width: 100%;
  background-color: #4f46e5;
  color: #ffffff;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s ease;
}

.btn-submit:hover {
  background-color: #4338ca;
}

.btn-submit:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 20px;
}

.alert-error {
  background-color: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.success-card {
  text-align: center;
  padding-bottom: 30px;
}

.success-accent {
  background: linear-gradient(90deg, #10b981, #059669) !important;
}

.success-content {
  padding: 40px 24px 20px 24px;
}

.success-icon {
  font-size: 56px;
  margin-bottom: 16px;
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.success-content h2 {
  font-size: 24px;
  color: #111827;
  margin: 0 0 12px 0;
  font-weight: 700;
}

.success-message {
  color: #4b5563;
  font-size: 15px;
  line-height: 1.6;
  max-width: 480px;
  margin: 0 auto 28px auto;
}

.success-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.btn-submit-another {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-submit-another:hover {
  background-color: #e5e7eb;
  color: #111827;
}

.loading-state,
.error-card {
  text-align: center;
  padding: 60px 20px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.error-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px auto;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes popIn {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>