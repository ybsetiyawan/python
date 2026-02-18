<template>
  <v-app class="bg-grey-lighten-4">
    <v-navigation-drawer 
      v-model="drawer" 
      elevation="0" 
      class="border-e-sm"
      :width="280"
    >
      <div class="pa-6 d-flex align-center">
        <v-avatar color="primary" size="32" class="mr-3" elevation="2">
          <v-icon color="white" size="18">mdi-account</v-icon>
        </v-avatar>
        <div>
          <div class="text-subtitle-2 font-weight-black leading-tight">Welcome {{ userName }}</div>
          <div class="text-caption text-grey">Powered by EDP SBY @2026</div>
        </div>
      </div>

      <v-divider class="mx-4 mb-4"></v-divider>

      <v-list nav density="comfortable" class="px-4">
        <v-list-subheader class="text-uppercase font-weight-bold text-caption text-grey-darken-1">Menu Utama</v-list-subheader>
        <v-list-item 
          to="/admin/dashboard" 
          prepend-icon="mdi-view-dashboard-outline" 
          color="primary"
          rounded="lg"
          title="Dashboard"
          class="mb-1"
        />

        <v-list-item 
          to="/admin/upload" 
          prepend-icon="mdi-cloud-upload-outline" 
          color="primary"
          rounded="lg"
          title="Upload Dokumen"
          class="mb-1"
        />

        <v-list-item 
          to="/admin/drafts" 
          prepend-icon="mdi-file-check-outline" 
          color="primary"
          rounded="lg"
          title="Verifikasi Draft"
          class="mb-1"
        />
        
        <v-list-item 
          @click="showExportDialog = true"
          prepend-icon="mdi-file-export-outline" 
          color="primary"
          rounded="lg"
          title="Ekspor Data"
          class="mb-1"
          link
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar 
      elevation="0" 
      class="border-b-sm bg-white px-4"
      flat
    >
      <v-app-bar-nav-icon @click="drawer = !drawer" class="d-md-none" />
      
      <v-app-bar-title class="font-weight-black text-grey-darken-3">
        KTP <span class="text-primary">OCR</span>
      </v-app-bar-title>

      <v-spacer />

      <div class="d-flex align-center">
        <v-avatar size="36" color="primary" class="mr-3">
          <span class="text-white font-weight-bold">{{ userInitials }}</span>
        </v-avatar>
        <div class="overflow-hidden">
          <div class="text-subtitle-2 font-weight-black text-truncate text-grey-darken-4">
            {{ userName }}
          </div>
          <v-tooltip text="Keluar dari sistem" location="bottom">
            <template #activator="{ props }">
              <div
                v-bind="props"
                class="text-caption text-primary font-weight-bold cursor-pointer d-flex align-center"
                @click="logout"
              >
                <v-icon size="12" class="mr-1">mdi-logout</v-icon>
                Keluar
              </div>
            </template>
          </v-tooltip>
        </div>
      </div>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-0">
        <v-fade-transition mode="out-in">
          <div class="pa-4 pa-md-8">
            <slot />
          </div>
        </v-fade-transition>
      </v-container>
    </v-main>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      location="top right"
      timeout="3000"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Tutup</v-btn>
      </template>
    </v-snackbar>

    <v-dialog v-model="showExportDialog" max-width="400">
  <v-card>
    <v-card-title class="font-weight-bold">
      Password Ekspor Data
    </v-card-title>

    <v-card-text>
      <v-text-field
        v-model="exportPassword"
        label="Masukkan Password"
        type="password"
        variant="outlined"
        density="comfortable"
        autofocus
      />
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="showExportDialog = false">
        Batal
      </v-btn>
      <v-btn 
        color="primary" 
        :loading="exportLoading"
        @click="exportExcel"
      >
        Download
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useNuxtApp } from "#imports"
import { useAuth } from "~~/app/composables/useAuth"
const showExportDialog = ref(false)
const exportPassword = ref("")
const exportLoading = ref(false)


const router = useRouter()
const { logout: authLogout } = useAuth()
const drawer = ref(true)
const userName = ref('Guest')

// State untuk notifikasi notify
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

// Fungsi helper notify
function notify(message: string, color: string = 'success') {
  snackbar.value.text = message
  snackbar.value.color = color
  snackbar.value.show = true
}

onMounted(() => {
  const userData = localStorage.getItem("user_data")
  if (userData) {
    try {
      const user = JSON.parse(userData)
      userName.value = user.name || 'User'
    } catch (e) {
      console.error("Gagal parsing user data")
    }
  }
})

const userInitials = computed(() => {
  if (!userName.value || userName.value === 'Guest') return 'G'
  const parts = userName.value.split(/[.\s]/).filter(Boolean)
  if (parts.length > 1) {
    const a = parts[0]?.[0] ?? ''
    const b = parts[1]?.[0] ?? ''
    const initials = (a + b).toUpperCase()
    return initials || 'G'
  }
  const fallback = (userName.value.substring(0, 2) ?? '').toUpperCase()
  return fallback || 'G'
})

function logout() {
  authLogout() // Memanggil logout dari useAuth agar redirect konsisten
}

// async function exportExcel() {
//   try {
//     const { $api } = useNuxtApp()

//     // Menggunakan $api agar interceptor auth/expired di api.ts berjalan
//     const blob: Blob = await $api("/api/ocr/export", {
//       method: "GET",
//       responseType: "blob"
//     })

//     const url = window.URL.createObjectURL(blob)
//     const a = document.createElement("a")
//     a.href = url
//     a.download = `ktp_export_${new Date().getTime()}.xlsx`
//     document.body.appendChild(a)
//     a.click()
    
//     window.URL.revokeObjectURL(url)
//     document.body.removeChild(a)
    
//     notify("Data berhasil diekspor ke Excel", "success")

//   } catch (err: any) {
//     // Abaikan jika error 401 karena sudah ditangani api.ts (redirect logout)
//     if (err.status !== 401) {
//       console.error("Gagal export excel:", err)
//       notify(err.data?.message || "Gagal mengunduh file Excel", "error")
//     }
//   }
// }

async function exportExcel() {
  if (!exportPassword.value) {
    notify("Password tidak boleh kosong", "error")
    return
  }

  exportLoading.value = true

  try {
    const { $api } = useNuxtApp()

    const blob: Blob = await $api(
      `/api/ocr/export?password=${encodeURIComponent(exportPassword.value)}`,
      {
        method: "GET",
        responseType: "blob"
      }
    )

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ktp_export_${new Date().getTime()}.xlsx`
    document.body.appendChild(a)
    a.click()

    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    notify("Data berhasil diekspor", "success")

    showExportDialog.value = false
    exportPassword.value = ""

  } catch (err: any) {
    if (err.status === 403) {
      notify("Password export tidak valid", "error")
    } else if (err.status !== 401) {
      notify("Gagal mengunduh file Excel", "error")
    }
  } finally {
    exportLoading.value = false
  }
}

</script>

<style scoped>
.leading-tight { line-height: 1.2; }
/* Scrollbar halus untuk sidebar */
:deep(.v-navigation-drawer__content::-webkit-scrollbar) { width: 4px; }
:deep(.v-navigation-drawer__content::-webkit-scrollbar-thumb) { background: #e0e0e0; border-radius: 10px; }
.v-main { background-color: #f8fafc; }
</style>