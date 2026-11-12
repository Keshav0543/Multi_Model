const BASE = "/api";
const AUTH_KEY = "lumen.auth";

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export function loadAuth() {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    if (parsed?.user?.id && parsed?.sessionId) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function saveAuth(auth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

function authHeaders() {
  const auth = loadAuth();
  return auth?.user?.id ? { "x-user-id": auth.user.id } : {};
}

function readable(message) {
  if (typeof message !== "string") return message;

  try {
    const parsed = JSON.parse(message);
    return parsed?.error?.message || parsed?.message || message;
  } catch {
    return message;
  }
}

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { ...authHeaders(), ...(options.headers || {}) },
    });
  } catch {
    throw new Error("Cannot reach the backend. Is the API proxy target reachable?");
  }

  const raw = await response.text();
  let data = {};

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { message: raw };
  }

  if (!response.ok) {
    const error = new Error(
      readable(data.error) || readable(data.message) || `Request failed (${response.status})`,
    );
    error.status = response.status;

    if (response.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }

    throw error;
  }

  return data;
}

export function registerUser({ userId, email, password }) {
  return request("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ UserId: userId, EmailId: email, Password: password }),
  });
}

export function loginUser({ userId, password }) {
  return request("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, Password: password }),
  });
}

export function createSession() {
  return request("/session", { method: "POST" });
}

export async function listDocuments() {
  const data = await request("/docId");
  return Array.isArray(data.documents) ? data.documents : [];
}

export function getDocumentData(docId) {
  return request(`/sId/${encodeURIComponent(docId)}`);
}

export function uploadFiles(sessionId, files) {
  const form = new FormData();

  for (const file of files) {
    form.append("myfiles", file);
  }

  return request(`/upload/${sessionId}`, {
    method: "POST",
    body: form,
  });
}

export function askQuestion(sessionId, question, docId) {
  return request(`/chat/${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(docId ? { question, docId } : { question }),
  });
}
