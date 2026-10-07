<template>
  <div class="spreadsheet-container">
    <!-- Jika Spreadsheet Tidak Ditemukan / Sudah Dihapus -->
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
          </div>
        </div>
        <div class="header-right">
          <span v-if="saveStatus" class="mr-6 save-status-text" :class="{ 'text-success': saveStatus === 'Tersimpan!' || saveStatus === 'File tersimpan' }">{{ saveStatus }}</span>
          <button class="btn-excel-save" @click="saveData(false)">💾 Simpan Perubahan</button>
        </div>
      </div>

      <!-- WPS Office / Excel Style Ribbon Toolbar -->
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
          <button type="button" class="ribbon-btn color-swatch yellow" title="Bg Kuning" @click="applyStyleToActive('bg-yellow')"></button>
          <button type="button" class="ribbon-btn color-swatch green" title="Bg Hijau" @click="applyStyleToActive('bg-green')"></button>
          <button type="button" class="ribbon-btn color-swatch blue" title="Bg Biru" @click="applyStyleToActive('bg-blue')"></button>
          <button type="button" class="ribbon-btn text-danger" title="Hapus Format" @click="clearFormatting">🧹 Clear</button>
        </div>
        <div class="ribbon-divider"></div>

        <!-- Tombol Formula Pintas: Otomatis membungkus sel yang sedang Anda blok -->
        <div class="ribbon-group">
          <button type="button" class="ribbon-btn formula-tag" @click="insertFormula('SUM')">∑ SUM (Blok)</button>
          <button type="button" class="ribbon-btn formula-tag" @click="insertFormula('AVERAGE')">AVERAGE (Blok)</button>
          <button type="button" class="ribbon-btn formula-tag" @click="insertFormula('COUNT')">COUNT (Blok)</button>
          <button type="button" class="ribbon-btn formula-tag" @click="insertFormula('VLOOKUP')">🔍 VLOOKUP</button>
        </div>
      </div>

      <!-- Formula Bar (fx) Utama -->
      <div class="formula-ribbon-outer">
        <div class="formula-ribbon">
          <div class="formula-fx-label">fx</div>
          <input 
            type="text" 
            ref="formulaInputRef"
            v-model="formulaInput" 
            class="formula-bar-input" 
            placeholder="Ketik rumus atau klik tombol rumus di atas..."
            @input="onFormulaInput"
            @focus="isFormulaFocused = true"
            @blur="handleFormulaBlur"
            @keyup.enter="applyFormula"
          />
          <button type="button" class="btn-apply-formula" @click="applyFormula">Terapkan ke Sel</button>
        </div>

        <!-- Kotak Dropdown Auto-Complete Rumus -->
        <div v-if="showSuggestions && filteredFormulas.length > 0" class="formula-suggestions-dropdown">
          <div 
            v-for="(item, index) in filteredFormulas" 
            :key="index"
            class="suggestion-item"
            @mousedown.prevent="selectSuggestion(item)"
          >
            <span class="suggestion-name">{{ item.name }}</span>
            <span class="suggestion-desc">{{ item.desc }}</span>
          </div>
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
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, markRaw } from 'vue'
import { HotTable } from '@handsontable/vue3'
import { registerAllCellTypes } from 'handsontable/cellTypes'
import { registerAllModules } from 'handsontable/registry'
import { HyperFormula } from 'hyperformula'
import { io } from 'socket.io-client'
import 'handsontable/styles/handsontable.min.css'
import 'handsontable/styles/ht-theme-main.min.css'

registerAllModules()
registerAllCellTypes()

definePageMeta({
  layout: 'admin',
})

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()

const spreadsheet = ref({ title: '', description: '' })
const hotRef = ref(null)
const formulaInputRef = ref(null)
const isMounted = ref(false)
const saveStatus = ref('')
const formulaInput = ref('')
const isNotFound = ref(false) // State penanda error 404 / terhapus

let lastSelectedRange = { startRow: 0, startCol: 0, endRow: 0, endCol: 0 }
const isFormulaFocused = ref(false)

