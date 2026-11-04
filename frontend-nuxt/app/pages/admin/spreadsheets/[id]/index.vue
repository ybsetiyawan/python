<template>
  <div class="spreadsheet-container-full">
    <!-- Jika Spreadsheet Tidak Ditemukan -->
    <div v-if="isNotFound" class="not-found-card">
      <div class="not-found-icon">🗑️</div>
      <h2>Spreadsheet Tidak Ditemukan</h2>
      <p>Lembar kerja ini kemungkinan besar telah dihapus atau tautan tidak valid.</p>
      <NuxtLink to="/admin/spreadsheets" class="btn-back-home">← Kembali ke Daftar Spreadsheet</NuxtLink>
    </div>

    <!-- Tampilan Normal Editor -->
    <template v-else>
      <!-- Header Card -->
      <div class="spreadsheet-header-card">
        <div class="header-left">
          <NuxtLink to="/admin/spreadsheets" class="btn-back" title="Kembali">← Kembali</NuxtLink>
          <div class="title-input-group">
            <input type="text" v-model="spreadsheet.title" class="sheet-title-input" placeholder="Judul Spreadsheet..." />
            <span class="badge-mode">Live Spreadsheet (Collab)</span>
            
            <!-- Info User yang Sedang Login -->
            <div v-if="currentUser.name" class="current-user-pill" :title="'Login sebagai: ' + currentUser.name">
              <span class="user-avatar-dot"></span>
              <span class="user-name-text">{{ currentUser.name }}</span>
            </div>
          </div>
        </div>
        <div class="header-right">
          <button v-if="isOwner" type="button" class="ribbon-btn btn-protect-action mr-3" @click="openProtectModal">
            🔒 Proteksi Rentang
          </button>
          <span v-if="saveStatus" class="mr-6 save-status-text" :class="{ 'text-success': saveStatus.includes('Tersimpan') }">{{ saveStatus }}</span>
          <button class="btn-excel-save" @click="saveData(false)">💾 Simpan Perubahan</button>
        </div>
      </div>

      <!-- WPS Office / Excel Style Ribbon Toolbar dengan Ikon Baru -->
      <div class="wps-ribbon-toolbar">
        <div class="ribbon-group">
          <button type="button" class="ribbon-btn" title="Undo" @click="triggerUndo">↩️ Undo</button>
          <button type="button" class="ribbon-btn" title="Redo" @click="triggerRedo">↪️ Redo</button>
        </div>
        <div class="ribbon-divider"></div>
        <div class="ribbon-group">
          <button type="button" class="ribbon-btn font-bold" title="Tebal (Bold)" @click="applyStyleToActive('ht-bold')"><b>B</b></button>
          <button type="button" class="ribbon-btn font-italic" title="Miring (Italic)" @click="applyStyleToActive('ht-italic')"><i>I</i></button>
        </div>
        <div class="ribbon-divider"></div>
        <div class="ribbon-group">
          <button type="button" class="ribbon-btn" title="Border Penuh" @click="applyStyleToActive('cell-border-all')">🔲 Border</button>
          <!-- Tombol Warna Background dengan Ikon Cat (🎨) -->
          <button type="button" class="ribbon-btn color-swatch yellow" title="Bg Kuning" @click="applyStyleToActive('bg-yellow')">🎨🟡</button>
          <button type="button" class="ribbon-btn color-swatch green" title="Bg Hijau" @click="applyStyleToActive('bg-green')">🎨🟢</button>
          <button type="button" class="ribbon-btn color-swatch blue" title="Bg Biru" @click="applyStyleToActive('bg-blue')">🎨🔵</button>
          <!-- Tombol Hapus Format dengan Ikon Penghapus (🧹) -->
          <button type="button" class="ribbon-btn text-danger" title="Hapus Format / Clear" @click="clearFormatting">🧹 Clear Format</button>
        </div>
      </div>

      <!-- Banner Peringatan Real-time -->
      <div v-if="warningMessage" class="collab-warning-banner">
        ⚠️ {{ warningMessage }}
      </div>

      <!-- Spreadsheet Editor Card -->
      <div class="spreadsheet-body-card">
        <client-only>
          <HotTable 
            v-if="isMounted"
            :settings="hotSettings" 
            ref="hotRef" 
          />
        </client-only>
      </div>

      <!-- Tab Bar Sheet Bawah -->
      <div class="sheet-tabs-bar">
        <div class="sheet-tabs-list">
          <button 
            v-for="(sheetData, sheetName) in allSheets" 
            :key="sheetName"
            :class="['sheet-tab-item', { active: currentSheetName === sheetName }]"
            @click="switchSheet(sheetName)"
          >
            📄 {{ sheetName }}
          </button>
          <button class="sheet-tab-add" @click="addNewSheet" title="Tambah Sheet Baru">+ Sheet</button>
        </div>
      </div>
    </template>

    <!-- Modal Proteksi Rentang (Admin) -->
    <div v-if="showProtectModal" class="modal-backdrop" @click.self="closeProtectModal">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h3>Kelola Proteksi Rentang Sel</h3>
            <p class="modal-sub">Blok area sel yang ingin dikunci agar tidak bisa diubah user lain.</p>
          </div>
          <button @click="closeProtectModal" class="btn-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="protect-form-box">
            <p class="info-tip">💡 Tips: Blok/sorot sel pada spreadsheet, lalu klik tombol di bawah untuk mengunci area tersebut pada sheet <strong>{{ currentSheetName }}</strong>.</p>
            <div class="selected-range-info">
              Area Terpilih: <strong>{{ formattedSelectedRangeLabel }}</strong>
            </div>
            <button class="btn-apply-protect" @click="saveProtectedRange">Kunci Area Terpilih Ini</button>
          </div>

          <h4 class="section-heading mt-4">Daftar Range yang Sedang Dikunci</h4>
          <div class="protected-list-table">
            <table>
              <thead>
                <tr>
                  <th>Sheet</th>
                  <th>Rentang Sel</th>
                  <th class="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in protectedRanges" :key="item.id">
                  <td>{{ item.sheet_name }}</td>
                  <td>Baris {{ item.start_row + 1 }} s/d {{ item.end_row + 1 }}, Kolom {{ item.start_col + 1 }} s/d {{ item.end_col + 1 }}</td>
                  <td class="text-center">
                    <button @click="deleteProtectedRange(item.id)" class="btn-delete-protect">Hapus Kunci</button>
                  </td>
                </tr>
                <tr v-if="protectedRanges.length === 0">
                  <td colspan="3" class="text-center text-muted py-3">Belum ada rentang sel yang diproteksi.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeProtectModal" class="btn-close-modal">Tutup</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, markRaw } from 'vue'
