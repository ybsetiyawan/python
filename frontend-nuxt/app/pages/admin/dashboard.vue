<template>
  <div>
    <div class="mb-8">
      <h1 class="text-h4 font-weight-black text-grey-darken-4">
        Alur <span class="text-primary">Verifikasi</span>
      </h1>
      <p class="text-grey-darken-1 text-subtitle-2">Sistem Pemrosesan KTP OCR - EDP Surabaya</p>
    </div>

    <v-card variant="flat" class="border rounded-xl pa-2 mb-10 bg-white">
      <v-row no-gutters class="align-center">
        <v-col cols="12" md="5" class="pa-4">
          <div class="d-flex align-center">
            <v-avatar color="primary" size="48" class="mr-4 elevation-2">
              <v-icon color="white">mdi-tray-arrow-up</v-icon>
            </v-avatar>
            <div>
              <div class="text-overline font-weight-black text-primary leading-none">TAHAP 1</div>
              <div class="text-h6 font-weight-bold">Upload Dokumen</div>
              <div class="text-caption text-grey">Unggah foto KTP untuk ekstraksi AI</div>
            </div>
          </div>
        </v-col>

        <v-col cols="12" md="2" class="d-flex justify-center pa-0">
          <v-icon size="40" color="grey-darken-1" class="d-none d-md-block">mdi-arrow-right-bold</v-icon>
          <v-icon size="32" color="grey-lighten-2" class="d-md-none my-2">mdi-arrow-down-bold</v-icon>
        </v-col>

        <v-col cols="12" md="5" class="pa-4">
          <div class="d-flex align-center">
            <v-avatar color="green-darken-1" size="48" class="mr-4 elevation-2">
              <v-icon color="white">mdi-account-multiple-check</v-icon>
            </v-avatar>
            <div>
              <div class="text-overline font-weight-black text-green-darken-2 leading-none">TAHAP 2</div>
              <div class="text-h6 font-weight-bold">Verifikasi Drafts</div>
              <div class="text-caption text-grey">Validasi & simpan hasil pembacaan</div>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <v-row>
      <v-col cols="12" md="6">
        <v-card variant="flat" class="border rounded-xl pa-8 h-100 bg-white shadow-sm">
          <div class="d-flex align-center">
            <v-avatar color="blue-lighten-5" rounded="lg" size="64" class="mr-5">
              <v-icon color="blue-darken-2" size="32">mdi-database-check</v-icon>
            </v-avatar>
            <div>
              <div class="text-h3 font-weight-black text-grey-darken-4">{{ totalData }}</div>
              <div class="text-body-2 font-weight-bold text-grey">Total Data Diproses</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-hover v-slot="{ isPropping, props }">
          <v-card 
            v-bind="props"
            variant="flat" 
            class="border rounded-xl pa-8 h-100 bg-orange-lighten-5 transition-swing clickable-card"
            @click="router.push('/admin/drafts')"
            :elevation="isPropping ? 4 : 0"
          >
            <div class="d-flex align-center">
              <v-avatar color="white" rounded="lg" size="64" class="mr-5 elevation-1">
                <v-icon color="orange-darken-3" size="32">mdi-alert-circle-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-h3 font-weight-black text-orange-darken-3">{{ totalPending }}</div>
                <div class="text-body-2 font-weight-bold text-orange-darken-1">Belum Diverifikasi</div>
              </div>
              <v-spacer />
              <v-icon color="orange-darken-1">mdi-chevron-right</v-icon>
            </div>
          </v-card>
        </v-hover>
      </v-col>
    </v-row>

    <v-divider class="my-10"></v-divider>
    <div class="d-flex align-center justify-center text-grey">
      <v-icon size="16" class="mr-2">mdi-shield-check</v-icon>
      <span class="text-caption font-weight-medium">• EDP SBY @2026 •</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from '#imports';

definePageMeta({ layout: "admin" });

const router = useRouter();

// Data Dummy - Nanti dihubungkan ke API
const totalData = ref('-');
const totalPending = ref('-');

const steps = [
  { title: 'Upload Dokumen', icon: 'mdi-upload' },
  { title: 'Verifikasi Data', icon: 'mdi-check-decagram' },
];
</script>

<style scoped>
.leading-none { line-height: 1; }
.clickable-card {
  cursor: pointer;
  border: 1px solid #FFCC80 !important;
}
.transition-swing {
  transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}
.shadow-sm {
  box-shadow: 0 2px 4px rgba(0,0,0,0.02) !important;
}
</style>