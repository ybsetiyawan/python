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
      <!-- Card 1: Header & Informasi Master Spreadsheet -->
      <div class="builder-card main-card">
        <div class="card-accent-bar"></div>
        <div class="builder-header">
          <h1>Buat E-Spreadsheet Baru</h1>
          <p>Atur judul dan deskripsi lembar kerja kolaborasi digital Anda.</p>
        </div>

        <div class="form-section">
          <div class="form-group">
            <label class="form-label">Judul Spreadsheet <span class="required">*</span></label>
            <input 
              ref="titleInputRef"
              v-model="formMeta.title" 
              type="text" 
              placeholder="Contoh: Rekap Stok Opname Cabang SBY" 
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
            <label class="form-label">Deskripsi Spreadsheet</label>
            <textarea 
              v-model="formMeta.description" 
              rows="2" 
              placeholder="Tuliskan keterangan atau petunjuk pengisian..." 
              class="form-control"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="builder-actions">
        <button type="button" class="btn-submit" :disabled="isSaving" @click="saveSpreadsheet">
          {{ isSaving ? 'Menyimpan Spreadsheet...' : 'Simpan & Buat Spreadsheet' }}
        </button>
      </div>
    </div>

    <!-- Modal Success -->
    <div v-if="createdSheetId" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-icon">🎉</div>
        <h2>Spreadsheet Berhasil Dibuat!</h2>
        <p>Lembar kerja Anda siap digunakan. Silakan salin tautan berikut:</p>
        
        <div class="link-box">
          <input ref="linkInputRef" type="text" readonly :value="getPublicLink(createdSheetId)" class="form-control code-input" />
          <button @click="copyLink(getPublicLink(createdSheetId))" class="btn-copy">
            {{ copied ? 'Tersalin!' : 'Salin' }}
          </button>
        </div>

        <div class="modal-actions">
          <a :href="`/admin/spreadsheets/${createdSheetId}`" class="btn-secondary">
            👁️ Buka Editor
          </a>
          <button @click="resetBuilder" class="btn-primary">
            Selesai
          </button>
        </div>
      </div>
    </div>

    <!-- Hidden Input untuk Fallback Copy di Server Non-HTTPS -->
    <input ref="hiddenInputRef" type="text" class="sr-only" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from '#imports'
import { useAuth } from '~~/app/composables/useAuth'

definePageMeta({
  layout: 'admin',
  middleware: ['auth-menu']
})

const router = useRouter()
const { getToken } = useAuth()

const formMeta = reactive({ title: '', description: '' })
const isSaving = ref(false)
const createdSheetId = ref<string | null>(null)
const copied = ref(false)
const linkInputRef = ref<HTMLInputElement | null>(null)
const hiddenInputRef = ref<HTMLInputElement | null>(null)

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

onMounted(() => {
  const token = getToken()
  if (!token) {
    router.push('/login')
    return
  }
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

const saveSpreadsheet = async () => {
  if (!formMeta.title || !formMeta.title.trim()) {
    titleError.value = 'Judul Spreadsheet wajib diisi!'
    isShaking.value = true
    setTimeout(() => { isShaking.value = false }, 500)
    
    titleInputRef.value?.focus()
    showToast('Validasi Gagal', 'Harap isi Judul Spreadsheet terlebih dahulu sebelum menyimpan.', 'error')
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

    const res: any = await $api('/spreadsheets', {
      method: 'POST',
      body: { 
        title: formMeta.title,
        description: formMeta.description,
        created_by: userId 
      }
    })

    if (res.success || res.data) {
      createdSheetId.value = res.data?.id || res.id
      showToast('Berhasil', 'Spreadsheet berhasil dibuat!', 'success')
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

const getPublicLink = (id: string) => `${window.location.origin}/admin/spreadsheets/${id}`

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
  createdSheetId.value = null
  formMeta.title = ''
  formMeta.description = ''
  titleError.value = ''
  navigateTo('/admin/spreadsheets')
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

.sr-only {
  position: absolute;
  width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0;
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

.toast-notification.error { border-left-color: #ef4444; }
.toast-notification.success { border-left-color: #10b981; }
.toast-icon { font-size: 20px; display: flex; align-items: center; }
.toast-content { display: flex; flex-direction: column; flex: 1; }
.toast-title { font-size: 14px; font-weight: 700; color: #1f2937; }
.toast-message { font-size: 13px; color: #4b5563; margin-top: 2px; }
.toast-close { background: transparent; border: none; color: #9ca3af; font-size: 16px; cursor: pointer; padding: 2px 6px; border-radius: 4px; }
.toast-close:hover { color: #374151; background-color: #f3f4f6; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-enter-from { opacity: 0; transform: translateY(-20px) scale(0.95); }
.toast-leave-to { opacity: 0; transform: translateX(30px); }

.shake-anim { animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }

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

.main-card { border-top: none; }

.card-accent-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 8px;
  background: linear-gradient(90deg, #6366f1, #4f46e5);
}

.builder-header { margin-bottom: 24px; }
.builder-header h1 { font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 6px 0; }
.builder-header p { color: #6b7280; font-size: 14px; margin: 0; }

.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 13px; font-weight: 600; color: #373151; margin-bottom: 6px; }
.required { color: #ef4444; }

.form-control {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.title-input { font-size: 16px; font-weight: 600; }
.form-control:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }

.form-control.is-invalid { border-color: #ef4444 !important; background-color: #fef2f2; }
.form-control.is-invalid:focus { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15); }

.error-text {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: #dc2626; font-weight: 500; margin-top: 6px;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.code-input { font-family: monospace; }
.builder-actions { margin-top: 24px; }

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
.btn-submit:hover { background-color: #059669; }
.btn-submit:disabled { background-color: #9ca3af; cursor: not-allowed; box-shadow: none; }

.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 999;
}

.modal-card {
  background: white; padding: 32px; border-radius: 16px;
  max-width: 480px; width: 90%; text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-icon { font-size: 48px; margin-bottom: 12px; }
.modal-card h2 { margin: 0 0 8px 0; color: #111827; }
.modal-card p { color: #6b7280; font-size: 14px; margin: 0; }

.link-box { display: flex; gap: 8px; margin: 20px 0; }
.btn-copy {
  background: #4f46e5; color: white; border: none;
  padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; white-space: nowrap;
}

.modal-actions { display: flex; gap: 12px; justify-content: center; }
.btn-secondary {
  text-decoration: none; background: #f3f4f6; color: #374151;
  padding: 10px 18px; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 14px;
}
.btn-primary {
  background: #10b981; color: white; border: none;
  padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px;
}
</style>