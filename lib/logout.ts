export async function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
  } catch {
    // Ignore network error on logout
  }

  window.location.href = "/";
}