import { HotTable } from '@handsontable/vue3'
import { registerAllCellTypes } from 'handsontable/cellTypes'
import { registerAllModules } from 'handsontable/registry'
import { HyperFormula } from 'hyperformula'
import { io } from 'socket.io-client'
import 'handsontable/styles/handsontable.min.css'
import 'handsontable/styles/ht-theme-main.min.css'

registerAllModules()
registerAllCellTypes()

definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()

const spreadsheet = ref({ title: '', description: '', created_by: null })
const hotRef = ref(null)
const isMounted = ref(false)
const saveStatus = ref('')
const isNotFound = ref(false)

let lastSelectedRange = { startRow: 0, startCol: 0, endRow: 0, endCol: 0 }
let socket = null
let autoSaveTimer = null
const currentUser = ref({ id: null, name: 'Staf Cabang' })

const lockedRows = ref({})
const warningMessage = ref('')
let warningTimeout = null
let activeRowLockedByMe = null

const currentSheetName = ref('Sheet1')
const allSheets = ref({
  'Sheet1': {
    rows: Array.from({ length: 60 }, () => Array(20).fill('')),
    styles: {},
    cellOwners: {}
  }
})

const showProtectModal = ref(false)
const protectedRanges = ref([])

const isOwner = computed(() => {
  if (!spreadsheet.value.created_by || !currentUser.value.id) return false
  return String(spreadsheet.value.created_by) === String(currentUser.value.id)
})

