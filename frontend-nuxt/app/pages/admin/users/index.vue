<template>
  <div class="user-management-page">
    
    <!-- TOP HEADER -->
    <div class="page-header slide-up">
      <div class="header-info">
        <h1>Manajemen Pengguna Sistem</h1>
        <p>Kelola data akun karyawan, tambah user baru, import massal via CSV, perbarui informasi, reset password, dan hapus akses.</p>
      </div>
      
      <!-- Tombol Aksi Header -->
      <div class="header-actions-group">
        <v-btn
          color="success"
          variant="flat"
          class="rounded-xl elevation-1 text-none font-weight-bold"
          prepend-icon="mdi-file-excel"
          @click="downloadTemplateCSV"
        >
          Download Template
        </v-btn>

        <v-btn
          color="indigo-darken-2"
          variant="flat"
          class="rounded-xl elevation-1 text-none font-weight-bold"
          prepend-icon="mdi-file-upload"
          @click="bulkDialog.show = true"
        >
          Import CSV (Bulk)
        </v-btn>

        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-account-plus"
              color="indigo-darken-2"
              variant="flat"
              class="rounded-xl elevation-1"
              size="large"
              @click="openAddDialog"
            ></v-btn>
          </template>
          <span>Tambah User Baru</span>
        </v-tooltip>
      </div>
    </div>

    <!-- MAIN CARD TABLE CONTAINER -->
    <v-card class="rounded-2xl border elevation-0 slide-up delay-1">
      <v-data-table
        :headers="headers"
        :items="filteredUsers"
        :search="searchQuery"
        :loading="loading"
        class="custom-table"
        no-data-text="Belum ada data pengguna sistem"
      >
        <!-- Top Search Bar Slot -->
        <template v-slot:top>
          <div class="px-4 pt-4 pb-2 d-flex justify-space-between align-center flex-wrap" style="gap: 12px;">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              label="Cari nama atau email pengguna..."
              variant="outlined"
              density="compact"
              hide-details
              clearable
              style="max-width: 340px;"
              class="rounded-lg"
            ></v-text-field>
            <div class="text-caption font-weight-bold text-slate-600">
              Total: <strong>{{ filteredUsers.length }}</strong> Pengguna
            </div>
          </div>
        </template>

        <!-- Kolom Nama -->
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar color="indigo-lighten-5" rounded="lg" size="38" class="mr-3 flex-shrink-0">
              <span class="text-indigo-darken-2 font-weight-bold text-subtitle-2">
                {{ item.name ? item.name.substring(0, 2).toUpperCase() : 'U' }}
              </span>
            </v-avatar>
            <div>
              <span class="d-block font-weight-semibold text-slate-900">{{ item.name }}</span>
            </div>
          </div>
        </template>

        <!-- Kolom Email -->
        <template v-slot:item.email="{ item }">
          <span class="text-slate-700 font-weight-medium">{{ item.email }}</span>
        </template>

        <!-- Kolom Tanggal Dibuat -->
        <template v-slot:item.created_at="{ item }">
          <span class="text-slate-500 text-caption">{{ formatDate(item.created_at || item.createdAt) }}</span>
        </template>

        <!-- Kolom Aksi -->
        <template v-slot:item.actions="{ item }">
          <div class="d-flex align-center" style="gap: 4px;">
            <v-btn
              icon="mdi-key-outline"
              size="small"
              variant="text"
              color="amber-darken-2"
              @click="openResetPasswordDialog(item)"
              title="Reset Password"
            ></v-btn>
            <v-btn
              icon="mdi-pencil-outline"
              size="small"
              variant="text"
              color="indigo-darken-2"
              @click="openEditDialog(item)"
              title="Edit User"
            ></v-btn>
            <v-btn
              icon="mdi-delete-outline"
              size="small"
              variant="text"
              color="error"
              @click="confirmDelete(item)"
              title="Hapus User"
            ></v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- DIALOG FORM TAMBAH / EDIT USER -->
    <v-dialog v-model="dialog.show" max-width="480" persistent>
      <v-card class="rounded-2xl pa-5 elevation-4">
        <div class="d-flex justify-space-between align-center mb-4">
          <h3 class="text-subtitle-1 font-weight-bold text-slate-900">
            {{ dialog.isEdit ? 'Edit Informasi User' : 'Tambah User Baru' }}
          </h3>
          <v-btn icon="mdi-close" variant="text" size="small" @click="dialog.show = false"></v-btn>
        </div>

        <v-form @submit.prevent="saveUser">
          <div class="mb-3">
            <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">Nama Lengkap</label>
            <v-text-field
              v-model="form.name"
              placeholder="Contoh: Yayan Bayu"
              variant="outlined"
              density="comfortable"
              :rules="[(v: string) => !!v || 'Nama wajib diisi']"
              hide-details="auto"
              class="rounded-lg"
            ></v-text-field>
          </div>

          <div class="mb-3">
            <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">Alamat Email</label>
            <v-text-field
              v-model="form.email"
              type="email"
              placeholder="Contoh: yayan@indomarco.co.id"
              variant="outlined"
              density="comfortable"
              :rules="[(v: string) => !!v || 'Email wajib diisi']"
              hide-details="auto"
            ></v-text-field>
          </div>

          <div v-if="!dialog.isEdit" class="mb-3">
            <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">Password Awal</label>
            <v-text-field
              v-model="form.password"
              type="password"
              placeholder="Minimal 6 karakter"
              variant="outlined"
              density="comfortable"
              :rules="[(v: string) => !!v || 'Password wajib diisi']"
              hide-details="auto"
            ></v-text-field>
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
              {{ dialog.isEdit ? 'Simpan Perubahan' : 'Tambah User' }}
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- DIALOG IMPORT CSV (BULK INSERT) -->
    <v-dialog v-model="bulkDialog.show" max-width="480" persistent>
      <v-card class="rounded-2xl pa-5 elevation-4">
        <div class="d-flex justify-space-between align-center mb-3">
          <h3 class="text-subtitle-1 font-weight-bold text-slate-900">Import Multi User (CSV)</h3>
          <v-btn icon="mdi-close" variant="text" size="small" @click="bulkDialog.show = false"></v-btn>
        </div>
        <p class="text-caption text-slate-600 mb-4">
          Pilih file berformat CSV yang berisi kolom: <code>name</code>, <code>email</code>, dan <code>password</code>.
        </p>

        <v-file-input
          v-model="bulkDialog.file"
          label="Pilih File CSV"
          accept=".csv"
          variant="outlined"
          density="comfortable"
          prepend-icon="mdi-file-delimited-outline"
          hide-details="auto"
          class="mb-4"
        ></v-file-input>

        <div class="d-flex justify-end" style="gap: 8px;">
          <v-btn
            variant="text"
            color="slate-600"
            class="text-none font-weight-bold rounded-xl px-4"
            @click="bulkDialog.show = false"
          >
            Batal
          </v-btn>
          <v-btn
            color="indigo-darken-2"
            class="text-none font-weight-bold rounded-xl px-6 elevation-0"
            :loading="bulkDialog.loading"
            :disabled="!bulkDialog.file"
            @click="processUploadCSV"
          >
            Upload & Proses
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- DIALOG RESET PASSWORD -->
    <v-dialog v-model="passwordDialog.show" max-width="420" persistent>
      <v-card class="rounded-2xl pa-5 elevation-4">
        <div class="d-flex justify-space-between align-center mb-3">
          <h3 class="text-subtitle-1 font-weight-bold text-slate-900">Reset Password User</h3>
          <v-btn icon="mdi-close" variant="text" size="small" @click="passwordDialog.show = false"></v-btn>
        </div>
        <p class="text-caption text-slate-600 mb-4">
          Masukkan password baru untuk akun <strong class="text-slate-900">{{ passwordDialog.userName }}</strong>.
        </p>

        <v-form @submit.prevent="executeResetPassword">
          <div class="mb-4">
            <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">Password Baru</label>
            <v-text-field
              v-model="passwordDialog.newPassword"
              type="password"
              placeholder="Masukkan password baru"
              variant="outlined"
              density="comfortable"
              :rules="[(v: string) => !!v || 'Password baru wajib diisi']"
              hide-details="auto"
            ></v-text-field>
          </div>

          <div class="d-flex justify-end" style="gap: 8px;">
            <v-btn
              variant="text"
              color="slate-600"
              class="text-none font-weight-bold rounded-xl px-4"
              @click="passwordDialog.show = false"
            >
              Batal
            </v-btn>
            <v-btn
              color="amber-darken-3"
              type="submit"
              class="text-none font-weight-bold rounded-xl px-6 elevation-0 text-white"
              :loading="passwordDialog.saving"
            >
              Reset Password
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- DIALOG KONFIRMASI HAPUS -->
    <v-dialog v-model="deleteDialog.show" max-width="360">
      <v-card class="rounded-2xl pa-5 text-center elevation-4">
        <div class="modal-icon-container bg-red-light mb-3 mx-auto">
          <v-icon color="error" size="26">mdi-alert-circle-outline</v-icon>
        </div>
        <h3 class="text-subtitle-1 font-weight-bold text-slate-900 mb-1">Hapus User Ini?</h3>
        <p class="text-body-2 text-slate-600 mb-5">
          User <strong class="text-slate-900">{{ deleteDialog.item?.name }}</strong> beserta relasi hak akses menunya akan dihapus permanen.
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useNuxtApp } from '#imports'

