# 🖥️ Nova AI Dashboard (Frontend)

Statische Web-App (reines HTML/CSS/JS, **kein Build-Schritt nötig**) für GitHub Pages.
Nutzer melden sich mit Discord an und verwalten dort Sprache, Kanal, Persönlichkeit und
Groq-API-Keys für jeden Server, auf dem sie Administrator sind.

Dieses Repo ist **nur** das Dashboard. Es braucht zwingend den zugehörigen
**Cloudflare Worker** (`nova-ai-dashboard-worker`) als Backend — richte den zuerst ein
(siehe dessen README), du brauchst von dort die Worker-URL für Schritt 2 unten.

---

## 1. Repository auf GitHub anlegen

Dieses Verzeichnis in ein neues GitHub-Repository pushen, z. B. `nova-ai-dashboard`:

```bash
cd nova-ai-dashboard
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/DEIN-USERNAME/nova-ai-dashboard.git
git push -u origin main
```

## 2. Konfiguration ausfüllen

`assets/js/config.js` öffnen und ausfüllen:

```js
window.NOVA_CONFIG = {
  WORKER_URL: 'https://nova-ai-dashboard-worker.dein-name.workers.dev',
  DISCORD_CLIENT_ID: 'deine-discord-client-id',
  DISCORD_REDIRECT_URI: 'https://nova-ai-dashboard-worker.dein-name.workers.dev/auth/callback',
  TURNSTILE_SITE_KEY: 'dein-turnstile-site-key',
  BOT_NAME: 'Nova AI',
};
```

Alle vier Werte kommen aus dem Setup des Cloudflare Workers (siehe dessen README,
Schritte 5–9). Diese Datei enthält **keine Geheimnisse** — Client ID, Redirect-URI und
Turnstile Site Key sind ohnehin öffentlich sichtbar, sobald jemand den Login-Button klickt.

Änderungen committen und pushen:

```bash
git add assets/js/config.js
git commit -m "Config ausfüllen"
git push
```

## 3. GitHub Pages aktivieren

Repository auf GitHub → **Settings → Pages** → unter **Build and deployment**:
- Source: **Deploy from a branch**
- Branch: **main**, Ordner: **/ (root)**
- Speichern.

Nach ein bis zwei Minuten ist das Dashboard erreichbar unter:
`https://DEIN-USERNAME.github.io/nova-ai-dashboard/`

## 4. Cloudflare Worker mit der echten URL abgleichen

Jetzt, wo du die echte GitHub-Pages-URL kennst: zurück zum Worker-Projekt,
`wrangler.toml` → `ALLOWED_ORIGIN` und `FRONTEND_URL` auf genau diese URL setzen
(inkl. abschließendem `/` bei `FRONTEND_URL`), dann dort `wrangler deploy` erneut
ausführen.

## 5. Testen

Seite öffnen → Turnstile-Captcha lösen → **Mit Discord anmelden** wird klickbar →
klicken → bei Discord bestätigen → man landet zurück im Dashboard mit der Serverliste.

---

## 🎨 Warum kein Build-Tool?

Alle JS-Dateien nutzen native ES-Modules (`<script type="module">`), die jeder moderne
Browser direkt versteht — kein Webpack/Vite/React nötig. Das macht Hosting auf GitHub
Pages so einfach wie "Dateien pushen, Pages aktivieren".

## 📁 Struktur

```
nova-ai-dashboard/
├── index.html                   # einzige HTML-Seite (SPA mit Hash-Routing: #/, #/server/ID)
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── config.js            # oeffentliche Konfiguration (siehe Schritt 2)
│       ├── auth.js               # Discord-Login, Token-Speicherung
│       ├── api.js                # Fetch-Wrapper fuer den Cloudflare Worker
│       ├── router.js             # minimaler Hash-Router
│       ├── utils.js
│       ├── main.js               # Bootstrap
│       └── views/
│           ├── login.js
│           ├── serverList.js
│           └── serverSettings.js
```

## 🩺 Fehlerbehandlung

Jede Ansicht fängt Fehler vom Worker einzeln ab und zeigt eine passende Meldung an
(abgelaufene Sitzung → automatische Weiterleitung zum Login; Rate-Limit/Cooldown → Meldung
mit Wartezeit; Datenbank/Discord nicht erreichbar → verständliche Fehlermeldung statt
stillem Fehlschlag).

## 🔧 Persönlichkeits-Presets synchron halten

Die Liste in `assets/js/views/serverSettings.js` (`PRESETS`) muss manuell zur Liste in
`src/services/personalities.js` des **Bot-Repositories** passen. Änderst du dort etwas,
hier nachziehen.

## 📜 Lizenz

MIT
