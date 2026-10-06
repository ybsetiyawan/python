<template>
  <v-container fluid class="pa-0 fill-height login-container overflow-hidden">
    <v-row no-gutters class="fill-height">

      <!-- KIRI: BRANDING & RUANG KERJA (WARNA KORPORAT ELEGAN) -->
      <v-col cols="12" md="6" lg="6" class="left-pane d-none d-md-flex flex-column justify-space-between pa-12 pa-lg-16 position-relative">
        <div class="blob-glow-1"></div>
        <div class="blob-glow-2"></div>

        <!-- Header Kiri -->
        <div class="z-index-1">
          <div class="d-flex align-center">
            <div class="logo-box-alt mr-3">
              <v-icon color="white" size="22">mdi-account-group-outline</v-icon>
            </div>
            <div>
              <span class="text-subtitle-1 font-weight-black text-white tracking-widest d-block">EDP WORKSPACE SBY</span>
              <span class="text-caption text-indigo-lighten-3">PT Indomarco Adi Prima &bull; Surabaya</span>
            </div>
          </div>
        </div>

        <!-- Pesan Utama (Bahasa Indonesia & Ringkas) -->
        <div class="z-index-1 my-auto py-10" style="max-width: 480px;">
          <div class="badge-pill mb-4">
            <v-icon size="14" color="indigo-lighten-3" class="mr-1">mdi-hub-outline</v-icon> Ruang Kerja Bersama
          </div>
          <h1 class="text-h3 font-weight-black text-white mb-4" style="line-height: 1.2;">
            Kolaborasi Mudah Antar Pengguna.
          </h1>
          <p class="text-body-1 text-indigo-lighten-3 font-weight-regular" style="line-height: 1.6;">
            Ruang kerja internal terpusat untuk memudahkan interaksi, pengelolaan data master, dan sinkronisasi operasional antar departemen di cabang Surabaya.
          </p>
        </div>

        <!-- COPYRIGHT DI KIRI -->
        <div class="z-index-1 text-caption text-indigo-lighten-3 font-weight-medium">
          Copyright &copy; @Ybs - EDPSBY 2026
        </div>
      </v-col>

      <!-- KANAN: FORM LOGIN -->
      <v-col cols="12" md="6" lg="6" class="right-pane d-flex align-center justify-center bg-white pa-8 pa-md-16">
        <div class="w-100" style="max-width: 420px;">
          
          <!-- Mobile Header -->
          <div class="d-flex align-center mb-8 d-md-none">
            <div class="logo-box-alt mr-3" style="background: #4f46e5;">
              <v-icon color="white" size="20">mdi-account-group-outline</v-icon>
            </div>
            <div>
              <span class="text-subtitle-1 font-weight-black text-slate-900 d-block">EDP WORKSPACE SBY</span>
              <span class="text-caption text-slate-500">Internal Ruang Kerja</span>
            </div>
          </div>

          <div class="mb-8">
            <h2 class="text-h4 font-weight-extrabold text-slate-900 mb-2">Masuk Ruang Kerja</h2>
            <p class="text-body-2 text-slate-500">Masukkan akun kredensial Anda untuk mengakses sistem.</p>
          </div>

          <v-alert v-if="infoMessage" type="warning" variant="tonal" class="mb-4 text-caption rounded-xl" density="compact">
            {{ infoMessage }}
          </v-alert>

          <v-form @submit.prevent="handleLogin">
            <div class="mb-4">
              <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">ALAMAT EMAIL</label>
              <v-text-field
                v-model="email"
                placeholder="nama@indomarco.co.id"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                color="indigo-darken-2"
                prepend-inner-icon="mdi-email-outline"
                hide-details
              ></v-text-field>
            </div>

            <div class="mb-6">
              <label class="d-block text-caption font-weight-bold text-slate-700 mb-1">PASSWORD</label>
              <v-text-field
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                color="indigo-darken-2"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                hide-details
              ></v-text-field>
            </div>

            <v-expand-transition>
              <v-alert v-if="error" type="error" variant="tonal" class="mb-6 rounded-xl text-caption font-weight-bold" icon="mdi-alert-circle">
                {{ error }}
              </v-alert>
            </v-expand-transition>

            <v-btn
              block
              color="indigo-darken-2"
              height="50"
              elevation="0"
              class="rounded-xl font-weight-bold text-none text-subtitle-2 shadow-sm"
              :loading="loading"
              @click="handleLogin"
            >
              Masuk ke Ruang Kerja
              <v-icon end size="18" class="ml-2">mdi-arrow-right</v-icon>
            </v-btn>
          </v-form>

          <!-- Copyright Mobile -->
          <div class="mt-12 text-center text-caption text-slate-400 d-md-none font-weight-medium">
            Copyright &copy; @Ybs - EDPSBY 2026
          </div>

        </div>
      </v-col>

    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "#imports";
import { useAuth } from "~/composables/useAuth";
import { adminLogin } from "~/services/api";

const router = useRouter();
const route = useRoute();
const { isAuthenticated } = useAuth();

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");
const showPassword = ref(false);
const infoMessage = ref("");

onMounted(() => {
    if (route.query.msg === 'session_expired') {
        infoMessage.value = "Sesi Anda telah berakhir. Silakan login kembali.";
        router.replace({ query: {} });
    } else if (isAuthenticated()) {
        router.push("/admin/dashboard");
    }
});

async function handleLogin() {
    if (!email.value || !password.value) {
        error.value = "E-mail dan password wajib diisi";
        return;
    }
    try {
        loading.value = true;
        error.value = "";

        const data = await adminLogin(email.value, password.value);

        localStorage.setItem("admin_token", data.token);
        localStorage.setItem("user_data", JSON.stringify(data.user));

        router.push("/admin/dashboard");
    } catch (err: any) {
        error.value = err.message || "Login gagal, silakan coba lagi.";
    } finally {
        loading.value = false;
    }
}
</script>

<style scoped>
.left-pane {
  /* Perpaduan warna Midnight Blue, Deep Navy, dan aksen Indigo yang harmonis & profesional */
  background: linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #312e81 100%);
  height: 100vh;
  overflow: hidden;
}

.right-pane {
  height: 100vh;
}

.blob-glow-1 {
  position: absolute;
  top: -100px;
  left: -100px;
  width: 400px;
  height: 400px;
  background: rgba(99, 102, 241, 0.25);
  filter: blur(90px);
  border-radius: 50%;
  pointer-events: none;
}

.blob-glow-2 {
  position: absolute;
  bottom: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  background: rgba(79, 70, 229, 0.2);
  filter: blur(90px);
  border-radius: 50%;
  pointer-events: none;
}

.z-index-1 {
  position: relative;
  z-index: 1;
}

.logo-box-alt {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.4);
}

.badge-pill {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #e0e7ff;
  backdrop-filter: blur(4px);
}

.text-slate-900 { color: #0f172a; }
.text-slate-700 { color: #334155; }
.text-slate-500 { color: #64748b; }
.text-slate-400 { color: #94a3b8; }
</style>