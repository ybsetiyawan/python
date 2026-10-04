<template>
  <!-- SINGLE ROOT NODE UNTUK MENCEGAH ERROR TRANSITION VUE -->
  <div class="menu-management-page">
    
    <!-- TOP HEADER -->
    <div class="page-header slide-up">
      <div class="header-info">
        <div class="system-badge">
          <v-icon size="13" class="mr-1.5" color="indigo-darken-2">mdi-menu</v-icon>
          EDP Portal Surabaya
        </div>
        <h1>Manajemen Menu Navigasi & Hak Akses</h1>
        <p>Kelola daftar modul, jalur path, urutan tampil, ikon, status publikasi, serta hak akses user.</p>
      </div>
      
      <!-- Tombol Header Ikon / Compact -->
      <div class="header-actions-group">
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-shield-account-outline"
              color="indigo-darken-2"
              variant="flat"
              class="rounded-xl elevation-1"
              size="large"
              @click="openUserAccessDialog"
            ></v-btn>
          </template>
          <span>Atur Hak Akses User</span>
        </v-tooltip>

        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-plus"
              color="indigo-darken-2"
              variant="flat"
              class="rounded-xl elevation-1"
              size="large"
              @click="openAddDialog"
            ></v-btn>
          </template>
          <span>Tambah Menu Baru</span>
        </v-tooltip>
      </div>
    </div>

    <!-- MAIN CARD TABLE CONTAINER -->
    <v-card class="rounded-2xl border elevation-0 slide-up delay-1">
      <v-data-table
        :headers="headers"
        :items="menus"
        :loading="loading"
        class="custom-table"
        no-data-text="Belum ada data menu sistem"
      >
        <!-- Kolom Urutan -->
        <template v-slot:item.sort_order="{ item }">
          <span class="font-weight-bold text-slate-700 pl-2">{{ item.sort_order }}</span>
        </template>

        <!-- Kolom Icon -->
        <template v-slot:item.icon="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar color="indigo-lighten-5" rounded="lg" size="38" class="mr-3 flex-shrink-0">
              <v-icon color="indigo-darken-2" size="22">
                {{ item.icon ? item.icon.replace(':', '-') : 'mdi-folder-outline' }}
              </v-icon>
            </v-avatar>
            <div class="icon-text-wrap">
              <span class="d-block text-body-2 font-weight-medium text-slate-800 text-truncate" style="max-width: 160px;">
                {{ item.icon || '-' }}
              </span>
            </div>
          </div>
        </template>

        <!-- Kolom Nama Menu -->
        <template v-slot:item.name="{ item }">
          <span class="font-weight-semibold text-slate-900">{{ item.name }}</span>
        </template>

        <!-- Kolom Path -->
        <template v-slot:item.path="{ item }">
          <code class="px-2 py-1 rounded bg-slate-100 text-indigo-darken-2 text-caption font-weight-medium">
            {{ item.path }}
          </code>
        </template>

        <!-- Kolom Status Publish -->
        <template v-slot:item.is_publish="{ item }">
          <v-chip
            :color="item.is_publish === 'Y' ? 'success' : 'grey'"
            size="small"
            class="font-weight-bold px-3"
            variant="flat"
          >
            {{ item.is_publish === 'Y' ? 'Published' : 'Draft' }}
          </v-chip>
        </template>

        <!-- Kolom Aksi -->
        <template v-slot:item.actions="{ item }">
          <div class="d-flex align-center" style="gap: 4px;">
            <v-btn
              icon="mdi-pencil-outline"
              size="small"
              variant="text"
              color="indigo-darken-2"
              @click="openEditDialog(item)"
              title="Edit Menu"
            ></v-btn>
            <v-btn
              icon="mdi-delete-outline"
              size="small"
              variant="text"
              color="error"
              @click="confirmDelete(item)"
              title="Hapus Menu"
            ></v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- DIALOG FORM TAMBAH / EDIT -->
    <v-dialog v-model="dialog.show" max-width="480" persistent>
      <v-card class="rounded-2xl pa-5 elevation-4">
        <div class="d-flex justify-space-between align-center mb-4">
          <h3 class="text-subtitle-1 font-weight-bold text-slate-900">
            {{ dialog.isEdit ? 'Edit Menu Sistem' : 'Tambah Menu Baru' }}
          </h3>
          <v-btn icon="mdi-close" variant="text" size="small" @click="dialog.show = false"></v-btn>
        </div>

        <v-form ref="formRef" @submit.prevent="saveMenu">
          <div class="mb-3">
            <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">Nama Menu</label>
            <v-text-field
              v-model="form.name"
              placeholder="Contoh: Manajemen Form"
              variant="outlined"
              density="comfortable"
              :rules="[(v: string) => !!v || 'Nama menu wajib diisi']"
              hide-details="auto"
              class="rounded-lg"
            ></v-text-field>
          </div>

          <div class="mb-3">
            <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">Path URL</label>
            <v-text-field
              v-model="form.path"
              placeholder="Contoh: /admin/forms"
              variant="outlined"
              density="comfortable"
              :rules="[(v: string) => !!v || 'Path wajib diisi']"
              hide-details="auto"
            ></v-text-field>
          </div>

          <div class="mb-3">
            <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">
              Icon MDI (Contoh: mdi:view-dashboard)
            </label>
            <v-text-field
              v-model="form.icon"
              placeholder="mdi:view-dashboard"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
            ></v-text-field>
          </div>

          <div class="d-flex mb-3" style="gap: 12px;">
            <div class="flex-grow-1">
              <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">Sort Order</label>
              <v-text-field
                v-model.number="form.sort_order"
                type="number"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              ></v-text-field>
            </div>
            <div class="flex-grow-1">
              <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">Status Publish</label>
              <v-select
                v-model="form.is_publish"
                :items="[{ title: 'Published (Y)', value: 'Y' }, { title: 'Draft (N)', value: 'N' }]"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              ></v-select>
            </div>
          </div>

          <div class="d-flex justify-end mt-5" style="gap: 8px;">
            <v-btn
              variant="text"
              color="slate-600"
              class="text-none font-weight-bold rounded-xl px-4"
              @click="dialog.show = false"
            >
              Batal
            </v-btn>
            <v-btn
              color="indigo-darken-2"
              type="submit"
              class="text-none font-weight-bold rounded-xl px-6 elevation-0"
              :loading="saving"
            >
              Simpan Menu
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- DIALOG PENGATURAN HAK AKSES USER -->
    <v-dialog v-model="accessDialog.show" max-width="520" persistent>
      <v-card class="rounded-2xl pa-5 elevation-4">
        <div class="d-flex justify-space-between align-center mb-3">
          <div>
            <h3 class="text-subtitle-1 font-weight-bold text-slate-900">Pengaturan Hak Akses Menu User</h3>
            <p class="text-caption text-slate-500 mb-0">Pilih user karyawan dan centang modul menu yang diizinkan.</p>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="accessDialog.show = false"></v-btn>
        </div>

        <!-- Pilih User -->
        <div class="mb-3">
          <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">Cari / Pilih User Karyawan</label>
          <v-autocomplete
            v-model="accessDialog.selectedUserId"
            :items="users"
            item-title="name"
            item-value="id"
            :loading="accessDialog.loadingUsers"
            placeholder="Ketik nama atau pilih user..."
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            clearable
            no-data-text="Data user tidak ditemukan"
            @update:model-value="fetchUserMenus"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="item.raw.email || item.raw.username"></v-list-item>
            </template>
          </v-autocomplete>
        </div>

        <!-- Daftar Menu dengan Checkbox -->
        <div class="mb-4">
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-caption font-weight-bold text-slate-700">Daftar Menu Navigasi</span>
            <span v-if="accessDialog.menuItems.length > 0" class="text-caption text-indigo-darken-2 font-weight-bold">
              {{ accessDialog.menuItems.filter((m: any) => m.is_checked).length }} / {{ accessDialog.menuItems.length }} Dipilih
            </span>
          </div>

          <div class="menu-access-container border rounded-xl pa-2 bg-slate-50" style="max-height: 240px; overflow-y: auto;">
            <div v-if="accessDialog.loadingMenus" class="text-center py-5 text-slate-500">
              <v-progress-circular indeterminate color="indigo-darken-2" size="22" width="3"></v-progress-circular>
              <div class="mt-2 text-caption font-weight-medium">Memuat hak akses menu...</div>
            </div>
            <div v-else-if="!accessDialog.selectedUserId" class="text-center py-5 text-slate-400 text-caption">
              <v-icon size="24" color="slate-300" class="mb-1">mdi-account-arrow-left-outline</v-icon>
              <div>Silakan pilih user terlebih dahulu untuk mengatur hak akses.</div>
            </div>
            <div v-else-if="accessDialog.menuItems.length === 0" class="text-center py-5 text-slate-400 text-caption">
              Belum ada data menu sistem yang tersedia.
            </div>
            <div v-else class="d-flex flex-column" style="gap: 4px;">
              <div 
                v-for="menu in accessDialog.menuItems" 
                :key="menu.id"
                class="menu-checkbox-item px-3 py-1.5 rounded-lg bg-white border transition-all"
                :class="{ 'border-indigo-light bg-indigo-subtle': menu.is_checked }"
              >
                <v-checkbox
                  v-model="menu.is_checked"
                  density="compact"
                  hide-details
                  color="indigo-darken-2"
                >
                  <template v-slot:label>
                    <div class="d-flex justify-space-between align-center w-100 pl-1">
                      <span class="font-weight-semibold text-slate-800 text-body-2">{{ menu.name }}</span>
                      <code class="text-caption text-indigo-darken-2 bg-slate-100 px-2 py-0.5 rounded">{{ menu.path }}</code>
                    </div>
                  </template>
                </v-checkbox>
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex justify-end pt-2 border-top" style="gap: 8px;">
          <v-btn
            variant="text"
            color="slate-600"
            class="text-none font-weight-bold rounded-xl px-4"
            @click="accessDialog.show = false"
          >
            Tutup
          </v-btn>
          <v-btn
            color="indigo-darken-2"
            class="text-none font-weight-bold rounded-xl px-6 elevation-0"
            :loading="accessDialog.saving"
            :disabled="!accessDialog.selectedUserId"
            @click="saveUserAccess"
          >
            Simpan Hak Akses
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- DIALOG KONFIRMASI HAPUS -->
    <v-dialog v-model="deleteDialog.show" max-width="360">
      <v-card class="rounded-2xl pa-5 text-center elevation-4">
        <div class="modal-icon-container bg-red-light mb-3 mx-auto">
          <v-icon color="error" size="26">mdi-alert-circle-outline</v-icon>
        </div>
        <h3 class="text-subtitle-1 font-weight-bold text-slate-900 mb-1">Hapus Menu Ini?</h3>
        <p class="text-body-2 text-slate-600 mb-5">
          Menu <strong class="text-slate-900">{{ deleteDialog.item?.name }}</strong> akan dihapus permanen dari sistem.
        </p>
        <div class="d-flex justify-center" style="gap: 8px;">
          <v-btn
            variant="outlined"
            class="flex-grow-1 rounded-xl text-none font-weight-bold"
            @click="deleteDialog.show = false"
          >
            Batal
          </v-btn>
          <v-btn
            color="error"
            class="flex-grow-1 rounded-xl text-none font-weight-bold elevation-0"
            :loading="deleting"
            @click="executeDelete"
          >
            Ya, Hapus
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- GLOBAL TOAST NOTIFICATION -->
    <v-snackbar
      v-model="toast.show"
      :color="toast.color"
      location="top right"
      timeout="3500"
      elevation="4"
      rounded="pill"
    >
      <div class="d-flex align-center" style="gap: 8px;">
        <v-icon :icon="toast.icon" size="20"></v-icon>
        <span class="font-weight-semibold text-body-2">{{ toast.message }}</span>
      </div>
    </v-snackbar>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useNuxtApp } from '#imports'

