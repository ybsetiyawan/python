<template>
  <v-app class="workspace-layout">
    <!-- NAVIGATION DRAWER: LIGHT & CLEAN -->
    <v-navigation-drawer
      v-model="drawer"
      elevation="0"
      class="sidebar-clean border-e-sm"
      :width="280"
    >
      <!-- KARTU PROFIL USER DI SIDEBAR -->
      <div class="px-4 py-4">
        <div class="user-profile-box pa-3 d-flex align-center">
          <v-badge
            dot
            location="bottom end"
            color="success"
            offset-x="2"
            offset-y="2"
          >
            <v-avatar color="indigo-darken-2" size="38" class="elevation-1">
              <span class="text-white font-weight-bold text-subtitle-2">{{ userInitials }}</span>
            </v-avatar>
          </v-badge>

          <div class="ml-3 d-flex flex-column" style="min-width: 0">
            <span class="text-slate-400 font-weight-medium" style="font-size: 10px; line-height: 1">
              Logged in as,
            </span>
            <div class="text-slate-900 font-weight-bold text-truncate mt-1" style="font-size: 12px; line-height: 1.2">
              <span class="text-uppercase">{{ userName }}</span>
            </div>
          </div>
        </div>
      </div>

      <v-divider class="mx-4 mb-2 border-slate-200"></v-divider>

      <!-- NAVIGATION MENU -->
      <v-list nav density="comfortable" class="px-3 custom-menu-list">
        <v-list-subheader class="text-uppercase font-weight-bold text-caption text-slate-400 px-3 mb-1" style="font-size: 10px; letter-spacing: 0.8px;">
          Menu Navigasi
        </v-list-subheader>

        <!-- Loading State -->
        <div v-if="menuLoading" class="px-4 py-6 text-center text-slate-400 text-caption">
          Memuat menu...
        </div>

        <!-- Render Menu Dinamis dari Tabel menus -->
        <template v-else>
          <template v-for="menu in menus" :key="menu.id || menu.path">
            <v-list-item
              :to="menu.path !== '/admin/export' && !menu.name.toLowerCase().includes('ekspor') ? menu.path : undefined"
              @click="menu.path === '/admin/export' || menu.name.toLowerCase().includes('ekspor') ? showExportDialog = true : null"
              color="indigo-darken-2"
              rounded="xl"
              class="mb-1.5 menu-item-custom"
            >
              <template v-slot:prepend>
                <v-icon :icon="formatIcon(menu.icon)" size="20" class="mr-3 text-indigo-darken-2" />
              </template>
              
              <v-list-item-title class="font-weight-medium" style="font-size: 13.5px;">
                {{ menu.name }}
              </v-list-item-title>
            </v-list-item>
          </template>
        </template>
      </v-list>

      <!-- DRAWER FOOTER / COPYRIGHT -->
      <template v-slot:append>
        <div class="pa-4 text-center border-t-sm border-slate-100">
          <p class="text-slate-400 font-weight-medium m-0" style="font-size: 11px;">
            Copyright &copy; @Ybs - EDPSBY 2026
          </p>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- APP BAR -->
    <v-app-bar elevation="0" class="border-b-sm bg-white px-4 appbar-clean" height="70">
      <v-app-bar-nav-icon @click="drawer = !drawer" class="d-md-none text-slate-700" />

      <!-- Judul Appbar otomatis mengikuti menu aktif atau default -->
      <v-app-bar-title class="font-weight-bold text-slate-800 ml-2 text-subtitle-1">
        {{ currentMenuTitle }}
      </v-app-bar-title>

      <v-spacer />

      <!-- USER INFO RIGHT -->
      <div class="d-flex align-center">
        <v-avatar size="38" color="indigo-lighten-5" class="mr-3 border-indigo-subtle">
          <span class="text-indigo-darken-2 font-weight-bold text-subtitle-2">{{ userInitials }}</span>
        </v-avatar>
        
        <div class="overflow-hidden d-none d-sm-block">
          <div class="text-subtitle-2 font-weight-bold text-truncate text-slate-900" style="font-size: 13px !important;">
            {{ userName }}
          </div>
          <v-tooltip text="Keluar dari sistem" location="bottom">
            <template #activator="{ props }">
              <div
                v-bind="props"
                class="text-caption text-rose-600 font-weight-semibold cursor-pointer d-flex align-center logout-trigger"
                @click="logout"
                style="font-size: 11px !important;"
              >
                <v-icon size="12" class="mr-1">mdi:logout</v-icon>
                Keluar
              </div>
            </template>
          </v-tooltip>
        </div>
      </div>
    </v-app-bar>

    <!-- MAIN CONTENT CONTAINER -->
    <!-- MAIN CONTENT CONTAINER -->
    <v-main class="main-background">
      <v-container fluid class="pa-6">
        <v-fade-transition mode="out-in">
          <div>
            <NuxtPage />
          </div>
        </v-fade-transition>
      </v-container>
    </v-main>

    <!-- SNACKBAR NOTIFICATION -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      location="top right"
      timeout="3000"
      rounded="pill"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Tutup</v-btn>
      </template>
    </v-snackbar>

    <!-- EXPORT PASSWORD DIALOG -->
    <v-dialog v-model="showExportDialog" max-width="400">
      <v-card class="rounded-2xl pa-4 elevation-6">
        <v-card-title class="font-weight-bold text-slate-900 text-h6 px-4 pt-4">
          Password Ekspor Data
        </v-card-title>

        <v-card-text class="px-4 pt-2 pb-0">
          <v-text-field
            v-model="exportPassword"
            label="Masukkan Password"
            type="password"
            variant="outlined"
            density="comfortable"
            color="indigo-darken-2"
            class="rounded-xl"
            autofocus
          />
        </v-card-text>

        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" class="text-slate-600 text-none" @click="showExportDialog = false">
            Batal
          </v-btn>
          <v-btn color="indigo-darken-2" class="text-none rounded-xl px-5" :loading="exportLoading" @click="exportExcel">
            Download
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute, useNuxtApp } from "#imports";
import { useAuth } from "~~/app/composables/useAuth";
import { watch } from "vue";

