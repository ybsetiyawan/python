<template>
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
      <div class="header-action d-flex flex-wrap gap-2">
        <v-btn
          color="indigo-darken-2"
          class="rounded-xl px-5 text-none font-weight-bold elevation-2"
          height="46"
          prepend-icon="mdi-shield-account-outline"
          @click="openUserAccessDialog"
        >
          Atur Akses User
        </v-btn>
        <v-btn
          color="indigo-darken-2"
          class="rounded-xl px-5 text-none font-weight-bold elevation-2"
          height="46"
          prepend-icon="mdi-plus"
          @click="openAddDialog"
        >
          Tambah Menu Baru
        </v-btn>
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
          <div class="d-flex align-center gap-1">
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
    <v-dialog v-model="dialog.show" max-width="500" persistent>
      <v-card class="rounded-2xl pa-6 elevation-4">
        <div class="d-flex justify-space-between align-center mb-4">
          <h3 class="text-h6 font-weight-bold text-slate-900">
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
              :rules="[v => !!v || 'Nama menu wajib diisi']"
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
              :rules="[v => !!v || 'Path wajib diisi']"
              hide-details="auto"
            ></v-text-field>
          </div>

          <div class="mb-3">
            <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">
              Icon MDI (Contoh: mdi:view-dashboard atau mdi-view-dashboard)
            </label>
            <v-text-field
              v-model="form.icon"
              placeholder="mdi:view-dashboard"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
            ></v-text-field>
          </div>

          <div class="row-fields d-flex gap-3 mb-3">
            <div class="flex-grow-1">
              <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">Sort Order (Urutan)</label>
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

          <div class="d-flex justify-end gap-2 mt-6">
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
    <v-dialog v-model="accessDialog.show" max-width="580" persistent>
      <v-card class="rounded-2xl pa-6 elevation-4">
        <div class="d-flex justify-space-between align-center mb-4">
          <div>
            <h3 class="text-h6 font-weight-bold text-slate-900">Pengaturan Hak Akses Menu User</h3>
            <p class="text-caption text-slate-500">Pilih user karyawan dan centang modul menu yang diizinkan.</p>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="accessDialog.show = false"></v-btn>
        </div>

        <!-- Pilih User menggunakan v-autocomplete -->
        <div class="mb-4">
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
            <span v-if="accessDialog.menuItems.length > 0" class="text-caption text-indigo-darken-2 font-weight-medium">
              {{ accessDialog.menuItems.filter(m => m.is_checked).length }} / {{ accessDialog.menuItems.length }} Dipilih
            </span>
          </div>

          <div class="menu-access-container border rounded-xl pa-3 bg-slate-50" style="max-height: 260px; overflow-y: auto;">
            <div v-if="accessDialog.loadingMenus" class="text-center py-6 text-slate-500">
              <v-progress-circular indeterminate color="indigo-darken-2" size="24" width="3"></v-progress-circular>
              <div class="mt-2 text-caption font-weight-medium">Memuat hak akses menu...</div>
            </div>
            <div v-else-if="!accessDialog.selectedUserId" class="text-center py-6 text-slate-400 text-caption">
              <v-icon size="28" color="slate-300" class="mb-1">mdi-account-arrow-left-outline</v-icon>
              <div>Silakan pilih user terlebih dahulu untuk mengatur hak akses menu.</div>
            </div>
            <div v-else-if="accessDialog.menuItems.length === 0" class="text-center py-6 text-slate-400 text-caption">
              Belum ada data menu sistem yang tersedia.
            </div>
            <div v-else class="d-flex flex-column gap-1">
              <div 
                v-for="menu in accessDialog.menuItems" 
                :key="menu.id"
                class="menu-checkbox-item px-3 py-2 rounded-lg bg-white border transition-all"
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

        <div class="d-flex justify-end gap-2 pt-2 border-top">
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
    <v-dialog v-model="deleteDialog.show" max-width="380">
      <v-card class="rounded-2xl pa-6 text-center elevation-4">
        <div class="modal-icon-container bg-red-light mb-3 mx-auto">
          <v-icon color="error" size="28">mdi-alert-circle-outline</v-icon>
        </div>
        <h3 class="text-h6 font-weight-bold text-slate-900 mb-2">Hapus Menu Ini?</h3>
        <p class="text-body-2 text-slate-600 mb-6">
          Menu <strong class="text-slate-900">{{ deleteDialog.item?.name }}</strong> akan dihapus permanen dari sistem hak akses.
        </p>
        <div class="d-flex gap-3 justify-center">
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

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useNuxtApp } from '#imports'