// Variabel Socket.io & Lock Baris Real-time
let socket = null
const lockedRows = ref({})
const currentUser = ref({ id: 'user_' + Math.random().toString(36).substr(2, 9), name: 'Staf Cabang' })
const warningMessage = ref('')
let warningTimeout = null
let activeRowLockedByMe = null

const currentSheetName = ref('Sheet1')
const allSheets = ref({
  'Sheet1': {
    rows: Array.from({ length: 60 }, () => Array(20).fill('')),
    styles: {}
  }
})

const availableFormulas = [
  { name: '=SUM(', desc: 'Menjumlahkan rentang sel (contoh: =SUM(B4:B8))' },
  { name: '=AVERAGE(', desc: 'Menghitung rata-rata nilai' },
  { name: '=COUNT(', desc: 'Menghitung jumlah sel angka' },
  { name: '=VLOOKUP(', desc: 'Pencarian data vertikal' },
  { name: '=HLOOKUP(', desc: 'Pencarian data horizontal' },
  { name: '=MAX(', desc: 'Nilai terbesar' },
  { name: '=MIN(', desc: 'Nilai terkecil' },
  { name: '=IF(', desc: 'Logika bersyarat' }
]

const filteredFormulas = ref([])
const showSuggestions = ref(false)

const onFormulaInput = () => {
  const val = formulaInput.value.trim()
  if (val.startsWith('=')) {
    const keyword = val.substring(1).toUpperCase()
    filteredFormulas.value = availableFormulas.filter(f => f.name.toUpperCase().includes(keyword))
    showSuggestions.value = filteredFormulas.value.length > 0
  } else {
    showSuggestions.value = false
  }
}

const selectSuggestion = (item) => {
  formulaInput.value = item.name
  showSuggestions.value = false
  if (formulaInputRef.value) formulaInputRef.value.focus()
}

const handleFormulaBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false
    isFormulaFocused.value = false
  }, 250)
}

const hyperFormulaInstance = markRaw(HyperFormula.buildEmpty({
  licenseKey: 'gpl-v3'
}))