definePageMeta({ 
  layout: 'admin',
  middleware: ['auth-menu']
})

const { $api } = useNuxtApp()

const users = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const searchQuery = ref('')

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
  { title: 'Nama Pengguna', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Terdaftar', key: 'created_at', width: '160px' },
  { title: 'Aksi', key: 'actions', align: 'end' as const, sortable: false, width: '140px' }
]

const dialog = reactive({
  show: false,
  isEdit: false,
  editId: null as any
})

const form = reactive({
  name: '',
  email: '',
  password: ''
})

const bulkDialog = reactive({
  show: false,
  file: null as any,
  loading: false
})

const passwordDialog = reactive({
  show: false,
  userId: null as any,
  userName: '',
  newPassword: '',
  saving: false
})

const deleteDialog = reactive({
  show: false,
  item: null as any
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const res: any = await $api('/users', { method: 'GET' })
    if (res && res.success) {
      users.value = res.data
    } else if (Array.isArray(res)) {
      users.value = res
    }
  } catch (err: any) {
    console.error('Gagal mengambil data user:', err)
    const backendMessage = err?.data?.message || err?.data?.error || err?.message || 'Gagal memuat daftar user'
    showToast(backendMessage, 'error')
  } finally {
    loading.value = false
  }
}

// Filter pencarian data pengguna
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const q = searchQuery.value.toLowerCase()
  return users.value.filter(item => 
    item.name?.toLowerCase().includes(q) ||
    item.email?.toLowerCase().includes(q)
  )
})

