<template>
  <v-container class="py-8">
    <v-card 
      elevation="3" 
      class="pa-6 rounded-lg upload-card"
      :class="{ 'card-loaded': true }"
    >
      <v-card-title class="text-h5 font-weight-bold mb-4 d-flex align-center">
        <v-icon 
          start 
          color="primary"
          class="title-icon"
        >
          mdi-card-account-details
        </v-icon>
        Upload KTP (Max 10 File)
      </v-card-title>

      <!-- Alert dengan animasi -->
      <v-alert 
        v-if="errorList.length" 
        type="error" 
        variant="tonal" 
        class="mb-4 animate-slide-down" 
        closable
      >
        <div v-for="(err, i) in errorList" :key="i">
          <v-icon size="small" class="mr-1">mdi-alert-circle</v-icon> {{ err }}
        </div>
      </v-alert>

      <!-- Alert success -->
      <v-alert 
        v-if="successList.length" 
        type="success" 
        variant="tonal" 
        class="mb-4 animate-slide-down" 
        closable
      >
        <div v-for="(msg, i) in successList" :key="i">
          <v-icon size="small" class="mr-1">mdi-check-circle</v-icon> {{ msg }}
        </div>
      </v-alert>

      <!-- Button dengan animasi -->
      <v-btn 
        v-if="showGoDraftButton" 
        color="success" 
        variant="elevated" 
        class="mb-6 animate-pulse"
        prepend-icon="mdi-arrow-right-circle" 
        @click="router.push('/admin/drafts')"
      >
        Lanjut ke Drafts
      </v-btn>

      <!-- File Input -->
      <div class="file-input-wrapper">
        <v-file-input 
          :model-value="files" 
          :disabled="loading" 
          multiple
          accept="image/*" 
          label="Pilih File KTP"
          prepend-inner-icon="mdi-camera" 
          prepend-icon="" 
          variant="outlined" 
          counter 
          show-size
          @update:modelValue="handleFiles" 
        />
      </div>

      <!-- Preview Grid -->
      <v-row class="mt-4" v-if="previews.length">
        <v-col 
          v-for="(img, i) in previews" 
          :key="i" 
          cols="12" sm="6" md="4" lg="3"
        >
          <div class="preview-item" :style="{ animationDelay: `${i * 0.1}s` }">
            <v-hover v-slot="{ isHovering, props }">
              <v-card 
                v-bind="props" 
                :elevation="isHovering ? 8 : 3" 
                class="position-relative rounded-lg overflow-hidden preview-card"
                :class="{ 
                  'hovering': isHovering,
                  'uploaded': uploadStatus[i] === 'success',
                  'failed': uploadStatus[i] === 'failed',
                  'processing': uploadStatus[i] === 'processing'
                }"
              >
                <v-img :src="img" height="200" cover class="bg-grey-lighten-2">
                  <!-- Overlay status upload -->
                  <v-overlay 
                    :model-value="uploadStatus[i] === 'success' || uploadStatus[i] === 'failed' || uploadStatus[i] === 'processing'" 
                    contained 
                    scrim="black" 
                    class="align-center justify-center"
                    persistent
                  >
                    <div class="d-flex flex-column align-center ga-2">
                      <v-icon 
                        v-if="uploadStatus[i] === 'success'"
                        color="success" 
                        size="48"
                      >
                        mdi-check-circle
                      </v-icon>
                      <v-icon 
                        v-else-if="uploadStatus[i] === 'failed'"
                        color="error" 
                        size="48"
                      >
                        mdi-alert-circle
                      </v-icon>
                      <v-progress-circular 
                        v-else-if="uploadStatus[i] === 'processing'"
                        indeterminate 
                        color="white" 
                        size="40"
                      />
                      <span 
                        v-if="uploadStatus[i] === 'success'"
                        class="text-white text-subtitle-1 font-weight-bold"
                      >
                        ✓ Berhasil
                      </span>
                      <span 
                        v-else-if="uploadStatus[i] === 'failed'"
                        class="text-white text-subtitle-1 font-weight-bold"
                      >
                        ✗ Gagal - Upload Ulang
                      </span>
                      <span 
                        v-else-if="uploadStatus[i] === 'processing'"
                        class="text-white text-subtitle-1 font-weight-bold"
                      >
                        Memproses...
                      </span>
                    </div>
                  </v-overlay>

                  <v-overlay 
                    :model-value="!!isHovering && uploadStatus[i] !== 'success' && uploadStatus[i] !== 'processing'" 
                    contained 
                    scrim="black" 
                    class="align-center justify-center"
                    persistent
                  >
                    <div class="d-flex ga-2">
                      <v-btn 
                        color="info" 
                        icon="mdi-rotate-right" 
                        size="small" 
                        title="Rotasi 90°"
                        :disabled="loading || uploadStatus[i] === 'processing'" 
                        class="action-btn"
                        @click.stop="rotateImage(i)"
                      ></v-btn>
                      <v-btn 
                        color="warning" 
                        icon="mdi-crop" 
                        size="small" 
                        title="Crop KTP"
                        :disabled="loading || uploadStatus[i] === 'processing'" 
                        class="action-btn"
                        @click.stop="openCropDialog(i)"
                      ></v-btn>
                      <v-btn 
                        v-if="uploadStatus[i] === 'failed'"
                        color="primary" 
                        icon="mdi-refresh" 
                        size="small" 
                        title="Upload Ulang"
                        :disabled="loading" 
                        class="action-btn"
                        @click.stop="retryUpload(i)"
                      ></v-btn>
                      <v-btn 
                        color="error" 
                        icon="mdi-delete" 
                        size="small" 
                        title="Hapus Gambar"
                        :disabled="loading || uploadStatus[i] === 'processing'" 
                        class="action-btn"
                        @click.stop="removeImage(i)"
                      ></v-btn>
                    </div>
                  </v-overlay>

                  <template v-slot:placeholder>
                    <v-row class="fill-height ma-0" align="center" justify="center">
                      <v-progress-circular indeterminate color="grey-lighten-5" />
                    </v-row>
                  </template>
                </v-img>
                
                <!-- NAMA FILE DI BAWAH GAMBAR -->
                <div class="image-title-wrapper px-2 py-1">
                  <div class="image-title d-flex align-center">
                    <v-icon size="small" color="grey" class="mr-1">mdi-file-image</v-icon>
                    <span class="file-name text-truncate">{{ getFileName(i) }}</span>
                    <span class="file-extension">{{ getFileExtension(i) }}</span>
                  </div>
                </div>
                
                <div class="text-caption text-center py-1 bg-grey-lighten-3 status-bar" style="font-size: 11px; font-weight: 500;">
                  <v-icon 
                    size="small" 
                    :color="imageStatus[i] === 'Cropped' ? 'success' : imageStatus[i] === 'Rotated' ? 'info' : 'grey'"
                    class="status-icon"
                  >
                    {{ imageStatus[i] === 'Cropped' ? 'mdi-check-circle' : imageStatus[i] === 'Rotated' ? 'mdi-rotate-right' : 'mdi-file-image' }}
                  </v-icon>
                  <span class="status-text">{{ imageStatus[i] || 'Original' }}</span>
                </div>
              </v-card>
            </v-hover>
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-6" v-if="previews.length"></v-divider>

      <!-- Upload Button dengan animasi -->
      <v-btn 
        color="primary" 
        size="large" 
        block 
        :disabled="!files.length || loading" 
        :loading="loading"
        prepend-icon="mdi-cloud-upload" 
        class="upload-btn"
        @click="upload"
      >
        <span class="btn-text">Mulai Upload & OCR</span>
        <v-progress-circular
          v-if="loading"
          indeterminate
          size="20"
          color="white"
          class="ml-2"
        />
      </v-btn>
    </v-card>

    <!-- Dialog Crop dengan Cropper.js -->
    <v-dialog 
      v-model="cropDialog" 
      max-width="95vw" 
      max-height="95vh" 
      persistent
      transition="dialog-bottom-transition"
    >
      <v-card class="crop-dialog">
        <v-card-title class="d-flex align-center pa-4">
          <span class="text-h5 font-weight-bold">✂️ Crop KTP</span>
          <v-spacer></v-spacer>
          <v-btn 
            icon="mdi-close" 
            variant="text" 
            @click="closeCropDialog"
            class="close-btn"
          ></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-4">
          <div class="crop-container-wrapper">
            <div class="d-flex justify-center crop-area" style="background: #1a1a1a; border-radius: 12px; padding: 16px; min-height: 400px;">
              <div style="max-height: 65vh; width: 100%; position: relative;">
                <img 
                  ref="cropperImageRef" 
                  :src="cropImageUrl" 
                  style="max-width: 100%; display: block;"
                  alt="Crop Image"
                />
                <!-- Animasi loading saat crop -->
                <div v-if="cropLoading" class="crop-loading-overlay">
                  <v-progress-circular indeterminate color="white" size="50" />
                </div>
              </div>
            </div>
          </div>
          
          <!-- Controls -->
          <div class="d-flex align-center ga-4 mt-4 flex-wrap controls-wrapper">
            <v-btn-group variant="outlined" density="comfortable">
              <v-btn 
                size="small" 
                prepend-icon="mdi-arrow-expand" 
                @click="resetCropper"
                class="control-btn"
              >
                Reset
              </v-btn>
              <v-btn 
                size="small" 
                prepend-icon="mdi-aspect-ratio" 
                @click="setKTPRatio"
                class="control-btn"
              >
                Rasio KTP
              </v-btn>
              <v-btn 
                size="small" 
                prepend-icon="mdi-vector-square" 
                @click="setFreeRatio"
                class="control-btn"
              >
                Bebas
              </v-btn>
            </v-btn-group>
            
            <div style="flex: 1; min-width: 150px;">
              <v-slider
                v-model="zoomLevel"
                min="0"
                max="2"
                step="0.01"
                label="Zoom"
                hide-details
                class="zoom-slider"
                @update:model-value="onZoomChange"
              ></v-slider>
            </div>
          </div>
          
          <!-- Informasi ukuran crop -->
          <div class="d-flex justify-center ga-4 mt-3 crop-info" v-if="cropData">
            <v-chip size="small" variant="outlined" class="info-chip">
              <v-icon start size="small">mdi-arrow-expand</v-icon>
              {{ Math.round(cropData.width || 0) }} × {{ Math.round(cropData.height || 0) }}px
            </v-chip>
            <v-chip size="small" variant="outlined" color="info" class="info-chip">
              <v-icon start size="small">mdi-aspect-ratio</v-icon>
              Rasio: {{ cropData.width && cropData.height ? (cropData.width / cropData.height).toFixed(3) : 'N/A' }}
            </v-chip>
          </div>
        </v-card-text>
     
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn 
            variant="text" 
            size="large" 
            :disabled="cropLoading" 
            @click="closeCropDialog"
            class="cancel-btn"
          >
            Batal
          </v-btn>
          <v-btn 
            color="primary" 
            size="large" 
            @click="applyCrop" 
            :loading="cropLoading"
            class="apply-btn"
          >
            <v-icon start>mdi-check</v-icon>
            Terapkan Crop
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
// Proteksi akses menu secara dinamis menggunakan middleware
definePageMeta({
  layout: "admin",
  middleware: ["auth-menu"]
})

