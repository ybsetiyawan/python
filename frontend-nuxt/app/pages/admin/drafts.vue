<template>
  <v-container class="py-10 bg-grey-lighten-4" style="min-height: 100vh;">

    <div class="mb-8 d-flex align-end justify-space-between text-no-wrap overflow-hidden">
      <div class="header-content">
        <div class="d-flex align-center mb-1">
          <v-chip color="primary" variant="flat" size="x-small" class="font-weight-black px-3 mr-2">AI OCR</v-chip>
          <div class="status-dot-active mr-1"></div>
          <span class="text-caption font-weight-bold text-grey-darken-1">SYSTEM DADAKAN</span>
        </div>
        <h1 class="text-h4 font-weight-black text-grey-darken-4 tracking-tight">
          Verifikasi <span class="text-primary">Draft</span>
        </h1>
      </div>
    </div>

    <div v-if="drafts.length > 0">
      <v-row v-for="(item, index) in drafts" :key="item.id" class="mb-8" justify="center">
        <v-col cols="12" md="11" lg="10">
          <v-card elevation="2" class="rounded-xl overflow-hidden shadow-soft border">
            <v-row no-gutters>
              <v-col cols="12" md="6" class="bg-grey-lighten-3 relative overflow-hidden viewer-bg" style="height: 420px;">
                <div class="zoom-wrapper" @wheel.prevent="handleWheel($event, index)"
                  @mousedown="startDrag($event, index)" @mousemove="onDrag($event, index)" @mouseup="stopDrag"
                  @mouseleave="stopDrag">
                  
                  <div class="position-absolute z-index-2 d-flex flex-column align-end ma-3" style="top:0; right:0;">
                    <v-btn icon="mdi-rotate-right" size="small" color="primary" class="mb-2" elevation="2" @click="rotateImage(index)"></v-btn>
                    <v-btn icon="mdi-refresh" size="small" color="white" elevation="2" @click="resetView(index)"></v-btn>
                  </div>

                  <div class="zoom-level-badge z-index-2">
                    {{ (item.zoomScale * 100).toFixed(0) }}% | {{ item.rotation }}°
                  </div>

                  <div class="image-container d-flex align-center justify-center" :style="{
                    transform: `scale(${item.zoomScale}) translate(${item.posX}px, ${item.posY}px) rotate(${item.rotation}deg)`,
                    cursor: item.zoomScale > 1 ? 'grab' : 'default'
                  }">
                    <v-img :src="getImageUrl(item.image_path)" width="100%" contain draggable="false" class="ktp-image-render">
                      <template v-slot:placeholder>
                        <v-row class="fill-height ma-0" align="center" justify="center">
                          <v-progress-circular indeterminate color="primary"></v-progress-circular>
                        </v-row>
                      </template>
                    </v-img>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" md="6" class="pa-8 bg-white d-flex flex-column justify-center border-s">
                <div class="mb-6">
                  <v-chip color="primary-lighten-5" text-color="primary" size="x-small" class="font-weight-black mb-1">
                    ITEM #{{ index + 1 }}
                  </v-chip>
                  <h3 class="text-h6 font-weight-bold text-grey-darken-4">Verifikasi Identitas</h3>
                </div>

                <v-form @submit.prevent="save(item)">
                  <div class="mb-4">
                    <div class="d-flex justify-space-between align-center ml-1 mb-1">
                      <span class="text-caption font-weight-bold text-grey-darken-2">NIK</span>
                      <v-chip :color="item.nik?.length === 16 ? 'success' : 'warning'" size="x-small" variant="flat" class="font-weight-black text-white">
                        {{ item.nik?.length || 0 }} / 16
                      </v-chip>
                    </div>
                    <v-text-field 
                      v-model="item.nik" 
                      variant="outlined" 
                      density="comfortable"
                      bg-color="grey-lighten-5"
                      prepend-inner-icon="mdi-identifier" 
                      rounded="lg" 
                      hide-details
                      @input="item.nik = item.nik.replace(/\D/g, '')"
                      maxLength="16"
                    />
                  </div>

                  <div class="mb-8">
                    <span class="text-caption font-weight-bold text-grey-darken-2 ml-1">Nama Lengkap</span>
                    <v-text-field 
                      v-model="item.nama" 
                      variant="outlined" 
                      density="comfortable"
                      bg-color="grey-lighten-5"
                      prepend-inner-icon="mdi-account-outline" 
                      rounded="lg" 
                      hide-details
                    />
                  </div>

                  <v-btn 
                    color="primary" 
                    size="x-large" 
                    block 
                    class="rounded-xl font-weight-bold py-7" 
                    elevation="3"
                    :loading="item.isSaving" 
                    :disabled="!isValid(item)"
                    @click="save(item)"
                  >
                    <span>{{ isValid(item) ? 'KONFIRMASI DATA' : 'LENGKAPI DATA' }}</span>
                    <v-icon end size="small" class="ml-2">
                      {{ isValid(item) ? 'mdi-check-all' : 'mdi-lock-outline' }}
                    </v-icon>
                  </v-btn>
                </v-form>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-row v-else justify="center" class="mt-10">
      <v-col cols="12" md="6" class="text-center">
        <v-card class="pa-10 rounded-xl border shadow-soft" variant="flat">
          <v-icon size="100" color="grey-lighten-1" class="mb-4">mdi-file-check-outline</v-icon>
          <h2 class="text-h5 font-weight-black text-grey-darken-3">Semua Data Terverifikasi!</h2>
          <p class="text-body-2 text-grey-darken-1 mb-8 mt-2">
            Tidak ada draft tersisa untuk dikonfirmasi. Anda bisa mengunggah dokumen baru sekarang.
          </p>
          <v-btn 
            color="primary" 
            prepend-icon="mdi-upload" 
            size="large" 
            class="rounded-lg px-8 font-weight-bold" 
            @click="router.push('/admin/upload')"
          >
            UNGGAH DOKUMEN BARU
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" elevation="24" rounded="lg" :timeout="3000">
      <div class="d-flex align-center">
        <v-icon start>{{ snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}</v-icon>
        <span class="font-weight-bold">{{ snackbar.message }}</span>
      </div>
    </v-snackbar>

  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRouter, useNuxtApp, useRuntimeConfig } from "#imports";
