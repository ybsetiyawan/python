// export const API_BASE_URL = "http://localhost:8090/api"; // sesuaikan port backendmu

export function getApiBase() {
  const config = useRuntimeConfig()
  return config.public.apiBase || "/api"
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
