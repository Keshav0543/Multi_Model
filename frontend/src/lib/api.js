const BASE = "/api";

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
    response = await fetch(`${BASE}${path}`, options);
  } catch {
    throw new Error("Cannot reach the backend. Is it running on port 3000?");
  }

  const raw = await response.text();
  let data = {};

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { message: raw };
  }

  if (!response.ok) {
    throw new Error(
      readable(data.error) || readable(data.message) || `Request failed (${response.status})`,
    );
  }

  return data;
}

export function createSession() {
  return request("/session", { method: "POST" });
}

export async function listDocuments() {
  const data = await request("/docId");
  return Array.isArray(data.documents) ? data.documents : [];
}

export function getDocumentData(docId) {
  return request(`/sId/${docId}`);
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