definePageMeta({ 
  layout: 'admin',
  middleware: ['auth-menu']
})

const { $api } = useNuxtApp()

const menus = ref<any[]>([])
const users = ref<any[]>([]) 
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)

const toast = reactive({
  show: false,
  message: '',
  color: 'success',
  icon: 'mdi-check-circle'
})

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.message = message
  toast.color = type === 'success' ? 'indigo-darken-2' : 'error'
  toast.icon = type === 'success' ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline'
  toast.show = true
}

const headers = [
  { title: 'Urutan', key: 'sort_order', align: 'start' as const, width: '90px' },
  { title: 'Ikon', key: 'icon', width: '220px' },
  { title: 'Nama Menu', key: 'name' },
  { title: 'Path URL', key: 'path' },
  { title: 'Status', key: 'is_publish', width: '130px' },
  { title: 'Aksi', key: 'actions', align: 'end' as const, sortable: false, width: '100px' }
]

const dialog = reactive({
  show: false,
  isEdit: false,
  editId: null as any
})

const form = reactive({
  name: '',
  path: '',
  icon: 'mdi:view-dashboard',
  sort_order: 0,
  is_publish: 'Y'
})

const accessDialog = reactive({
  show: false,
  selectedUserId: null as any,
  loadingUsers: false,
  loadingMenus: false,
  saving: false,
  menuItems: [] as any[]
})