import { useAuth } from "~~/app/composables/useAuth";

const config = useRuntimeConfig()
const router = useRouter();
const { getToken } = useAuth();
const drafts = ref<any[]>([])
const isDragging = ref(false)
const lastMousePos = ref({ x: 0, y: 0 })
const snackbar = ref({ show: false, message: "", color: "success" })

onMounted(async () => {
  const token = getToken();
  if (!token) {
    router.push("/login");
    return;
  }
  loadDrafts();
});

const isValid = (item: any) => {
  return (item.nik?.length === 16) && (item.nama?.trim().length > 0)
}


function getImageUrl(path: string) {
  if (!path) return ''
  const cleanPath = path.replace(/\\/g, '/')
  return `${config.public.fileBase}/${cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath}`
}

async function loadDrafts() {
  try {
    const { $api } = useNuxtApp()
    // Jika token expired, request ini akan memicu redirect otomatis dari api.ts
    const data: any = await $api("/ocr/drafts")
    
    drafts.value = data.map((d: any) => ({
      ...d,
      isSaving: false, 
      zoomScale: 1, 
      posX: 0, 
      posY: 0, 
      rotation: 0
    }))
  } catch (err: any) {
    // Kita cek jika bukan error 401 (karena 401 sudah dihandle api.ts)
    if (err.status !== 401) {
      notify("Gagal memuat data draft dari server", "error")
    }
    console.error("Gagal load data:", err)
  }
}

async function save(item: any) {
  item.isSaving = true
  try {
    const { $api } = useNuxtApp()
    
    // Request PUT untuk update data
    await $api(`/ocr/${item.id}`, { 
      method: "PUT", 
      body: item 
    })
    
    notify(`Data ${item.nama} berhasil disimpan`, "success")

    // Animasi transisi halus sebelum menghapus dari list
    setTimeout(() => {
      drafts.value = drafts.value.filter(d => d.id !== item.id)
      
      // Jika data sudah habis, arahkan kembali ke upload
      if (drafts.value.length === 0) {
        navigateTo("/admin/upload")
      }
    }, 300)
    
  } catch (err: any) {
    // Tampilkan pesan error spesifik dari backend jika ada (misal: "NIK sudah terdaftar")
    // Tapi lewati jika error 401 agar tidak tabrakan dengan redirect logout
    if (err.status !== 401) {
      const errorMsg = err.data?.message || "Gagal menyimpan perubahan"
      notify(errorMsg, "error")
    }
  } finally {
    item.isSaving = false
  }
}

// UI Handlers (Zoom, Drag, Rotate)
function rotateImage(index: number) { drafts.value[index].rotation = (drafts.value[index].rotation + 90) % 360 }
function handleWheel(e: WheelEvent, i: number) {
  const delta = e.deltaY * -0.0012
  const next = drafts.value[i].zoomScale + delta
  if (next >= 1 && next <= 6) drafts.value[i].zoomScale = next
}
function startDrag(e: MouseEvent, i: number) {
  if (drafts.value[i].zoomScale <= 1.05) return
  isDragging.value = true
  lastMousePos.value = { x: e.clientX, y: e.clientY }
}
function onDrag(e: MouseEvent, i: number) {
  if (!isDragging.value) return
  const item = drafts.value[i]
  item.posX += (e.clientX - lastMousePos.value.x) / item.zoomScale
  item.posY += (e.clientY - lastMousePos.value.y) / item.zoomScale
  lastMousePos.value = { x: e.clientX, y: e.clientY }
}
function stopDrag() { isDragging.value = false }
function resetView(i: number) {
  Object.assign(drafts.value[i], { zoomScale: 1, posX: 0, posY: 0, rotation: 0 })
}
function notify(msg: string, type: 'success' | 'error' = 'success') {
  snackbar.value = { show: true, message: msg, color: type }
}
</script>

<style scoped>
.tracking-tight { letter-spacing: -1px !important; }
.status-dot-active { width: 6px; height: 6px; background-color: #4caf50; border-radius: 50%; box-shadow: 0 0 8px rgba(76, 175, 80, 0.4); animation: pulse 2s infinite; }
@keyframes pulse { 0% { transform: scale(0.95); opacity: 0.7; } 70% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(0.95); opacity: 0.7; } }
.viewer-bg { background-image: radial-gradient(#cbd5e1 0.5px, transparent 0.5px); background-size: 15px 15px; }
.zoom-wrapper { width: 100%; height: 100%; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.image-container { width: 100%; height: 100%; transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); transform-origin: center center; }
.zoom-level-badge { position: absolute; bottom: 12px; left: 12px; background: rgba(0, 0, 0, 0.6); color: white; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: bold; }
.ktp-image-render { filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.15)); }
.z-index-2 { z-index: 2; }
.shadow-soft { box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05) !important; }
.border-s { border-left: 1px solid #f0f0f0 !important; }
</style>