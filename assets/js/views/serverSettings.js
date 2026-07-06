import { api, ApiError } from '../api.js';
import { escapeHtml } from '../utils.js';
import { navigate } from '../router.js';

// Hinweis: Diese Liste muss manuell synchron zu PRESET_KEYS in
// src/services/personalities.js im Bot-Repository gehalten werden.
const PRESETS = [
  { value: 'none', label: 'Keine Personalität (reine KI)' },
  { value: 'custom', label: 'Eigene' },
  { value: 'chaotic_buddy', label: 'Chaotischer Kumpel' },
  { value: 'diva', label: 'Dramatische Diva' },
  { value: 'wise_guru', label: 'Möchtegern-weiser Guru' },
  { value: 'gamer_nerd', label: 'Gamer-Nerd' },
  { value: 'grumpy_wizard', label: 'Grantiger alter Zauberer' },
  { value: 'polite_butler', label: 'Übertrieben höflicher Butler' },
];

const LANGUAGES = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
];

export async function renderServerSettings(container, guildId) {
  const botName = escapeHtml(window.NOVA_CONFIG.BOT_NAME);

  container.innerHTML = `
    <header class="topbar">
      <button id="back-btn" class="btn btn-ghost">← Zurück</button>
      <div class="brand">${botName}</div>
    </header>
    <main class="content">
      <div id="banner-slot"></div>
      <div id="settings-body"><div class="loading">Lade Servereinstellungen…</div></div>
    </main>
  `;

  container.querySelector('#back-btn').addEventListener('click', () => navigate('/'));

  const body = container.querySelector('#settings-body');
  const bannerSlot = container.querySelector('#banner-slot');

  let guild;
  try {
    guild = await api.getGuild(guildId);
  } catch (err) {
    renderLoadError(err, body, bannerSlot);
    return;
  }

  renderForm(body, guildId, guild);
}

function renderLoadError(err, body, bannerSlot) {
  body.innerHTML = '';

  if (err instanceof ApiError && (err.status === 401 || err.code === 'session_expired')) {
    bannerSlot.innerHTML = `<div class="banner banner-error">Sitzung abgelaufen. Du wirst zur Anmeldung weitergeleitet…</div>`;
    setTimeout(() => {
      window.location.hash = '';
      window.location.reload();
    }, 1500);
    return;
  }

  if (err instanceof ApiError && err.status === 403) {
    bannerSlot.innerHTML = `<div class="banner banner-error">${escapeHtml(err.message)}</div>`;
    return;
  }

  if (err instanceof ApiError && err.code === 'bot_not_present') {
    bannerSlot.innerHTML = `<div class="banner banner-error">${escapeHtml(err.message)}</div>`;
    return;
  }

  bannerSlot.innerHTML = `<div class="banner banner-error">${escapeHtml(
    err.message || 'Einstellungen konnten nicht geladen werden. Bitte Seite neu laden.'
  )}</div>`;
}

function renderForm(body, guildId, guild) {
  const botName = escapeHtml(window.NOVA_CONFIG.BOT_NAME);
  const icon = guild.icon
    ? `<img src="${escapeHtml(guild.icon)}" class="server-icon" alt="" />`
    : `<div class="server-icon server-icon-fallback">${escapeHtml((guild.name || '?').slice(0, 1).toUpperCase())}</div>`;

  const currentLanguageLabel = LANGUAGES.find((l) => l.value === guild.language)?.label || guild.language || '—';
  const currentPresetLabel = PRESETS.find((p) => p.value === guild.personalityPreset)?.label || 'nicht eingestellt';

  body.innerHTML = `
    <div class="settings-head">
      ${icon}
      <div>
        <h1>${escapeHtml(guild.name)}</h1>
        <div class="status-strip">
          <span class="pill">Sprache: ${escapeHtml(currentLanguageLabel)}</span>
          <span class="pill">Persönlichkeit: ${escapeHtml(currentPresetLabel)}</span>
          <span class="pill">${guild.isSetupComplete ? 'Eingerichtet' : 'Noch nicht eingerichtet'}</span>
        </div>
      </div>
    </div>

    <form id="settings-form" class="settings-form">
      <section class="field-group">
        <label for="language-select">Sprache</label>
        <select id="language-select">
          ${LANGUAGES.map(
            (l) => `<option value="${l.value}" ${l.value === guild.language ? 'selected' : ''}>${escapeHtml(l.label)}</option>`
          ).join('')}
        </select>
      </section>

      <section class="field-group">
        <label for="channel-select">KI-Kanal</label>
        <select id="channel-select"><option value="">Lade Kanäle…</option></select>
        <p class="field-hint">In diesem Kanal antwortet ${botName} automatisch auf jede Nachricht.</p>
      </section>

      <section class="field-group">
        <label for="personality-select">Persönlichkeit</label>
        <select id="personality-select">
          ${PRESETS.map(
            (p) => `<option value="${p.value}" ${p.value === guild.personalityPreset ? 'selected' : ''}>${escapeHtml(p.label)}</option>`
          ).join('')}
        </select>
        <textarea
          id="personality-custom"
          class="custom-textarea ${guild.personalityPreset === 'custom' ? '' : 'is-hidden'}"
          maxlength="1500"
          placeholder="Beschreibe, wie sich der Bot verhalten soll…"
        >${escapeHtml(guild.personalityCustom || '')}</textarea>
      </section>

      <div id="form-banner"></div>
      <button type="submit" id="save-btn" class="btn btn-primary">Speichern</button>
    </form>

    <section class="api-keys-section">
      <h2>Groq-API-Keys</h2>
      <p class="field-hint">Der erste Key wird standardmäßig genutzt. Läuft er in ein Limit, wechselt der Bot automatisch zum nächsten.</p>
      <div id="api-keys-list"></div>
      <form id="add-key-form" class="add-key-form">
        <input id="new-key-input" type="password" placeholder="Groq API-Key" maxlength="200" required />
        <input id="new-key-label" type="text" placeholder="Bezeichnung (optional)" maxlength="60" />
        <button type="submit" class="btn btn-secondary">Hinzufügen</button>
      </form>
      <div id="keys-banner"></div>
    </section>
  `;

  const personalitySelect = body.querySelector('#personality-select');
  const customTextarea = body.querySelector('#personality-custom');
  personalitySelect.addEventListener('change', () => {
    customTextarea.classList.toggle('is-hidden', personalitySelect.value !== 'custom');
  });

  loadChannels(body, guildId, guild.aiChannelId);

  body.querySelector('#settings-form').addEventListener('submit', (event) => {
    event.preventDefault();
    saveSettings(body, guildId);
  });

  renderApiKeys(body, guildId, guild.apiKeys || []);
  body.querySelector('#add-key-form').addEventListener('submit', (event) => {
    event.preventDefault();
    addApiKey(body, guildId);
  });
}

