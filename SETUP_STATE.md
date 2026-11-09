# VipInvitoz — État du setup (dernière session : 2026-11-03)

> Ce fichier est le résumé lisible de ce qui a été fait pendant la session `/setup-kit`.
> La version structurée (JSON + Markdown) est dans `.handoff/handoff.md` et `.handoff/handoff.json`.

## ✅ Ce qui est fait

### Outils système (installés une bonne fois pour toutes)
- **Node v24.20** (déjà présent)
- **Git 2.54** (déjà présent)
- **pnpm 9.15** (installé via Corepack dans PowerShell admin)
- **GitHub CLI 2.103.3** (installé via winget)
- **gh auth login** complété avec le compte GitHub

### Plugins Claude Code (chargés dans TOUTES les sessions Claude de cette machine)
- `superpowers` (workflow TDD, planification, parallel agents)
- `context-handoff` (sauvegarde/reprise de session — c'est ce qui a créé `.handoff/`)
- `claude-context-optimizer` (optimisation du contexte)
- `ui-ux-pro-max` (bundlé dans ce starter — design intelligence)
- `banani-design-implementation` (bundlé dans ce starter — reproduction pixel-perfect depuis Banani)

### Base de données Neon
- **Projet Neon** : `VipInvitoz` (id `holy-brook-62735290`)
- **Région** : AWS us-east-2 (Ohio)
- **Plan** : Free
- **5 migrations appliquées** : `0_init`, `1_oauth_accounts`, `2_organizations`, `3_admin`, `4_phase3_admin_orders`
- Les tables sont déjà créées — tu peux voir le schéma avec `pnpm db:studio` (ouvre Prisma Studio sur `localhost:5555`)

### Variables d'environnement (fichiers gitignored — jamais poussés sur GitHub)
Fichier : `frontend/.env.local` **et** `frontend/.env` (dupliqué pour Prisma CLI)

| Variable | État | Rôle |
|---|---|---|
| `DATABASE_URL` | ✅ Rempli (Neon pooled) | Connexion app → Postgres |
| `DIRECT_URL` | ✅ Rempli (Neon direct) | Connexion Prisma migrations |
| `JWT_SECRET` | ✅ Généré (48B base64) | Signer les tokens auth |
| `CRON_SECRET` | ✅ Généré (32B base64) | Auth des routes /api/cron/* |
| `ENCRYPTION_KEY` | ✅ Généré (32B base64) | Chiffrer les blobs sensibles (AES-256-GCM) |

### Dépendances
- `pnpm install` terminé — 624 paquets installés dans `frontend/node_modules/`
- Prisma Client généré automatiquement par le `postinstall` hook

---

## 🚧 Ce qui reste à faire (à la prochaine session)

### Phase 6 — Providers optionnels — TERMINÉE ✅

| # | Provider | État | Notes |
|---|---|---|---|
| 1 | **Upstash Redis** (rate-limit) | ✅ Configuré | `faithful-unicorn-159115.upstash.io` |
| 2 | **Resend** (emails) | ✅ Configuré | `EMAIL_FROM=onboarding@resend.dev` (test) |
| 3 | **Cloudinary** (upload images) | ✅ Configuré | Cloud name `vipinvitoz` |
| 4 | **Sentry** (monitoring erreurs) | ✅ Configuré | DSN serveur + client |
| 5 | **Google OAuth** (Sign-in Google) | ✅ Configuré | Redirect dev : `http://localhost:3000/api/auth/oauth/google/callback` |
| 6 | **Bictorys** (paiements) | ⏭️ **TODO — validation 24-48h** | Marqué visible dans `.env` (scénario B placeholder) |
| 7 | **Banani MCP** (design import) | ✅ Configuré | `.mcp.json` gitignored (token Bearer) |

### Phase 7 — Smoke tests finaux — TERMINÉE ✅
- `pnpm format` ✅
- `pnpm lint` ✅
- `pnpm typecheck` ✅ (après `pnpm prisma generate` pour régénérer les types)
- `pnpm test` → **570/570 verts** ✅ (après bump `testTimeout: 15000` dans `frontend/vitest.config.ts` pour bcrypt sur Windows)
- `pnpm dev` ✅ démarre en 16s sur http://localhost:3000

## 🔜 Prochaines étapes (reprise de la prochaine session)

1. **Bictorys** : récupérer les 4 clés après validation du compte (API_KEY + PRIVATE_KEY + WEBHOOK_SECRET + MERCHANT_SECRET_CODE) et les remplir dans `frontend/.env.local` + `frontend/.env`
2. **Construire la UI** : écrire les pages `/signup`, `/login`, `/dashboard` (s'inspirer de `examples/frontend-pages/*.tsx`)
3. **Tester le flow auth** complet via `pnpm smoke:auth` quand une UI minimale existe
4. **Deploy Vercel** : push sur GitHub puis import sur vercel.com (copier toutes les env vars sauf DIRECT_URL)

## 📸 Checklist réutilisable (générée cette session)

Pour tous tes futurs SaaS, consulter :
- `~/.claude/SAAS_SETUP_CHECKLIST.md` (markdown)
- `~/.claude/saas-setup-checklist.html` (HTML stylé)
- `~/.claude/saas-setup-checklist.png` (screenshot 1240×2400)

Références aussi dans `~/.claude/CLAUDE.md` — Claude les cite dans chaque nouvelle session.

---

## 🔄 Comment reprendre la session

À l'ouverture de Claude Code dans ce dossier, tape :
```
/handoff-resume
```
Claude va lire `.handoff/handoff.md` et reprendra pile où on s'est arrêté (début Phase 6, Upstash Redis).

Alternative : tape juste **« continue le setup-kit »** et je lirai ce fichier.

---

## 🌍 Ce qui est déjà global sur ta machine (dispo dans TOUS tes projets Claude)

Pas besoin de refaire ces étapes dans un futur projet :

- **Outils CLI** : Node, pnpm, git, gh, Corepack — tous dans le PATH système
- **Plugins Claude Code** : superpowers, context-handoff, claude-context-optimizer sont installés dans `~/.claude/plugins/` → chargés automatiquement dans chaque session Claude, quel que soit le projet
- **Règles de sécurité** : `~/.claude/CLAUDE.md` + `~/.claude/SECURITE.md` → appliquées dans chaque session

## 📁 Ce qui est spécifique à VipInvitoz (NE PAS copier dans un autre projet)

- `frontend/.env.local` et `frontend/.env` : contiennent les secrets de **cette** base Neon et **ces** JWT. Chaque projet doit avoir ses propres secrets.
- `.handoff/` : contient l'historique de **cette** session.
- Le code du starter izikit lui-même.

## 💡 Pour un futur projet avec cette même stack

1. Clone un nouveau starter dans un dossier séparé
2. Lance `/setup-kit` dans Claude Code
3. Les outils (pnpm, gh) et plugins (superpowers etc.) seront déjà prêts
4. Tu auras juste à créer un **nouveau** projet Neon et de **nouveaux** secrets

---

## 📋 Références internes

- `.handoff/handoff.md` — snapshot machine-lisible
- `CLAUDE.md` (dans ce dossier) — instructions permanentes du starter izikit
- `.claude/skills/setup-kit/SKILL.md` — le workflow qui a été exécuté
- `WORKFLOW.md` — guide « vibe coding »
