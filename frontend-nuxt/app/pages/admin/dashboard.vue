<template>
  <div class="wrapper">

    <!-- HEADER -->
    <div class="header fade-in">
      <h1 class="title">Dashboard Verifikasi KTP</h1>
      <div class="subtitle">
        Sistem Digital – EDP Surabaya
      </div>
    </div>

    <!-- HERO ACTION -->
    <div
      class="hero-card clickable slide-up delay-1"
      @click="router.push('/admin/upload')"
    >
      <div class="hero-content">
        <v-icon size="40">mdi-cloud-upload</v-icon>
        <div>
          <div class="hero-title">Upload Dokumen Baru</div>
          <div class="hero-desc">
            Klik untuk mengunggah KTP dan memulai proses verifikasi
          </div>
        </div>
        <v-icon class="hover-arrow">mdi-arrow-right</v-icon>
      </div>
    </div>

    <!-- FLOW -->
    <div class="flow-container slide-up delay-2">
      <div class="flow-step">
        <div class="flow-number">01</div>
        <div>Upload</div>
      </div>

      <div class="flow-line"></div>

      <div
        class="flow-step clickable"
        @click="router.push('/admin/drafts')"
      >
        <div class="flow-number success">02</div>
        <div>Verifikasi</div>
      </div>
    </div>

    <!-- STAT GRID -->
    <div class="stat-grid">

      <div class="stat-card blue slide-up delay-1">
        <div class="stat-label">Total Data Cabang</div>
        <div class="stat-value">
          {{ loading ? '-' : totalData }}
        </div>
      </div>

      <div
        class="stat-card orange clickable slide-up delay-2"
        @click="router.push('/admin/drafts')"
      >
        <div class="stat-label">Total Data Cabang Belum Diverifikasi</div>
        <div class="stat-value">
          {{ loading ? '-' : totalDraft }}
        </div>
        <v-icon class="hover-arrow small">mdi-arrow-right</v-icon>
      </div>

      <div class="stat-card cyan slide-up delay-3">
        <div class="stat-label">Data Hari Ini</div>
        <div class="stat-value">
          {{ loading ? '-' : totalToday }}
        </div>
      </div>

      <div class="stat-card green slide-up delay-4">
        <div class="stat-label">Verified Hari Ini</div>
        <div class="stat-value">
          {{ loading ? '-' : totalVerifiedToday }}
        </div>
      </div>

    </div>

    <!-- FOOTER -->
    <v-divider class="my-12"></v-divider>
    <div class="footer">
      <v-icon size="16" class="mr-1">mdi-shield-check</v-icon>
      EDPSBY ©2026 – Sistem Verifikasi Digital
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter, useNuxtApp } from "#imports"

definePageMeta({ layout: "admin" })

const router = useRouter()
const { $api } = useNuxtApp()

const totalData = ref(0)
const totalDraft = ref(0)
const totalToday = ref(0)
const totalVerifiedToday = ref(0)
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await $api("/ocr/dashboard", { method: "GET" })

    totalData.value = res.total ?? 0
    totalDraft.value = res.draft ?? 0
    totalToday.value = res.today ?? 0
    totalVerifiedToday.value = res.verifiedToday ?? 0
  } catch (err) {
    console.error("Dashboard error:", err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.wrapper {
  padding: 40px;
  max-width: 1300px;
  margin: auto;
}

/* HEADER */
.header {
  margin-bottom: 35px;
}

.title {
  font-size: 30px;
  font-weight: 700;
}

.subtitle {
  font-size: 14px;
  color: #757575;
  margin-top: 6px;
}

/* HERO */
.hero-card {
  background: linear-gradient(135deg, #4f83cc, #3f6fb5);
  color: white;
  padding: 35px;
  border-radius: 20px;
  margin-bottom: 40px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.hero-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 25px 50px rgba(63,111,181,0.25);
  filter: brightness(1.05);
}

.hero-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.hero-title {
  font-size: 20px;
  font-weight: 600;
}

.hero-desc {
  font-size: 13px;
  opacity: 0.9;
}

/* FLOW */
.flow-container {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 50px;
}

.flow-step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.flow-number {
  width: 40px;
  height: 40px;
  background: #4f83cc;
  color: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flow-number.success {
  background: #4caf75;
}

.flow-line {
  width: 60px;
  height: 3px;
  background: #e0e0e0;
}

/* STATS */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
}

.stat-card {
  padding: 28px;
  border-radius: 18px;
  color: white;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-6px);
  filter: brightness(1.05);
}

.blue { background: #3f6fb5; }
.orange { background: #f08c42; }
.cyan { background: #2e9ca6; }
.green { background: #4caf75; }

.stat-label {
  font-size: 13px;
  opacity: 0.9;
}

.stat-value {
  font-size: 30px;
  font-weight: 800;
  margin-top: 6px;
}

/* Hover Arrow */
.hover-arrow {
  margin-left: auto;
  opacity: 0;
  transform: translateX(-5px);
  transition: all 0.3s ease;
}

.stat-card:hover .hover-arrow,
.hero-card:hover .hover-arrow {
  opacity: 1;
  transform: translateX(5px);
}

.small {
  position: absolute;
  bottom: 15px;
  right: 15px;
}

/* Animations */
.fade-in {
  animation: fadeIn 0.7s ease forwards;
}

.slide-up {
  opacity: 0;
  transform: translateY(25px);
  animation: slideUp 0.6s ease forwards;
}

.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }
.delay-4 { animation-delay: 0.4s; }

@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.footer {
  text-align: center;
  font-size: 13px;
  color: #757575;
}

.clickable {
  cursor: pointer;
}
</style>