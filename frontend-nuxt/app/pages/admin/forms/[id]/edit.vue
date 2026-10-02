<template>
  <div class="builder-wrapper">
    <!-- Toast Notification -->
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
      <!-- Top Navigation Header -->
      <div class="top-nav">
        <NuxtLink to="/admin/forms" class="btn-back">
          ← Kembali ke Dashboard Admin
        </NuxtLink>
        <span class="badge-edit-mode">✏️ Mode Edit Form</span>
      </div>

      <!-- State Loading -->
      <div v-if="pending" class="loading-state">
        <div class="spinner"></div>
        <p>Memuat struktur formulir...</p>
      </div>

      <template v-else-if="form">
        <!-- Card 1: Header & Informasi Master Form -->
        <div class="builder-card main-card">
          <div class="card-accent-bar"></div>
          <div class="builder-header">
            <h1>Edit Formulir</h1>
            <p>Ubah judul, deskripsi, atau sesuaikan struktur pertanyaan.</p>
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
              <Transition name="fade">
                <span v-if="titleError" class="error-text">⚠️ {{ titleError }}</span>
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

          <div v-for="(field, index) in fields" :key="field._key || field.id || index" class="field-item-card">
            <div class="field-item-header">
              <div class="field-header-left">
                <span class="drag-handle">⋮⋮</span>
                <span class="field-number">#{{ index + 1 }}</span>
                <span class="field-type-tag">{{ getFieldTypeName(field.type) }}</span>
              </div>
              <button type="button" class="btn-delete" @click="removeField(index)" title="Hapus Field">
                🗑️ Hapus
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

            <!-- Setting Upload File -->
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

            <!-- Options Builder (Diperbaiki jadi Grid Sejajar) -->
            <div v-if="['select', 'radio', 'checkbox'].includes(field.type)" class="options-builder">
              <div class="options-header">
                <label class="form-label">Daftar Pilihan / Opsi <span class="required">*</span></label>
                <button type="button" class="btn-small-add" @click="addOption(field)">+ Tambah Opsi</button>
              </div>
              <div class="options-container">
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
                  <button type="button" class="btn-opt-delete" @click="removeOption(field, optIdx)" title="Hapus Opsi">✕</button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="fields.length > 0" class="bottom-add-container">
            <button type="button" class="btn-add-block" @click="addField">
              + Tambah Field Baru
            </button>
          </div>
        </div>

        <!-- Submit Action -->
        <div class="builder-actions">
          <button type="button" class="btn-submit" :disabled="isSaving" @click="updateForm">
            {{ isSaving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Formulir' }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute, useNuxtApp } from '#imports'
import { useAuth } from '~~/app/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { getToken } = useAuth()
const { $api } = useNuxtApp()

const formId = route.params.id

const form = ref(null)
const pending = ref(true)
const isSaving = ref(false)

const formMeta = reactive({ title: '', description: '' })
const fields = ref([])

const titleError = ref('')
const isShaking = ref(false)
const titleInputRef = ref(null)

const toast = reactive({ show: false, title: '', message: '', type: 'error' })

const showToast = (title, message, type = 'error') => {
  toast.title = title
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => { toast.show = false }, 4000)
}

const clearTitleError = () => {
  if (formMeta.title.trim()) titleError.value = ''
}

// Fetch detail form untuk diedit dengan validasi Token Auth (Menggunakan endpoint relatif)
const loadFormDetail = async () => {
  const token = getToken()
  if (!token) {
    router.push('/login')
    return
  }

  pending.value = true
  try {
    const res = await $api(`/forms/${formId}`)
    const data = res.data || res
    if (data) {
      form.value = data
      formMeta.title = data.title || ''
      formMeta.description = data.description || ''
      
      let struct = data.structure
      if (typeof struct === 'string') {
        try { struct = JSON.parse(struct) } catch { struct = [] }
      }
      fields.value = Array.isArray(struct) ? struct : []
    }
  } catch (err) {
    if (err.status === 401 || err.statusCode === 401) {
      router.push('/login')
      return
    }
    showToast('Gagal Memuat', 'Formulir tidak ditemukan atau server error', 'error')
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  const token = getToken()
  if (!token) {
    router.push('/login')
    return
  }
  loadFormDetail()
})

const addField = () => {
  const newIndex = fields.value.length + 1
  fields.value.push({
    _key: Date.now().toString(),
    id: `pertanyaan_${newIndex}`,
    label: `Pertanyaan ${newIndex}`,
    type: 'text',
    required: true,
    allowMultiple: true,
    options: []
  })
}

const removeField = (index) => fields.value.splice(index, 1)

const autoGenerateFieldId = (field) => {
  if (!field.label) { field.id = ''; return }
  field.id = field.label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

const autoGenerateOptionValue = (opt) => {
  if (!opt.label) { opt.value = ''; return }
  opt.value = opt.label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

const addOption = (field) => {
  if (!field.options) field.options = []
  const idx = field.options.length + 1
  field.options.push({ label: `Opsi ${idx}`, value: `opsi_${idx}` })
}

const removeOption = (field, optIdx) => {
  if (field.options.length > 1) field.options.splice(optIdx, 1)
}

const handleTypeChange = (field) => {
  if (['select', 'radio', 'checkbox'].includes(field.type) && (!field.options || field.options.length === 0)) {
    field.options = [{ label: 'Opsi 1', value: 'opsi_1' }, { label: 'Opsi 2', value: 'opsi_2' }]
  }
}

const getFieldTypeName = (type) => {
  const map = { text: 'Short Text', textarea: 'Long Text', number: 'Angka', date: 'Tanggal', radio: 'Radio Button', checkbox: 'Checkbox', select: 'Dropdown', file: 'Upload File' }
  return map[type] || type
}

const updateForm = async () => {
  const token = getToken()
  if (!token) {
    router.push('/login')
    return
  }

  if (!formMeta.title || !formMeta.title.trim()) {
    titleError.value = 'Judul Form wajib diisi!'
    isShaking.value = true
    setTimeout(() => { isShaking.value = false }, 500)
    titleInputRef.value?.focus()
    showToast('Validasi Gagal', 'Harap isi Judul Form terlebih dahulu.', 'error')
    return
  }

  isSaving.value = true
  
  const payload = {
    title: formMeta.title,
    description: formMeta.description,
    structure: fields.value 
  }

  try {
    const res = await $api(`/forms/${formId}`, {
      method: 'PUT',
      body: payload
    })
    
    if (res.success || res.data || res.message) {
      showToast('Berhasil', 'Struktur formulir telah diperbarui!', 'success')
      setTimeout(() => {
        router.push('/admin/forms')
      }, 1200)
    }
  } catch (err) {
    if (err.status === 401 || err.statusCode === 401) {
      router.push('/login')
      return
    }
    const errorMsg = err.data?.message || err.message || 'Terjadi kesalahan saat memperbarui formulir.'
    showToast('Gagal Menyimpan', errorMsg, 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.builder-wrapper {
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  padding: 30px 16px 80px 16px;
  background-color: #f1f5f9;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  max-width: 820px;
  margin-left: auto;
  margin-right: auto;
}

.btn-back {
  text-decoration: none;
  color: #4f46e5;
  font-weight: 600;
  font-size: 14px;
}

.btn-back:hover {
  text-decoration: underline;
}

.badge-edit-mode {
  background-color: #fef3c7;
  color: #92400e;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid #fde68a;
}

.builder-container {
  max-width: 820px;
  margin: 0 auto;
  font-family: 'Inter', system-ui, sans-serif;
  color: #1f2937;
}

.builder-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
  padding: 28px;
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
}

.card-accent-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 6px;
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.builder-header h1 { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 4px 0; }
.builder-header p { color: #6b7280; font-size: 13px; margin: 0 0 20px 0; }

.section-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.section-title h2 { font-size: 18px; font-weight: 700; margin: 0; color: #111827; }
.field-count-badge { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 6px; font-weight: 500; }

.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; }
.required { color: #ef4444; }

.form-control {
  width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; box-sizing: border-box; transition: all 0.2s; background: #fff;
}
.form-control:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15); }
.readonly-input { background-color: #f8fafc !important; color: #64748b; font-family: monospace; font-size: 13px; }

.form-control.is-invalid { border-color: #ef4444 !important; background-color: #fef2f2; }
.error-text { display: block; font-size: 12px; color: #dc2626; font-weight: 500; margin-top: 6px; }

.field-item-card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); transition: border-color 0.2s; }
.field-item-card:hover { border-color: #94a3b8; }

.field-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; }
.field-header-left { display: flex; align-items: center; gap: 8px; }
.drag-handle { color: #94a3b8; cursor: grab; font-weight: bold; }
.field-number { font-weight: 700; color: #d97706; font-size: 14px; }
.field-type-tag { background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
.field-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; }

@media (max-width: 768px) {
  .field-grid { grid-template-columns: 1fr; }
}

.btn-primary-small { background-color: #d97706; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-primary-small:hover { background-color: #b45309; }

.btn-delete { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-delete:hover { background-color: #fecaca; }

/* PERBAIKAN DESAIN OPSI (Grid Horizontal Sejajar) */
.options-builder {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 14px;
  border-radius: 8px;
  margin-top: 14px;
}

.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.btn-small-add {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
}
.btn-small-add:hover { background: #dbeafe; }

.option-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto; /* Kolom Label Opsi, Value DB, dan Tombol Hapus */
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.btn-opt-delete {
  background: #fee2e2;
  color: #ef4444;
  border: 1px solid #fecaca;
  border-radius: 6px;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
}
.btn-opt-delete:hover { background: #fecaca; color: #dc2626; }

.bottom-add-container { margin-top: 16px; }
.btn-add-block { width: 100%; padding: 12px; background: #ffffff; border: 2px dashed #cbd5e1; border-radius: 8px; color: #475569; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-add-block:hover { border-color: #d97706; color: #d97706; background: #fffbeb; }

.builder-actions { margin-top: 24px; }
.btn-submit { width: 100%; background-color: #d97706; color: white; padding: 14px; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.2); transition: background 0.2s; }
.btn-submit:hover { background-color: #b45309; }

/* Toast Notification Styles */
.toast-notification { position: fixed; top: 24px; right: 24px; z-index: 1000; display: flex; align-items: center; gap: 12px; min-width: 300px; padding: 14px 18px; border-radius: 10px; background: #ffffff; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border-left: 5px solid #ef4444; }
.toast-notification.success { border-left-color: #10b981; }
.toast-title { font-size: 14px; font-weight: 700; color: #1f2937; }
.toast-message { font-size: 13px; color: #4b5563; }
.toast-close { background: transparent; border: none; color: #9ca3af; font-size: 16px; cursor: pointer; }

.loading-state { text-align: center; padding: 60px 20px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; }
.spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #d97706; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px auto; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>