async function loadChannels(body, guildId, currentChannelId) {
  const select = body.querySelector('#channel-select');
  try {
    const { channels } = await api.getChannels(guildId);
    if (channels.length === 0) {
      select.innerHTML = `<option value="">Keine Textkanäle gefunden</option>`;
      return;
    }
    select.innerHTML =
      `<option value="">— kein Kanal ausgewählt —</option>` +
      channels
        .map(
          (c) =>
            `<option value="${escapeHtml(c.id)}" ${c.id === currentChannelId ? 'selected' : ''}>#${escapeHtml(c.name)}</option>`
        )
        .join('');
  } catch (err) {
    select.innerHTML = `<option value="">Kanäle konnten nicht geladen werden</option>`;
    select.disabled = true;
  }
}

async function saveSettings(body, guildId) {
  const banner = body.querySelector('#form-banner');
  const button = body.querySelector('#save-btn');
  banner.innerHTML = '';

  const language = body.querySelector('#language-select').value;
  const aiChannelId = body.querySelector('#channel-select').value || null;
  const personalityPreset = body.querySelector('#personality-select').value;
  const personalityCustom = body.querySelector('#personality-custom').value;

  if (personalityPreset === 'custom' && !personalityCustom.trim()) {
    banner.innerHTML = `<div class="banner banner-error">Bitte beschreibe die eigene Persönlichkeit, bevor du speicherst.</div>`;
    return;
  }

  button.disabled = true;
  button.textContent = 'Speichert…';

  try {
    await api.patchGuild(guildId, { language, aiChannelId, personalityPreset, personalityCustom });
    banner.innerHTML = `<div class="banner banner-success">Gespeichert.</div>`;
  } catch (err) {
    banner.innerHTML = `<div class="banner banner-error">${escapeHtml(formatError(err))}</div>`;
  } finally {
    button.disabled = false;
    button.textContent = 'Speichern';
  }
}

function formatError(err) {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Sitzung abgelaufen. Bitte Seite neu laden und erneut anmelden.';
    return err.message;
  }
  return 'Unbekannter Fehler. Bitte erneut versuchen.';
}

function renderApiKeys(body, guildId, keys) {
  const list = body.querySelector('#api-keys-list');

  if (!keys || keys.length === 0) {
    list.innerHTML = `<p class="empty-state-inline">Noch keine Keys hinterlegt.</p>`;
    return;
  }

  list.innerHTML = keys
    .map(
      (k, i) => `
      <div class="key-row">
        <span class="key-position">${i === 0 ? 'Standard' : `#${i + 1}`}</span>
        <span class="key-label">${escapeHtml(k.label || 'Ohne Bezeichnung')}</span>
        <button type="button" class="btn btn-danger-ghost remove-key-btn" data-key-id="${k.id}">Entfernen</button>
      </div>`
    )
    .join('');

  list.querySelectorAll('.remove-key-btn').forEach((btn) => {
    btn.addEventListener('click', () => removeApiKey(body, guildId, btn.dataset.keyId));
  });
}

async function addApiKey(body, guildId) {
  const banner = body.querySelector('#keys-banner');
  const keyInput = body.querySelector('#new-key-input');
  const labelInput = body.querySelector('#new-key-label');
  banner.innerHTML = '';

  if (!keyInput.value.trim()) return;

  try {
    await api.addApiKey(guildId, { key: keyInput.value.trim(), label: labelInput.value.trim() });
    keyInput.value = '';
    labelInput.value = '';
    const guild = await api.getGuild(guildId);
    renderApiKeys(body, guildId, guild.apiKeys);
    banner.innerHTML = `<div class="banner banner-success">Key hinzugefügt.</div>`;
  } catch (err) {
    banner.innerHTML = `<div class="banner banner-error">${escapeHtml(formatError(err))}</div>`;
  }
}

async function removeApiKey(body, guildId, keyId) {
  const banner = body.querySelector('#keys-banner');
  banner.innerHTML = '';

  if (!window.confirm('Diesen API-Key wirklich entfernen?')) return;

  try {
    await api.deleteApiKey(guildId, keyId);
    const guild = await api.getGuild(guildId);
    renderApiKeys(body, guildId, guild.apiKeys);
    banner.innerHTML = `<div class="banner banner-success">Key entfernt.</div>`;
  } catch (err) {
    banner.innerHTML = `<div class="banner banner-error">${escapeHtml(formatError(err))}</div>`;
  }
}
