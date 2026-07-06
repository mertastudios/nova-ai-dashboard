import { initRouter, registerRoute } from './router.js';
import { consumeAuthHash, getToken, isTokenValid, setToken, clearToken } from './auth.js';
import { renderLogin } from './views/login.js';
import { renderServerList } from './views/serverList.js';
import { renderServerSettings } from './views/serverSettings.js';

const appEl = document.getElementById('app');

const ERROR_MESSAGES = {
  discord_denied: 'Die Anmeldung wurde abgebrochen.',
  missing_code: 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.',
  turnstile_missing: 'Sicherheitsüberprüfung fehlt. Bitte lade die Seite neu und versuche es erneut.',
  turnstile_failed: 'Sicherheitsüberprüfung fehlgeschlagen. Bitte erneut versuchen.',
  rate_limited: 'Zu viele Anmeldeversuche. Bitte warte ein paar Minuten und versuche es erneut.',
  discord_token_exchange_failed: 'Verbindung zu Discord fehlgeschlagen. Bitte erneut versuchen.',
  discord_profile_failed: 'Dein Discord-Profil konnte nicht geladen werden. Bitte erneut versuchen.',
  session_store_failed: 'Sitzung konnte nicht angelegt werden. Bitte in ein paar Sekunden erneut versuchen.',
};

function errorMessageFor(code) {
  return ERROR_MESSAGES[code] || 'Unbekannter Fehler bei der Anmeldung. Bitte erneut versuchen.';
}

function showLogin(errorMessage) {
  renderLogin(appEl, { errorMessage });
}

function requireAuth(renderFn) {
  return (...args) => {
    if (!isTokenValid(getToken())) {
      clearToken();
      showLogin();
      return;
    }
    renderFn(appEl, ...args);
  };
}

registerRoute(/^\/$/, requireAuth(renderServerList));
registerRoute(/^\/server\/(\d+)$/, requireAuth(renderServerSettings));

function bootstrap() {
  const { token, error } = consumeAuthHash();

  if (token) setToken(token);

  if (error) {
    showLogin(errorMessageFor(error));
    return;
  }

  if (!isTokenValid(getToken())) {
    clearToken();
    showLogin();
    return;
  }

  initRouter();
}

bootstrap();