definePageMeta({ layout: 'admin' })

const { $api } = useNuxtApp()

const menus = ref([])
const users = ref([]) 
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)

const headers = [
  { title: 'Urutan', key: 'sort_order', align: 'start', width: '90px' },
  { title: 'Ikon', key: 'icon', width: '220px' },
  { title: 'Nama Menu', key: 'name' },
  { title: 'Path URL', key: 'path' },
  { title: 'Status', key: 'is_publish', width: '130px' },
  { title: 'Aksi', key: 'actions', align: 'end', sortable: false, width: '100px' }
]

const dialog = reactive({
  show: false,
  isEdit: false,
  editId: null
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
  selectedUserId: null,
  loadingUsers: false,
  loadingMenus: false,
  saving: false,
  menuItems: []
})

const deleteDialog = reactive({
  show: false,
  item: null
})

const fetchMenus = async () => {
  loading.value = true
  try {
    const res = await $api('/menus', { method: 'GET' })
    if (res && res.success) {
      menus.value = res.data
    }
  } catch (err) {
    console.error('Gagal mengambil data menu:', err)
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  accessDialog.loadingUsers = true
  try {
    const res = await $api('/users', { method: 'GET' })
    if (res) {
      if (Array.isArray(res)) {
        users.value = res
      } else if (res.success && Array.isArray(res.data)) {
        users.value = res.data
      } else if (res.data && Array.isArray(res.data.rows)) {
        users.value = res.data.rows
      }
    }
  } catch (err) {
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
    const res = await $api(`/menus/user/${accessDialog.selectedUserId}`, { method: 'GET' })
    if (res && res.success) {
      accessDialog.menuItems = res.data.map(m => ({
        ...m,
        is_checked: Boolean(m.is_assigned)
      }))
    }
  } catch (err) {
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
      menuIds: accessDialog.menuItems.filter(m => m.is_checked).map(m => m.id)
    }
    
    const res = await $api(`/menus/user/${accessDialog.selectedUserId}`, {
      method: 'POST',
      body: payload
    })

    if (res && res.success) {
      alert('Hak akses menu berhasil disimpan!')
      accessDialog.show = false
    }
  } catch (err) {
    console.error('Gagal menyimpan hak akses:', err)
    alert(err?.data?.error || 'Terjadi kesalahan saat menyimpan hak akses')
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

const openEditDialog = (item) => {
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
    } else {
      await $api('/menus', {
        method: 'POST',
        body: form
      })
    }
    dialog.show = false
    await fetchMenus()
  } catch (err) {
    console.error('Gagal menyimpan menu:', err)
    alert(err?.data?.error || 'Terjadi kesalahan saat menyimpan menu')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (item) => {
  deleteDialog.item = item
  deleteDialog.show = true
}

const executeDelete = async () => {
  if (!deleteDialog.item) return
  deleting.value = true
  try {
    await $api(`/menus/${deleteDialog.item.id}`, { method: 'DELETE' })
    deleteDialog.show = false
    await fetchMenus()
  } catch (err) {
    console.error('Gagal menghapus menu:', err)
    alert(err?.data?.error || 'Gagal menghapus menu')
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
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
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.header-info h1 {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px 0;
  letter-spacing: -0.4px;
}

.header-info p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.modal-icon-container {
  width: 52px;
  height: 52px;
  border-radius: 16px;
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
  padding-top: 12px !important;
  padding-bottom: 12px !important;
}

.slide-up {
  opacity: 0;
  transform: translateY(12px);
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.delay-1 { animation-delay: 0.05s; }

@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 800px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 24px;
  }
}
</style>