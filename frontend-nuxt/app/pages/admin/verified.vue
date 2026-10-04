<template>
  <!-- SINGLE ROOT NODE UNTUK MENJAMIN KESTABILAN CSS & TRANSISI -->
  <div class="verified-page-wrapper">
    <v-container class="py-6" fluid>

      <!-- HEADER -->
      <div class="mb-6 d-flex justify-space-between align-center">
        <div>
          <div class="text-h5 font-weight-bold text-slate-900">
            Data Verified
          </div>
          <div class="text-caption text-slate-500">
            Total {{ total }} data terverifikasi dalam sistem
          </div>
        </div>
      </div>

      <!-- TABLE CONTAINER -->
      <v-card elevation="0" class="rounded-2xl border elevation-0 bg-white pa-4">

        <!-- TOOLBAR -->
        <div class="py-3 d-flex align-center">
          <v-text-field
            v-model="search"
            label="Cari File Name / NIK / Nama..."
            density="compact"
            prepend-inner-icon="mdi-magnify"
            hide-details
            clearable
            variant="outlined"
            style="max-width:380px"
            class="rounded-xl"
          />
        </div>

        <v-divider class="my-3"/>

        <v-data-table
          :headers="headers"
          :items="items"
          :loading="loading"
          item-value="id"
          density="comfortable"
          hover
          :items-per-page="-1"
          hide-default-footer
          class="custom-table"
        >
          <!-- STATUS -->
          <template #item.status="{ item }">
            <v-chip
              color="success"
              size="small"
              variant="flat"
              class="font-weight-bold"
            >
              VERIFIED
            </v-chip>
          </template>

          <!-- DATE -->
          <template #item.updated_at="{ item }">
            <span class="text-slate-600 text-body-2">{{ formatDate(item.updated_at) }}</span>
          </template>

          <!-- ACTION -->
          <template #item.actions="{ item }">
            <v-btn
              icon="mdi-delete-outline"
              size="small"
              color="error"
              variant="text"
              @click="openDelete(item)"
              title="Hapus Data"
            />
          </template>
        </v-data-table>

        <!-- PAGINATION -->
        <v-divider class="my-3"/>

        <div class="d-flex justify-space-between align-center px-2 py-2">
          <div class="text-caption text-slate-500">
            Showing {{ items.length }} of {{ total }} data
          </div>

          <v-pagination
            v-model="page"
            :length="totalPages"
            :total-visible="5"
            size="small"
            density="compact"
            @update:modelValue="changePage"
            color="indigo-darken-2"
          />
        </div>

      </v-card>

      <!-- DELETE DIALOG -->
      <v-dialog v-model="deleteDialog" width="420">
        <v-card class="rounded-2xl pa-4 elevation-4">
          <v-card-title class="text-h6 font-weight-bold text-slate-900">
            Konfirmasi Hapus
          </v-card-title>

          <v-card-text class="text-slate-600 pt-2">
            Apakah anda yakin ingin menghapus data:
            <strong class="text-slate-900">{{ selectedItem?.nama }}</strong> ?
          </v-card-text>

          <v-card-actions class="justify-end pt-4">
            <v-btn
              variant="text"
              class="text-none font-weight-bold text-slate-600"
              @click="deleteDialog = false"
            >
              Batal
            </v-btn>

            <v-btn
              color="error"
              class="text-none font-weight-bold elevation-0 rounded-xl px-4"
              @click="confirmDelete"
            >
              Ya, Hapus
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- SNACKBAR -->
      <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        timeout="2500"
        elevation="4"
        rounded="pill"
      >
        {{ snackbar.message }}
      </v-snackbar>

    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { useRouter, useNuxtApp } from "#imports"
import { useAuth } from "~~/app/composables/useAuth"

// Proteksi akses menu secara dinamis menggunakan middleware
definePageMeta({
  layout: "admin",
  middleware: ["auth-menu"]
})

const router = useRouter()
const { getToken } = useAuth()

const loading = ref(false)
const items = ref<any[]>([])

const page = ref(1)
const limit = ref(10)

const total = ref(0)
const totalPages = ref(1)

const search = ref("")

const deleteDialog = ref(false)
const selectedItem = ref<any>(null)

const snackbar = ref({
  show: false,
  message: "",
  color: "success"
})

const headers = [
  { title: "File Name", key: "original_filename" },
  { title: "NIK", key: "nik" },
  { title: "Nama", key: "nama" },
  { title: "Status", key: "status" },
  { title: "Updated", key: "updated_at" },
  { title: "Action", key: "actions", sortable: false }
]

onMounted(async () => {
  const token = getToken()

  if (!token) {
    router.push("/login")
    return
  }

  loadData()
})

async function loadData() {
  try {
    loading.value = true
    const { $api } = useNuxtApp()

    const res: any = await $api("/ocr/verified", {
      query: {
        page: page.value,
        limit: limit.value,
        search: search.value
      }
    })

    items.value = res.data
    total.value = res.pagination.total
    totalPages.value = Math.ceil(total.value / limit.value)
  } catch (err: any) {
    if (err.status !== 401) {
      console.error(err)
    }
  } finally {
    loading.value = false
  }
}

function changePage(p: number) {
  page.value = p
  loadData()
}

watch(search, () => {
  page.value = 1
  loadData()
})

function openDelete(item: any) {
  selectedItem.value = item
  deleteDialog.value = true
}

async function confirmDelete() {
  if (!selectedItem.value) return

  try {
    const { $api } = useNuxtApp()

    await $api(`/ocr/${selectedItem.value.id}`, {
      method: "DELETE"
    })

    snackbar.value = {
      show: true,
      message: "Data berhasil dihapus",
      color: "success"
    }

    loadData()
  } catch (err) {
    snackbar.value = {
      show: true,
      message: "Gagal menghapus data",
      color: "error"
    }
  } finally {
    deleteDialog.value = false
    selectedItem.value = null
  }
}

function formatDate(date: string) {
  if (!date) return ""
  const d = new Date(date)

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta"
  }).format(d)
}
</script>


<style scoped>
.verified-page-wrapper {
  max-width: 1140px;
  margin: 0 auto;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
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
</style>