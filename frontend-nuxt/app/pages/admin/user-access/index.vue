<template>
  <div class="user-access-page">
    <!-- TOP HEADER -->
    <div class="page-header slide-up">
      <div class="header-info">
        <div class="system-badge">
          <v-icon size="13" class="mr-1.5" color="indigo-darken-2">mdi-shield-account</v-icon>
          EDP Portal Surabaya
        </div>
        <h1>Otorisasi Hak Akses Menu</h1>
        <p>Atur modul navigasi yang diizinkan untuk diakses oleh masing-masing akun pengguna.</p>
      </div>
    </div>

    <!-- CONTENT GRID -->
    <v-row class="slide-up delay-1">
      <!-- KOLOM KIRI: DAFTAR USER -->
      <v-col cols="12" md="4">
        <v-card class="rounded-2xl border elevation-0 pa-4 h-100">
          <h3 class="text-subtitle-1 font-weight-bold text-slate-900 mb-3">Pilih Pengguna</h3>
          <v-list class="user-list rounded-xl" density="comfortable">
            <v-list-item
              v-for="user in users"
              :key="user.id"
              :active="selectedUser?.id === user.id"
              active-color="indigo-darken-2"
              class="rounded-xl mb-1 cursor-pointer"
              @click="selectUser(user)"
            >
              <template v-slot:prepend>
                <v-avatar color="indigo-lighten-5" size="36" class="mr-2">
                  <span class="text-indigo-darken-2 font-weight-bold text-caption">
                    {{ user.name ? user.name.substring(0, 2).toUpperCase() : 'US' }}
                  </span>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-semibold text-slate-900">{{ user.name }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption text-slate-500">{{ user.email }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- KOLOM KANAN: MATRIKS MENU CHECKBOX -->
      <v-col cols="12" md="8">
        <v-card class="rounded-2xl border elevation-0 pa-5">
          <div v-if="!selectedUser" class="text-center py-12 text-slate-400">
            <v-icon size="48" class="mb-2">mdi-account-arrow-left-outline</v-icon>
            <p class="text-body-2 font-weight-medium">Silakan pilih salah satu pengguna di sebelah kiri terlebih dahulu.</p>
          </div>

          <template v-else>
            <div class="d-flex justify-space-between align-center mb-4 pb-3 border-bottom">
              <div>
                <h3 class="text-subtitle-1 font-weight-bold text-slate-900">Hak Akses untuk: <span class="text-indigo-darken-2">{{ selectedUser.name }}</span></h3>
                <p class="text-caption text-slate-500">Centang menu di bawah untuk mengizinkan akses modul.</p>
              </div>
              <v-btn
                color="indigo-darken-2"
                class="rounded-xl text-none font-weight-bold px-5"
                elevation="0"
                :loading="saving"
                @click="saveAccess"
              >
                Simpan Perubahan
              </v-btn>
            </div>

            <v-list class="menu-checklist">
              <v-list-item v-for="menu in menuList" :key="menu.id" class="px-0 py-2">
                <template v-slot:prepend>
                  <v-checkbox-btn
                    v-model="menu.is_assigned"
                    color="indigo-darken-2"
                    class="mr-2"
                  ></v-checkbox-btn>
                </template>
                <div class="d-flex align-center justify-space-between w-100">
                  <div class="d-flex align-center gap-3">
                    <v-avatar color="indigo-lighten-5" rounded="lg" size="34">
                      <v-icon color="indigo-darken-2" size="18">
                        {{ menu.icon ? menu.icon.replace(':', '-') : 'mdi-folder-outline' }}
                      </v-icon>
                    </v-avatar>
                    <div>
                      <div class="font-weight-semibold text-slate-800 text-body-2">{{ menu.name }}</div>
                      <code class="text-caption text-slate-500">{{ menu.path }}</code>
                    </div>
                  </div>
                  <v-chip size="x-small" :color="menu.is_publish === 'Y' ? 'success' : 'grey'" variant="flat">
                    {{ menu.is_publish === 'Y' ? 'Published' : 'Draft' }}
                  </v-chip>
                </div>
              </v-list-item>
            </v-list>
          </template>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useNuxtApp } from '#imports'

definePageMeta({ layout: 'admin' })

const { $api } = useNuxtApp()

const users = ref([])
const selectedUser = ref(null)
const menuList = ref([])
const saving = ref(false)

// Ambil daftar seluruh user (sesuaikan endpoint user Anda, misal /users atau /auth/users)
const fetchUsers = async () => {
  try {
    const res = await $api('/auth/users', { method: 'GET' }) // Sesuaikan dengan endpoint list user Anda
    if (res && res.success) {
      users.value = res.data
    }
  } catch (err) {
    console.error('Gagal memuat data user:', err)
  }
}

// Saat user diklik di panel kiri
const selectUser = async (user) => {
  selectedUser.value = user
  try {
    const res = await $api(`/menus/user/${user.id}`, { method: 'GET' })
    if (res && res.success) {
      menuList.value = res.data
    }
  } catch (err) {
    console.error('Gagal memuat akses menu user:', err)
  }
}

// Simpan perubahan akses
const saveAccess = async () => {
  if (!selectedUser.value) return
  saving.value = true
  try {
    // Ambil ID menu yang status is_assigned-nya true
    const assignedMenuIds = menuList.value
      .filter(m => m.is_assigned)
      .map(m => m.id)

    const res = await $api(`/menus/user/${selectedUser.value.id}`, {
      method: 'POST',
      body: { menuIds: assignedMenuIds }
    })

    if (res && res.success) {
      alert('Hak akses berhasil diperbarui!')
    }
  } catch (err) {
    console.error('Gagal menyimpan akses:', err)
    alert('Terjadi kesalahan saat menyimpan akses')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-access-page {
  max-width: 1140px;
  margin: 0 auto;
  padding: 36px 24px 60px 24px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #1e293b;
  background-color: #f8fafc;
  min-height: 100vh;
}
.page-header {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 28px 32px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px -2px rgba(0, 0, 0, 0.02);
}
.system-badge {
  background: #eef2ff;
  color: #4f46e5;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  margin-bottom: 10px;
  text-transform: uppercase;
}
.header-info h1 {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px 0;
}
.header-info p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}
.border-bottom {
  border-bottom: 1px solid #f1f5f9;
}
</style>