const hyperFormulaInstance = markRaw(HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' }))

const hotSettings = ref({
  data: allSheets.value['Sheet1'].rows,
  rowHeaders: true,
  colHeaders: true,
  filters: true,
  dropdownMenu: true,
  manualColumnResize: true,
  manualRowResize: true,
  stretchH: 'all',
  height: '700px',
  width: '100%',
  formulas: { engine: hyperFormulaInstance },

  afterChange: (changes, source) => {
    if (source === 'loadData' || !changes) return

    const myId = String(currentUser.value?.id || '')
    const currentSheet = allSheets.value[currentSheetName.value]

    if (!currentSheet.cellOwners) {
      currentSheet.cellOwners = {}
    }

    if (myId && !isOwner.value) {
      for (const [row, col, oldVal, newVal] of changes) {
        const cellKey = `${row},${col}`
        const hasContent = newVal !== null && newVal !== undefined && String(newVal).trim() !== ''
        
        if (hasContent) {
          if (!currentSheet.cellOwners[cellKey]) {
            currentSheet.cellOwners[cellKey] = myId
          }
        } else {
          if (currentSheet.cellOwners[cellKey] === myId) {
            delete currentSheet.cellOwners[cellKey]
          }
        }
      }
    }

    saveStatus.value = 'Menyimpan otomatis...'
    if (autoSaveTimer) clearTimeout(autoSaveTimer)
    autoSaveTimer = setTimeout(() => { saveData(true) }, 1000)
  },

  afterSelectionEnd: (row, column, row2, column2) => {
    lastSelectedRange = {
      startRow: Math.min(row, row2),
      startCol: Math.min(column, column2),
      endRow: Math.max(row, row2),
      endCol: Math.max(column, column2)
    };

    const targetRow = Math.min(row, row2);

    if (activeRowLockedByMe !== null && activeRowLockedByMe !== targetRow) {
      if (socket) {
        socket.emit('unlock_row', { spreadsheetId: route.params.id, rowIndex: activeRowLockedByMe });
      }
      activeRowLockedByMe = null;
    }

    if (lockedRows.value[targetRow] && String(lockedRows.value[targetRow].userId) !== String(currentUser.value.id)) {
      warningMessage.value = `Baris ${targetRow + 1} sedang disunting oleh ${lockedRows.value[targetRow].userName}!`;
      
      if (warningTimeout) clearTimeout(warningTimeout);
      warningTimeout = setTimeout(() => {
        warningMessage.value = '';
      }, 4000);

      if (activeRowLockedByMe !== null) {
        if (socket) socket.emit('unlock_row', { spreadsheetId: route.params.id, rowIndex: activeRowLockedByMe });
        activeRowLockedByMe = null;
      }
    } else {
      warningMessage.value = '';
      if (socket) {
        socket.emit('lock_row', {
          spreadsheetId: route.params.id,
          rowIndex: targetRow,
          user: currentUser.value
        });
        activeRowLockedByMe = targetRow;
      }
    }
  },

  // 💡 PERBAIKAN UTAMA: Sertakan customStyle (styles) di sini agar terbaca oleh siapa saja secara real-time
  cells: (row, column) => {
    const cellProperties = {}
    const myId = String(currentUser.value?.id || '')
    const currentSheet = allSheets.value[currentSheetName.value] || {}
    const cellOwners = currentSheet.cellOwners || {}
    const cellKey = `${row},${column}`
    let ownerOfCell = cellOwners[cellKey] ? String(cellOwners[cellKey]) : null

    // Ambil style kustom (border, bold, background) yang tersimpan
    let customStyle = currentSheet.styles && currentSheet.styles[cellKey] ? currentSheet.styles[cellKey] : ''

    if (lockedRows.value[row] && String(lockedRows.value[row].userId) !== myId) {
      cellProperties.className = (customStyle + ' row-locked-by-other').trim()
      cellProperties.readOnly = isOwner.value ? false : true 
      return cellProperties
    }

    if (isOwner.value) {
      cellProperties.className = customStyle
      cellProperties.readOnly = false
      return cellProperties
    }

    const isProtected = protectedRanges.value.some(range => {
      return range.sheet_name === currentSheetName.value &&
             row >= range.start_row && row <= range.end_row &&
             column >= range.start_col && column <= range.end_col
    })

    if (isProtected) {
      cellProperties.className = (customStyle + ' cell-protected-range').trim()
      cellProperties.readOnly = true
      return cellProperties
    }

    if (ownerOfCell && ownerOfCell !== myId) {
      cellProperties.className = (customStyle + ' cell-owned-by-other').trim()
      cellProperties.readOnly = true
      return cellProperties
    }

    cellProperties.className = customStyle
    cellProperties.readOnly = false
    return cellProperties
  },
  licenseKey: 'non-commercial-and-evaluation'
})

const applyStyleToActive = (className) => {
  if (!hotRef.value) return
  const hotInstance = hotRef.value.hotInstance
  const { startRow, startCol, endRow, endCol } = lastSelectedRange
  
  const currentSheet = allSheets.value[currentSheetName.value]
  if (!currentSheet.styles) currentSheet.styles = {}

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cellKey = `${r},${c}`
      const cellMeta = hotInstance.getCellMeta(r, c)
      let currentClass = (cellMeta.className || '').replace('row-locked-by-other', '').trim()

      if (className.startsWith('bg-')) {
        currentClass = currentClass.split(' ').filter(cls => !cls.startsWith('bg-')).join(' ')
      }
      
      let newClass = currentClass
      if (!currentClass.includes(className)) {
        newClass = (currentClass + ' ' + className).trim()
      }
      
      hotInstance.setCellMeta(r, c, 'className', newClass)
      currentSheet.styles[cellKey] = newClass
    }
  }
  hotInstance.render()
  saveData(true)
}

