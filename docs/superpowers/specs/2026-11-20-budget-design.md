# Budget (VIP) — design

Date : 2026-11-20 · Statut : à approuver

## Pourquoi
La page `/budget` est une maquette (données fictives, aucun backend) alors que le
« Suivi budget » est vendu dans l'offre VIP. Avant d'activer les paiements, la
fonction doit être réelle : un client VIP doit pouvoir suivre son budget.

## Objectifs
- L'organisateur **crée lui-même ses postes de dépenses** (ajout, renommage,
  suppression) et fixe un montant prévu par poste.
- Il enregistre ses dépenses (quantité × prix unitaire) rattachées à un poste.
- Totaux justes : budget total, dépensé, restant, % consommé, dépassement signalé.
- Export CSV ouvrable dans Excel.
- Page FR/EN (next-intl), comme le reste de l'app.

## Non-objectifs
- **Aucune devise** (décision utilisateur) : uniquement des nombres. Pas de symbole,
  pas de conversion. L'organisateur compte dans sa propre monnaie.
- Pas de lien dépense ↔ prestataire (viendra avec la fonction Prestataires).
- Pas de partage avec des co-organisateurs (viendra avec Co-organisateurs).

## Anti-objectifs
- Un utilisateur non VIP qui accède au budget via l'API.
- Un utilisateur qui voit ou modifie le budget d'une cérémonie qui n'est pas la sienne.
- Des totaux faux à cause d'arrondis flottants.
- Des dépenses perdues silencieusement quand on supprime un poste.

## Approches considérées
- **Retenue — postes créés par l'utilisateur, pré-remplis à la première ouverture.**
  Décision utilisateur : il crée ses propres postes. Pour éviter une page vide, 6 postes
  de départ (Salle & décor, Traiteur, Tenues, Photo & vidéo, DJ & musique, Divers) sont
  créés **dans la langue de l'utilisateur** à la première ouverture ; ce sont ensuite des
  postes ordinaires (texte utilisateur, non retraduit, comme un titre de cérémonie).
- Écartée — 6 catégories fixes traduites : refusée, l'utilisateur veut créer ses postes.
- Écartée — monnaie par cérémonie : refusée par l'utilisateur (trop de devises possibles).

## Conception

### Données (Prisma)
- `BudgetCategory` : `ceremonyId` (FK, cascade), `label` String (1–60, texte utilisateur),
  `planned` Decimal(14,2) ≥ 0 (défaut 0), `order` Int.
- `BudgetExpense` : `ceremonyId` (FK, cascade), `categoryId` (FK BudgetCategory, Restrict),
  `label` (1–120), `quantity` Decimal(10,2) > 0 défaut 1, `unitAmount` Decimal(14,2) ≥ 0,
  `status` String (PAID | PENDING | PLANNED), `date` DateTime? .
  Total d'une ligne = quantity × unitAmount, calculé côté serveur.
- `Ceremony.budgetSeededAt DateTime?` : posé quand les postes de départ ont été créés,
  pour ne pré-remplir qu'une seule fois (si l'utilisateur supprime tout, on ne recrée pas).
- Montants en `Decimal` (jamais Float) ; 2 décimales max, validées par Zod.

### API
Toutes : `export const runtime = 'nodejs'`, `requireAuth`, `verifyCsrf` sur les mutations,
`withRequestContext`, validation Zod serveur, cérémonie filtrée par `userId` → 404 sinon.
- `GET /api/budget?ceremonyId=&locale=` → postes (prévu, dépensé, à venir), dépenses,
  totaux, `daysUntil` (première occasion). Sans `ceremonyId` : cérémonie la plus récente
  (DRAFT/ACTIVE), comme `/api/guestbook`. Si `budgetSeededAt` est vide : création des 6
  postes dans `locale` (fr|en, défaut fr) + pose de `budgetSeededAt`, dans une transaction.
- `POST /api/budget/categories` (label, planned) ;
  `PATCH /api/budget/categories/[id]` (label, planned, order) ;
  `DELETE /api/budget/categories/[id]` → 409 `CATEGORY_NOT_EMPTY` si des dépenses y sont
  rattachées (l'utilisateur les déplace ou les supprime d'abord).
- `POST /api/budget/expenses` ; `PATCH /api/budget/expenses/[id]` (dont changement de poste) ;
  `DELETE /api/budget/expenses/[id]`.
- `GET /api/budget/export?ceremonyId=` → CSV (séparateur `;`, BOM UTF-8 pour Excel).
- Chaque id de poste/dépense est vérifié comme appartenant à une cérémonie de l'utilisateur.

### Contrôle de palier
Nouveau helper serveur réutilisable `requireTier(userId, 'VIP')` dans
`lib/server/vipinvitoz/` (s'appuie sur `ensureActiveSubscription`) → 403
`{ error: 'TIER_REQUIRED', requiredTier: 'VIP' }`. Appliqué à toutes les routes budget,
puis réutilisé pour Prestataires et Orientation.

### Calculs
- Dépensé = somme des dépenses PAID + PENDING (argent engagé).
- À venir = somme des dépenses PLANNED (affiché à part).
- Restant = total prévu − dépensé. Dépassement (rouge) = dépensé > prévu, par poste et au total.

### UI
Page `/budget` branchée sur l'API, même mise en page que la maquette :
- résumé : total prévu / dépensé (barre %) / restant + « Jour J dans N jours » ;
- liste des postes : barre par poste, bouton « + Poste », renommage, montant prévu
  modifiable, suppression (message clair si le poste n'est pas vide) ;
- liste des dépenses : ajout / édition / suppression dans une fenêtre
  (libellé, poste, quantité, prix unitaire, total affiché en direct, statut, date) ;
- bouton Exporter (CSV).
Non-VIP → encart « Réservé au VIP » au lieu des données. Bandeau maquette retiré.
Nombres formatés selon la langue (`Intl.NumberFormat`, sans devise).
Textes dans `messages/{fr,en}.json`, namespace `budget`.

### Tests (Vitest)
Calcul des totaux, validation Zod (décimales, négatifs), pré-remplissage unique,
refus de suppression d'un poste non vide, `requireTier` (403 non-VIP), isolation par
`userId` (404 sur cérémonie / poste / dépense d'autrui), runtime nodejs (tripwire existant).

## Laissé au builder
Mise en forme exacte de la fenêtre d'ajout ; ordre de tri des dépenses (date desc
proposé) ; réordonnancement des postes en V1 optionnel (champ `order` prêt) ;
noms de fichiers internes.

## Décisions prises par Claude (à vérifier)
- Quantité optionnelle pour permettre « 200 × 500 ».
- 2 décimales autorisées.
- PENDING compte comme dépensé (engagé), PLANNED non.
- 6 postes de départ créés dans la langue de l'utilisateur, une seule fois.
- Supprimer un poste qui contient des dépenses est refusé (pas de suppression en cascade).
