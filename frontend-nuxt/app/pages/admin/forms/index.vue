<template>
  <div class="admin-dashboard">
    <!-- Header Admin -->
    <div class="admin-header">
      <div class="header-text">
        <h1>Daftar Form</h1>
        <p>Kelola formulir, edit struktur field, dan lihat respons pengguna.</p>
      </div>
      <NuxtLink to="/admin/forms/create" class="btn-primary">
        + Buat Form Baru
      </NuxtLink>
    </div>

    <!-- State Loading -->
    <div v-if="pending" class="loading-state">
      <div class="spinner"></div>
      <p>Memuat lembaran formulir...</p>
    </div>

    <!-- State Empty -->
    <div v-else-if="!forms || forms.length === 0" class="empty-paper">
      <div class="paper-clip-icon">📎</div>
      <h3>Arsip Formulir Kosong</h3>
      <p>Belum ada template formulir yang dibuat dalam sistem.</p>
    </div>

    <!-- Grid Dokumen Paper Clip Warna-Warni -->
    <div v-else class="forms-paper-grid">
      <div 
        v-for="(form, idx) in forms" 
        :key="form.id" 
        class="paper-card"
        :class="getCardTheme(idx)"
      >
        <!-- PAPER CLIP BESAR BERWARNA (Atas Kanan) -->
        <div class="paper-clip-large" title="Dokumen Tersimpan">
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

        <!-- Top Meta (Badge Field & Tanggal) -->
        <div class="paper-top-meta">
          <span class="field-badge">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
              <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
              <path d="M4 4.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5z"/>
            </svg>
            {{ parseStructureLength(form.structure) }} Field
          </span>
          <span class="paper-date">{{ formatDate(form.created_at || form.createdAt) }}</span>
        </div>

        <!-- Isi Judul & Deskripsi Dokumen -->
        <div class="paper-content">
          <h3 class="paper-title" :title="form.title">{{ form.title }}</h3>
          <p class="paper-desc">{{ form.description || 'Tidak ada deskripsi.' }}</p>
        </div>

        <!-- Tombol Aksi Berwarna Kontras -->
        <div class="paper-actions">
          <button @click="copyPublicLink(form.id)" class="btn-action btn-salin" title="Salin Tautan Form">
            <svg width="15" height="15" fill="currentColor" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
              <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
              <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
            </svg>
            Salin
          </button>

          <NuxtLink :to="`/admin/forms/${form.id}/edit`" class="btn-action btn-edit" title="Edit Form">
            <svg width="15" height="15" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.034z"/>
            </svg>
            Edit
          </NuxtLink>

          <NuxtLink :to="`/admin/forms/${form.id}/responses`" class="btn-action btn-respons" title="Lihat Hasil Isian">
            <svg width="15" height="15" fill="currentColor" viewBox="0 0 16 16">
              <path d="M1 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3zm5-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm5-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V2z"/>
            </svg>
            Respons
          </NuxtLink>
        </div>

      </div>
    </div>

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

definePageMeta({
  layout: 'admin',
  middleware: ['auth-menu']
})

const router = useRouter()

interface FormItem {
  id: string | number
  title: string
  description?: string
  structure?: any
  created_at?: string
  createdAt?: string
}

const forms = ref<FormItem[]>([])
const pending = ref(true)
const toast = reactive({ show: false, message: '' })

const fetchForms = async () => {
  pending.value = true
  try {
    const { $api } = useNuxtApp()
    const res: any = await $api('/forms')
    forms.value = res.data || res || []
  } catch (err: any) {
    if (err.status === 401 || err.statusCode === 401) {
      router.push('/login')
      return
    }
    console.error('Gagal mengambil daftar form:', err)
  } finally {
    pending.value = false
  }
}

onMounted(async () => {
  await fetchForms()
})

const themes = ['theme-indigo', 'theme-emerald', 'theme-amber', 'theme-rose', 'theme-cyan']
const getCardTheme = (index: number) => {
  return themes[index % themes.length]
}

const parseStructureLength = (structure: any) => {
  if (!structure) return 0
  if (typeof structure === 'string') {
    try {
      return JSON.parse(structure).length
    } catch {
      return 0
    }
  }
  return Array.isArray(structure) ? structure.length : 0
}

const showToast = (msg: string) => {
  toast.message = msg
  toast.show = true
  setTimeout(() => toast.show = false, 2500)
}

