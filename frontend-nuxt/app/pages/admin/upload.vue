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

      <!-- Upload Ulang Button untuk file gagal -->
    
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
          
          <!-- Controls - Hanya Crop, tanpa Rotate -->
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
definePageMeta({
  layout: "admin"
})

import { ref, onBeforeUnmount, onMounted, nextTick, watch, computed } from "vue"
import { useRouter } from "#imports";
import { useAuth } from "~~/app/composables/useAuth";

// Dynamic import untuk Cropper.js
let Cropper: any = null

const router = useRouter();
const { getToken } = useAuth();
const { $api } = useNuxtApp()

// ==================== STATE ====================
const files = ref<File[]>([])
const previews = ref<string[]>([])
const loading = ref(false)
const errorList = ref<string[]>([])
const successList = ref<string[]>([])
const showGoDraftButton = ref(false)
const imageStatus = ref<string[]>([])
const uploadStatus = ref<string[]>([]) // 'idle' | 'processing' | 'success' | 'failed'

// Computed untuk file yang gagal
const failedFiles = computed(() => {
  return files.value.filter((_, index) => uploadStatus.value[index] === 'failed')
})

// State untuk crop
const cropDialog = ref(false)
const cropIndex = ref(-1)
const cropImageUrl = ref<string>('')
const cropLoading = ref(false)
const cropperImageRef = ref<HTMLImageElement | null>(null)
let cropperInstance: any = null
const zoomLevel = ref(0)
const cropData = ref<{ width: number; height: number } | null>(null)

// ==================== LIFECYCLE ====================
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
      console.log('✅ Cropper.js loaded successfully')
    } catch (err) {
      console.error('❌ Failed to load Cropper.js:', err)
    }
  }
})

onBeforeUnmount(() => {
  clearPreviews()
  destroyCropper()
})

// ==================== FUNGSI UTILITY ====================
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

// ==================== ROTASI GAMBAR ====================
async function rotateImage(index: number) {
  if (index < 0 || index >= files.value.length) {
    console.error('Index out of bounds')
    return
  }
  
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }
    
    const img = new Image()
    const file = files.value[index]
    if (!file) {
      throw new Error('File not found')
    }
    
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
        if (b) {
          resolve(b)
        } else {
          reject(new Error('Failed to convert to blob'))
        }
      }, 'image/jpeg', 0.95)
    })
    
    const rotatedFile = new File([blob], file.name, { type: 'image/jpeg' })
    
    files.value[index] = rotatedFile
    if (previews.value[index]) {
      try {
        URL.revokeObjectURL(previews.value[index])
      } catch (e) {
        // ignore
      }
    }
    previews.value[index] = URL.createObjectURL(rotatedFile)
    
    const currentRotation = parseInt(imageStatus.value[index]?.match(/\d+/)?.join('') || '0')
    imageStatus.value[index] = `Rotated ${(currentRotation + 90) % 360}°`
    
    try {
      URL.revokeObjectURL(url)
    } catch (e) {
      // ignore
    }
  } catch (err) {
    console.error('Rotasi gagal:', err)
    errorList.value.push('Gagal merotasi gambar')
  }
}

// ==================== CROP DENGAN CROPPER.JS ====================
function openCropDialog(index: number) {
  if (index < 0 || index >= previews.value.length) {
    console.error('Index out of bounds')
    return
  }
  
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
  
  if (!Cropper) {
    console.error('Cropper not loaded')
    return
  }
  
  const imageElement = cropperImageRef.value
  if (!imageElement) {
    console.error('Cropper image reference not found')
    return
  }
  
  try {
    const options: any = {
      viewMode: 1,
      dragMode: 'crop',
      aspectRatio: NaN,
      autoCropArea: 0.9,
      rotatable: false,
      scalable: true,
      zoomable: true,
      zoomOnTouch: true,
      zoomOnWheel: true,
      wheelZoomRatio: 0.1,
      guides: true,
      center: true,
      highlight: true,
      background: true,
      modal: true,
      responsive: true,
      restore: true,
      checkCrossOrigin: true,
      checkOrientation: true,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: true,
      minCropBoxWidth: 50,
      minCropBoxHeight: 50,
      
      crop: (event: any) => {
        if (event.detail) {
          cropData.value = {
            width: event.detail.width,
            height: event.detail.height
          }
        }
      }
    }

    cropperInstance = new (Cropper as any)(imageElement, options)
    
    setTimeout(() => {
      if (cropperInstance) {
        cropperInstance.setDragMode('crop')
      }
    }, 100)
    
  } catch (err) {
    console.error('Error initializing cropper:', err)
  }
}

