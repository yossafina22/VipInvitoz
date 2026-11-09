# Banani implementation status

Last updated: 2026-11-07

## Source

- **Project**: VipInvitoz Frontend (`g-L-NuyDq8NB`)
- **Design system**: terracotta/or/crème (African wax print), DM Sans + PT Serif
- **Tokens**: ported to Tailwind v4 `@theme` in [frontend/src/app/globals.css](../../frontend/src/app/globals.css)
- **Gotcha corrigée** : Tailwind v4 + Next.js 16 Turbopack ne scannait AUCUN fichier sans `@source` explicite — ajouté `@source "../**/*.{ts,tsx,js,jsx,mdx}"` dans globals.css. Sans ça, zéro utility class n'était générée.

## Done — MVP (4 screens + verify-email helper)

- [x] **01 Landing Page** — [frontend/src/app/page.tsx](../../frontend/src/app/page.tsx) — plan: [01-landing-page.md](01-landing-page.md)
- [x] **02 Signup** — [frontend/src/app/auth/signup/page.tsx](../../frontend/src/app/auth/signup/page.tsx) — plan: [02-auth.md](02-auth.md)
- [x] **02 Login** — [frontend/src/app/auth/login/page.tsx](../../frontend/src/app/auth/login/page.tsx) — plan: [02-auth.md](02-auth.md)
- [x] **02 Verify email** (added, needed by signup flow) — [frontend/src/app/auth/verify-email/page.tsx](../../frontend/src/app/auth/verify-email/page.tsx) — plan: [02-auth.md](02-auth.md)
- [x] **03 Dashboard** — [frontend/src/app/dashboard/page.tsx](../../frontend/src/app/dashboard/page.tsx) — plan: [03-dashboard.md](03-dashboard.md)
- [x] **15 Guest Invitation** — [frontend/src/app/i/[slug]/page.tsx](../../frontend/src/app/i/[slug]/page.tsx) — plan: [15-guest-invitation.md](15-guest-invitation.md)

## Shared components built

Under [frontend/src/components/](../../frontend/src/components/):

- Primitives : `Icon`, `Image`, `UserAvatar`, `WaxPattern`
- UI : `FormField`, `OTPInput`, `AlertBanner`, `PricingCard`, `StatCard`, `CeremonyCard`, `RSVPStatusBar`
- Layout : `NavBar`, `Footer`, `SideBar`, `AppLayout`, `AuthShell`

## Pending (seen in Banani, not yet fetched/planned)

Organisateur (connecté) :
- `04` — Créer une cérémonie & générer l'invitation
- `05` — Éditeur d'invitation & modifications IA
- `06` — Gestion des invités & RSVP
- `07` — Plan de table 💎 Premium
- `08` — Projection live photos 💎 Premium
- `09` — Livre d'or digital 💎 Premium
- `10` — Suivi budget 👑 VIP
- `11` — Coordination prestataires 👑 VIP
- `12` — Orientation invités 👑 VIP
- `13` — Abonnement & gestion du plan
- `14` — Paramètres utilisateur
- `19` — Co-organisateurs & accès délégués

Invité (public, mobile) :
- `16` — Contribution live photos & Livre d'or
- `17` — Écran de projection live (affichage cérémonie)
- `18` — Orientation invité avec navigation

Composants partagés non encore portés (seront nécessaires pour les prochaines vagues) :
`InvitationPreview`, `StepIndicator`, `TableSeat`, `BudgetRow`, `VendorCard`, `AIChat`, `PhotoModerationCard`, `GuestRow`, `GuestBookMessage`, `PageHeader`, `PaymentMethodCard`, `QRCodePlaceholder` (actuellement SVG inline dans l'écran 15).

## Open design questions

1. **Signup — champs collectés vs backend** : la maquette Banani demande Prénom/Nom + Email + Téléphone + Mot de passe + OTP 6 chiffres SMS. Le backend v1 n'accepte que `{ email, password }` et envoie un code Crockford 8 caractères par email. Décisions prises pour le MVP :
   - Nom gardé dans l'UI (fidélité visuelle), silencieusement ignoré par Zod `.strip()` ; à wire plus tard quand `User.name` existera.
   - Téléphone **omis** du formulaire MVP (pas de surface backend).
   - OTP 6 chiffres remplacé par input texte 8 caractères majuscules (Crockford). `OTPInput` reste disponible pour futur flux SMS.
   - Sélecteur de langue FR/EN/DE **omis** du MVP (pas de i18n côté backend).
2. **Dashboard** : toutes les cartes utilisent des données mockées (2 cérémonies Fatoumata & Ousmane). À remplacer par `GET /api/ceremonies` dès que la route existe.
3. **Guest Invitation `/i/[slug]`** : page entièrement mockée. RSVP confirm/decline garde l'état en React local uniquement — pas de `POST /api/invitations/[slug]/rsvp` wiré. À faire quand le modèle Prisma `Invitation` sera ajouté.
4. **Tiers Premium/VIP** : aucune gate active dans le MVP. `SideBar` affiche un badge PRO/VIP sur les liens verrouillés mais la navigation n'est pas bloquée.
5. **OAuth Google** : le bouton "Sign in with Google" n'est pas dans la maquette Banani auth. Backend wiré (`/api/auth/oauth/google/start`), mais surfaces UI à décider — recommandation : l'ajouter en bouton ghost au-dessus du formulaire. Pas fait dans le MVP.

## Verification done

- [x] `pnpm --filter frontend typecheck` — OK
- [x] `pnpm --filter frontend lint` — OK
- [x] `pnpm --filter frontend test` — 570/570 passed
- [x] `pnpm --filter frontend build` — OK, toutes les routes MVP compilées (`○ /`, `○ /auth/signup`, `○ /auth/login`, `○ /auth/verify-email`, `○ /dashboard`, `ƒ /i/[slug]`)
- [x] Dev server curl check — `/`, `/auth/signup`, `/auth/login`, `/auth/verify-email`, `/dashboard`, `/i/test` tous HTTP 200
- [x] Screenshots `/` à 375/768/1280 (sauvés dans scratchpad)
