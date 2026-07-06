import { api, ApiError } from '../api.js';
import { escapeHtml }    from '../utils.js';
import { navigate }      from '../router.js';
import { clearToken }    from '../auth.js';

/* Keep in sync with src/services/personalities.js in the bot repo */
const PRESETS = [
  { value: 'none',           label: 'No personality (pure AI)' },
  { value: 'custom',         label: 'Custom' },
  { value: 'chaotic_buddy',  label: 'Chaotic Buddy' },
  { value: 'diva',           label: 'Dramatic Diva' },
  { value: 'wise_guru',      label: 'Wannabe Wise Guru' },
  { value: 'gamer_nerd',     label: 'Gamer Nerd' },
  { value: 'grumpy_wizard',  label: 'Grumpy Old Wizard' },
  { value: 'polite_butler',  label: 'Overly Polite Butler' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
];

export async function renderServerSettings(container, guildId) {
  const botName = escapeHtml(window.NOVA_CONFIG.BOT_NAME);

  container.innerHTML = `
    <header class="topbar">
      <div class="brand">
        <div class="brand-dot"></div>
        ${botName}
      </div>
      <button id="back-btn" class="btn btn-ghost">← Back</button>
    </header>
    <div class="page">
      <div id="banner-slot"></div>
      <div id="settings-body">
        <div class="state-loading">
          <div class="spinner"></div>
          <span>Loading server settings…</span>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#back-btn').addEventListener('click', () => navigate('/'));

  const body       = container.querySelector('#settings-body');
  const bannerSlot = container.querySelector('#banner-slot');

  let guild;
  try {
    guild = await api.getGuild(guildId);
  } catch (err) {
    renderLoadError(err, body, bannerSlot);
    return;
  }

  renderForm(body, guildId, guild, botName);
}

/* ── Error on load ──────────────────────────── */
function renderLoadError(err, body, bannerSlot) {
  body.innerHTML = '';

  if (err instanceof ApiError && (err.status === 401 || err.code === 'session_expired')) {
    bannerSlot.innerHTML = alertHtml('error', 'Session expired. Redirecting to login…');
    setTimeout(() => { clearToken(); window.location.hash = ''; window.location.reload(); }, 1800);
    return;
  }

  if (err instanceof ApiError && (err.status === 403 || err.code === 'bot_not_present')) {
    bannerSlot.innerHTML = alertHtml('error', escapeHtml(err.message));
    return;
  }

  bannerSlot.innerHTML = alertHtml(
    'error',
    escapeHtml(err.message || 'Settings could not be loaded. Please refresh the page.')
  );
}

/* ── Main form ──────────────────────────────── */
function renderForm(body, guildId, guild, botName) {
  const icon = guild.icon
    ? `<img src="${escapeHtml(guild.icon)}" class="server-icon" alt="" />`
    : `<div class="server-icon server-icon-fallback">${escapeHtml((guild.name || '?')[0].toUpperCase())}</div>`;

  const langLabel    = LANGUAGES.find((l) => l.value === guild.language)?.label || guild.language || '—';
  const presetLabel  = PRESETS.find((p) => p.value === guild.personalityPreset)?.label || 'Not configured';
  const setupBadge   = guild.isSetupComplete
    ? `<span class="pill" style="color:var(--success);border-color:rgba(52,211,153,.25)">✓ Configured</span>`
    : `<span class="pill" style="color:var(--warning);border-color:rgba(251,191,36,.25)">⚠ Not fully configured</span>`;

  body.innerHTML = `
    <!-- Hero -->
    <div class="settings-hero">
      <div class="settings-hero-icon">${icon}</div>
      <div class="settings-hero-info">
        <h1>${escapeHtml(guild.name)}</h1>
        <div class="settings-pills">
          <span class="pill">Language: ${escapeHtml(langLabel)}</span>
          <span class="pill">Personality: ${escapeHtml(presetLabel)}</span>
          ${setupBadge}
        </div>
      </div>
    </div>

    <!-- Main settings grid -->
    <form id="settings-form">
      <div class="settings-layout">

        <!-- Language -->
        <div class="settings-card">
          <div class="settings-card-header">
            <div class="settings-card-icon blue">🌐</div>
            <div>
              <h2>Language</h2>
              <p>The language ${botName} responds in</p>
            </div>
          </div>
          <div class="field-group">
            <label for="language-select">Response language</label>
            <select id="language-select">
              ${LANGUAGES.map((l) =>
                `<option value="${l.value}" ${l.value === guild.language ? 'selected' : ''}>${escapeHtml(l.label)}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <!-- Channel -->
        <div class="settings-card">
          <div class="settings-card-header">
            <div class="settings-card-icon purple">#</div>
            <div>
              <h2>AI Channel</h2>
              <p>${botName} replies to every message here</p>
            </div>
          </div>
          <div class="field-group">
            <label for="channel-select">Text channel</label>
            <select id="channel-select">
              <option value="">Loading channels…</option>
            </select>
            <p class="field-hint">
              In this channel, ${botName} automatically responds to every message without needing a command.
            </p>
          </div>
        </div>

        <!-- Personality — full width -->
        <div class="settings-card full">
          <div class="settings-card-header">
            <div class="settings-card-icon purple">🎭</div>
            <div>
              <h2>Personality</h2>
              <p>Choose how ${botName} behaves and speaks</p>
            </div>
          </div>
          <div class="field-group">
            <label for="personality-select">Preset</label>
            <select id="personality-select">
              ${PRESETS.map((p) =>
                `<option value="${p.value}" ${p.value === guild.personalityPreset ? 'selected' : ''}>${escapeHtml(p.label)}</option>`
              ).join('')}
            </select>
          </div>
          <textarea
            id="personality-custom"
            class="custom-textarea ${guild.personalityPreset === 'custom' ? '' : 'is-hidden'}"
            maxlength="1500"
            placeholder="Describe how the bot should behave, speak, and interact…"
          >${escapeHtml(guild.personalityCustom || '')}</textarea>
          <p class="field-hint" id="custom-hint" style="${guild.personalityPreset === 'custom' ? '' : 'display:none'}">
            Max 1500 characters. Be specific — describe tone, vocabulary, and any quirks.
          </p>
        </div>

      </div><!-- /settings-layout -->

      <div id="form-banner" style="margin-top:16px"></div>

      <div class="save-bar" style="margin-top:20px">
        <button type="button" id="reset-btn" class="btn btn-ghost">Reset</button>
        <button type="submit" id="save-btn" class="btn btn-primary">Save changes</button>
      </div>
    </form>

    <!-- API Keys -->
    <div class="settings-card full" style="margin-top:28px" id="keys-card">
      <div class="settings-card-header">
        <div class="settings-card-icon green">🔑</div>
        <div>
          <h2>Groq API Keys</h2>
          <p>The first key is used by default. When it hits a limit, ${botName} auto-switches to the next.</p>
        </div>
      </div>
      <div id="api-keys-list" class="key-list"></div>
      <form id="add-key-form" class="add-key-form" style="margin-top:8px">
        <input id="new-key-input" type="password" placeholder="Groq API key" maxlength="200" required style="flex:2" />
        <input id="new-key-label" type="text"     placeholder="Label (optional)"          maxlength="60"  style="flex:1" />
        <button type="submit" class="btn btn-secondary">Add key</button>
      </form>
      <div id="keys-banner" style="margin-top:8px"></div>
    </div>
  `;

  /* ── Personality toggle ──────────────────── */
  const personalitySelect = body.querySelector('#personality-select');
  const customTextarea    = body.querySelector('#personality-custom');
  const customHint        = body.querySelector('#custom-hint');

  personalitySelect.addEventListener('change', () => {
    const isCustom = personalitySelect.value === 'custom';
    customTextarea.classList.toggle('is-hidden', !isCustom);
    customHint.style.display = isCustom ? '' : 'none';
  });

  /* ── Load channels ───────────────────────── */
  loadChannels(body, guildId, guild.aiChannelId);

  /* ── Reset button ────────────────────────── */
  const origValues = {
    language:          guild.language,
    aiChannelId:       guild.aiChannelId,
    personalityPreset: guild.personalityPreset,
    personalityCustom: guild.personalityCustom || '',
  };

  body.querySelector('#reset-btn').addEventListener('click', () => {
    body.querySelector('#language-select').value    = origValues.language          || '';
    body.querySelector('#personality-select').value = origValues.personalityPreset || 'none';
    customTextarea.value                            = origValues.personalityCustom;
    const isCustom = origValues.personalityPreset === 'custom';
    customTextarea.classList.toggle('is-hidden', !isCustom);
    customHint.style.display = isCustom ? '' : 'none';
    body.querySelector('#form-banner').innerHTML = alertHtml('info', 'Form reset to last saved values.');
    // channel select might not be loaded yet — handled gracefully
    const chSel = body.querySelector('#channel-select');
    if (chSel && origValues.aiChannelId) {
      chSel.value = origValues.aiChannelId;
    }
  });

  /* ── Submit ──────────────────────────────── */
  body.querySelector('#settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveSettings(body, guildId);
  });

  /* ── API keys ────────────────────────────── */
  renderApiKeys(body, guildId, guild.apiKeys || []);
  body.querySelector('#add-key-form').addEventListener('submit', (e) => {
    e.preventDefault();
    addApiKey(body, guildId);
  });
}

/* ── Channel loader ─────────────────────────── */
async function loadChannels(body, guildId, currentChannelId) {
  const select = body.querySelector('#channel-select');
  try {
    const { channels } = await api.getChannels(guildId);
    if (!channels.length) {
      select.innerHTML = `<option value="">No text channels found</option>`;
      return;
    }
    select.innerHTML =
      `<option value="">— no channel selected —</option>` +
      channels.map((c) =>
        `<option value="${escapeHtml(c.id)}" ${c.id === currentChannelId ? 'selected' : ''}>#${escapeHtml(c.name)}</option>`
      ).join('');
  } catch {
    select.innerHTML = `<option value="">Could not load channels</option>`;
    select.disabled = true;
  }
}

/* ── Save ───────────────────────────────────── */
async function saveSettings(body, guildId) {
  const banner    = body.querySelector('#form-banner');
  const saveBtn   = body.querySelector('#save-btn');
  banner.innerHTML = '';

  const language          = body.querySelector('#language-select').value;
  const aiChannelId       = body.querySelector('#channel-select').value  || null;
  const personalityPreset = body.querySelector('#personality-select').value;
  const personalityCustom = body.querySelector('#personality-custom').value;

  if (personalityPreset === 'custom' && !personalityCustom.trim()) {
    banner.innerHTML = alertHtml('error', 'Please describe the custom personality before saving.');
    return;
  }

  saveBtn.disabled    = true;
  saveBtn.textContent = 'Saving…';

  try {
    await api.patchGuild(guildId, { language, aiChannelId, personalityPreset, personalityCustom });
    banner.innerHTML = alertHtml('success', 'Settings saved successfully.');
  } catch (err) {
    banner.innerHTML = alertHtml('error', escapeHtml(formatError(err)));
  } finally {
    saveBtn.disabled    = false;
    saveBtn.textContent = 'Save changes';
  }
}

/* ── API key helpers ────────────────────────── */
function renderApiKeys(body, guildId, keys) {
  const list = body.querySelector('#api-keys-list');

  if (!keys?.length) {
    list.innerHTML = `<p style="color:var(--text-3);font-size:.875rem">No API keys added yet.</p>`;
    return;
  }

  list.innerHTML = keys.map((k, i) => `
    <div class="key-row" data-key-id="${escapeHtml(k.id)}">
      ${i === 0
        ? `<span class="key-badge-primary">Primary</span>`
        : `<span class="key-badge-num">#${i + 1}</span>`}
      <span class="key-label">${escapeHtml(k.label || 'Unlabeled')}</span>
      <button type="button" class="btn btn-danger remove-key-btn" style="padding:6px 14px;font-size:.8rem" data-key-id="${escapeHtml(k.id)}">
        Remove
      </button>
    </div>
  `).join('');

  list.querySelectorAll('.remove-key-btn').forEach((btn) => {
    btn.addEventListener('click', () => removeApiKey(body, guildId, btn.dataset.keyId));
  });
}

async function addApiKey(body, guildId) {
  const banner     = body.querySelector('#keys-banner');
  const keyInput   = body.querySelector('#new-key-input');
  const labelInput = body.querySelector('#new-key-label');
  banner.innerHTML = '';

  if (!keyInput.value.trim()) return;

  const submitBtn = body.querySelector('#add-key-form button[type=submit]');
  submitBtn.disabled    = true;
  submitBtn.textContent = 'Adding…';

  try {
    await api.addApiKey(guildId, { key: keyInput.value.trim(), label: labelInput.value.trim() });
    keyInput.value   = '';
    labelInput.value = '';
    const guild = await api.getGuild(guildId);
    renderApiKeys(body, guildId, guild.apiKeys);
    banner.innerHTML = alertHtml('success', 'API key added successfully.');
  } catch (err) {
    banner.innerHTML = alertHtml('error', escapeHtml(formatError(err)));
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Add key';
  }
}

async function removeApiKey(body, guildId, keyId) {
  const banner = body.querySelector('#keys-banner');
  banner.innerHTML = '';

  if (!window.confirm('Remove this API key? This cannot be undone.')) return;

  try {
    await api.deleteApiKey(guildId, keyId);
    const guild = await api.getGuild(guildId);
    renderApiKeys(body, guildId, guild.apiKeys);
    banner.innerHTML = alertHtml('success', 'API key removed.');
  } catch (err) {
    banner.innerHTML = alertHtml('error', escapeHtml(formatError(err)));
  }
}

/* ── Utilities ──────────────────────────────── */
function alertHtml(type, content) {
  return `<div class="banner banner-${type}">${content}</div>`;
}

function formatError(err) {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Session expired. Please refresh and sign in again.';
    return err.message;
  }
  return 'An unknown error occurred. Please try again.';
}