import { ref, onBeforeUnmount, onMounted, nextTick, watch, computed } from "vue"
import { useRouter } from "#imports";
import { useAuth } from "~~/app/composables/useAuth";

let Cropper: any = null

const router = useRouter();
const { getToken } = useAuth();
const { $api } = useNuxtApp()

const files = ref<File[]>([])
const previews = ref<string[]>([])
const loading = ref(false)
const errorList = ref<string[]>([])
const successList = ref<string[]>([])
const showGoDraftButton = ref(false)
const imageStatus = ref<string[]>([])
const uploadStatus = ref<string[]>([])

// const failedFiles = computed(() => {
//   return files.value.filter((_, index) => uploadStatus.value[index] === 'failed')
// })

const cropDialog = ref(false)
const cropIndex = ref(-1)
const cropImageUrl = ref<string>('')
const cropLoading = ref(false)
const cropperImageRef = ref<HTMLImageElement | null>(null)
let cropperInstance: any = null
const zoomLevel = ref(0)
const cropData = ref<{ width: number; height: number } | null>(null)

onMounted(async () => {
  const token = getToken();
  if (!token) {
    router.push("/login");
    return;
  }
  
  if (process.client) {
    try {
      // @ts-ignore
      const module = await import('cropperjs')
      Cropper = module.default
    } catch (err) {
      console.error('❌ Failed to load Cropper.js:', err)
    }
  }
})

