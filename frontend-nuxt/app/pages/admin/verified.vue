<template>

<v-container class="py-8">

  <!-- HEADER -->
  <div class="mb-6">

    <div class="text-h5 font-weight-bold">
      Data Verified
    </div>

    <div class="text-caption text-grey">
      Total {{ total }} data
    </div>

  </div>


  <!-- TABLE -->

  <v-card elevation="3">

    <!-- TOOLBAR -->
    <v-card-title class="py-3">

      <v-text-field
        v-model="search"
        label="Search File Name / NIK / Nama"
        density="compact"
        prepend-inner-icon="mdi-magnify"
        hide-details
        clearable
        variant="outlined"
        style="max-width:380px"
      />

    </v-card-title>

    <v-divider/>


   
    <v-data-table
  :headers="headers"
  :items="items"
  :loading="loading"
  item-value="id"
  density="comfortable"
  hover
  :items-per-page="-1"
  hide-default-footer
>

      <!-- STATUS -->
      <template #item.status="{ item }">

        <v-chip
          color="green"
          size="small"
          variant="flat"
        >
          VERIFIED
        </v-chip>

      </template>


      <!-- DATE -->
      <template #item.updated_at="{ item }">

        {{ formatDate(item.updated_at) }}

      </template>


      <!-- ACTION -->
      <template #item.actions="{ item }">

        <v-btn
          icon="mdi-delete"
          size="small"
          color="red"
          variant="text"
          @click="openDelete(item)"
        />

      </template>

    </v-data-table>


    <!-- PAGINATION -->

    <v-divider/>

    <div class="d-flex justify-space-between align-center px-4 py-2">

      <div class="text-caption text-grey-darken-1">
        Showing {{ items.length }} of {{ total }} data
      </div>

      <v-pagination
        v-model="page"
        :length="totalPages"
        :total-visible="5"
        size="small"
        density="compact"
        @update:modelValue="changePage"
      />

    </div>

  </v-card>


  <!-- DELETE DIALOG -->

  <v-dialog v-model="deleteDialog" width="420">

    <v-card>

      <v-card-title class="text-h6">
        Konfirmasi Hapus
      </v-card-title>

      <v-card-text>
        Apakah anda yakin ingin menghapus data:
        <strong>{{ selectedItem?.nama }}</strong> ?
      </v-card-text>

      <v-card-actions class="justify-end">

        <v-btn
          variant="text"
          @click="deleteDialog = false"
        >
          Batal
        </v-btn>

        <v-btn
          color="red"
          @click="confirmDelete"
        >
          Hapus
        </v-btn>

      </v-card-actions>

    </v-card>

  </v-dialog>


  <!-- SNACKBAR -->

  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    timeout="2500"
  >
    {{ snackbar.message }}
  </v-snackbar>


</v-container>

</template>



<script setup lang="ts">

import { ref, onMounted, watch } from "vue"
import { useRouter, useNuxtApp } from "#imports"
import { useAuth } from "~~/app/composables/useAuth"

definePageMeta({
  layout: "admin"
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
  show:false,
  message:"",
  color:"success"
})

const headers = [
  { title: "File Name", key: "original_filename" },
  { title: "NIK", key: "nik" },
  { title: "Nama", key: "nama" },
  { title: "Status", key: "status" },
  { title: "Updated", key: "updated_at" },
  { title: "Action", key: "actions", sortable:false }
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

    const res:any = await $api("/ocr/verified",{
      query:{
        page: page.value,
        limit: limit.value,
        search: search.value
      }
    })

    items.value = res.data

    total.value = res.pagination.total

    totalPages.value = Math.ceil(total.value / limit.value)

  } catch(err:any){

    if(err.status !== 401){
      console.error(err)
    }

  } finally{

    loading.value = false

  }

}


function changePage(p:number){

  page.value = p
  loadData()

}


watch(search,()=>{

  page.value = 1
  loadData()

})



function openDelete(item:any){

  selectedItem.value = item
  deleteDialog.value = true

}



async function confirmDelete(){

  if(!selectedItem.value) return

  try{

    const { $api } = useNuxtApp()

    await $api(`/ocr/${selectedItem.value.id}`,{
      method:"DELETE"
    })

    snackbar.value={
      show:true,
      message:"Data berhasil dihapus",
      color:"success"
    }

    loadData() // reload supaya tetap 10 data

  }catch(err){

    snackbar.value={
      show:true,
      message:"Gagal menghapus data",
      color:"error"
    }

  }finally{

    deleteDialog.value = false
    selectedItem.value = null

  }

}



function formatDate(date:string){

  if(!date) return ""

  const d = new Date(date)

  return new Intl.DateTimeFormat("id-ID",{
    dateStyle:"medium",
    timeStyle:"short",
    timeZone:"Asia/Jakarta"
  }).format(d)

}

</script>