function destroyCropper() {
  if (cropperInstance) {
    try {
      cropperInstance.destroy()
    } catch (e) {
      // ignore
    }
    cropperInstance = null
  }
}

function resetCropper() {
  if (cropperInstance) {
    try {
      cropperInstance.reset()
      zoomLevel.value = 0
      cropData.value = null
      setTimeout(() => {
        if (cropperInstance) {
          cropperInstance.setDragMode('crop')
        }
      }, 100)
    } catch (e) {
      console.error('Reset cropper error:', e)
    }
  }
}

function onZoomChange(value: number) {
  if (cropperInstance) {
    try {
      const zoomRatio = value * 0.5 + 1
      cropperInstance.zoomTo(zoomRatio)
    } catch (e) {
      console.error('Zoom error:', e)
    }
  }
}

function setKTPRatio() {
  if (cropperInstance) {
    try {
      cropperInstance.setAspectRatio(1.586)
    } catch (e) {
      console.error('Set ratio error:', e)
    }
  }
}

function setFreeRatio() {
  if (cropperInstance) {
    try {
      cropperInstance.setAspectRatio(NaN)
    } catch (e) {
      console.error('Set free ratio error:', e)
    }
  }
}

async function applyCrop() {
  if (!cropperInstance || cropIndex.value === -1) {
    console.error('Cropper not initialized or invalid index')
    return
  }
  
  cropLoading.value = true
  
  try {
    const croppedCanvas = cropperInstance.getCroppedCanvas({
      width: 800,
      height: 1260,
      fillColor: '#fff',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    })
    
    if (!croppedCanvas) {
      throw new Error('Gagal mendapatkan hasil crop')
    }
    
    const blob = await new Promise<Blob>((resolve, reject) => {
      croppedCanvas.toBlob((b: Blob | null) => {
        if (b) {
          resolve(b)
        } else {
          reject(new Error('Gagal konversi ke blob'))
        }
      }, 'image/jpeg', 0.95)
    })
    
    const file = files.value[cropIndex.value]
    if (!file) {
      throw new Error('File not found')
    }
    
    const croppedFile = new File([blob], file.name, { type: 'image/jpeg' })
    
    files.value[cropIndex.value] = croppedFile
    
    const previewUrl = previews.value[cropIndex.value]
    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl)
      } catch (e) {
        // ignore
      }
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

// Watch crop dialog untuk destroy cropper
watch(cropDialog, (newVal: boolean) => {
  if (!newVal) {
    destroyCropper()
  }
})