onBeforeUnmount(() => {
  clearPreviews()
  destroyCropper()
})

function getFileName(index: number): string {
  const file = files.value[index]
  if (!file) return 'unknown'
  const name = file.name
  const lastDot = name.lastIndexOf('.')
  if (lastDot === -1) return name
  return name.substring(0, lastDot)
}

function getFileExtension(index: number): string {
  const file = files.value[index]
  if (!file) return ''
  const name = file.name
  const lastDot = name.lastIndexOf('.')
  if (lastDot === -1) return ''
  return name.substring(lastDot)
}

function clearPreviews() {
  for (let i = 0; i < previews.value.length; i++) {
    const url = previews.value[i]
    if (url) {
      try {
        URL.revokeObjectURL(url)
      } catch (e) {
        // ignore
      }
    }
  }
}

function handleFiles(selected: File | File[] | null) {
  if (!selected || (Array.isArray(selected) && selected.length === 0)) {
    clearPreviews()
    files.value = []
    previews.value = []
    imageStatus.value = []
    uploadStatus.value = []
    return
  }

  const arr = Array.isArray(selected) ? selected : [selected]
  const limited = arr.slice(0, 10)

  clearPreviews()
  files.value = limited
  previews.value = limited.map((file) => URL.createObjectURL(file))
  imageStatus.value = limited.map(() => 'Original')
  uploadStatus.value = limited.map(() => 'idle')
}