const clearFormatting = () => {
  if (!hotRef.value) return
  const hotInstance = hotRef.value.hotInstance
  const { startRow, startCol, endRow, endCol } = lastSelectedRange
  
  const currentSheet = allSheets.value[currentSheetName.value]
  if (!currentSheet.styles) currentSheet.styles = {}

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cellKey = `${r},${c}`
      hotInstance.setCellMeta(r, c, 'className', '')
      delete currentSheet.styles[cellKey]
    }
  }
  hotInstance.render()
  saveData(true)
}

const triggerUndo = () => {
  if (hotRef.value?.hotInstance?.getPlugin('undoRedo')?.isUndoAvailable()) {
    hotRef.value.hotInstance.getPlugin('undoRedo').undo()
  }
}

const triggerRedo = () => {
  if (hotRef.value?.hotInstance?.getPlugin('undoRedo')?.isRedoAvailable()) {
    hotRef.value.hotInstance.getPlugin('undoRedo').redo()
  }
}

const fetchSpreadsheetDetail = async () => {
  if (hotRef.value && hotRef.value.hotInstance) {
    const hotInstance = hotRef.value.hotInstance
    if (hotInstance.isEditing && hotInstance.isEditing()) return;
  }

  try {
    const res = await $api(`/spreadsheets/${route.params.id}`)
    if (res.success && res.data) {
      spreadsheet.value = res.data
      const content = res.data.data_content
      
      if (content && content.sheets) {
        for (const sName in content.sheets) {
          const sh = content.sheets[sName]
          const normalizedCellOwners = {}
          if (sh.cellOwners && typeof sh.cellOwners === 'object') {
            for (const cKey in sh.cellOwners) {
              normalizedCellOwners[String(cKey)] = String(sh.cellOwners[cKey])
            }
          }
          sh.cellOwners = normalizedCellOwners
        }
        allSheets.value = content.sheets

        const targetSheetName = allSheets.value[currentSheetName.value] ? currentSheetName.value : Object.keys(allSheets.value)[0]
        currentSheetName.value = targetSheetName

        const activeSheet = allSheets.value[targetSheetName]
        if (hotRef.value && hotRef.value.hotInstance) {
          const hotInstance = hotRef.value.hotInstance
          if (!hotInstance.isEditing || !hotInstance.isEditing()) {
            hotInstance.loadData(activeSheet.rows)
            applySheetStyles(hotInstance, activeSheet)
            hotInstance.updateSettings({ cells: hotSettings.value.cells })
          }
        }
      }
    } else {
      isNotFound.value = true
    }
  } catch (err) {
    isNotFound.value = true
  }
}

const applySheetStyles = (hotInstance, targetSheet) => {
  if (!hotInstance) return
  const totalRows = hotInstance.countRows()
  const totalCols = hotInstance.countCols()
  
  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      hotInstance.setCellMeta(r, c, 'className', '')
    }
  }

  if (targetSheet && targetSheet.styles) {
    for (const key in targetSheet.styles) {
      const [r, c] = key.split(',').map(Number)
      hotInstance.setCellMeta(r, c, 'className', targetSheet.styles[key])
    }
  }
  hotInstance.render()
}

const fetchCurrentUser = async () => {
  try {
    const userDataStr = localStorage.getItem("user_data")
    if (userDataStr) {
      const user = JSON.parse(userDataStr)
      if (user && (user.id || user._id)) {
        currentUser.value = {
          id: String(user.id || user._id),
          name: user.name || 'User',
          email: user.email || ''
        }
      }
    }
  } catch (err) {}
}

