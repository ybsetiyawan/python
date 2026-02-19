<template>
    <v-container fluid class="pa-0 fill-height bg-white overflow-hidden">
        <v-row no-gutters class="fill-height">

            <v-col cols="12" md="5" lg="4" class="d-flex align-center bg-white z-index-2 shadow-xl">
                <div class="pa-8 pa-md-16 w-100">

                    <div class="d-flex align-center mb-12">
                        <div class="logo-box mr-3">
                            <v-icon color="white" size="30">mdi-source-branch-plus</v-icon>
                        </div>
                        <span class="text-h6 font-weight-black text-slate-800 tracking-tighter">EDP SBY -
                            <span class="text-primary font-weight-light text-subtitle-2">Vision</span>
                            </span>
                    </div>
                    <v-alert v-if="infoMessage" type="warning" variant="tonal" closable class="mb-4 text-caption"
                        density="compact">
                        {{ infoMessage }}
                    </v-alert>

                    <!-- <div class="mb-10">
                        <h1 class="text-h3 font-weight-black text-slate-900 mb-2 tracking-tighter">Login.</h1>
                        <p class="text-body-1 text-slate-500">Gunakan akses admin Anda untuk masuk ke sistem verifikasi.
                        </p>
                    </div> -->

                    <v-form @submit.prevent="handleLogin">
                        <div class="mb-6">
                            <label class="text-subtitle-2 font-weight-black text-slate-700 ml-1">USERNAME</label>
                            <v-text-field v-model="email" placeholder="Enter your username" variant="outlined"
                                density="comfortable" rounded="lg" color="primary" class="mt-2 custom-field"
                                prepend-inner-icon="mdi-account-key" hide-details />
                        </div>

                        <div class="mb-8">
                            <div class="d-flex justify-space-between align-center ml-1">
                                <label class="text-subtitle-2 font-weight-black text-slate-700">PASSWORD</label>
                                <!-- <span class="text-caption font-weight-bold text-primary cursor-pointer">Lupa?</span> -->
                            </div>
                            <v-text-field v-model="password" :type="showPassword ? 'text' : 'password'"
                                placeholder="••••••••" variant="outlined" density="comfortable" rounded="lg"
                                color="primary" class="mt-2 custom-field" prepend-inner-icon="mdi-lock-outline"
                                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                @click:append-inner="showPassword = !showPassword" hide-details />
                        </div>

                        <v-expand-transition>
                            <v-alert v-if="error" type="error" variant="tonal"
                                class="mb-6 rounded-lg text-caption font-weight-bold" icon="mdi-alert-circle">
                                {{ error }}
                            </v-alert>
                        </v-expand-transition>

                        <v-btn block color="primary" height="56" elevation="0"
                            class="rounded-lg font-weight-black text-none" :loading="loading" @click="handleLogin">
                            Akses Dashboard
                            <v-icon end size="18" class="ml-2">mdi-chevron-right</v-icon>
                        </v-btn>
                    </v-form>

                    <div class="mt-16 text-caption text-slate-400 d-flex align-center">
                        <v-icon size="14" class="mr-2">mdi-shield-check</v-icon>
                        Ybs - @EDP SURABAYA &bull; &copy; 2026
                    </div>
                </div>
            </v-col>

            <v-col cols="12" md="7" lg="8"
                class="bg-slate-50 d-none d-md-flex align-center justify-center position-relative">

                <div class="bg-pattern"></div>

                <div class="preview-container">
                    <v-card flat class="rounded-xl shadow-2xl border pa-6 bg-white overflow-hidden" width="500">
                        <div class="d-flex align-center justify-space-between mb-8">
                            <div class="d-flex align-center">
                                <div class="status-dot mr-2"></div>
                                <span class="text-caption font-weight-black text-slate-400">Optical Character
                                    Recognition</span>
                            </div>
                            <v-icon color="grey-lighten-3">mdi-dots-horizontal</v-icon>
                        </div>

                        <div v-for="i in 3" :key="i"
                            class="mb-4 d-flex align-center pa-4 rounded-lg bg-slate-50 border-dashed">
                            <v-avatar size="40" color="primary-lighten-5" class="mr-4">
                                <v-icon color="primary" size="20">mdi-file-document-outline</v-icon>
                            </v-avatar>
                            <div class="flex-grow-1">
                                <div class="bg-slate-200 rounded mb-2" style="width: 40%; height: 10px;"></div>
                                <div class="bg-slate-100 rounded" style="width: 25%; height: 8px;"></div>
                            </div>
                            <v-chip size="x-small" color="success" variant="flat"
                                class="font-weight-black">VERIFIED</v-chip>
                        </div>

                        <div class="mt-8 pt-4 border-t d-flex justify-space-between align-center">
                            <span class="text-caption font-weight-bold text-slate-400">SESSIONS: 128 ACTIVE</span>
                            <v-progress-circular indeterminate size="16" width="2"
                                color="primary"></v-progress-circular>
                        </div>
                    </v-card>
                </div>

                <div class="position-absolute" style="bottom: 40px; right: 40px;">
                    <v-chip color="white" class="shadow-sm font-weight-bold" size="large">
                        <v-icon start color="success">mdi-check-decagram</v-icon>
                        System v2.48 Operational
                    </v-chip>
                </div>
            </v-col>

        </v-row>

    </v-container>