function removeImage(index: number) {
  if (index < 0 || index >= previews.value.length) return
  
  const url = previews.value[index]
  if (url) {
    try {
      URL.revokeObjectURL(url)
    } catch (e) {
      // ignore
    }
  }

  const newFiles = [...files.value]
  newFiles.splice(index, 1)
  files.value = newFiles

  previews.value.splice(index, 1)
  imageStatus.value.splice(index, 1)
  uploadStatus.value.splice(index, 1)
}

async function rotateImage(index: number) {
  if (index < 0 || index >= files.value.length) return
  
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const img = new Image()
    const file = files.value[index]
    if (!file) return
    
    const url = URL.createObjectURL(file)
    
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = url
    })
    
    canvas.width = img.height
    canvas.height = img.width
    ctx.translate(canvas.width/2, canvas.height/2)
    ctx.rotate(Math.PI/2)
    ctx.drawImage(img, -img.width/2, -img.height/2)
    
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b: Blob | null) => {
        if (b) resolve(b)
        else reject(new Error('Failed to convert to blob'))
      }, 'image/jpeg', 0.95)
    })
    
    const rotatedFile = new File([blob], file.name, { type: 'image/jpeg' })
    files.value[index] = rotatedFile
    
    if (previews.value[index]) {
      try {
        URL.revokeObjectURL(previews.value[index])
      } catch (e) {}
    }
    previews.value[index] = URL.createObjectURL(rotatedFile)
    
    const currentRotation = parseInt(imageStatus.value[index]?.match(/\d+/)?.join('') || '0')
    imageStatus.value[index] = `Rotated ${(currentRotation + 90) % 360}°`
    
    try {
      URL.revokeObjectURL(url)
    } catch (e) {}
  } catch (err) {
    console.error('Rotasi gagal:', err)
    errorList.value.push('Gagal merotasi gambar')
  }
}