const saveData = async (isAutoSave = false) => {
  if (!hotRef.value) return
  const hotInstance = hotRef.value.hotInstance

  allSheets.value[currentSheetName.value].rows = hotInstance.getData()

  saveStatus.value = isAutoSave ? 'Menyimpan...' : 'Menyimpan perubahan...'
  try {
    await $api(`/spreadsheets/${route.params.id}`, {
      method: 'PUT',
      body: {
        title: spreadsheet.value.title,
        description: spreadsheet.value.description || '',
        currentUserId: String(currentUser.value.id),
        data_content: { sheets: allSheets.value }
      }
    })

    if (socket) {
      socket.emit('spreadsheet_saved', { 
        spreadsheetId: route.params.id, 
        updatedData: { sheets: allSheets.value } 
      });
    }

    saveStatus.value = isAutoSave ? 'Tersimpan otomatis' : 'Tersimpan!'
    setTimeout(() => { saveStatus.value = '' }, 2000)
  } catch (err) {
    saveStatus.value = 'Gagal menyimpan'
  }
}

const switchSheet = (sheetName) => {
  if (currentSheetName.value === sheetName) return
  if (hotRef.value && hotRef.value.hotInstance) {
    allSheets.value[currentSheetName.value].rows = hotRef.value.hotInstance.getData()
  }
  currentSheetName.value = sheetName
  const targetSheet = allSheets.value[sheetName]
  setTimeout(() => {
    if (hotRef.value && hotRef.value.hotInstance) {
      const hotInstance = hotRef.value.hotInstance
      if (!hotInstance.isEditing || !hotInstance.isEditing()) {
        hotInstance.loadData(targetSheet.rows)
        applySheetStyles(hotInstance, targetSheet)
        hotInstance.updateSettings({ cells: hotSettings.value.cells })
      }
    }
  }, 50)
}

const addNewSheet = () => {
  const sheetKeys = Object.keys(allSheets.value)
  const newSheetName = `Sheet${sheetKeys.length + 1}`
  allSheets.value[newSheetName] = {
    rows: Array.from({ length: 60 }, () => Array(20).fill('')),
    styles: {},
    cellOwners: {}
  }
  switchSheet(newSheetName)
}

const openProtectModal = () => { showProtectModal.value = true; fetchProtectedRanges(); }
const closeProtectModal = () => { showProtectModal.value = false; }
const formattedSelectedRangeLabel = computed(() => {
  const startColLetter = String.fromCharCode(65 + lastSelectedRange.startCol)
  const endColLetter = String.fromCharCode(65 + lastSelectedRange.endCol)
  return `${startColLetter}${lastSelectedRange.startRow + 1} sampai ${endColLetter}${lastSelectedRange.endRow + 1}`
})

const fetchProtectedRanges = async () => {
  try {
    const res = await $api(`/spreadsheets/${route.params.id}/protected-ranges`)
    if (res.success) protectedRanges.value = res.data
  } catch (err) {}
}

const saveProtectedRange = async () => {
  try {
    const payload = {
      sheet_name: currentSheetName.value,
      start_row: lastSelectedRange.startRow,
      end_row: lastSelectedRange.endRow,
      start_col: lastSelectedRange.startCol,
      end_col: lastSelectedRange.endCol
    }
    const res = await $api(`/spreadsheets/${route.params.id}/protected-ranges`, { method: 'POST', body: payload })
    if (res.success) {
      alert('Berhasil mengunci rentang sel!')
      fetchProtectedRanges()
    }
  } catch (err) { alert('Gagal memproteksi rentang.') }
}

const deleteProtectedRange = async (rangeId) => {
  if (!confirm('Yakin ingin membuka kunci area ini?')) return
  try {
    await $api(`/spreadsheets/protected-ranges/${rangeId}`, { method: 'DELETE' })
    fetchProtectedRanges()
  } catch (err) {}
}