const hotSettings = ref({
  data: allSheets.value['Sheet1'].rows,
  rowHeaders: true,
  colHeaders: true,
  filters: true,
  dropdownMenu: true,
  manualColumnResize: true,
  manualRowResize: true,
  stretchH: 'all',
  height: '560px',
  width: '100%',
  formulas: {
    engine: hyperFormulaInstance
  },
  afterSelectionEnd: (row, column, row2, column2) => {
    lastSelectedRange = {
      startRow: Math.min(row, row2),
      startCol: Math.min(column, column2),
      endRow: Math.max(row, row2),
      endCol: Math.max(column, column2)
    }

    if (activeRowLockedByMe !== null && activeRowLockedByMe !== row) {
      if (socket) {
        socket.emit('unlock_row', { spreadsheetId: route.params.id, rowIndex: activeRowLockedByMe })
      }
      activeRowLockedByMe = null
    }

    if (lockedRows.value[row] && lockedRows.value[row].userId !== currentUser.value.id) {
      warningMessage.value = `Baris ${row + 1} sedang disunting oleh ${lockedRows.value[row].userName}! Silakan gunakan baris kosong di bawahnya.`
      
      if (warningTimeout) clearTimeout(warningTimeout)
      warningTimeout = setTimeout(() => {
        warningMessage.value = ''
      }, 4000)
    } else {
      warningMessage.value = ''
      if (socket) {
        socket.emit('lock_row', {
          spreadsheetId: route.params.id,
          rowIndex: row,
          user: currentUser.value
        })
        activeRowLockedByMe = row
      }
    }

    const hotInstance = hotRef.value?.hotInstance
    if (hotInstance && !isFormulaFocused.value) {
      const val = hotInstance.getDataAtCell(row, column)
      formulaInput.value = val !== null && val !== undefined ? String(val) : ''
    }
  },
  cells: (row, column) => {
    const cellProperties = {}
    if (lockedRows.value[row] && lockedRows.value[row].userId !== currentUser.value.id) {
      cellProperties.className = (cellProperties.className || '') + ' row-locked-by-other'
      cellProperties.readOnly = true
    }
    return cellProperties
  },
  contextMenu: {
    items: {
      'row_above': { name: 'Sisipkan Baris di Atas' },
      'row_below': { name: 'Sisipkan Baris di Bawah' },
      'remove_row': { name: 'Hapus Baris' },
      'col_left': { name: 'Sisipkan Kolom di Kiri' },
      'col_right': { name: 'Sisipkan Kolom di Kanan' },
      'remove_col': { name: 'Hapus Kolom' },
      'sep1': '---------',
      'make_bold': {
        name: '<b>Tebal (Bold)</b>',
        callback: function (key, selection) { applyStyleToSelection(this, selection, 'ht-bold') }
      },
      'make_italic': {
        name: '<i>Miring (Italic)</i>',
        callback: function (key, selection) { applyStyleToSelection(this, selection, 'ht-italic') }
      },
      'sep2': '---------',
      'border_all': {
        name: '🔲 Border Penuh (Kotak)',
        callback: function (key, selection) { applyStyleToSelection(this, selection, 'cell-border-all') }
      },
      'bg_yellow': {
        name: '🎨 Background Kuning',
        callback: function (key, selection) { applyStyleToSelection(this, selection, 'bg-yellow') }
      },
      'bg_green': {
        name: '🎨 Background Hijau',
        callback: function (key, selection) { applyStyleToSelection(this, selection, 'bg-green') }
      },
      'bg_blue': {
        name: '🎨 Background Biru',
        callback: function (key, selection) { applyStyleToSelection(this, selection, 'bg-blue') }
      },
      'clear_format': {
        name: '🧹 Hapus Format & Border',
        callback: function (key, selection) {
          const range = selection[0]
          for (let r = range.start.row; r <= range.end.row; r++) {
            for (let c = range.start.col; c <= range.end.col; c++) {
              this.setCellMeta(r, c, 'className', '')
            }
          }
          this.render()
        }
      },
      'sep3': '---------',
      'copy': {},
      'cut': {}
    }
  },
  licenseKey: 'non-commercial-and-evaluation'
})

const insertFormula = (funcName) => {
  const startColLetter = String.fromCharCode(65 + lastSelectedRange.startCol)
  const endColLetter = String.fromCharCode(65 + lastSelectedRange.endCol)
  const startRow = lastSelectedRange.startRow + 1
  const endRow = lastSelectedRange.endRow + 1

  const rangeStr = (lastSelectedRange.startCol === lastSelectedRange.endCol && lastSelectedRange.startRow === lastSelectedRange.endRow)
    ? `${startColLetter}${startRow}`
    : `${startColLetter}${startRow}:${endColLetter}${endRow}`

  let formulaText = `=SUM(${rangeStr})`
  if (funcName === 'AVERAGE') formulaText = `=AVERAGE(${rangeStr})`
  else if (funcName === 'COUNT') formulaText = `=COUNT(${rangeStr})`
  else if (funcName === 'VLOOKUP') formulaText = `=VLOOKUP(A1, ${rangeStr}, 2, FALSE)`

  formulaInput.value = formulaText
  showSuggestions.value = false
  if (formulaInputRef.value) formulaInputRef.value.focus()
}

const applyFormula = () => {
  if (!hotRef.value) return
  const hotInstance = hotRef.value.hotInstance
  const { endRow, endCol } = lastSelectedRange
  hotInstance.setDataAtCell(endRow, endCol, formulaInput.value)
  showSuggestions.value = false
}