function openCropDialog(index: number) {
  if (index < 0 || index >= previews.value.length) return
  
  cropIndex.value = index
  cropImageUrl.value = previews.value[index] || ''
  cropDialog.value = true
  zoomLevel.value = 0
  cropData.value = null
  
  nextTick(() => {
    initCropper()
  })
}

function closeCropDialog() {
  cropDialog.value = false
  cropImageUrl.value = ''
  cropIndex.value = -1
  cropData.value = null
  destroyCropper()
}

function initCropper() {
  destroyCropper()
  if (!Cropper || !cropperImageRef.value) return
  
  try {
    const options: any = {
      viewMode: 1,
      dragMode: 'crop',
      aspectRatio: NaN,
      autoCropArea: 0.9,
      rotatable: false,
      scalable: true,
      zoomable: true,
      crop: (event: any) => {
        if (event.detail) {
          cropData.value = {
            width: event.detail.width,
            height: event.detail.height
          }
        }
      }
    }
    cropperInstance = new (Cropper as any)(cropperImageRef.value, options)
  } catch (err) {
    console.error('Error initializing cropper:', err)
  }
}

function destroyCropper() {
  if (cropperInstance) {
    try {
      cropperInstance.destroy()
    } catch (e) {}
    cropperInstance = null
  }
}

function resetCropper() {
  if (cropperInstance) {
    cropperInstance.reset()
    zoomLevel.value = 0
    cropData.value = null
  }
}

function onZoomChange(value: number) {
  if (cropperInstance) {
    const zoomRatio = value * 0.5 + 1
    cropperInstance.zoomTo(zoomRatio)
  }
}

function setKTPRatio() {
  if (cropperInstance) cropperInstance.setAspectRatio(1.586)
}

function setFreeRatio() {
  if (cropperInstance) cropperInstance.setAspectRatio(NaN)
}

async function applyCrop() {
  if (!cropperInstance || cropIndex.value === -1) return
  cropLoading.value = true
  
  try {
    const croppedCanvas = cropperInstance.getCroppedCanvas({
      width: 800,
      height: 1260,
      fillColor: '#fff',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    })
    
    if (!croppedCanvas) throw new Error('Gagal mendapatkan hasil crop')
    
    const blob = await new Promise<Blob>((resolve, reject) => {
      croppedCanvas.toBlob((b: Blob | null) => {
        if (b) resolve(b)
        else reject(new Error('Gagal konversi ke blob'))
      }, 'image/jpeg', 0.95)
    })
    
    const file = files.value[cropIndex.value]
    if (!file) throw new Error('File not found')
    
    const croppedFile = new File([blob], file.name, { type: 'image/jpeg' })
    files.value[cropIndex.value] = croppedFile
    
  const previewUrl = previews.value[cropIndex.value]
    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl)
      } catch (e) {}
    }

    previews.value[cropIndex.value] = URL.createObjectURL(croppedFile)
    imageStatus.value[cropIndex.value] = 'Cropped'
    closeCropDialog()
  } catch (err) {
    console.error('Crop gagal:', err)
    errorList.value.push('Gagal melakukan crop pada gambar')
  } finally {
    cropLoading.value = false
  }
}

watch(cropDialog, (newVal: boolean) => {
  if (!newVal) destroyCropper()
})

