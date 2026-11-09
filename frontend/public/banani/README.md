# Images Banani

Dépose ici les **10 images exportées depuis Banani**. Les noms de fichiers ci-dessous sont utilisés par le code — garde-les exacts.

Format recommandé : **WebP** (meilleur ratio qualité/poids) ou PNG si WebP indisponible. Taille minimum à l'export : voir la colonne "Dimensions min" pour éviter le flou en desktop.

## Les 10 images à exporter

| Nom fichier | Écran source dans Banani | Ratio | Dimensions min | Ce qu'on voit |
|---|---|---|---|---|
| `hero.webp` | Écran **01 — Landing Page**, grande image du hero droite | 4:3 | 1200×900 | Couple africain en mariage, décor terracotta/or |
| `ceremony-mariage.webp` | Écran 01, 1ère card du bandeau "Pour chaque moment" | 1:1 | 800×800 | Mariage africain avec décor kente/doré |
| `ceremony-bapteme.webp` | Écran 01, 2ème card | 1:1 | 800×800 | Baptême africain fleurs blanches |
| `ceremony-anniversaire.webp` | Écran 01, 3ème card | 1:1 | 800×800 | Anniversaire africain, décor coloré |
| `ceremony-deuil.webp` | Écran 01, 4ème card | 1:1 | 800×800 | Cérémonie mémorielle bougies blanches + lys |
| `ceremony-coutumier.webp` | Écran 01, 5ème card | 1:1 | 800×800 | Cérémonie coutumière wax + tambours |
| `features.webp` | Écran 01, image portrait section "Tout-en-un" | 3:4 | 900×1200 | Femme en robe wax + smartphone |
| `cta.webp` | Écran 01, bannière fine en bas avant le footer | 16:4 | 1920×480 | Table de banquet décorée fleurs + bougies |
| `auth.webp` | Écran **02 — Inscription / Connexion**, image gauche dans panneau dark | 4:3 | 1200×900 | Famille africaine joyeuse, lumières terracotta |
| `invitation-cover.webp` | Écran **15 — Invitation vue invité**, grande cover photo du haut | 4:3 | 1200×900 | Couple africain en mariage, mariée robe blanche + or |

## Comment exporter depuis Banani

1. Ouvre le projet VipInvitoz dans l'éditeur Banani
2. Sélectionne l'écran concerné (ex : 01 Landing Page)
3. **Clique droit sur l'image** générée dans le canvas
4. Choisis **"Download image"** ou **"Export as PNG/WebP"** (le menu peut varier selon la version Banani)
5. Sauvegarde dans ce dossier (`frontend/public/banani/`) avec le nom exact du tableau ci-dessus

Si Banani n'expose pas le clic droit : ouvre les DevTools du navigateur (F12), onglet Network, filtre `img`, recharge la page, clique sur l'image → onglet Preview → clic droit → Save.

## Après avoir déposé les fichiers

Dis-moi "c'est bon" — je bascule tous les `<Image>` du code sur `src="/banani/xxx.webp"` et je supprime le fallback loremflickr. Le build doit toujours passer et les screenshots doivent être identiques à ceux de Banani.
