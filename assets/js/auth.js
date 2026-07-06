const STORAGE_KEY = 'nova_session_token';

export function getToken() {
  return localStorage.getItem(STORAGE_KEY);
}

export function setToken(token) {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(STORAGE_KEY);
}

/** Dekodiert das JWT-Payload lokal (nur lesen, keine Signaturpruefung noetig im Client). */
export function decodeToken(token) {
  if (!token) return null;
  try {
    const payloadPart = token.split('.')[1];
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function isTokenValid(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return false;
  return Date.now() / 1000 < payload.exp;
}

/**
 * Liest "#token=..." oder "#error=..." aus der URL (kommt vom Worker nach dem
 * Discord-OAuth2-Callback) und entfernt sie danach aus der Adresszeile, damit der
 * Token nicht in der Browser-History haengen bleibt. Normale Routen wie "#/server/123"
 * enthalten kein "=" und werden hier ignoriert.
 */
export function consumeAuthHash() {
  const hash = window.location.hash.slice(1);
  if (!hash || !hash.includes('=')) return { token: null, error: null };

  const params = new URLSearchParams(hash);
  const token = params.get('token');
  const error = params.get('error');

  if (token || error) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  return { token, error };
}

/** Baut die Discord-OAuth2-Login-URL inkl. Turnstile-Token im "state"-Parameter. */
export function buildDiscordLoginUrl(turnstileToken) {
  const state = btoa(JSON.stringify({ ts: turnstileToken }));
  const params = new URLSearchParams({
    client_id: window.NOVA_CONFIG.DISCORD_CLIENT_ID,
    redirect_uri: window.NOVA_CONFIG.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds',
    state,
    prompt: 'consent',
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}