async function upload() {
  if (!files.value.length) return

  loading.value = true
  errorList.value = []
  successList.value = []
  showGoDraftButton.value = false

  for (let i = 0; i < files.value.length; i++) {
    uploadStatus.value[i] = 'processing'
  }

  const formData = new FormData()
  for (let i = 0; i < files.value.length; i++) {
    const file = files.value[i]
    if (file) formData.append("files", file)
  }

  try {
    const res: any = await $api("/ocr", {
      method: "POST",
      body: formData
    })

    for (let i = 0; i < res.results.length; i++) {
      const item = res.results[i]
      if (item.error) {
        uploadStatus.value[i] = 'failed'
        errorList.value.push(`${item.filename}: ${item.error}`)
      } else {
        uploadStatus.value[i] = 'success'
        successList.value.push(`${item.filename}: Berhasil di-upload`)
      }
    }

    if (uploadStatus.value.some(status => status === 'success')) {
      showGoDraftButton.value = true
    }

    setTimeout(() => {
      const newFiles: File[] = []
      const newPreviews: string[] = []
      const newStatus: string[] = []
      const newUploadStatus: string[] = []
      
      for (let i = 0; i < files.value.length; i++) {
        const file = files.value[i]
        const preview = previews.value[i]
        const status = imageStatus.value[i]
        const uploadStat = uploadStatus.value[i]
        
        if (uploadStat === 'success') {
          if (preview) {
            try { URL.revokeObjectURL(preview) } catch (e) {}
          }
        } else {
          if (file && preview && status && uploadStat) {
            newFiles.push(file)
            newPreviews.push(preview)
            newStatus.push(status)
            newUploadStatus.push(uploadStat)
          }
        }
      }
      
      files.value = newFiles
      previews.value = newPreviews
      imageStatus.value = newStatus
      uploadStatus.value = newUploadStatus
    }, 3000)

    loading.value = false
  } catch (err: any) {
    for (let i = 0; i < files.value.length; i++) {
      uploadStatus.value[i] = 'failed'
    }
    errorList.value = [err?.data?.error || "Gagal menghubungi server."]
    loading.value = false
  }
}

async function retryUpload(index: number) {
  if (index < 0 || index >= files.value.length || uploadStatus.value[index] !== 'failed') return
  
  const file = files.value[index]
  if (!file) return
  
  uploadStatus.value[index] = 'processing'
  const formData = new FormData()
  formData.append("files", file)
  
  try {
    const res: any = await $api("/ocr", { method: "POST", body: formData })
    if (res.results && res.results[0]) {
      const item = res.results[0]
      if (item.error) {
        uploadStatus.value[index] = 'failed'
        errorList.value.push(`${item.filename}: ${item.error}`)
      } else {
        uploadStatus.value[index] = 'success'
        successList.value.push(`${item.filename}: Berhasil di-upload ulang`)
        
        setTimeout(() => {
          if (previews.value[index]) {
            try { URL.revokeObjectURL(previews.value[index]) } catch (e) {}
          }
          files.value.splice(index, 1)
          previews.value.splice(index, 1)
          imageStatus.value.splice(index, 1)
          uploadStatus.value.splice(index, 1)
        }, 3000)
        
        if (!uploadStatus.value.some(status => status === 'failed') && uploadStatus.value.length > 0) {
          showGoDraftButton.value = true
        }
      }
    }
  } catch (err: any) {
    uploadStatus.value[index] = 'failed'
    errorList.value.push('Gagal upload ulang file')
  }
}
</script>

<style scoped>
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.upload-card { transition: all 0.3s ease; }
.upload-card:hover { box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12) !important; }
.title-icon { animation: pulse 2s infinite; }
.animate-slide-down { animation: slideDown 0.5s ease forwards; }
.animate-pulse { animation: pulse 2s infinite; }

.upload-btn {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}
.upload-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(25, 118, 210, 0.4);
}

.preview-item { opacity: 0; animation: fadeInUp 0.5s ease forwards; }
.preview-card { transition: all 0.3s ease; position: relative; }
.preview-card.hovering { transform: scale(1.02); }
.preview-card.uploaded { border: 2px solid #4caf50; }
.preview-card.failed { border: 2px solid #f44336; }
.preview-card.processing { border: 2px solid #ff9800; }

.image-title-wrapper {
  padding: 4px 8px !important;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.image-title { font-size: 12px; color: #333; min-height: 24px; }
.image-title .file-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
.image-title .file-extension { color: #999; font-weight: 400; margin-left: 2px; flex-shrink: 0; }

.crop-loading-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.5); border-radius: 12px; z-index: 20;
}
</style>