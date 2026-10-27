// // export const API_BASE_URL = "http://localhost:8090/api"; // sesuaikan port backendmu

// export function getApiBase() {
//   const config = useRuntimeConfig()
//   return config.public.apiBase || "/api"
// }


// export async function adminLogin(email: string, password: string) {
//   const config = useRuntimeConfig()

//   const res = await fetch(`${config.public.apiBase}/auth/login`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ email, password }),
//   });

//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || "Login gagal");
//   }

//   return res.json();
// }


export function getApiBase() {
  const config = useRuntimeConfig()
  return config.public.apiBase || "/api"
}

// 🛡️ Helper internal untuk otomatis menyertakan Bearer Token
function getAuthHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token")
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
  }
  
  return headers
}

// 🌐 Fungsi pemanggil API universal yang sudah dilengkapi Token & BaseURL
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBase

  // Pastikan endpoint diawali garis miring jika belum ada
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  const res = await fetch(`${baseUrl}${cleanEndpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || error.error || "Terjadi kesalahan pada server")
  }

  return res.json()
}

export async function adminLogin(email: string, password: string) {
  const config = useRuntimeConfig()

  const res = await fetch(`${config.public.apiBase}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Login gagal");
  }

  return res.json();
}