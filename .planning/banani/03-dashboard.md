# 03 — Tableau de bord — Banani → Next.js 16 / Tailwind v4

## Source

- Banani screen ID: `g-L-NuyDq8NB/screens/03-Dashboard.jsx`
- `screenSize`: `desktop`
- Fetched: 2026-11-07
- Route: [frontend/src/app/dashboard/page.tsx](../../frontend/src/app/dashboard/page.tsx)

## Gate d'auth

Client-side via `useAuth()` : redirect vers `/auth/login` si `!loading && !user`. Un middleware server-side est recommandé en vague suivante (plus sûr, SSR-friendly).

## Structure map

- **AppLayout** — SideBar (hidden md) + top bar avec notifications bell + UserAvatar + email du user.
- **AlertBanner upgrade** — "Passez en VIP pour débloquer le suivi budget et la coordination prestataires."
- **Welcome** — h2 "Bonjour, {firstName} 👋" + sous-titre dynamique + CTA "Nouvelle cérémonie" (vers `/ceremonies/new`, page future).
- **Stats** — grid 4 col sur lg, 2 col sur mobile. 4 `StatCard` : Cérémonies actives / Confirmés / RSVP en attente / Crédits IA.
- **Main content** — grid 3 col sur lg (2 col pour "Mes cérémonies" + 1 col pour "RSVP + Activité"). Stacké en mobile.
- **Mes cérémonies** — 2 `CeremonyCard` (Mariage Fatoumata & Baptême Ousmane).
- **Statut RSVP** — `RSVPStatusBar` + accompagnants (+34).
- **Activité récente** — 4 entrées mockées.

## Component breakdown

- **REUSE** `AppLayout` (nouvelle), `SideBar` (nouvelle), `AlertBanner`, `StatCard`, `CeremonyCard`, `RSVPStatusBar`, `Icon`.

## Responsive plan

- **375px** — AppLayout avec sidebar cachée (`hidden md:flex`). Pas encore de bottom nav mobile — à ajouter en vague 2. Welcome row stacke verticalement, CTA pleine largeur. Stats en grid 2 col. Ceremonies + RSVP stackés.
- **md 768px** — SideBar 240px apparaît. Stats en grid 2 col toujours.
- **lg 1024px** — Stats en 4 col. Main content en grid 3 col.

## Interactions / état

- Mock data uniquement. Pas de fetch vers `/api/ceremonies` (route non existante encore).
- Déconnexion : pas de bouton visible dans le dashboard — accessible via `AuthContext.logout()` à partir de `/settings` (future).

## Copy / i18n

Chaînes françaises inline. `firstName` dérivé de l'email avant `@` et `.`.

## Open questions for user

- **Dashboard mobile sans sidebar** : actuellement la sidebar disparaît sous md. Faut-il un **bottom tab bar** mobile (comme une PWA) ou un drawer hamburger ? Je recommande bottom tab bar (plus natural pour un produit mobile-first).
- **Routes des liens sidebar** (`/ceremonies`, `/guests`, `/seating`, etc.) : aucune n'existe. Elles 404 pour l'instant. On les crée en vague 2 ou on les masque tant qu'absentes ?
- **"Nouvelle cérémonie"** pointe vers `/ceremonies/new` — c'est l'écran 04 dans Banani. On le prend dans la prochaine vague ?
- **Vraies données** : le dashboard doit lire les cérémonies de l'utilisateur. `GET /api/ceremonies` n'existe pas encore. Priorité pour la vague suivante ?