const switchSheet = (sheetName) => {
  if (currentSheetName.value === sheetName) return
  
  if (hotRef.value && hotRef.value.hotInstance) {
    const hotInstance = hotRef.value.hotInstance
    allSheets.value[currentSheetName.value].rows = hotInstance.getData()
    
    const stylesMap = {}
    const totalRows = hotInstance.countRows()
    const totalCols = hotInstance.countCols()
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        const meta = hotInstance.getCellMeta(r, c)
        if (meta && meta.className && meta.className.trim() !== '') {
          stylesMap[`${r},${c}`] = meta.className.trim()
        }
      }
    }
    allSheets.value[currentSheetName.value].styles = stylesMap
  }

  currentSheetName.value = sheetName
  
  setTimeout(() => {
    if (hotRef.value && hotRef.value.hotInstance) {
      const hotInstance = hotRef.value.hotInstance
      const targetSheet = allSheets.value[sheetName]
      
      hotInstance.loadData(targetSheet.rows)
      
      const totalRows = hotInstance.countRows()
      const totalCols = hotInstance.countCols()
      for (let r = 0; r < totalRows; r++) {
        for (let c = 0; c < totalCols; c++) {
          hotInstance.setCellMeta(r, c, 'className', '')
        }
      }

      if (targetSheet.styles) {
        for (const key in targetSheet.styles) {
          const [r, c] = key.split(',').map(Number)
          hotInstance.setCellMeta(r, c, 'className', targetSheet.styles[key])
        }
      }
      hotInstance.render()
    }
  }, 50)
}

const addNewSheet = () => {
  const sheetKeys = Object.keys(allSheets.value)
  const newSheetName = `Sheet${sheetKeys.length + 1}`
  
  allSheets.value[newSheetName] = {
    rows: Array.from({ length: 60 }, () => Array(20).fill('')),
    styles: {}
  }

  switchSheet(newSheetName)
}

const applyStyleToSelection = (hotInstance, selection, className) => {
  const range = selection[0]
  for (let r = range.start.row; r <= range.end.row; r++) {
    for (let c = range.start.col; c <= range.end.col; c++) {
      const cellMeta = hotInstance.getCellMeta(r, c)
      const currentClass = cellMeta.className || ''
      if (!currentClass.includes(className)) {
        hotInstance.setCellMeta(r, c, 'className', (currentClass + ' ' + className).trim())
      }
    }
  }
  hotInstance.render()
}

const applyStyleToActive = (className) => {
  if (!hotRef.value || !lastSelectedRange) return
  const hotInstance = hotRef.value.hotInstance

  const { startRow, startCol, endRow, endCol } = lastSelectedRange
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cellMeta = hotInstance.getCellMeta(r, c)
      const currentClass = cellMeta.className || ''
      if (!currentClass.includes(className)) {
        hotInstance.setCellMeta(r, c, 'className', (currentClass + ' ' + className).trim())
      }
    }
  }
  hotInstance.render()
}

const clearFormatting = () => {
  if (!hotRef.value || !lastSelectedRange) return
  const hotInstance = hotRef.value.hotInstance

  const { startRow, startCol, endRow, endCol } = lastSelectedRange
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      hotInstance.setCellMeta(r, c, 'className', '')
    }
  }
  hotInstance.render()
}

const triggerUndo = () => {
  if (hotRef.value && hotRef.value.hotInstance) {
    const undoRedoPlugin = hotRef.value.hotInstance.getPlugin('undoRedo')
    if (undoRedoPlugin && undoRedoPlugin.isUndoAvailable()) {
      undoRedoPlugin.undo()
    }
  }
}

const triggerRedo = () => {
  if (hotRef.value && hotRef.value.hotInstance) {
    const undoRedoPlugin = hotRef.value.hotInstance.getPlugin('undoRedo')
    if (undoRedoPlugin && undoRedoPlugin.isRedoAvailable()) {
      undoRedoPlugin.redo()
    }
  }
}

