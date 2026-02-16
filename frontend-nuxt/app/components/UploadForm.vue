<script setup lang="ts">
import { ref } from "vue"

const config = useRuntimeConfig()

const files = ref<File[]>([])
const previews = ref<string[]>([])
const loading = ref(false)
const result = ref<any>(null)

function handleFiles(selected: File[] | File) {
  if (!selected) return

  const arr = Array.isArray(selected) ? selected : [selected]

  const limited = arr.slice(0, 5)
  files.value = limited

  previews.value = limited.map(file =>
    URL.createObjectURL(file)
  )
}

async function upload() {
  if (!files.value.length) return

  loading.value = true
  result.value = null

  const formData = new FormData()
  files.value.forEach(file => {
    formData.append("files", file)
  })

  try {
    const res = await $fetch(`${config.public.apiBase}/api/ocr`, {
      method: "POST",
      body: formData
    })

    result.value = res
  } catch (err) {
    console.error(err)
    alert("Upload gagal")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container class="py-10">
    <v-card elevation="4" class="pa-6">
      <v-card-title class="text-h5 font-weight-bold">
        Upload KTP (Max 5 File)
      </v-card-title>

      <v-card-text>

        <!-- ✅ FIX DI SINI -->
        <v-file-input
          multiple
          accept="image/*"
          label="Pilih File KTP"
          prepend-icon="mdi-camera"
          show-size
          @update:modelValue="handleFiles"
        />

        <!-- Preview -->
        <v-row class="mt-4" v-if="previews.length">
          <v-col
            v-for="(img, i) in previews"
            :key="i"
            cols="12"
            sm="4"
          >
            <v-img
              :src="img"
              aspect-ratio="1"
              cover
              class="rounded-lg"
            />
          </v-col>
        </v-row>

        <v-btn
          color="primary"
          size="large"
          class="mt-6"
          :loading="loading"
          @click="upload"
        >
          Upload & OCR
        </v-btn>

      </v-card-text>
    </v-card>

    <!-- Result -->
    <v-card v-if="result" class="mt-6 pa-4">
      <pre>{{ result }}</pre>
    </v-card>
  </v-container>
</template>