const openAddDialog = () => {
  dialog.isEdit = false
  dialog.editId = null
  form.name = ''
  form.email = ''
  form.password = ''
  dialog.show = true
}

const openEditDialog = (item: any) => {
  dialog.isEdit = true
  dialog.editId = item.id
  form.name = item.name
  form.email = item.email
  form.password = ''
  dialog.show = true
}

const openResetPasswordDialog = (item: any) => {
  passwordDialog.userId = item.id
  passwordDialog.userName = item.name
  passwordDialog.newPassword = ''
  passwordDialog.show = true
}

const saveUser = async () => {
  saving.value = true
  try {
    if (dialog.isEdit) {
      await $api(`/users/${dialog.editId}`, {
        method: 'PUT',
        body: {
          name: form.name,
          email: form.email
        }
      })
      showToast('Data user berhasil diperbarui!')
    } else {
      await $api('/users', {
        method: 'POST',
        body: form
      })
      showToast('User baru berhasil ditambahkan!')
    }
    dialog.show = false
    await fetchUsers()
  } catch (err: any) {
    console.error('Gagal menyimpan user:', err)
    const backendMessage = err?.data?.message || err?.data?.error || err?.message || 'Terjadi kesalahan saat menyimpan user'
    showToast(backendMessage, 'error')
  } finally {
    saving.value = false
  }
}