const fetchSpreadsheetDetail = async () => {
  try {
    const res = await $api(`/spreadsheets/${route.params.id}`)
    if (res.success && res.data) {
      spreadsheet.value = res.data
      const content = res.data.data_content
      if (content) {
        if (content.sheets && typeof content.sheets === 'object') {
          allSheets.value = content.sheets
        } else if (content.rows && Array.isArray(content.rows)) {
          allSheets.value['Sheet1'] = {
            rows: content.rows,
            styles: content.styles || {}
          }
        }

        const firstSheetKey = Object.keys(allSheets.value)[0] || 'Sheet1'
        currentSheetName.value = firstSheetKey

        if (hotRef.value && hotRef.value.hotInstance) {
          const hotInstance = hotRef.value.hotInstance
          const targetSheet = allSheets.value[firstSheetKey]
          hotInstance.loadData(targetSheet.rows)

          if (targetSheet.styles) {
            for (const key in targetSheet.styles) {
              const [r, c] = key.split(',').map(Number)
              hotInstance.setCellMeta(r, c, 'className', targetSheet.styles[key])
            }
            hotInstance.render()
          }
        } else {
          hotSettings.value.data = allSheets.value[firstSheetKey].rows
        }
      }
    } else {
      isNotFound.value = true
    }
  } catch (err) {
    // Tangkap error 404 dari API dan aktifkan tampilan penanda Not Found
    if (err.status === 404 || err.statusCode === 404 || (err.message && err.message.includes('404'))) {
      isNotFound.value = true
    } else {
      console.error('Gagal memuat detail spreadsheet:', err)
    }
  }
}

const saveData = async (isShortcut = false) => {
  if (!hotRef.value) return
  const hotInstance = hotRef.value.hotInstance

  allSheets.value[currentSheetName.value].rows = hotInstance.getData()
  const stylesMap = {}
  const totalRows = hotInstance.countRows()
  const totalCols = hotInstance.countCols()
  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      const meta = hotInstance.getCellMeta(r, c)
      if (meta && meta.className && meta.className.trim() !== '') {
        stylesMap[`${r},${c}`] = meta.className.trim()
      }
    }
  }
  allSheets.value[currentSheetName.value].styles = stylesMap

  saveStatus.value = 'Menyimpan...'
  try {
    await $api(`/spreadsheets/${route.params.id}`, {
      method: 'PUT',
      body: {
        title: spreadsheet.value.title,
        description: spreadsheet.value.description || '',
        data_content: { 
          sheets: allSheets.value
        }
      }
    })

    if (socket) {
      socket.emit('spreadsheet_saved', { spreadsheetId: route.params.id });
    }

    if (activeRowLockedByMe !== null) {
      if (socket) {
        socket.emit('unlock_row', { spreadsheetId: route.params.id, rowIndex: activeRowLockedByMe })
      }
      activeRowLockedByMe = null
    }

    saveStatus.value = isShortcut ? 'File tersimpan' : 'Tersimpan!'
    setTimeout(() => { saveStatus.value = '' }, 2500)
  } catch (err) {
    saveStatus.value = 'Gagal menyimpan'
    console.error('Error saving spreadsheet:', err)
  }
}

const handleKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    saveData(true)
  }
}

onMounted(async () => {
  isMounted.value = true

  socket = io('http://localhost:8090')

  socket.emit('join_spreadsheet', route.params.id)

  socket.on('sync_locks', (locks) => {
    lockedRows.value = locks
    if (hotRef.value?.hotInstance) {
      hotRef.value.hotInstance.render()
    }
  })

  socket.on('refresh_spreadsheet', async () => {
    await fetchSpreadsheetDetail()
  })

  window.addEventListener('keydown', handleKeydown)
  setTimeout(async () => {
    await fetchSpreadsheetDetail()
  }, 150)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (socket && activeRowLockedByMe !== null) {
    socket.emit('unlock_row', { spreadsheetId: route.params.id, rowIndex: activeRowLockedByMe })
  }
  if (socket) socket.disconnect()
})
</script>

<style scoped>
.spreadsheet-container {
  max-width: 1350px;
  margin: 0 auto;
  padding: 24px 16px 60px 16px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #1e293b;
}

