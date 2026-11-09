# 02 — Inscription / Connexion — Banani → Next.js 16 / Tailwind v4

## Source

- Banani screen ID: `g-L-NuyDq8NB/screens/02-AuthPage.jsx`
- `screenSize`: `desktop` (reproduit en mobile-first)
- Fetched: 2026-11-07

## Implémentation : 3 routes distinctes

Banani ne montre qu'un seul écran avec tabs internes. Choix de routing : séparer en 3 pages, plus propre pour SSR et deep-linking.

- **`/auth/signup`** — [frontend/src/app/auth/signup/page.tsx](../../frontend/src/app/auth/signup/page.tsx)
- **`/auth/login`** — [frontend/src/app/auth/login/page.tsx](../../frontend/src/app/auth/login/page.tsx)
- **`/auth/verify-email`** — [frontend/src/app/auth/verify-email/page.tsx](../../frontend/src/app/auth/verify-email/page.tsx) (ajout nécessaire pour compléter le flow signup)

Toutes utilisent le même shell visuel `AuthShell` pour signup/login (panneau gauche dark avec wax + image + stats, panneau droit avec formulaire). Verify-email a son propre layout centré simple.

## Structure map

**Signup / Login (AuthShell)**

- **NavBar** (variant light, pas d'activePage).
- **Panneau gauche (hidden lg:flex)** — `bg-dark-surface` + `WaxPattern` 0.08 ; title headings ; image 4:3 ; 3 stats gold "20 invités offerts / 6 modifications IA / 0 FCFA pour commencer".
- **Panneau droit** — tab bar (Créer un compte | Se connecter) ; titre + sous-titre ; formulaire ; social proof mini (3 avatars + "Rejoignez 50 000+ familles").

**Signup form** : Prénom & Nom (nom ignoré backend MVP) + Email + Mot de passe → `POST /api/auth/signup` → redirect `/auth/verify-email?email=…`

**Login form** : Email + Mot de passe → `POST /api/auth/login` → `refresh()` → redirect `/dashboard`

**Verify-email** : NavBar + card centrée + input text 8 chars uppercase + bouton Vérifier + "Renvoyer" qui call `POST /api/auth/resend-verification`.

## Component breakdown

- **NEW** `AuthShell` — layout split signup/login partagé.
- **REUSE** `NavBar`, `FormField`, `WaxPattern`, `Image`, `UserAvatar`, `Icon`.
- **DEFERRED** `OTPInput` — créé car présent dans Banani, mais pas utilisé en MVP (le backend a un code 8 caractères Crockford, pas un OTP numérique 6 digits SMS).

## Backend contract mapping

| Banani (UI) | Backend (réalité) | Décision MVP |
|---|---|---|
| Phone field | n'existe pas | omis |
| OTP 6 digits SMS | Crockford 8-char code email | input texte 8 chars |
| Language FR/EN/DE | pas de i18n backend | omis (dans le Footer uniquement) |
| Name (Prénom & Nom) | pas de `User.name` | gardé dans l'UI, Zod strip silencieux |

## Responsive plan

- **375px** — panneau gauche masqué (`hidden lg:flex`). Tab bar + form sur toute la largeur. Input OTP 8 chars → `w-10 h-12`. CTA pleine largeur.
- **md 768px** — form en `max-w-md` centré.
- **lg 1024px** — split 2 col activé, panneau gauche visible.
- **xl 1280px** — paddings `xl:px-20` / `xl:p-16`.

## Interactions / état

- Signup : loading, error (ApiError.message), réseau OK.
- Login : loading, error, `useAuth().refresh()` pour recharger le contexte, redirect `/dashboard`.
- Verify-email : code limité à 8 caractères, forcé uppercase ; bouton disable tant que code.length < 8 ; "Renvoyer" déclenche `resend-verification`.

## Copy / i18n

Chaînes en français inline. "Mot de passe oublié ?" lie `/auth/forgot-password` (page non implémentée dans le MVP — à ajouter dans une vague suivante ou pointer vers reset-password).

## Open questions for user

- **OAuth Google** : backend prêt (`/api/auth/oauth/google/start`). Pas de bouton dans la maquette Banani. On l'ajoute où dans l'écran ? Proposition : bouton ghost "Continuer avec Google" au-dessus du formulaire avec séparateur "ou".
- **Forgot password** : route backend existe. On ajoute la page dans cette vague ou on fait dead-link vers "Nous contacter" ?
- **Préférence langue** : Banani montre FR/EN/DE. Le footer a déjà le switcher (cosmétique). On brûle le sélecteur de l'auth form définitivement ou on prépare l'i18n ?