</template>



<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "#imports";
import { useAuth } from "~/composables/useAuth";
import { adminLogin } from "~/services/api";

const router = useRouter();
const { isAuthenticated } = useAuth();

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");
const showPassword = ref(false);
const route = useRoute()
const infoMessage = ref("")

onMounted(() => {
    // 1. Cek query parameter dulu
    if (route.query.msg === 'session_expired') {
        infoMessage.value = "Sesi Anda telah berakhir. Silakan login kembali."

        // Opsional: Hapus query param dari URL agar tidak muncul terus saat di-refresh
        router.replace({ query: {} })
    }
    // 2. Jika tidak ada pesan error, baru cek apakah sudah login
    else if (isAuthenticated()) {
        router.push("/admin/dashboard")
    }
})
async function handleLogin() {
    if (!email.value || !password.value) {
        error.value = "E-mail dan password wajib diisi";
        return;
    }
    try {
        loading.value = true;
        error.value = "";

        const data = await adminLogin(email.value, password.value);

        // 1. Simpan Token
        localStorage.setItem("admin_token", data.token);

        // 2. Simpan Data User (Gunakan JSON.stringify karena data adalah objek)
        localStorage.setItem("user_data", JSON.stringify(data.user));

        // Redirect ke dashboard
        router.push("/admin/dashboard");
    } catch (err: any) {
        error.value = err.message || "Login gagal, silakan coba lagi.";
    } finally {
        loading.value = false;
    }
}
</script>

<style scoped>
.z-index-2 {
    z-index: 2;
}

.shadow-xl {
    box-shadow: 20px 0 50px rgba(0, 0, 0, 0.03) !important;
}

.shadow-2xl {
    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.08) !important;
}

.bg-slate-50 {
    background-color: #f8fafc !important;
}

.text-slate-900 {
    color: #0f172a;
}

.text-slate-800 {
    color: #1e293b;
}

.text-slate-700 {
    color: #334155;
}

.text-slate-500 {
    color: #64748b;
}

.text-slate-400 {
    color: #94a3b8;
}

.bg-slate-200 {
    background-color: #e2e8f0;
}

.bg-slate-100 {
    background-color: #f1f5f9;
}

.logo-box {
    width: 40px;
    height: 40px;
    background-color: rgb(var(--v-theme-primary));
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3);
}

.custom-field :deep(.v-field__outline) {
    --v-field-border-opacity: 0.15 !important;
}

.bg-pattern {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(rgb(var(--v-theme-primary)) 0.5px, transparent 0.5px);
    background-size: 30px 30px;
    opacity: 0.1;
}

.border-dashed {
    border: 1px dashed #e2e8f0 !important;
}

.status-dot {
    width: 8px;
    height: 8px;
    background-color: #4caf50;
    border-radius: 50%;
}

.tracking-tighter {
    letter-spacing: -2px !important;
}

.preview-container {
    transform: perspective(1000px) rotateY(-5deg) rotateX(2deg);
    transition: transform 0.5s ease;
}

.preview-container:hover {
    transform: perspective(1000px) rotateY(0deg) rotateX(0deg);
}
</style>