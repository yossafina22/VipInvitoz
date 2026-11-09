# 15 — Invitation vue invité — Banani → Next.js 16 / Tailwind v4

## Source

- Banani screen ID: `g-L-NuyDq8NB/screens/15-GuestInvitationView.jsx`
- `screenSize`: `mobile` (déjà pensé mobile-first — gain de temps)
- Fetched: 2026-11-07
- Route: [frontend/src/app/i/[slug]/page.tsx](../../frontend/src/app/i/[slug]/page.tsx)

## Pourquoi `/i/[slug]`

- Public — pas de gate auth.
- Chemin court pour partage WhatsApp, SMS, QR (`vipin.vz/i/abc123`).
- `slug` = token unique opaque (pas le nom de la cérémonie), généré par le backend quand on émet l'invitation. Pas encore de modèle Prisma `Invitation` → utilise des données mockées pour l'instant.

## Structure map

- **Header dark** sticky — back arrow + label "INVITATION" en gold + share icon.
- **Carte invitation** — cover photo 4:3 + contenu centré : emoji 💍, titre headings 2xl, texte invitation, 3 colonnes Date/Heure/Lieu séparées par divider vertical, famille, 2 CTA (success + muted), note musique.
- **Détails** — card avec 3 lignes (map-pin lieu, phone contact, info indications).
- **Accompagnants** — card secondary avec 4 boutons (Moi seul / +1 / +2 / +3) — n'apparaît que si `rsvp !== 'declined'`.
- **QR code** — card centrée avec SVG pattern wax (motif placeholder, à remplacer par le vrai QR encodant `slug`).
- **CTA bas** — "Ajouter au calendrier" + WhatsApp + Partager.

## Component breakdown

- **REUSE** `Icon`, `Image`.
- **INLINE** Tout le reste — très spécifique à l'invitation, pas de réemploi.

## Responsive plan

- **375px (base)** — déjà le design cible. `max-w-md mx-auto` pour cadrer sur petit écran.
- **lg 1024px** — élargit à `max-w-2xl mx-auto` pour une version "desktop preview" de l'invitation. Cover photo plus grande (`lg:h-72`). Titre +1 taille.

## Interactions / état

- `useState<RSVPStatus>` local pour confirmed/declined/idle. **Pas de POST**.
- `useState<number>` pour le nombre d'accompagnants (1-4). **Pas de POST**.
- Boutons calendar / WhatsApp / share : pas de wire fonctionnel.

## Mock vs prod

Toutes les données sont hard-codées (Mariage Fatoumata & Ibrahima, Terrou-Bi Dakar, 14 juin 2025, Table 3). En prod il faudra :

- Modèle Prisma `Invitation { slug, ceremonyId, guestId, rsvpStatus, companionCount, ... }` + `Ceremony { title, date, venue, coverImage, ... }` + `Guest { name, phone, tableNumber, ... }`.
- `GET /api/i/[slug]` → retourne les données publiques (titre, date, lieu) + info invité (nom, table) + état RSVP courant.
- `POST /api/i/[slug]/rsvp { status, companionCount }` → met à jour.
- QR code encode `slug` et redirige vers `/i/[slug]` → l'invité le scanne à l'entrée pour validation côté agent.

## Open questions for user

- **Génération du slug** : nanoid 12 chars ? UUID ? Prefix par cérémonie (`c42-x8ngv2`) ? Je recommande nanoid 10 chars.
- **Expiration** : invitation valide jusqu'à la date de la cérémonie + 1 jour ? Ou éternelle ?
- **Partage WhatsApp** : ouvre `wa.me/?text=...` avec message pré-rempli ? Le lien doit-il inclure le slug de l'invité ou un lien générique ?
- **Mode "déjà confirmé"** : si l'invité revient sur la page après avoir confirmé, affichage différent (carte verte "Vous avez confirmé le X") ? Actuellement l'état est local donc perdu au refresh.
- **Multi-cérémonies** : un même invité peut être invité à plusieurs cérémonies — slugs différents, ou un seul slug qui liste toutes ses invitations ? (impact sur la structure DB)
