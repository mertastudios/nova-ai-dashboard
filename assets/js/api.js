import { getToken, clearToken } from './auth.js';

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;
    this.code   = code;
  }
}

async function request(path, options = {}) {
  const token   = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${window.NOVA_CONFIG.WORKER_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      'The server is currently unreachable. Please check your connection and try again.',
      0,
      'network_error'
    );
  }

  let data = null;
  try { data = await res.json(); } catch { /* empty body is fine */ }

  if (!res.ok) {
    if (res.status === 401) clearToken();
    const message = data?.error || `Unknown error (status ${res.status}).`;
    throw new ApiError(message, res.status, data?.code || null);
  }

  return data;
}

export const api = {
  getGuilds:    ()            => request('/api/guilds'),
  getGuild:     (id)          => request(`/api/guilds/${id}`),
  patchGuild:   (id, body)    => request(`/api/guilds/${id}`,            { method: 'PATCH',  body: JSON.stringify(body) }),
  getChannels:  (id)          => request(`/api/guilds/${id}/channels`),
  addApiKey:    (id, body)    => request(`/api/guilds/${id}/api-keys`,   { method: 'POST',   body: JSON.stringify(body) }),
  deleteApiKey: (id, keyId)   => request(`/api/guilds/${id}/api-keys/${keyId}`, { method: 'DELETE' }),
};