const deleteDialog = reactive({
  show: false,
  item: null as any
})

const fetchMenus = async () => {
  loading.value = true
  try {
    const res: any = await $api('/menus', { method: 'GET' })
    if (res && res.success) {
      menus.value = res.data
    }
  } catch (err: any) {
    console.error('Gagal mengambil data menu:', err)
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  accessDialog.loadingUsers = true
  try {
    const res: any = await $api('/users', { method: 'GET' })
    if (res) {
      if (Array.isArray(res)) {
        users.value = res
      } else if (res.success && Array.isArray(res.data)) {
        users.value = res.data
      } else if (res.data && Array.isArray(res.data.rows)) {
        users.value = res.data.rows
      }
    }
  } catch (err: any) {
    console.error('Gagal mengambil daftar user:', err)
  } finally {
    accessDialog.loadingUsers = false
  }
}

const openUserAccessDialog = () => {
  accessDialog.selectedUserId = null
  accessDialog.menuItems = []
  accessDialog.show = true
  fetchUsers()
}

const fetchUserMenus = async () => {
  if (!accessDialog.selectedUserId) {
    accessDialog.menuItems = []
    return
  }
  accessDialog.loadingMenus = true
  try {
    const res: any = await $api(`/menus/user/${accessDialog.selectedUserId}`, { method: 'GET' })
    
    if (res && res.success) {
      accessDialog.menuItems = res.data.map((m: any) => {
        const assignedFlag = m.is_assigned ?? m.has_access ?? m.is_checked ?? m.status ?? m.checked ?? false
        const isChecked = 
          assignedFlag === true || 
          assignedFlag === 1 || 
          assignedFlag === '1' || 
          assignedFlag === 'Y' || 
          assignedFlag === 'true' ||
          assignedFlag > 0
          
        return {
          ...m,
          is_checked: isChecked
        }
      })
    }
  } catch (err: any) {
    console.error('Gagal mengambil hak akses menu user:', err)
  } finally {
    accessDialog.loadingMenus = false
  }
}

const saveUserAccess = async () => {
  if (!accessDialog.selectedUserId) return
  accessDialog.saving = true
  try {
    const payload = {
      menuIds: accessDialog.menuItems.filter((m: any) => m.is_checked).map((m: any) => m.id)
    }

    const res: any = await $api(`/menus/user/${accessDialog.selectedUserId}`, {
      method: 'POST',
      body: payload
    })

    if (res && res.success) {
      showToast('Hak akses menu berhasil disimpan!')
      accessDialog.show = false
      window.dispatchEvent(new CustomEvent('menu-access-updated'))
    }
  } catch (err: any) {
    console.error('Gagal menyimpan hak akses:', err)
    // Menangkap pesan error spesifik dari backend (message atau error)
    const backendMessage = err?.data?.message || err?.data?.error || err?.message || 'Terjadi kesalahan saat menyimpan hak akses'
    showToast(backendMessage, 'error')
  } finally {
    accessDialog.saving = false
  }
}

const openAddDialog = () => {
  dialog.isEdit = false
  dialog.editId = null
  form.name = ''
  form.path = ''
  form.icon = 'mdi:view-dashboard'
  form.sort_order = menus.value.length + 1
  form.is_publish = 'Y'
  dialog.show = true
}

const openEditDialog = (item: any) => {
  dialog.isEdit = true
  dialog.editId = item.id
  form.name = item.name
  form.path = item.path
  form.icon = item.icon || ''
  form.sort_order = item.sort_order ?? 0
  form.is_publish = item.is_publish || 'Y'
  dialog.show = true
}

const saveMenu = async () => {
  saving.value = true
  try {
    if (dialog.isEdit) {
      await $api(`/menus/${dialog.editId}`, {
        method: 'PUT',
        body: form
      })
      showToast('Menu berhasil diperbarui!')
    } else {
      await $api('/menus', {
        method: 'POST',
        body: form
      })
      showToast('Menu baru berhasil ditambahkan!')
    }
    dialog.show = false
    await fetchMenus()
    window.dispatchEvent(new CustomEvent('menu-access-updated'))
  } catch (err: any) {
    console.error('Gagal menyimpan menu:', err)
    // Menangkap pesan error spesifik dari backend
    const backendMessage = err?.data?.message || err?.data?.error || err?.message || 'Terjadi kesalahan saat menyimpan menu'
    showToast(backendMessage, 'error')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (item: any) => {
  deleteDialog.item = item
  deleteDialog.show = true
}

const executeDelete = async () => {
  if (!deleteDialog.item) return
  deleting.value = true
  try {
    await $api(`/menus/${deleteDialog.item.id}`, { method: 'DELETE' })
    deleteDialog.show = false
    showToast('Menu berhasil dihapus!')
    await fetchMenus()
    window.dispatchEvent(new CustomEvent('menu-access-updated'))
  } catch (err: any) {
    console.error('Gagal menghapus menu:', err)
    // Menangkap pesan error spesifik dari backend
    const backendMessage = err?.data?.message || err?.data?.error || err?.message || 'Gagal menghapus menu'
    showToast(backendMessage, 'error')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchMenus()
})
</script>
<style scoped>
.menu-management-page {
  max-width: 1140px;
  margin: 0 auto;
  padding: 28px 20px 50px 20px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #1e293b;
  box-sizing: border-box;
}

.page-header {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px 26px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px -2px rgba(0, 0, 0, 0.02);
}

.header-actions-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.system-badge {
  background: #eef2ff;
  color: #4f46e5;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  margin-bottom: 6px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.header-info h1 {
  font-size: 19px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 2px 0;
  letter-spacing: -0.3px;
}

.header-info p {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.modal-icon-container {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-red-light { background-color: #ffeeec; }
.bg-indigo-subtle { background-color: #f5f3ff !important; }

.menu-checkbox-item {
  border-color: #e2e8f0 !important;
  transition: all 0.2s ease;
}
.menu-checkbox-item:hover {
  border-color: #c7d2fe !important;
  background-color: #faf8ff !important;
}

:deep(.v-data-table) {
  background: transparent !important;
}

:deep(.v-data-table-header th) {
  font-weight: 700 !important;
  color: #475569 !important;
  background-color: #f8fafc !important;
  text-transform: uppercase;
  font-size: 11px !important;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e2e8f0 !important;
}

:deep(.v-data-table td) {
  border-bottom: 1px solid #f1f5f9 !important;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}

.slide-up {
  opacity: 0;
  transform: translateY(10px);
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.delay-1 { animation-delay: 0.05s; }

@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 800px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
  }
  .header-actions-group {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>