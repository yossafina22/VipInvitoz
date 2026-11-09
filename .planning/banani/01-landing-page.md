# 01 — Landing Page — Banani → Next.js 16 / Tailwind v4

## Source

- Banani screen ID: `g-L-NuyDq8NB/screens/01-LandingPage.jsx`
- `screenSize`: `desktop` (reproduit en mobile-first dans l'implémentation)
- Fetched: 2026-11-07

## Structure map (top → bottom)

- **NavBar** (sticky-ready, 2 variants light/dark) — logo "V" + 4 liens (Accueil / Fonctionnalités / Comment ça marche / Tarifs) + 2 CTA (Se connecter / Créer un compte). Hamburger en mobile.
- **Hero** — grid 2 colonnes sur lg, column unique en mobile. Badge "L'app africaine tout-en-un" (gold-light), h1 avec span primary, CTA primaire + CTA ghost "Voir la démo", 3 stats (50 000+, 4.8/5, 8 pays). Image 4:3 côté droit + 2 floating cards (RSVP en direct 87/200, "Invitation générée en 47s"). `WaxPattern` 0.04 en fond.
- **Types de cérémonie** — 5 cérémonies (mariage, baptême, anniversaire, deuil, coutumier) + "Et bien plus". Carrousel horizontal `overflow-x-auto snap-x` en mobile, flex centré en desktop.
- **Features** — grid 2 colonnes sur lg. 6 features en grid 2×3 avec icônes dans badge secondary + Image portrait 3:4 + badge primary flottant "WhatsApp → 87 RSVP reçus".
- **How it works** (section dark) — 3 étapes avec icône dans badge primary 64×64, numéros gold, flèches entre étapes en desktop. `WaxPattern` 0.05 en fond.
- **Pricing** — 3 cards (`PricingCard`) : Freemium, Premium (highlight), VIP. Grid 3 col sur md, stack mobile.
- **Social proof** — 3 témoignages avec `UserAvatar`, citation italique, 5 étoiles gold.
- **CTA final** — Image 16:4 avec overlay dark 60%, h2 blanc + CTA primary.
- **Footer** — 3 colonnes (Produit / Cérémonies / Support) + logo + sélecteur de langue + ligne copyright.

## Component breakdown

- **REUSE** `NavBar`, `Footer`, `PricingCard`, `WaxPattern`, `Image`, `UserAvatar`, `Icon` (tous déjà portés).
- **INLINE** Hero, features grid, testimonials grid, CTA — spécifiques à la landing, pas de réemploi prévu.

## Token mapping (Banani → projet)

Déjà géré via `@theme` dans `globals.css`. Rappel :

| Banani class | Résolution |
| `bg-primary` | `#C4602A` terracotta |
| `bg-gold-light` | `#F7E8C8` |
| `bg-dark` | `#1A1207` (section "Comment ça marche") |
| `font-headings` | PT Serif (h1/h2) |
| `font-body` | DM Sans |

## Responsive plan

- **375px (base)** — hero en colonne, image sous le texte ; CTA stackés ; stats en flex-wrap ; cérémonies en carrousel horizontal ; features en grid 1 col ; pricing stacké ; testimonials stackés ; CTA final avec h2 à 2xl/3xl.
- **sm 640px** — CTA côte à côte ; stats toujours flex-wrap mais plus d'espace.
- **md 768px** — testimonials en 3 col ; pricing en 3 col ; features internal grid 2 col.
- **lg 1024px** — hero en 2 col avec `lg:absolute inset-0` sur l'image ; steps "Comment ça marche" en row.
- **xl 1280px** — max-w conteneurs, paddings `xl:px-20`.

## Copy / i18n

Toutes les chaînes en français inline (pas de `t()` wrapper pour l'instant). Chaînes sources sécurisées HTML via `&apos;` quand nécessaire.

## Interactions / état

- Tout statique côté landing — aucune requête API.
- Liens vers `/auth/signup`, `/auth/login`, `#features`, `#howto`, `#pricing`, `#faq`.
- Images = placeholder avec gradient wax (pas de vraie photo tant que Cloudinary n'héberge pas les visuels). `aria-label` = `prompt` Banani.

## Open questions for user

- Les 5 cérémonies affichées dans le bandeau "Pour chaque moment" — les photos seront-elles vraiment différentes par type, ou une seule image hero suffit pour le lancement ?
- "Voir la démo" pointe vers `#howto` (ancre). Préfères-tu un modal vidéo (nécessite un composant `VideoModal`) ou un lien externe YouTube ?
- "WhatsApp → 87 RSVP reçus" est un chiffre statique de preuve sociale. OK pour prod ou on branche sur le vrai dashboard (`metrics` admin) ?