const downloadTemplateCSV = () => {
  const csvContent = "name,email,password\nMuhamad Zarkasi,muhamad-zarkasi@sby.indomarco.co.id,indomarco@11\nYayan Bayu,yayan-bayu@sby.indomarco.co.id,indomarco@11";
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template_user_import.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const processUploadCSV = async () => {
  if (!bulkDialog.file) return

  const targetFile = Array.isArray(bulkDialog.file) ? bulkDialog.file[0] : bulkDialog.file
  if (!targetFile) return

  bulkDialog.loading = true
  const reader = new FileReader()

  reader.onload = async (e) => {
    try {
      const text = e.target?.result as string
      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '')

      if (lines.length < 2) {
        showToast('File CSV kosong atau format tidak valid', 'error')
        bulkDialog.loading = false
        return
      }

      const headerLine = lines[0]
      if (!headerLine) return

      const headers = headerLine.split(',').map(h => h.trim().toLowerCase())
      const nameIdx = headers.indexOf('name')
      const emailIdx = headers.indexOf('email')
      const passwordIdx = headers.indexOf('password')

      if (nameIdx === -1 || emailIdx === -1 || passwordIdx === -1) {
        showToast('Header CSV harus memiliki kolom: name, email, password', 'error')
        bulkDialog.loading = false
        return
      }

      const usersArray = []

      for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i]
        if (!currentLine) continue

        const row = currentLine.split(',').map(val => val.trim())
        if (row.length >= 3 && row[nameIdx] && row[emailIdx] && row[passwordIdx]) {
          usersArray.push({
            name: row[nameIdx],
            email: row[emailIdx],
            password: row[passwordIdx]
          })
        }
      }

      if (usersArray.length === 0) {
        showToast('Tidak ada data valid yang dapat diproses dari CSV', 'error')
        bulkDialog.loading = false
        return
      }

      const res: any = await $api('/users', {
        method: 'POST',
        body: usersArray
      })

      if (res && res.success) {
        showToast(`Berhasil mendaftarkan ${res.count || usersArray.length} user sekaligus!`)
        bulkDialog.show = false
        bulkDialog.file = null
        await fetchUsers()
      }
    } catch (err: any) {
      console.error('Gagal import CSV:', err)
      const backendMessage = err?.data?.message || err?.data?.error || err?.message || 'Gagal memproses file CSV'
      showToast(backendMessage, 'error')
    } finally {
      bulkDialog.loading = false
    }
  }

  reader.onerror = () => {
    showToast('Gagal membaca file dari komputer', 'error')
    bulkDialog.loading = false
  }

  reader.readAsText(targetFile)
}

const executeResetPassword = async () => {
  if (!passwordDialog.newPassword) return
  passwordDialog.saving = true
  try {
    await $api(`/users/${passwordDialog.userId}`, {
      method: 'PUT',
      body: {
        password: passwordDialog.newPassword
      }
    })
    showToast('Password user berhasil direset!')
    passwordDialog.show = false
  } catch (err: any) {
    console.error('Gagal reset password:', err)
    const backendMessage = err?.data?.message || err?.data?.error || err?.message || 'Gagal mereset password'
    showToast(backendMessage, 'error')
  } finally {
    passwordDialog.saving = false
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
    await $api(`/users/${deleteDialog.item.id}`, { method: 'DELETE' })
    deleteDialog.show = false
    showToast('User berhasil dihapus!')
    await fetchUsers()
  } catch (err: any) {
    console.error('Gagal menghapus user:', err)
    const backendMessage = err?.data?.message || err?.data?.error || err?.message || 'Gagal menghapus user'
    showToast(backendMessage, 'error')
  } finally {
    deleting.value = false
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-management-page {
  max-width: 1140px;
  margin: 0 auto;
  padding: 10px 0 40px 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #1e293b;
  box-sizing: border-box;
}

.user-management-page .page-header {
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

.user-management-page .header-actions-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.user-management-page .header-info h1 {
  font-size: 19px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 2px 0;
  letter-spacing: -0.3px;
}

.user-management-page .header-info p {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.user-management-page .modal-icon-container {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-management-page .bg-red-light { 
  background-color: #ffeeec; 
}

/* Tabel Styling */
.user-management-page :deep(.v-data-table) {
  background: transparent !important;
}

.user-management-page :deep(.v-data-table-header th) {
  font-weight: 700 !important;
  color: #475569 !important;
  background-color: #f8fafc !important;
  text-transform: uppercase;
  font-size: 11px !important;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e2e8f0 !important;
}

.user-management-page :deep(.v-data-table td) {
  border-bottom: 1px solid #f1f5f9 !important;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}

.slide-up {
  opacity: 0;
  transform: translateY(10px);
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.delay-1 { 
  animation-delay: 0.05s; 
}

@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 800px) {
  .user-management-page .page-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
  }
  .user-management-page .header-actions-group {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>