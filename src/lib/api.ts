export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  const text = await res.text();

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  if (!res.ok) {
    // 🔑 Handle validation errors (422) or unauthorized (401)
    if (data?.errors) {
      // pick the first error message from validation
      const firstField = Object.keys(data.errors)[0];
      const firstError = data.errors[firstField][0];
      throw new Error(firstError);
    }

    if (data?.message) {
      throw new Error(data.message);
    }

    throw new Error(text || "Unknown error");
  }

  return data;
}
