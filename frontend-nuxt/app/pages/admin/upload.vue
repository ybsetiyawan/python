<template>
  <v-container class="py-8">

    <v-card elevation="3" class="pa-6">

      <v-card-title class="text-h5 font-weight-bold mb-4">
        Upload KTP (Max 5 File)
      </v-card-title>

      <!-- ERROR LIST -->
      <v-alert
        v-if="errorList.length"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        <div
          v-for="(err, i) in errorList"
          :key="i"
        >
          ❌ {{ err }}
        </div>
      </v-alert>

      <v-btn
  v-if="showGoDraftButton"
  color="primary"
  class="mt-4"
  @click="navigateTo('/admin/drafts')"
>
  Lanjut ke Drafts
</v-btn>


      <!-- FILE INPUT -->
      <v-file-input
        multiple
        accept="image/*"
        label="Pilih File KTP"
        prepend-icon="mdi-camera"
        show-size
        @update:modelValue="handleFiles"
      />

      <!-- PREVIEW -->
      <v-row class="mt-4" v-if="previews.length">
        <v-col
          v-for="(img, i) in previews"
          :key="i"
          cols="12"
          sm="4"
        >
          <v-img
            :src="img"
            height="0"
            cover
            class="rounded"
          />
        </v-col>
      </v-row>

      <!-- BUTTON -->
      <v-btn
        color="primary"
        size="large"
        class="mt-6"
        :loading="loading"
        @click="upload"
      >
        Upload & OCR
      </v-btn>

    </v-card>

  </v-container>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin"
})

import { ref } from "vue"

const config = useRuntimeConfig()

const files = ref<File[]>([])
const previews = ref<string[]>([])
const loading = ref(false)
const errorList = ref<string[]>([])
const errorMsg = ref("")
const showGoDraftButton = ref(false)

function handleFiles(selected: File | File[] | null) {
  if (!selected) return

  const arr = Array.isArray(selected) ? selected : [selected]

  const limited = arr.slice(0, 5)

  files.value = limited
  previews.value = limited.map(file =>
    URL.createObjectURL(file)
  )
}
async function upload() {
  if (!files.value.length) {
    errorMsg.value = "Pilih minimal 1 file"
    return
  }

  loading.value = true
  errorList.value = []
  showGoDraftButton.value = false

  const formData = new FormData()
  files.value.forEach(file =>
    formData.append("files", file)
  )

  try {
    const res: any = await $fetch(
      `${config.public.apiBase}/api/ocr`,
      {
        method: "POST",
        body: formData
      }
    )

    // Jika ada gagal
    if (res.failed > 0) {
      res.results.forEach((item: any) => {
        if (item.error) {
          errorList.value.push(
            `${item.filename} - ${item.error}`
          )
        }
      })

      // Jika ada yang sukses juga
      if (res.success > 0) {
        showGoDraftButton.value = true
      }

      return
    }

    // Semua sukses
    await navigateTo("/admin/drafts")

  } catch (err: any) {
    errorList.value = ["Upload gagal koneksi server"]
  } finally {
    loading.value = false
  }
}
</script>
