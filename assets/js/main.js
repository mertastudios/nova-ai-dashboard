import { initRouter, registerRoute }           from './router.js';
import { consumeAuthHash, getToken, isTokenValid, setToken, clearToken } from './auth.js';
import { renderLogin }          from './views/login.js';
import { renderServerList }     from './views/serverList.js';
import { renderServerSettings } from './views/serverSettings.js';

const appEl = document.getElementById('app');

const AUTH_ERRORS = {
  discord_denied:               'Login was cancelled.',
  missing_code:                 'Sign-in failed. Please try again.',
  turnstile_missing:            'Security check missing. Please reload the page and try again.',
  turnstile_failed:             'Security check failed. Please try again.',
  rate_limited:                 'Too many sign-in attempts. Please wait a few minutes and try again.',
  discord_token_exchange_failed:'Could not connect to Discord. Please try again.',
  discord_profile_failed:       'Your Discord profile could not be loaded. Please try again.',
  session_store_failed:         'Session could not be created. Please try again in a moment.',
};

const errorFor = (code) =>
  AUTH_ERRORS[code] || 'An unknown sign-in error occurred. Please try again.';

function showLogin(msg) { renderLogin(appEl, { errorMessage: msg }); }

function requireAuth(renderFn) {
  return (...args) => {
    if (!isTokenValid(getToken())) { clearToken(); showLogin(); return; }
    renderFn(appEl, ...args);
  };
}

registerRoute(/^\/$/, requireAuth(renderServerList));
registerRoute(/^\/server\/(\d+)$/, requireAuth(renderServerSettings));

function bootstrap() {
  const { token, error } = consumeAuthHash();
  if (token) setToken(token);
  if (error) { showLogin(errorFor(error)); return; }
  if (!isTokenValid(getToken())) { clearToken(); showLogin(); return; }
  initRouter();
}

bootstrap();
