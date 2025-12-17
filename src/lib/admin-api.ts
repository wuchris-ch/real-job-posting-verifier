// Helper for making authenticated admin API requests
export async function adminFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const password = sessionStorage.getItem("admin_password") || "";

  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": password,
      ...options.headers,
    },
  });
}
