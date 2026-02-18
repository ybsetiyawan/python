<template>
  <div>
    <!-- HEADER -->
    <div class="mb-8">
      <h1 class="text-h4 font-weight-black text-grey-darken-4">
        Alur <span class="text-primary">Verifikasi</span>
      </h1>
      <p class="text-grey-darken-1 text-subtitle-2">
        Sistem Verifikasi KTP Digital – EDP Surabaya
      </p>
    </div>

    <!-- FLOW CARD -->
    <v-card variant="flat" class="border rounded-xl pa-2 mb-10 bg-white">
      <v-row no-gutters class="align-center">
        <v-col cols="12" md="5" class="pa-4">
          <div class="d-flex align-center">
            <v-avatar color="primary" size="48" class="mr-4 elevation-2">
              <v-icon color="white">mdi-tray-arrow-up</v-icon>
            </v-avatar>
            <div>
              <div class="text-overline font-weight-black text-primary leading-none">
                TAHAP 1
              </div>
              <div class="text-h6 font-weight-bold">Upload Dokumen</div>
              <div class="text-caption text-grey">
                Unggah foto KTP untuk ekstraksi AI
              </div>
            </div>
          </div>
        </v-col>

        <v-col cols="12" md="2" class="d-flex justify-center pa-0">
          <v-icon size="40" color="grey-darken-1" class="d-none d-md-block">
            mdi-arrow-right-bold
          </v-icon>
          <v-icon size="32" color="grey-lighten-2" class="d-md-none my-2">
            mdi-arrow-down-bold
          </v-icon>
        </v-col>

        <v-col cols="12" md="5" class="pa-4">
          <div class="d-flex align-center">
            <v-avatar color="green-darken-1" size="48" class="mr-4 elevation-2">
              <v-icon color="white">mdi-account-multiple-check</v-icon>
            </v-avatar>
            <div>
              <div class="text-overline font-weight-black text-green-darken-2 leading-none">
                TAHAP 2
              </div>
              <div class="text-h6 font-weight-bold">Verifikasi Draft</div>
              <div class="text-caption text-grey">
                Validasi & simpan hasil pembacaan
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <!-- SUMMARY CARDS -->
  <v-row>
  <!-- TOTAL DATA -->
  <v-col cols="12" md="3">
    <v-card class="pa-6 rounded-xl border bg-white">
      <div class="text-caption text-grey">Total Data</div>
      <div class="text-h4 font-weight-black">
        {{ loading ? '-' : totalData }}
      </div>
    </v-card>
  </v-col>

  <!-- TOTAL DRAFT -->
  <v-col cols="12" md="3">
    <v-card
      class="pa-6 rounded-xl border bg-orange-lighten-5 clickable-card"
      @click="router.push('/admin/drafts')"
    >
      <div class="text-caption text-orange-darken-2">
        Belum Diverifikasi
      </div>
      <div class="text-h4 font-weight-black text-orange-darken-3">
        {{ loading ? '-' : totalDraft }}
      </div>
    </v-card>
  </v-col>

  <!-- DATA HARI INI -->
  <v-col cols="12" md="3">
    <v-card class="pa-6 rounded-xl border bg-blue-lighten-5">
      <div class="text-caption text-blue-darken-2">
        Data Hari Ini
      </div>
      <div class="text-h4 font-weight-black text-blue-darken-3">
        {{ loading ? '-' : totalToday }}
      </div>
    </v-card>
  </v-col>

  <!-- VERIFIED HARI INI -->
  <v-col cols="12" md="3">
    <v-card class="pa-6 rounded-xl border bg-green-lighten-5">
      <div class="text-caption text-green-darken-2">
        Verified Hari Ini
      </div>
      <div class="text-h4 font-weight-black text-green-darken-3">
        {{ loading ? '-' : totalVerifiedToday }}
      </div>
    </v-card>
  </v-col>
</v-row>


    <!-- FOOTER -->
    <v-divider class="my-10"></v-divider>
    <div class="d-flex align-center justify-center text-grey">
      <v-icon size="16" class="mr-2">mdi-shield-check</v-icon>
      <span class="text-caption font-weight-medium">
        • EDP SBY @2026 •
      </span>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue"
import { useRouter, useNuxtApp } from "#imports"

definePageMeta({ layout: "admin" })

const router = useRouter()
const { $api } = useNuxtApp()

const totalData = ref(0)
const totalDraft = ref(0)
const totalToday = ref(0)
const totalVerifiedToday = ref(0)

const loading = ref(true)

onMounted(async () => {
  try {
    const res = await $api("/api/ocr/dashboard", {
      method: "GET"
    })

    totalData.value = res.total ?? 0
    totalDraft.value = res.draft ?? 0
    totalToday.value = res.today ?? 0
    totalVerifiedToday.value = res.verifiedToday ?? 0

  } catch (err) {
    console.error("Gagal mengambil data dashboard:", err)
  } finally {
    loading.value = false
  }
})
</script>


<style scoped>
.leading-none {
  line-height: 1;
}

.clickable-card {
  cursor: pointer;
  border: 1px solid #ffcc80 !important;
}

.transition-swing {
  transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}

.shadow-sm {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02) !important;
}
</style>