// ==================== UPLOAD ====================
async function upload() {
  if (!files.value.length) return

  loading.value = true
  errorList.value = []
  successList.value = []
  showGoDraftButton.value = false

  // Set status processing untuk semua file
  for (let i = 0; i < files.value.length; i++) {
    uploadStatus.value[i] = 'processing'
  }

  const formData = new FormData()
  for (let i = 0; i < files.value.length; i++) {
    const file = files.value[i]
    if (file) {
      formData.append("files", file)
    }
  }

  try {
    const res: any = await $api("/ocr", {
      method: "POST",
      body: formData
    })

    // Update status berdasarkan hasil
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

    // Cek apakah ada yang berhasil
    const hasSuccess = uploadStatus.value.some(status => status === 'success')
    if (hasSuccess) {
      showGoDraftButton.value = true
    }

    // Hapus file yang BERHASIL saja setelah 3 detik
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
        
        // HANYA file yang BERHASIL yang dihapus
        // File yang GAGAL tetap dipertahankan
        if (uploadStat === 'success') {
          // Hapus URL untuk file yang berhasil
          if (preview) {
            try {
              URL.revokeObjectURL(preview)
            } catch (e) {
              // ignore
            }
          }
        } else {
          // Pertahankan file yang gagal dan idle
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

    // Reset loading setelah semua selesai
    loading.value = false

  } catch (err: any) {
    // Set semua status ke failed jika error total
    for (let i = 0; i < files.value.length; i++) {
      uploadStatus.value[i] = 'failed'
    }
    
    if (err?.data?.error) {
      errorList.value = [err.data.error]
    } else if (err?.response?._data?.error) {
      errorList.value = [err.response._data.error]
    } else {
      errorList.value = [
        "Gagal menghubungi server. Pastikan koneksi dan backend aktif."
      ]
    }
    loading.value = false
  }
}

// ==================== UPLOAD ULANG ====================
async function retryUpload(index: number) {
  if (index < 0 || index >= files.value.length) return
  if (uploadStatus.value[index] !== 'failed') return
  
  // Upload ulang satu file
  const file = files.value[index]
  if (!file) return
  
  uploadStatus.value[index] = 'processing'
  
  const formData = new FormData()
  formData.append("files", file)
  
  try {
    const res: any = await $api("/ocr", {
      method: "POST",
      body: formData
    })
    
    if (res.results && res.results[0]) {
      const item = res.results[0]
      if (item.error) {
        uploadStatus.value[index] = 'failed'
        errorList.value.push(`${item.filename}: ${item.error}`)
      } else {
        uploadStatus.value[index] = 'success'
        successList.value.push(`${item.filename}: Berhasil di-upload ulang`)
        
        // Hapus file yang berhasil setelah 3 detik
        setTimeout(() => {
          const preview = previews.value[index]
          if (preview) {
            try {
              URL.revokeObjectURL(preview)
            } catch (e) {
              // ignore
            }
          }
          
          // Hapus dari array
          const newFiles = [...files.value]
          newFiles.splice(index, 1)
          files.value = newFiles
          
          previews.value.splice(index, 1)
          imageStatus.value.splice(index, 1)
          uploadStatus.value.splice(index, 1)
        }, 3000)
        
        // Cek apakah semua sudah berhasil
        const hasFailed = uploadStatus.value.some(status => status === 'failed')
        if (!hasFailed && uploadStatus.value.length > 0) {
          showGoDraftButton.value = true
        }
      }
    }
  } catch (err: any) {
    uploadStatus.value[index] = 'failed'
    if (err?.data?.error) {
      errorList.value.push(err.data.error)
    } else {
      errorList.value.push('Gagal upload ulang file')
    }
  }
}

async function retryAllFailed() {
  // Upload ulang semua file yang gagal
  const failedIndices: number[] = []
  for (let i = 0; i < uploadStatus.value.length; i++) {
    if (uploadStatus.value[i] === 'failed') {
      failedIndices.push(i)
    }
  }
  
  if (failedIndices.length === 0) return
  
  // Upload semua file yang gagal
  const formData = new FormData()
  for (const index of failedIndices) {
    const file = files.value[index]
    if (file) {
      formData.append("files", file)
      uploadStatus.value[index] = 'processing'
    }
  }
  
  try {
    const res: any = await $api("/ocr", {
      method: "POST",
      body: formData
    })
    
    // Update status untuk file yang diupload ulang
    let resultIndex = 0
    for (const originalIndex of failedIndices) {
      if (resultIndex < res.results.length) {
        const item = res.results[resultIndex]
        if (item.error) {
          uploadStatus.value[originalIndex] = 'failed'
          errorList.value.push(`${item.filename}: ${item.error}`)
        } else {
          uploadStatus.value[originalIndex] = 'success'
          successList.value.push(`${item.filename}: Berhasil di-upload ulang`)
        }
        resultIndex++
      }
    }
    
    // Hapus file yang berhasil setelah 3 detik
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
            try {
              URL.revokeObjectURL(preview)
            } catch (e) {
              // ignore
            }
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
    
    // Cek apakah semua sudah berhasil
    const hasFailed = uploadStatus.value.some(status => status === 'failed')
    if (!hasFailed && uploadStatus.value.length > 0) {
      showGoDraftButton.value = true
    }
    
  } catch (err: any) {
    for (const index of failedIndices) {
      uploadStatus.value[index] = 'failed'
    }
    if (err?.data?.error) {
      errorList.value.push(err.data.error)
    } else {
      errorList.value.push('Gagal upload ulang file')
    }
  }
}
</script>

<style scoped>
/* ===== ANIMASI ===== */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

/* ===== CARD ===== */
.upload-card {
  transition: all 0.3s ease;
}

.upload-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12) !important;
}

