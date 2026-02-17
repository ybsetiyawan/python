export function useAuth() {
  const getToken = () => {
    if (typeof window === "undefined") return null; // <-- penting untuk SSR
    return localStorage.getItem("admin_token");
  };

  const isAuthenticated = () => {
    return !!getToken();
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
      window.location.href = "/login";
    }
  };

  return {
    getToken,
    isAuthenticated,
    logout,
  };
}