onMounted(async () => {
  await fetchCurrentUser()
  isMounted.value = true

  const serverHost = window.location.hostname
  socket = io(`http://${serverHost}:8090`)
  socket.emit('join_spreadsheet', route.params.id)

  socket.on('sync_locks', (locks) => {
    lockedRows.value = locks || {}
    if (hotRef.value && hotRef.value.hotInstance) {
      hotRef.value.hotInstance.render()
    }
  })

  socket.on('refresh_spreadsheet', async (incomingData) => {
    if (incomingData && incomingData.sheets) {
      allSheets.value = incomingData.sheets
      if (hotRef.value && hotRef.value.hotInstance) {
        const activeSheet = allSheets.value[currentSheetName.value]
        if (activeSheet) {
          hotRef.value.hotInstance.loadData(activeSheet.rows)
          applySheetStyles(hotRef.value.hotInstance, activeSheet)
        }
      }
    } else {
      await fetchSpreadsheetDetail()
    }
  })

  setTimeout(async () => {
    await fetchSpreadsheetDetail()
    await fetchProtectedRanges()
  }, 150)
})

onBeforeUnmount(() => {
  if (socket && activeRowLockedByMe !== null) {
    socket.emit('unlock_row', { spreadsheetId: route.params.id, rowIndex: activeRowLockedByMe })
  }
  if (socket) socket.disconnect()
})
</script>

<style scoped>
.spreadsheet-container-full { width: 100vw; min-height: 100vh; padding: 16px 24px; background-color: #f8fafc; box-sizing: border-box; }
.spreadsheet-header-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px 12px 0 0; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
.header-left, .header-right, .title-input-group { display: flex; align-items: center; gap: 12px; }
.sheet-title-input { font-size: 18px; font-weight: 700; border: none; background: transparent; }
.badge-mode { background: #e0e7ff; color: #4338ca; font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 700; }
.current-user-pill { display: flex; align-items: center; gap: 6px; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.user-avatar-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; }
.btn-back { text-decoration: none; color: #475569; padding: 6px 12px; background: #f1f5f9; border-radius: 6px; font-size: 13px; font-weight: 600; }
.btn-excel-save { background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; }
.btn-protect-action { background: #fef08a !important; color: #854d0e !important; border: 1px solid #fde047 !important; padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
.wps-ribbon-toolbar { display: flex; align-items: center; background: #f1f5f9; border: 1px solid #e2e8f0; border-top: none; padding: 8px 16px; gap: 10px; }
.ribbon-group { display: flex; gap: 4px; align-items: center; }
.ribbon-btn { background: #fff; border: 1px solid #cbd5e1; padding: 5px 10px; border-radius: 4px; font-size: 12px; cursor: pointer; }
.ribbon-divider { width: 1px; height: 22px; background: #cbd5e1; }
.spreadsheet-body-card { background: #fff; border: 1px solid #e2e8f0; border-top: none; padding: 16px; }
.sheet-tabs-bar { background: #f1f5f9; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 8px 16px; display: flex; }
.sheet-tabs-list { display: flex; gap: 6px; }
.sheet-tab-item { background: #fff; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
.sheet-tab-item.active { background: #6366f1; color: #fff; border-color: #4f46e5; }

/* Styling Warna Background, Bold, dan Border CSS */
.spreadsheet-body-card :deep(.ht-bold) { font-weight: bold !important; }
.spreadsheet-body-card :deep(.ht-italic) { font-style: italic !important; }

.spreadsheet-body-card :deep(.cell-border-all) { 
  border: 2px solid #0f172a !important; 
}

.spreadsheet-body-card :deep(.bg-yellow) { background-color: #fef08a !important; }
.spreadsheet-body-card :deep(.bg-green) { background-color: #bbf7d0 !important; }
.spreadsheet-body-card :deep(.bg-blue) { background-color: #bfdbfe !important; }

.collab-warning-banner {
  background-color: #fff1f2;
  border: 1px solid #fda4af;
  color: #9f1239;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  margin-top: 12px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.spreadsheet-body-card :deep(.row-locked-by-other):not(.bg-yellow):not(.bg-green):not(.bg-blue) {
  background-color: #ffe4e6 !important;
  color: #9f1239 !important;
  cursor: not-allowed !important;
}
.spreadsheet-body-card :deep(.cell-owned-by-other):not(.bg-yellow):not(.bg-green):not(.bg-blue) { 
  background-color: #f1f5f9 !important; 
  color: #64748b !important; 
  cursor: not-allowed !important; 
}
.spreadsheet-body-card :deep(.cell-protected-range):not(.bg-yellow):not(.bg-green):not(.bg-blue) { 
  background-color: #f1f5f9 !important; 
  color: #94a3b8 !important; 
  cursor: not-allowed !important; 
}
</style>