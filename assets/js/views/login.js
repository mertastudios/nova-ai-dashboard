import { buildDiscordLoginUrl } from '../auth.js';
import { escapeHtml } from '../utils.js';

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function ensureTurnstileScript() {
  if (window.turnstile?.render) return;
  if ([...document.scripts].some((script) => script.src.includes('challenges.cloudflare.com/turnstile'))) return;

  const script = document.createElement('script');
  script.src = TURNSTILE_SCRIPT_URL;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

function waitForTurnstile({ onReady, onFail }) {
  ensureTurnstileScript();

  const startedAt = Date.now();
  const timer = window.setInterval(() => {
    if (window.turnstile?.render) {
      window.clearInterval(timer);
      onReady();
      return;
    }

    if (Date.now() - startedAt > 10000) {
      window.clearInterval(timer);
      onFail();
    }
  }, 120);
}

export function renderLogin(container, { errorMessage } = {}) {
  const botName = escapeHtml(window.NOVA_CONFIG?.BOT_NAME || 'Nova AI');
  const siteKey = window.NOVA_CONFIG?.TURNSTILE_SITE_KEY || '';

  let turnstileToken = null;
  let turnstileWidgetId = null;

  container.innerHTML = `
    <div class="login-screen">
      <div class="nova-burst" aria-hidden="true"></div>
      <div class="login-card">
        <p class="eyebrow">Steuerzentrale</p>
        <h1>${botName} Dashboard</h1>
        <p class="lead">Melde dich mit Discord an, um deine Server zu verwalten.</p>
        ${errorMessage ? `<div class="banner banner-error">${escapeHtml(errorMessage)}</div>` : ''}
        <div id="turnstile-status" class="captcha-hint" style="font-size: 0.8rem; color: var(--text-faint); margin-bottom: 8px;">
          Sicherheitsprüfung wird geladen …
        </div>
        <div id="turnstile-widget" class="cf-turnstile turnstile-widget"></div>
        <button id="discord-login-btn" class="btn btn-primary" disabled>Mit Discord anmelden</button>
        <button id="back-home-btn" class="btn btn-ghost" style="width: 100%; margin-top: 12px;">
          Zurück zur Startseite
        </button>
        <p class="fine-print">
          Wir lesen nur deinen Discord-Benutzernamen und deine Server-Mitgliedschaften —
          keine Nachrichten, keine E-Mail-Adresse.
        </p>
      </div>
    </div>
  `;

  const button = container.querySelector('#discord-login-btn');
  const backButton = container.querySelector('#back-home-btn');
  const status = container.querySelector('#turnstile-status');
  const widget = container.querySelector('#turnstile-widget');

  function setCaptchaReady(token) {
    turnstileToken = token;
    button.disabled = false;
    status.textContent = 'Sicherheitsprüfung abgeschlossen.';
  }

  function resetCaptcha(message = 'Sicherheitsprüfung abgelaufen. Bitte kurz neu bestätigen.') {
    turnstileToken = null;
    button.disabled = true;
    status.textContent = message;
  }

  backButton.addEventListener('click', () => {
    window.location.href = '/';
  });

  button.addEventListener('click', () => {
    if (!turnstileToken) return;
    window.location.href = buildDiscordLoginUrl(turnstileToken);
  });

  waitForTurnstile({
    onReady: () => {
      if (!siteKey) {
        resetCaptcha('Turnstile Site Key fehlt in assets/js/config.js.');
        return;
      }

      try {
        if (turnstileWidgetId !== null && window.turnstile?.remove) {
          window.turnstile.remove(turnstileWidgetId);
        }

        turnstileWidgetId = window.turnstile.render(widget, {
          sitekey: siteKey,
          theme: 'dark',
          callback: setCaptchaReady,
          'expired-callback': () => resetCaptcha(),
          'timeout-callback': () => resetCaptcha('Sicherheitsprüfung hat zu lange gedauert. Bitte erneut versuchen.'),
          'error-callback': () => resetCaptcha('Captcha konnte nicht geladen werden. Bitte Adblocker/Tracking-Schutz prüfen oder Seite neu laden.'),
        });

        status.textContent = 'Bitte Sicherheitsprüfung abschließen.';
      } catch (err) {
        resetCaptcha('Captcha wurde nicht korrekt gestartet. Bitte Seite neu laden.');
        // Hilft beim Debuggen, ohne Nutzern sensible Daten zu zeigen.
        console.error('Turnstile render failed:', err);
      }
    },
    onFail: () => {
      resetCaptcha('Captcha konnte nicht geladen werden. Bitte Adblocker/Tracking-Schutz deaktivieren oder Seite neu laden.');
    },
  });
}
