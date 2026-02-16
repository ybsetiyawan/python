<template>
  <v-container class="py-8">

    <!-- SNACKBAR -->
 <v-snackbar
  v-model="snackbar"
  color="success"
  timeout="3000"
  location="center"
  elevation="8"
>
  Data berhasil diverifikasi

  <template #actions>
    <v-btn
      variant="text"
      color="white"
      @click="goToUpload"
    >
      Upload Lagi
    </v-btn>
  </template>
</v-snackbar>



    <!-- EMPTY STATE -->
    <v-alert
      v-if="drafts.length === 0"
      type="success"
      variant="tonal"
      class="mb-6"
    >
      Semua draft sudah diverifikasi 🎉
    </v-alert>

    <v-row v-for="item in drafts" :key="item.id" class="mb-8">
      <v-col cols="12">
        <v-card elevation="3" class="pa-4">

          <v-row>

            <!-- IMAGE -->
            <v-col cols="12" md="5">
              <v-img
                :src="`${config.public.apiBase}/${item.image_path.replace(/\\/g, '/')}`"
                aspect-ratio="1.6"
                cover
                class="rounded-lg"
              />
            </v-col>

            <!-- FORM -->
            <v-col cols="12" md="7">

              <!-- STATUS CHIP -->
              <div class="d-flex align-center mb-4">
                <v-chip
                  color="orange"
                  variant="flat"
                  size="small"
                  class="font-weight-bold"
                >
                  DRAFT
                </v-chip>
              </div>

              <v-text-field v-model="item.nik" label="NIK" />
              <v-text-field v-model="item.nama" label="Nama" />

              <v-btn
                color="primary"
                class="mt-4"
                @click="save(item)"
              >
                Simpan & Verifikasi
              </v-btn>

            </v-col>

          </v-row>

        </v-card>
      </v-col>
    </v-row>

  </v-container>
</template>


<script setup lang="ts">
import { ref, onMounted } from "vue"

const config = useRuntimeConfig()
const drafts = ref<any[]>([])
const snackbar = ref(false)
const router = useRouter()

async function loadDrafts() {
  drafts.value = await $fetch(`${config.public.apiBase}/api/ocr/drafts`)
}
async function save(item: any) {
  try {
    await $fetch(`${config.public.apiBase}/api/ocr/${item.id}`, {
      method: "PUT",
      body: item
    })

    drafts.value = drafts.value.filter(d => d.id !== item.id)

    snackbar.value = true

  } catch (err: any) {
    alert(err.data?.error || "Gagal update")
  }
}



function goToUpload() {
  router.push("/admin/upload")

}

onMounted(loadDrafts)
</script>