/* Tampilan Not Found / Data Dihapus */
.not-found-card {
  text-align: center;
  padding: 80px 20px;
  background: #ffffff;
  border-radius: 16px;
  border: 2px dashed #cbd5e1;
  max-width: 500px;
  margin: 60px auto;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.not-found-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.not-found-card h2 {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
}
.not-found-card p {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 24px 0;
}
.btn-back-home {
  background: #4f46e5;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  text-decoration: none;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);
  transition: background 0.2s;
}
.btn-back-home:hover {
  background: #4338ca;
}

.spreadsheet-header-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px 12px 0 0;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sheet-title-input {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  border: 1px solid transparent;
  padding: 4px 8px;
  border-radius: 6px;
  outline: none;
  width: 320px;
  background: transparent;
  transition: all 0.2s;
}

.sheet-title-input:hover,
.sheet-title-input:focus {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.badge-mode {
  background: #e0e7ff;
  color: #4338ca;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
}

.btn-back {
  text-decoration: none;
  color: #475569;
  font-weight: 600;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 6px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  transition: background 0.2s;
}

.btn-back:hover {
  background: #e2e8f0;
}

.btn-excel-save {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 8px 18px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
  transition: transform 0.1s;
}

.btn-excel-save:hover {
  background: #059669;
  transform: translateY(-1px);
}

.save-status-text {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.text-success {
  color: #059669 !important;
  font-weight: 700;
}

.wps-ribbon-toolbar {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border-left: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  padding: 8px 16px;
  gap: 10px;
  flex-wrap: wrap;
}

.ribbon-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ribbon-btn {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ribbon-btn:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
}

.ribbon-divider {
  width: 1px;
  height: 22px;
  background: #cbd5e1;
  margin: 0 4px;
}

.color-swatch {
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 4px;
}
.color-swatch.yellow { background-color: #fef08a; border-color: #fde047; }
.color-swatch.green { background-color: #bbf7d0; border-color: #86efac; }
.color-swatch.blue { background-color: #bfdbfe; border-color: #93c5fd; }

.formula-tag {
  background: #e0e7ff;
  color: #3730a3;
  border-color: #c7d2fe;
}
.formula-tag:hover {
  background: #c7d2fe;
}

.formula-ribbon-outer {
  position: relative;
  z-index: 1050;
}

.formula-ribbon {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: #ffffff;
  border-left: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  gap: 10px;
}

.formula-fx-label {
  font-style: italic;
  font-weight: bold;
  color: #64748b;
  font-size: 14px;
}

.formula-bar-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
  background: #ffffff;
}

.formula-bar-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}

.btn-apply-formula {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.btn-apply-formula:hover {
  background: #4338ca;
}

.formula-suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 45px;
  right: 135px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  z-index: 1100;
  max-height: 220px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  font-size: 12px;
  background: #ffffff;
}

.suggestion-item:hover {
  background: #f8fafc;
}

.suggestion-name {
  font-weight: 700;
  color: #4338ca;
}

.suggestion-desc {
  color: #64748b;
}

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
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.spreadsheet-body-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 0 0;
  padding: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
}

.sheet-tabs-bar {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 12px 12px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
}

.sheet-tabs-list {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
}

.sheet-tab-item {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.sheet-tab-item:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.sheet-tab-item.active {
  background: #6366f1;
  color: white;
  border-color: #4f46e5;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.25);
}

.sheet-tab-add {
  background: #e2e8f0;
  border: 1px dashed #94a3b8;
  color: #334155;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.sheet-tab-add:hover {
  background: #cbd5e1;
  color: #0f172a;
}

.spreadsheet-body-card :deep(.handsontable) {
  color: #0f172a !important;
}

.spreadsheet-body-card :deep(.wtHolder) {
  background-color: #ffffff !important;
}

/* Warna indikator baris yang sedang dikunci/diedit oleh user lain */
.spreadsheet-body-card :deep(.row-locked-by-other) {
  background-color: #ffe4e6 !important;
  color: #9f1239 !important;
}

.spreadsheet-body-card :deep(.ht-bold) { font-weight: bold !important; }
.spreadsheet-body-card :deep(.ht-italic) { font-style: italic !important; }
.spreadsheet-body-card :deep(.cell-border-all) { border: 2px solid #0f172a !important; }
.spreadsheet-body-card :deep(.bg-yellow) { background-color: #fef08a !important; }
.spreadsheet-body-card :deep(.bg-green) { background-color: #bbf7d0 !important; }
.spreadsheet-body-card :deep(.bg-blue) { background-color: #bfdbfe !important; }
</style>