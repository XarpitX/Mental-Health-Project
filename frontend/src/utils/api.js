const API_ROOT = import.meta.env.VITE_API_URL || "";

function url(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_ROOT}${p}`;
}

export function getToken() {
  return localStorage.getItem("mindcare_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("mindcare_token", token);
  else localStorage.removeItem("mindcare_token");
}

export async function api(path, options = {}) {
  const { body, headers = {}, ...rest } = options;
  const token = getToken();
  const res = await fetch(url(path), {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || "Request failed" };
  }
  if (!res.ok) {
    const err = new Error(data.message || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
