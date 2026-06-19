<template>
  <v-container class="py-8">
    <v-card elevation="3" class="pa-6 rounded-lg">
      <v-card-title class="text-h5 font-weight-bold mb-4 d-flex align-center">
        <v-icon start color="primary">mdi-card-account-details</v-icon>
        Upload KTP (Max 10 File)
      </v-card-title>

      <v-alert v-if="errorList.length" type="error" variant="tonal" class="mb-4" closable>
        <div v-for="(err, i) in errorList" :key="i">
          <v-icon size="small" class="mr-1">mdi-alert-circle</v-icon> {{ err }}
        </div>
      </v-alert>

      <v-btn v-if="showGoDraftButton" color="success" variant="elevated" class="mb-6"
        prepend-icon="mdi-arrow-right-circle" @click="navigateTo('/admin/drafts')">
        Lanjut ke Drafts
      </v-btn>

      <v-file-input 
        :model-value="files" 
        :disabled="loading"  multiple
        accept="image/*" 
        label="Pilih File KTP"
        prepend-inner-icon="mdi-camera" 
        prepend-icon="" 
        variant="outlined" 
        counter 
        show-size
        @update:modelValue="handleFiles" 
      />

      <v-row class="mt-4" v-if="previews.length">
        <v-col v-for="(img, i) in previews" :key="i" cols="6" sm="4" md="3">
          <v-hover v-slot="{ isHovering, props }">
            <v-card 
              v-bind="props" 
              :elevation="isHovering ? 6 : 2" 
              class="position-relative rounded-lg overflow-hidden"
            >
              <v-img :src="img" height="150" cover class="bg-grey-lighten-2">
                <v-overlay 
                  :model-value="!!isHovering" 
                  contained 
                  scrim="black" 
                  class="align-center justify-center"
                  persistent
                >
                  <v-btn 
                    color="error" 
                    icon="mdi-delete" 
                    size="small" 
                    title="Hapus Gambar"
                    :disabled="loading" @click.stop="removeImage(i)"
                  ></v-btn>
                </v-overlay>

                <template v-slot:placeholder>
                  <v-row class="fill-height ma-0" align="center" justify="center">
                    <v-progress-circular indeterminate color="grey-lighten-5" />
                  </v-row>
                </template>
              </v-img>
            </v-card>
          </v-hover>
        </v-col>
      </v-row>

      <v-divider class="my-6" v-if="previews.length"></v-divider>

      <v-btn color="primary" size="large" block :disabled="!files.length" :loading="loading"
        prepend-icon="mdi-cloud-upload" @click="upload">
        Mulai Upload & OCR
      </v-btn>

    </v-card>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin"
})

import { ref, onBeforeUnmount, onMounted } from "vue"
import { useRouter } from "#imports";
import { useAuth } from "~~/app/composables/useAuth";
// const { $api } = useNuxtApp()

// const config = useRuntimeConfig()

const files = ref<File[]>([])
const previews = ref<string[]>([])
const loading = ref(false)
const errorList = ref<string[]>([])
const showGoDraftButton = ref(false)


const router = useRouter();
const { getToken } = useAuth();

onMounted(async () => {
  

    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

});

// Membersihkan memory URL preview
function clearPreviews() {
  previews.value.forEach(url => {
    if (url) URL.revokeObjectURL(url)
  })
}

// function handleFiles(selected: File | File[] | null) {
//   if (!selected || (Array.isArray(selected) && selected.length === 0)) {
//     clearPreviews()
//     files.value = []
//     previews.value = []
//     return
//   }

//   const arr = Array.isArray(selected) ? selected : [selected]
//   const limited = arr.slice(0, 10)

//   clearPreviews()
//   files.value = limited
//   previews.value = limited.map(file => URL.createObjectURL(file))
// }

async function handleFiles(
  selected: File | File[] | null
) {

  if (!selected) {
    clearPreviews()
    files.value = []
    previews.value = []
    return
  }

  const arr = Array.isArray(selected)
    ? selected
    : [selected]

  const limited = arr.slice(0, 10)

  clearPreviews()

  const processedFiles: File[] = []
  const processedPreviews: string[] = []

  for (const file of limited) {

    const bwFile = await preprocessImage(file)

    processedFiles.push(bwFile)

    processedPreviews.push(
      URL.createObjectURL(bwFile)
    )
  }

  files.value = processedFiles
  previews.value = processedPreviews
}

// Menghapus satu gambar tertentu
function removeImage(index: number) {
  const url = previews.value[index]
  if (url) {
    URL.revokeObjectURL(url)
  }

  // Penting: Hapus dari array files agar v-file-input tersinkronisasi
  const newFiles = [...files.value]
  newFiles.splice(index, 1)
  files.value = newFiles

  // Hapus dari array preview
  previews.value.splice(index, 1)
}


async function preprocessImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        reject(new Error("Canvas tidak tersedia"))
        return
      }

      canvas.width = img.width
      canvas.height = img.height

      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      )

      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {

      const gray =
  data[i]! * 0.299 +
  data[i + 1]! * 0.587 +
  data[i + 2]! * 0.114

const contrast = 1.35

const enhanced =
  (gray - 128) * contrast + 128

const finalGray = Math.max(
  0,
  Math.min(255, enhanced)
)

data[i] = finalGray
data[i + 1] = finalGray
data[i + 2] = finalGray
      }

      ctx.putImageData(imageData, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Gagal membuat blob"))
            return
          }

          resolve(
            new File(
              [blob],
              file.name,
              { type: "image/jpeg" }
            )
          )
        },
        "image/jpeg",
        0.95
      )
    }

    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}


async function upload() {
  if (!files.value.length) return

  loading.value = true
  errorList.value = []
  showGoDraftButton.value = false

  const formData = new FormData()

  files.value.forEach(file => {
    formData.append(
      "files",
      file,
      file.name
    )
  })

  try {
    const { $api } = useNuxtApp()

    const res: any = await $api("/ocr", {
      method: "POST",
      body: formData
    })

    if (res.failed > 0) {
      res.results.forEach((item: any) => {
        if (item.error) {
          errorList.value.push(
            `${item.filename}: ${item.error}`
          )
        }
      })

      if (res.success > 0) {
        showGoDraftButton.value = true
      }

      return
    }

    await navigateTo("/admin/drafts")

  } catch (err: any) {

    if (err?.data?.error) {
      errorList.value = [err.data.error]
    } else if (err?.response?._data?.error) {
      errorList.value = [err.response._data.error]
    } else {
      errorList.value = [
        "Gagal menghubungi server. Pastikan koneksi dan backend aktif."
      ]
    }

  } finally {
    loading.value = false
  }
}


onBeforeUnmount(() => {
  clearPreviews()
})
</script>

<style scoped>
.v-card {
  transition: transform 0.2s ease-in-out;
}
</style>