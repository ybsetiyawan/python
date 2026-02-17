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
          <v-icon color="white" size="18">mdi-brain</v-icon>
        </v-avatar>
        <div>
          <div class="text-subtitle-2 font-weight-black leading-tight">AI OCR</div>
          <div class="text-caption text-grey">ADMIN DASHBOARD</div>
        </div>
      </div>

      <v-divider class="mx-4 mb-4"></v-divider>

      <v-list nav density="comfortable" class="px-4">
        <v-list-subheader class="text-uppercase font-weight-bold text-caption">Menu Utama</v-list-subheader>
        
        <v-list-item 
          to="/admin/upload" 
          prepend-icon="mdi-cloud-upload-outline" 
          active-color="primary"
          rounded="lg"
          title="Upload Dokumen"
          class="mb-1"
        />

        <v-list-item 
          to="/admin/drafts" 
          prepend-icon="mdi-file-check-outline" 
          active-color="primary"
          rounded="lg"
          title="Verifikasi Draft"
          class="mb-1"
        />
      </v-list>

      <template v-slot:append>
        <div class="pa-4">
          <v-card variant="tonal" color="grey-darken-3" class="rounded-xl pa-3">
            <div class="d-flex align-center">
              <v-avatar size="32" color="primary-lighten-4" class="mr-3">
                <v-icon size="18" color="primary">mdi-account-circle</v-icon>
              </v-avatar>
              <div class="overflow-hidden">
                <div class="text-caption font-weight-bold text-truncate">Administrator</div>
                <div class="text-error font-weight-bold cursor-pointer" style="font-size: 10px;" @click="logout">
                  LOGOUT
                </div>
              </div>
            </div>
          </v-card>
        </div>
      </template>
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

      <v-btn icon class="mr-2">
        <v-badge dot color="success">
          <v-icon color="grey-darken-1">mdi-bell-outline</v-icon>
        </v-badge>
      </v-btn>

      <v-btn 
        variant="outlined" 
        color="error" 
        size="small" 
        class="rounded-lg font-weight-bold px-4"
        prepend-icon="mdi-power"
        @click="logout"
      >
        Logout
      </v-btn>
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
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from "#imports"

const router = useRouter()
const drawer = ref(true)

function logout() {
  // Gunakan key yang sama dengan saat login
  localStorage.removeItem("admin_token")
  // Opsional: bersihkan state lain jika ada
  router.push("/login")
}
</script>

<style scoped>
.leading-tight {
  line-height: 1.2;
}

/* Membuat scrollbar lebih cantik di sidebar */
:deep(.v-navigation-drawer__content::-webkit-scrollbar) {
  width: 4px;
}
:deep(.v-navigation-drawer__content::-webkit-scrollbar-thumb) {
  background: #e0e0e0;
  border-radius: 10px;
}

/* Background halus untuk area konten */
.v-main {
  background-color: #f8fafc;
}
</style>