const showExportDialog = ref(false);
const exportPassword = ref("");
const exportLoading = ref(false);

const router = useRouter();
const route = useRoute();
const { logout: authLogout } = useAuth();
const drawer = ref(true);
const userName = ref("Guest");

const menus = ref<any[]>([]);
const menuLoading = ref(true);

const snackbar = ref({
  show: false,
  text: "",
  color: "success",
});

watch(
  () => route.query.error,
  (errorVal) => {
    if (errorVal === "unauthorized") {
      notify("Akses ditolak! Anda tidak memiliki izin untuk membuka halaman tersebut.", "error");
      
      // Bersihkan query parameter dari URL agar bersih kembali
      router.replace({ query: {} });
    }
  },
  { immediate: true }
);

function notify(message: string, color: string = "success") {
  snackbar.value.text = message;
  snackbar.value.color = color;
  snackbar.value.show = true;
}

function formatIcon(iconStr: string) {
  if (!iconStr) return 'mdi-view-dashboard';
  return iconStr.replace(':', '-');
}

// Menyesuaikan judul Appbar secara otomatis berdasarkan path menu yang sedang dibuka
const currentMenuTitle = computed(() => {
  const activeMenu = menus.value.find(m => m.path === route.path);
  return activeMenu ? activeMenu.name : "Dashboard Panel";
});

// Fungsi mengambil data menu sidebar dari backend
const fetchSidebarMenus = async () => {
  try {
    const { $api } = useNuxtApp();
    const res: any = await $api("/auth/menus", { method: "GET" });
    const menuList = res?.data || res;

    if (Array.isArray(menuList)) {
      menus.value = menuList;
    }
  } catch (err: any) {
    console.error("Gagal memuat menu sidebar:", err);
  } finally {
    menuLoading.value = false;
  }
};

// Listener event kustom agar sidebar otomatis update ketika ada perubahan menu / hak akses
const handleMenuUpdate = () => {
  fetchSidebarMenus();
};

onMounted(() => {
  const userData = localStorage.getItem("user_data");
  if (userData) {
    try {
      const user = JSON.parse(userData);
      userName.value = user.name || "User";
    } catch (e) {
      console.error("Gagal parsing user data dari localStorage");
    }
  }

  fetchSidebarMenus();

  // Daftarkan listener event dari halaman manajemen menu
  window.addEventListener("menu-access-updated", handleMenuUpdate);
});

onUnmounted(() => {
  window.removeEventListener("menu-access-updated", handleMenuUpdate);
});

const userInitials = computed(() => {
  if (!userName.value || userName.value === "Guest") return "G";
  const parts = userName.value.split(/[.\s]/).filter(Boolean);
  if (parts.length > 1) {
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? "";
    const initials = (a + b).toUpperCase();
    return initials || "G";
  }
  const fallback = (userName.value.substring(0, 2) ?? "").toUpperCase();
  return fallback || "G";
});

function logout() {
  authLogout();
}

async function exportExcel() {
  if (!exportPassword.value) {
    notify("Password tidak boleh kosong", "error");
    return;
  }

  exportLoading.value = true;

  try {
    const { $api } = useNuxtApp();
    const blob: Blob = await $api(
      `/ocr/export?password=${encodeURIComponent(exportPassword.value)}`,
      { method: "GET", responseType: "blob" },
    );

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ktp_export_${new Date().getTime()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    notify("Data berhasil diekspor", "success");
    showExportDialog.value = false;
    exportPassword.value = "";
  } catch (err: any) {
    if (err.status === 403) {
      notify("Password export tidak valid", "error");
    } else if (err.status !== 401) {
      notify("Gagal mengunduh file Excel", "error");
    }
  } finally {
    exportLoading.value = false;
  }
}
</script>

<style scoped>
.workspace-layout {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: #f8fafc;
}
.sidebar-clean {
  background-color: #ffffff !important;
  border-right: 1px solid #e2e8f0;
}
.user-profile-box {
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 14px;
}
.appbar-clean {
  border-bottom: 1px solid #e2e8f0;
}
.main-background {
  background-color: #f8fafc;
}
.menu-item-custom {
  font-weight: 500;
  color: #334155;
  transition: all 0.2s ease;
}
.menu-item-custom:hover {
  background-color: #f1f5f9;
}
:deep(.v-list-item--active) {
  background-color: #eef2ff !important;
  color: #4f46e5 !important;
}
.border-indigo-subtle {
  border: 1px solid rgba(79, 70, 229, 0.2);
}
.logout-trigger {
  color: #e11d48 !important;
  transition: opacity 0.2s;
}
.logout-trigger:hover {
  opacity: 0.8;
}
:deep(.v-navigation-drawer__content::-webkit-scrollbar) {
  width: 4px;
}
:deep(.v-navigation-drawer__content::-webkit-scrollbar-thumb) {
  background: #cbd5e1;
  border-radius: 10px;
}
</style>