.title-icon {
  animation: pulse 2s infinite;
}

/* ===== ALERT ===== */
.animate-slide-down {
  animation: slideDown 0.5s ease forwards;
}

/* ===== BUTTON ===== */
.animate-pulse {
  animation: pulse 2s infinite;
}

.upload-btn {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.upload-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(25, 118, 210, 0.4);
}

.upload-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.upload-btn .btn-text {
  transition: all 0.3s ease;
}

/* ===== PREVIEW ===== */
.preview-item {
  opacity: 0;
  animation: fadeInUp 0.5s ease forwards;
}

.preview-card {
  transition: all 0.3s ease;
  position: relative;
}

.preview-card.hovering {
  transform: scale(1.02);
}

.preview-card.uploaded {
  border: 2px solid #4caf50;
}

.preview-card.failed {
  border: 2px solid #f44336;
}

.preview-card.processing {
  border: 2px solid #ff9800;
}

.action-btn {
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.15);
}

.action-btn:active {
  transform: scale(0.9);
}

.status-bar {
  transition: all 0.3s ease;
}

.status-icon {
  transition: all 0.3s ease;
}

.status-text {
  transition: all 0.3s ease;
}

/* ===== IMAGE TITLE (JUDUL GAMBAR) ===== */
.image-title-wrapper {
  padding: 4px 8px !important;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.image-title {
  font-size: 12px;
  color: #333;
  min-height: 24px;
}

.image-title .file-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.image-title .file-extension {
  color: #999;
  font-weight: 400;
  margin-left: 2px;
  flex-shrink: 0;
}

.image-title .v-icon {
  flex-shrink: 0;
}

/* ===== CROP DIALOG ===== */
.crop-dialog {
  transition: all 0.3s ease;
}

.close-btn {
  transition: all 0.3s ease;
}

.close-btn:hover {
  transform: rotate(90deg);
}

.crop-container-wrapper {
  position: relative;
}

.crop-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  z-index: 20;
  animation: fadeInUp 0.3s ease forwards;
}

.controls-wrapper {
  animation: slideDown 0.3s ease forwards;
}

.control-btn {
  transition: all 0.2s ease;
}

.control-btn:hover {
  transform: translateY(-2px);
}

.zoom-slider {
  transition: all 0.3s ease;
}

.crop-info {
  animation: fadeInUp 0.4s ease forwards;
}

.info-chip {
  transition: all 0.3s ease;
}

.info-chip:hover {
  transform: scale(1.05);
}

.cancel-btn {
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.apply-btn {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.apply-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(25, 118, 210, 0.4);
}

.apply-btn:active:not(:disabled) {
  transform: scale(0.98);
}

/* ===== FILE INPUT ===== */
.file-input-wrapper {
  transition: all 0.3s ease;
}

.file-input-wrapper:hover {
  transform: translateY(-2px);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 600px) {
  .controls-wrapper {
    flex-direction: column;
    gap: 8px;
  }
  
  .controls-wrapper .v-btn-group {
    width: 100%;
  }
  
  .controls-wrapper .v-btn-group .v-btn {
    flex: 1;
  }
  
  .crop-info {
    flex-wrap: wrap;
  }
  
  .image-title .file-name {
    max-width: 80px;
  }
}

@media (max-width: 400px) {
  .image-title {
    font-size: 10px;
  }
  
  .image-title .file-name {
    max-width: 60px;
  }
  
  .image-title .v-icon {
    font-size: 14px !important;
  }
}
</style>