const copyPublicLink = (id: string | number) => {
  const url = `${window.location.origin}/admin/forms/${id}`
  navigator.clipboard.writeText(url)
  showToast('Link formulir berhasil disalin!')
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

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 36px;
}

.admin-header h1 {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px 0;
  letter-spacing: -0.5px;
}

.admin-header p {
  color: #64748b;
  font-size: 14px;
  margin: 0;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 700;
  text-decoration: none;
  font-size: 14px;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
}

.forms-paper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 32px;
}

.paper-card {
  position: relative;
  background: #ffffff;
  border-radius: 14px 14px 14px 2px;
  border: 1px solid #e2e8f0;
  padding: 28px 24px 20px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: visible;
}

.paper-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 32px -8px rgba(0, 0, 0, 0.12), 0 8px 12px -4px rgba(0, 0, 0, 0.04);
}

.paper-clip-large {
  position: absolute;
  top: -17px;
  right: -2px;
  width: 40px;
  height: 56px;
  z-index: 10;
  pointer-events: none;
  filter: drop-shadow(0 8px 4px rgba(0,0,0,0.22));
  transition: transform 0.15s ease;
}

.paper-card:hover .paper-clip-large {
  transform: translateY(-4px) rotate(4deg) scale(1.08);
}

.paper-clip-large svg {
  width: 100%;
  height: 100%;
}

.top-color-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  border-radius: 14px 14px 0 0;
}

.corner-fold {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 0 16px 16px;
  border-color: transparent transparent #f1f5f9 #cbd5e1;
  border-bottom-left-radius: 2px;
  box-shadow: 1px -1px 2px rgba(0,0,0,0.06);
}

.theme-indigo .top-color-bar { background: linear-gradient(90deg, #6366f1, #4f46e5); }
.theme-indigo .clip-path-stroke { stroke: #4f46e5; }
.theme-indigo .field-badge { background: #e0e7ff; color: #3730a3; }
.theme-indigo:hover { border-color: #a5b4fc; }

.theme-emerald .top-color-bar { background: linear-gradient(90deg, #10b981, #059669); }
.theme-emerald .clip-path-stroke { stroke: #059669; }
.theme-emerald .field-badge { background: #d1fae5; color: #065f46; }
.theme-emerald:hover { border-color: #6ee7b7; }

.theme-amber .top-color-bar { background: linear-gradient(90deg, #f59e0b, #d97706); }
.theme-amber .clip-path-stroke { stroke: #d97706; }
.theme-amber .field-badge { background: #fef3c7; color: #92400e; }
.theme-amber:hover { border-color: #fcd34d; }

.theme-rose .top-color-bar { background: linear-gradient(90deg, #f43f5e, #e11d48); }
.theme-rose .clip-path-stroke { stroke: #e11d48; }
.theme-rose .field-badge { background: #ffe4e6; color: #9f1239; }
.theme-rose:hover { border-color: #fda4af; }

.theme-cyan .top-color-bar { background: linear-gradient(90deg, #06b6d4, #0891b2); }
.theme-cyan .clip-path-stroke { stroke: #0891b2; }
.theme-cyan .field-badge { background: #cffafe; color: #155e75; }
.theme-cyan:hover { border-color: #67e8f9; }

.paper-top-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-right: 44px;
}

.field-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
}

.paper-date {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.paper-content {
  margin-bottom: 24px;
}

.paper-title {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.paper-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.paper-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-top: 16px;
  border-top: 1px dashed #e2e8f0;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 4px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-action:hover {
  transform: translateY(-3px);
}

.btn-salin {
  background-color: #e0e7ff;
  color: #4338ca;
  border: 1px solid #c7d2fe;
}
.btn-salin:hover {
  background-color: #4338ca;
  color: #ffffff;
  border-color: #3730a3;
  box-shadow: 0 4px 12px rgba(67, 56, 202, 0.35);
}

.btn-edit {
  background-color: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
}
.btn-edit:hover {
  background-color: #d97706;
  color: #ffffff;
  border-color: #b45309;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.35);
}

.btn-respons {
  background-color: #d1fae5;
  color: #047857;
  border: 1px solid #a7f3d0;
}
.btn-respons:hover {
  background-color: #059669;
  color: #ffffff;
  border-color: #047857;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);
}

.loading-state, .empty-paper {
  text-align: center;
  padding: 60px 20px;
  background: #ffffff;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  margin: 0 auto 12px auto;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.paper-clip-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.toast-floating {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: #0f172a;
  color: white;
  padding: 12px 22px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
  z-index: 99;
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>