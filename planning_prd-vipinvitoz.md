# PRD — VipInvitoz

## 1. Vision produit

**Pitch en une phrase :** VipInvitoz est la plateforme tout-en-un qui permet aux familles africaines, en Afrique et dans la diaspora, d'organiser leurs cérémonies (mariages, baptêmes, anniversaires, deuils) sans stress — de la création de l'invitation au jour J.

**Problème résolu :** Organiser une cérémonie en Afrique ou dans la diaspora est un cauchemar logistique. Il n'existe aucun outil unique, accessible en mobile money, pensé pour les réalités africaines (grandes familles, connectivité variable, multilinguisme, diversité des cérémonies incluant le deuil), qui couvre l'ensemble de la chaîne : invitations, suivi des réponses, gestion du jour J, et maîtrise du budget.

**Pourquoi maintenant :**
- Les familles africaines utilisent massivement WhatsApp pour organiser leurs événements, mais de manière chaotique (listes de diffusion, tableurs manuels, appels un par un). Le marché est prêt pour un outil structuré qui s'intègre à WhatsApp plutôt que de le remplacer.
- Aucun concurrent ne couvre à la fois : plan de table, suivi budget, projection live photos, livre d'or enrichi, programmes de deuil ou organisation des funerailles ET paiement mobile money et stripe ou carte bancaire. C'est un trou béant.
- La diaspora européenne (France, Allemagne, Belgique) organise des cérémonies pour la famille restée au pays. Elle a le pouvoir d'achat ET le besoin d'un outil digital.

**Ce que le produit règle concrètement :**

- **"Je ne sais pas combien de personnes viennent"** → RSVP en temps réel via lien WhatsApp : chaque invité confirme sa présence et le nombre d'accompagnants. L'organisateur voit le compteur monter en direct.
- **"Je passe 3 jours à écrire et envoyer les invitations"** → L'utilisateur décrit sa cérémonie en une phrase, l'IA génère l'invitation complète (texte, design, ambiance). Envoi en un clic via WhatsApp ou lien partageable.
- **"Le jour J, les invités ne trouvent pas leur table"** → Plan de table visuel + QR code personnel : l'invité scanne son QR à l'entrée et voit sa table assignée.
- **"Je ne sais plus où est passé mon budget"** → Suivi budget intégré (VIP) : budget de départ, ajout/suppression de lignes de dépenses, solde restant en temps réel. Pas de paiement dans l'app — juste du tracking clair.
- **"Le livre d'or, c'est la file d'attente du siècle"** → Livre d'or digital : les invités laissent un message texte, depuis leur téléphone, sans faire la queue.

---

## 2. Personas cibles

### Persona 1 — Aïssatou, 34 ans, Dakar (Sénégal)

- **Profil :** Comptable dans une entreprise privée. Organise le mariage de sa sœur cadette. Smartphone Android d'entrée de gamme, connexion 3G/4G variable.
- **Pain points :**
  - Envoie les invitations par WhatsApp message par message — elle en a 200 à envoyer et perd le fil de qui a répondu.
  - A noté le budget sur un cahier, ne sait plus combien il reste après les 15 prestataires payés.
  - Le jour J du dernier mariage familial, les invités erraient dans la salle sans savoir où s'asseoir.
- **Ce qu'elle utilise aujourd'hui :** WhatsApp + cahier + appels téléphoniques + bouche-à-oreille.
- **Pouvoir d'achat :** Peut payer 8 000-15 000 FCFA par trimestre si l'outil lui fait gagner du temps concret. Paie tout par Wave ou Orange Money — pas de carte bancaire.

### Persona 2 — Raoul, 41 ans, Francfort (Allemagne)

- **Profil :** Ingénieur, diaspora camerounaise. Organise le baptême de son fils à Francfort avec famille invitée depuis le Cameroun et l'Europe. Smartphone haut de gamme, WiFi stable.
- **Pain points :**
  - Coordonne des invités sur 3 fuseaux horaires et 2 continents. Certains n'ont même pas de smartphone récent.
  - Veut une invitation élégante en français ET en allemand (famille mixte).
  - A besoin que le programme soit clair : cérémonie religieuse → réception → repas. Les invités camerounais ne connaissent pas le lieu.
- **Ce qu'elle utilise aujourd'hui :** Canva pour le design, WhatsApp pour l'envoi, Google Sheets pour le budget.
- **Pouvoir d'achat :** 11,99-21,99 €/trimestre sans hésitation si l'outil est professionnel. Paie par carte bancaire.

### Persona 3 — Fatou, 52 ans, Abidjan (Côte d'Ivoire)

- **Profil :** Commerçante au marché. Son mari est décédé, elle organise le programme de deuil (40e jour). Smartphone basique, connexion lente.
- **Pain points :**
  - En plein deuil, elle doit quand même prévenir toute la famille élargie (oncles, cousins, belle-famille) de la date et du programme.
  - Personne ne propose d'invitations digitales pour un deuil — tout est conçu pour les mariages.
  - Pas le temps ni l'énergie de gérer la logistique seule.
- **Ce qu'elle utilise aujourd'hui :** Appels téléphoniques un par un. Un neveu qui fait passer le message dans les groupes WhatsApp famille.
- **Pouvoir d'achat :** Utiliserait le palier Freemium (20 invités suffisent pour le cercle proche). Pourrait upgrader en Premium si un membre de la famille diaspora paie pour elle.

---

## 3. Pages & écrans

### Parcours principal (organisateur)

**3.1. Page d'accueil / Landing page**
- À quoi elle sert : Présenter VipInvitoz, ses bénéfices, les paliers et les prix. Convaincre de s'inscrire.
- Qui y accède : Tout visiteur non connecté.
- Actions clés : S'inscrire, se connecter, changer de langue (FR/EN/DE), voir les tarifs.

**3.2. Page d'inscription / Connexion**
- À quoi elle sert : Créer un compte ou se connecter (email ou téléphone + OTP).
- Qui y accède : Tout visiteur.
- Actions clés : S'inscrire avec email ou numéro de téléphone, recevoir et saisir l'OTP, se connecter.

**3.3. Tableau de bord (Dashboard)**
- À quoi elle sert : Vue d'ensemble de toutes les cérémonies de l'utilisateur. Point d'entrée central après connexion.
- Qui y accède : Tout utilisateur connecté (Aïssatou, Raoul, Fatou).
- Actions clés : Créer une nouvelle cérémonie, accéder à une cérémonie existante, voir son palier actuel et le nombre de crédits IA restants.

**3.4. Page de création de cérémonie**
- À quoi elle sert : Définir les paramètres d'une nouvelle cérémonie (type, date, lieu, nombre estimé d'invités, description en une phrase pour l'IA).
- Qui y accède : Tout utilisateur connecté.
- Actions clés : Choisir le type de cérémonie (mariage, baptême, anniversaire, deuil, autre), renseigner les détails, lancer la génération IA de l'invitation.

**3.5. Page de l'invitation générée (Éditeur)**
- À quoi elle sert : Voir le résultat de l'IA, le modifier, choisir la musique de fond, prévisualiser, et valider.
- Qui y accède : L'organisateur de la cérémonie.
- Actions clés : Modifier l'invitation via les crédits IA (ou chatbot Premium/VIP), choisir un fond musical, prévisualiser le rendu mobile, valider et passer à l'envoi.

**3.6. Page de gestion des invités**
- À quoi elle sert : Ajouter des invités (nom, téléphone, email), envoyer les invitations, suivre les réponses RSVP en temps réel.
- Qui y accède : L'organisateur.
- Actions clés : Ajouter des invités manuellement ou par import, envoyer l'invitation via WhatsApp ou lien, voir le statut de chaque invité (en attente / confirmé / décliné / nombre d'accompagnants).

**3.7. Page du plan de table (Premium/VIP)**
- À quoi elle sert : Placer visuellement les invités confirmés sur les tables de la salle.
- Qui y accède : Organisateur Premium ou VIP.
- Actions clés : Créer des tables (nommer, définir la capacité), glisser-déposer les invités sur les tables, voir les places restantes par table.

**3.8. Page de la projection live photos (Premium/VIP)**
- À quoi elle sert : Configurer et gérer la projection live de photos envoyées par les invités le jour J.
- Qui y accède : L'organisateur (configuration) + le modérateur désigné (approbation).
- Actions clés : Activer/désactiver la projection, désigner un modérateur, approuver ou rejeter les photos soumises, afficher le flux approuvé sur un écran (lien de projection dédié).

**3.9. Page du livre d'or (Premium/VIP)**
- À quoi elle sert : Consulter les messages laissés par les invités (texte).
- Qui y accède : L'organisateur Premium ou VIP.
- Actions clés : Voir tous les messages reçus, les lire/écouter/visionner, les télécharger en souvenir.

**3.10. Page de suivi budget (VIP uniquement)**
- À quoi elle sert : Suivre les dépenses liées à la cérémonie par rapport à un budget initial défini.
- Qui y accède : Organisateur VIP.
- Actions clés : Définir un budget de départ, ajouter une ligne de dépense (catégorie, montant, prestataire), supprimer une ligne, voir le solde restant mis à jour en temps réel.

**3.11. Page de coordination prestataires (VIP uniquement)**
- À quoi elle sert : Lister les prestataires de la cérémonie, leurs contacts et tâches.
- Qui y accède : Organisateur VIP.
- Actions clés : Ajouter un prestataire (nom, rôle, téléphone, tâche), marquer une tâche comme faite, contacter le prestataire directement.

**3.12. Page d'orientation invités (VIP uniquement)**
- À quoi elle sert : Fournir un plan du lieu / itinéraire pour que les invités trouvent la salle, l'église, le parking.
- Qui y accède : Organisateur VIP (configuration) + invités (consultation via QR ou lien).
- Actions clés : Ajouter l'adresse du lieu, générer un lien de navigation, ajouter des indications personnalisées ("Parking à droite après le portail bleu").

**3.13. Page de gestion d'abonnement**
- À quoi elle sert : Voir son palier actuel, upgrader, renouveler ou changer de formule.
- Qui y accède : Tout utilisateur connecté.
- Actions clés : Voir le palier actuel et la date d'expiration, upgrader vers Premium ou VIP, payer via mobile money (Wave, Orange Money) ou carte bancaire.

**3.14. Page de paramètres utilisateur**
- À quoi elle sert : Gérer son profil, sa langue, ses notifications.
- Qui y accède : Tout utilisateur connecté.
- Actions clés : Modifier son nom/téléphone/email, changer la langue de l'interface (FR/EN/DE), gérer ses préférences de notifications.

### Parcours invité (sans compte requis)

**3.15. Page d'invitation (vue invité)**
- À quoi elle sert : L'invité reçoit un lien (WhatsApp ou autre) et voit l'invitation complète avec musique, détails de la cérémonie.
- Qui y accède : Tout invité ayant reçu le lien — aucun compte requis.
- Actions clés : Lire l'invitation, confirmer ou décliner sa présence (RSVP), indiquer le nombre d'accompagnants, voir son QR code personnel après confirmation.

**3.16. Page de contribution live (vue invité, Premium/VIP)**
- À quoi elle sert : Permettre à l'invité d'envoyer une photo pour la projection live et/ou d'écrire dans le livre d'or.
- Qui y accède : Invité d'une cérémonie Premium ou VIP, via QR code ou lien dédié.
- Actions clés : Prendre ou sélectionner une photo et l'envoyer, rédiger un message texte / enregistrer un vocal / tourner une vidéo courte pour le livre d'or.

**3.17. Page d'orientation (vue invité, VIP)**
- À quoi elle sert : L'invité voit le plan du lieu, son numéro de table, et les indications pour s'y rendre.
- Qui y accède : Invité d'une cérémonie VIP, via QR code ou lien.
- Actions clés : Voir sa table assignée, voir le plan/itinéraire, lancer la navigation vers le lieu.

**3.18. Page de projection (affichage écran, Premium/VIP)**
- À quoi elle sert : Affichage plein écran des photos approuvées, destiné à être projeté sur un écran/vidéoprojecteur le jour J.
- Qui y accède : Organisateur ou modérateur (ouvre le lien sur un ordinateur connecté au projecteur).
- Actions clés : Afficher le diaporama en plein écran, les photos approuvées apparaissent automatiquement.

---

## 4. Fonctionnalités MVP (V1)

### Authentification & compte

| Feature | Description | Priorité |
|---|---|---|
| Inscription email + OTP | L'utilisateur crée un compte avec son email et vérifie via un code OTP envoyé par email. | P0 |
| Inscription téléphone + OTP | L'utilisateur crée un compte avec son numéro de téléphone et vérifie via SMS OTP. | P0 |
| Connexion | L'utilisateur se connecte avec ses identifiants (email ou téléphone + OTP). | P0 |
| Choix de langue à l'inscription | L'utilisateur choisit sa langue (FR/EN/DE) dès la création du compte. Modifiable ensuite dans les paramètres. Disponible pour tous les paliers. | P0 |
| Gestion du profil | Modifier nom, email, téléphone, photo de profil, langue de l'interface. | P1 |

### Création & gestion de cérémonie

| Feature | Description | Priorité |
|---|---|---|
| Création de cérémonie | Choisir le type (mariage, baptême, anniversaire, deuil, autre personnalisé), date, lieu(il faut noter qu une ceremonie peut avoir plusieurs dates et lieux de celebration, il faut donner la possibilite d ajouter le champ de date, lieu et le titre, description libre. | P0 |
| Génération d'invitation par IA | L'utilisateur décrit sa cérémonie en une phrase → l'IA génère une page d'invitation complète (texte, mise en page, couleurs adaptées au type de cérémonie). | P0 |
| Modifications IA avec compteur | L'utilisateur peut demander des modifications à l'IA. Compteur visible : 6 restantes (Freemium) / 12 restantes (Premium) / illimité (VIP). Chaque modification = une reformulation, un changement de ton, de couleur, de structure. | P0 |
| Chatbot IA (Premium/VIP) | En plus des modifications ponctuelles, l'utilisateur Premium et VIP peut converser avec un chatbot pour affiner l'invitation de manière interactive ("rends le ton plus formel", "ajoute une citation biblique"). | P0 |
| Musique de fond | L'organisateur choisit une ambiance musicale parmi une bibliothèque de morceaux libres de droits, diffusée quand l'invité ouvre la page d'invitation. | P1 |
| Multi-cérémonie (VIP) | Un même utilisateur peut créer et gérer plusieurs cérémonies simultanément (ex : mariage civil + mariage religieux + réception). | P0 |

### Gestion des invités & RSVP

| Feature | Description | Priorité |
|---|---|---|
| Ajout d'invités | Ajouter des invités un par un (nom, téléphone, email optionnel) ou par import (fichier CSV). | P0 |
| Limite de 20 invités (Freemium) | Le palier gratuit est limité à 20 invités par cérémonie. Au-delà, un message invite à upgrader. | P0 |
| Envoi d'invitation via WhatsApp | Un bouton génère un message WhatsApp pré-rédigé avec le lien personnalisé de l'invitation. L'organisateur l'envoie depuis son WhatsApp. | P0 |
| Envoi par lien partageable | Un lien unique est généré pour chaque invité (ou un lien générique pour l'événement). Partageable sur n'importe quel canal. | P0 |
| RSVP temps réel | L'invité confirme ou décline directement depuis la page d'invitation. L'organisateur voit le statut de chaque invité mis à jour en temps réel dans son dashboard. | P0 |
| Nombre d'accompagnants | L'invité peut indiquer combien de personnes l'accompagnent lors du RSVP. Le total se met à jour automatiquement. | P0 |

### QR code

| Feature | Description | Priorité |
|---|---|---|
| QR code personnel | Après confirmation RSVP, chaque invité reçoit un QR code unique. | P0 |
| Check-in QR le jour J | L'organisateur scanne le QR code de chaque invité à l'entrée pour valider sa présence. L'invité voit sa table assignée après scan (si plan de table activé). | P0 |

### Plan de table (Premium/VIP)

| Feature | Description | Priorité |
|---|---|---|
| Création de tables | L'organisateur crée des tables (nom, capacité max). | P0 |
| Placement drag & drop | L'organisateur glisse-dépose les invités confirmés sur les tables. Indicateur visuel quand une table est pleine. | P0 |
| Vue d'ensemble | Vision globale de toutes les tables avec les noms des invités placés et les places restantes. | P0 |

### Projection live photos (Premium/VIP)

| Feature | Description | Priorité |
|---|---|---|
| Activation de la projection | L'organisateur active la projection live pour sa cérémonie. Un lien de contribution est généré pour les invités. | P0 |
| Envoi de photos par les invités | Les invités prennent ou sélectionnent une photo depuis leur téléphone et l'envoient via le lien ou QR code. Uniquement des photos — pas de vidéo. | P0 |
| Modération | Un modérateur (l'organisateur ou une personne désignée) approuve ou rejette chaque photo avant qu'elle n'apparaisse sur l'écran de projection. | P0 |
| Affichage projection | Lien dédié plein écran qui affiche les photos approuvées en diaporama continu. Conçu pour être ouvert sur un ordinateur connecté à un projecteur. | P0 |

### Livre d'or digital (Premium/VIP)

| Feature | Description | Priorité |
|---|---|---|
| Message texte | L'invité écrit un message de vœux/condoléances via le lien ou QR code de la cérémonie. | P1 |

| Consultation par l'organisateur | L'organisateur peut lire, tous les messages. Possibilité de télécharger le tout comme souvenir. | P1 |

### Suivi budget (VIP uniquement)

| Feature | Description | Priorité |
|---|---|---|
| Budget de départ | L'organisateur définit un montant total prévu pour la cérémonie (ex : 2 000 000 FCFA). | P1 |
| Ajout de lignes de dépenses | Ajouter une dépense : catégorie (traiteur, salle, décoration, DJ…), montant, prestataire associé (optionnel). | P1 |
| Suppression de lignes | Supprimer une dépense si elle est annulée ou erronée. | P1 |
| Solde restant en temps réel | Le solde (budget de départ — total des dépenses) est recalculé et affiché en temps réel à chaque ajout/suppression. | P1 |

### Coordination prestataires (VIP uniquement)

| Feature | Description | Priorité |
|---|---|---|
| Liste de prestataires | Ajouter un prestataire : nom, rôle (DJ, traiteur, photographe…), téléphone, tâche assignée. | P1 |
| Suivi des tâches | Marquer une tâche prestataire comme "à faire" ou "faite". | P1 |
| Contact direct | Bouton pour appeler ou envoyer un WhatsApp au prestataire directement depuis l'app. | P1 |

### Orientation invités (VIP uniquement)

| Feature | Description | Priorité |
|---|---|---|
| Adresse et navigation | L'organisateur renseigne l'adresse du lieu. Un lien de navigation est généré (ouvre l'app de cartographie de l'invité). | P1 |
| Indications personnalisées | L'organisateur ajoute des instructions texte ("Après le rond-point, prendre la 2e à droite. Parking derrière le bâtiment bleu."). | P1 |
| Accès via QR/lien | L'invité accède aux indications depuis son QR code ou le lien d'invitation. | P1 |

### Multi-langue

| Feature | Description | Priorité |
|---|---|---|
| Interface en 3 langues | L'ensemble de l'interface (menus, boutons, messages système, emails) est disponible en français (défaut), anglais et allemand. Tous les paliers. | P0 |
| Changement de langue | L'utilisateur peut changer de langue à tout moment depuis la page d'accueil (avant connexion) ou les paramètres (après connexion). | P0 |

### Gestion d'abonnement

| Feature | Description | Priorité |
|---|---|---|
| Affichage du palier actuel | L'utilisateur voit son palier (Freemium/Premium/VIP), la date d'expiration, et les crédits IA restants. | P0 |
| Upgrade | Passer de Freemium à Premium ou VIP, ou de Premium à VIP. Le paiement se fait dans l'app. | P0 |
| Paiement mobile money + carte | Paiement par Wave, Orange Money (zone Afrique) et carte bancaire (zone Europe et Afrique). | P0 |

---

## 5. User Stories principales

### US-01 : Créer une cérémonie et générer l'invitation
**En tant qu'** Aïssatou (organisatrice, Freemium), **je veux** créer une cérémonie de mariage et décrire l'événement en une phrase **afin que** l'IA me génère automatiquement une invitation prête à envoyer.

**Critères d'acceptation :**
- Je peux choisir le type "Mariage" parmi les options proposées.
- Je renseigne la date, le lieu et une description libre (ex : "Mariage traditionnel de Mariama et Ousmane, dans la joie et la tradition").
- Après validation, une invitation complète est générée (texte, couleurs, mise en page adaptée au type "mariage").
- Je peux modifier l'invitation 6 fois (compteur visible, décrémenté à chaque modification validée).
- Si je tente une 7e modification, un message m'invite à passer en Premium.

### US-02 : Inviter des personnes et suivre les RSVP
**En tant qu'** Aïssatou, **je veux** ajouter mes 20 invités et leur envoyer l'invitation via WhatsApp **afin de** savoir en temps réel qui vient et combien de personnes au total.

**Critères d'acceptation :**
- Je peux ajouter jusqu'à 20 invités avec nom et numéro de téléphone.
- Pour chaque invité, un bouton "Envoyer via WhatsApp" ouvre WhatsApp avec un message pré-rédigé contenant le lien personnalisé.
- L'invité peut confirmer ou décliner depuis la page d'invitation, sans créer de compte.
- L'invité peut indiquer son nombre d'accompagnants.
- Je vois le statut de chaque invité en temps réel : en attente / confirmé / décliné + nombre d'accompagnants.
- Le total (confirmés + accompagnants) est affiché en gros sur ma page de gestion.
- Si j'essaie d'ajouter un 21e invité, un message m'invite à passer en Premium.

### US-03 : Scanner les invités le jour J
**En tant qu'** Aïssatou, **je veux** scanner le QR code de chaque invité à l'entrée **afin de** vérifier qu'il est bien sur la liste et lui indiquer sa table.

**Critères d'acceptation :**
- Chaque invité confirmé a reçu un QR code unique après son RSVP.
- Je scanne le QR avec l'appareil photo de mon téléphone depuis l'app.
- L'app affiche le nom de l'invité, son statut (confirmé), et sa table assignée (si plan de table activé).
- Si le QR n'est pas reconnu ou si l'invité a décliné, un message d'erreur clair s'affiche.

### US-04 : Organiser le plan de table
**En tant que** Raoul (organisateur Premium), **je veux** placer mes invités sur des tables **afin que** chacun sache où s'asseoir le jour du baptême.

**Critères d'acceptation :**
- Je crée des tables avec un nom (ex : "Table Famille") et une capacité (ex : 8 places).
- Je vois la liste de mes invités confirmés et je les glisse-dépose sur les tables.
- Une table qui atteint sa capacité est visuellement marquée comme pleine.
- Je peux déplacer un invité d'une table à une autre.
- La vue d'ensemble montre toutes les tables avec les noms placés et les places disponibles.

### US-05 : Projeter les photos en live le jour J
**En tant que** Raoul (Premium), **je veux** que mes invités envoient des photos depuis leur téléphone et qu'elles apparaissent sur l'écran de projection **afin d'** animer la fête avec les moments capturés par tout le monde.

**Critères d'acceptation :**
- J'active la projection live depuis le tableau de bord de ma cérémonie.
- Un lien/QR code est généré pour les invités.
- L'invité peut prendre une photo ou en sélectionner une depuis sa galerie et l'envoyer. Seules les photos sont acceptées (pas de vidéo).
- Chaque photo envoyée passe par la file de modération.
- Le modérateur (moi ou une personne désignée) approuve ou rejette chaque photo.
- Les photos approuvées apparaissent automatiquement sur la page de projection plein écran.

### US-06 : Suivre mon budget en temps réel
**En tant que** Raoul (VIP), **je veux** fixer mon budget total et ajouter mes dépenses au fur et à mesure **afin de** voir combien il me reste à tout moment.

**Critères d'acceptation :**
- Je définis un budget de départ (ex : 5 000 €).
- J'ajoute des lignes de dépenses avec catégorie (salle, traiteur, gâteau, DJ…), montant, et note optionnelle.
- Je peux supprimer une ligne si la dépense est annulée.
- Le solde restant (budget de départ − total des dépenses) se met à jour instantanément à chaque ajout/suppression.
- Aucun paiement ne se fait dans l'app — c'est un outil de suivi uniquement.

### US-07 : Écrire dans le livre d'or
**En tant qu'** invité d'une cérémonie Premium/VIP, **je veux** laisser un message (texte) **afin de** féliciter les mariés ou exprimer mes condoléances sans faire la queue devant un cahier.

**Critères d'acceptation :**
- J'accède au livre d'or via le QR code ou le lien de la cérémonie, sans créer de compte.
- Je peux écrire un message texte (pas de limite stricte, max raisonnable ~500 caractères).

- Mon message est visible par l'organisateur dans la section livre d'or de sa cérémonie.

### US-08 : Changer la langue de l'interface
**En tant que** Fatou (Freemium), **je veux** utiliser l'app en français **afin de** comprendre tous les menus et messages.
**En tant que** Raoul (Premium), **je veux** passer l'interface en allemand **afin que** ma belle-famille allemande puisse naviguer sur la page d'invitation.

**Critères d'acceptation :**
- La langue est choisie à l'inscription (français par défaut).
- Je peux changer de langue (FR/EN/DE) à tout moment depuis les paramètres.
- Tous les éléments de l'interface (menus, boutons, messages d'erreur, emails envoyés) sont traduits.
- La page d'invitation vue par les invités s'affiche dans la langue de l'organisateur (les invités ne choisissent pas séparément).
- La fonctionnalité multi-langue est disponible pour tous les paliers (Freemium, Premium, VIP).

### US-09 : Upgrader mon abonnement
**En tant qu'** Aïssatou (Freemium), **je veux** passer en Premium pour avoir plus de 20 invités et le plan de table **afin d'** organiser le mariage de ma sœur qui a 150 invités.

**Critères d'acceptation :**
- Je vois mon palier actuel et les features des paliers supérieurs.
- Je choisis Premium (8 000 FCFA/trim) ou VIP (15 000 FCFA/trim).
- Je paie par Wave ou Orange Money (un écran de paiement s'ouvre, je confirme depuis mon téléphone).
- Après paiement confirmé, mes nouvelles features sont débloquées instantanément.
- Mon compteur de modifications IA passe à 12 (Premium) ou illimité (VIP).
Possibilite de scanner le QR Code meme en mode hors ligne ou reseau.

---

## 6. Business Model & Monétisation

### Modèle de revenus

**Freemium trimestriel** — abonnement par trimestre (3 mois), sans renouvellement automatique. L'utilisateur paie manuellement à chaque renouvellement. Ce modèle correspond aux habitudes de consommation du marché africain (pas d'engagement, pas de prélèvement surprise) et s'aligne sur le concurrent local direct.

### Grille tarifaire

| Zone | Freemium | Premium | VIP |
|---|---|---|---|
| Afrique (FCFA) | 0 FCFA | ~~10 000 FCFA~~ **8 000 FCFA** / trimestre | ~~18 000 FCFA~~ **15 000 FCFA** / trimestre |
| Europe (EUR) | 0 € | ~~14,99 €~~ **11,99 €** / trimestre | ~~26,99 €~~ **21,99 €** / trimestre |

### Détail des paliers

**Freemium (0 FCFA / 0 €) :**
- Création d'une cérémonie à la fois
- 20 invités maximum par cérémonie
- Génération d'invitation par IA (6 modifications maximum)
- Envoi via WhatsApp / lien partageable
- RSVP temps réel avec accompagnants
- QR code invité + check-in jour J
- Musique de fond sur la page d'invitation
- Interface en 3 langues (FR/EN/DE)

**Premium (8 000 FCFA / 11,99 € par trimestre) :**
- Tout le Freemium +
- Invités illimités
- 12 modifications IA + chatbot IA interactif
- Multi-cérémonie (plusieurs cérémonies simultanées)
- Plan de table drag & drop
- Projection live photos (avec modération)
- Livre d'or enrichi (texte + vocal + vidéo courte)

**VIP (15 000 FCFA / 21,99 € par trimestre) :**
- Tout le Premium +
- Modifications IA illimitées + chatbot IA
- Suivi budget (budget de départ + lignes de dépenses + solde temps réel)
- Coordination prestataires (liste + tâches + contact direct)
- Orientation invités (adresse + navigation + indications personnalisées)

### Moyens de paiement

| Zone | Moyens acceptés |
|---|---|
| Afrique (UEMOA) | Wave, Orange Money, Free Money, carte bancaire |
| Afrique (autre) | Mobile money local via agrégateur, carte bancaire |
| Europe | Carte bancaire (Visa, Mastercard) |

**Agrégateur recommandé pour l'Afrique :** un agrégateur unique couvrant Wave, Orange Money, et les principaux wallets mobile money de la zone — évite d'intégrer chaque opérateur séparément.

### Projection de conversion

- Objectif : 3-5% de conversion Freemium → Premium en 90 jours.
- Levier principal : la limite de 20 invités force naturellement l'upgrade dès qu'un utilisateur organise un événement réel (un baptême africain dépasse quasi-toujours 20 personnes).
- Levier secondaire : le plan de table et la projection live sont des features visuellement démontrées dans le dashboard Freemium (aperçu verrouillé) pour susciter l'envie.

---

## 7. Métriques de succès

### Métriques d'acquisition (Mois 1-3)

| KPI | Objectif M1 | Objectif M3 | Comment mesurer |
|---|---|---|---|
| Inscriptions totales | 200 | 1 000 | Comptes créés |
| Cérémonies créées | 80 | 400 | Cérémonies avec ≥ 1 invité ajouté |
| Coût d'acquisition (hors paid) | 0 FCFA | 0 FCFA | Croissance organique + WhatsApp viral |

### Métriques d'activation

| KPI | Objectif | Définition |
|---|---|---|
| Taux d'activation J+1 | > 40% | % d'inscrits qui créent une cérémonie et ajoutent ≥ 1 invité dans les 24h |
| Taux d'invitation envoyée | > 60% | % de cérémonies créées où ≥ 1 invitation est effectivement envoyée (WhatsApp ou lien) |
| Taux de RSVP | > 50% | % d'invités qui répondent (confirmé ou décliné) parmi ceux qui ont reçu l'invitation |

### Métriques de conversion

| KPI | Objectif M3 | Définition |
|---|---|---|
| Freemium → Premium | 3-5% | % d'utilisateurs Freemium qui passent Premium dans les 90 jours |
| Premium → VIP | 10-15% | % de Premium qui upgradent vers VIP |
| Revenu trimestriel | 400 000 FCFA | ~50 Premium × 8 000 FCFA |

### Métriques d'engagement (jour J)

| KPI | Objectif | Définition |
|---|---|---|
| QR codes scannés | > 70% | % d'invités confirmés qui scannent leur QR le jour J |
| Photos soumises (projection live) | > 15 par cérémonie | Nombre moyen de photos envoyées par les invités |
| Messages livre d'or | > 10 par cérémonie | Messages (texte + vocal + vidéo) laissés |

### Métrique virale

| KPI | Objectif | Définition |
|---|---|---|
| Coefficient viral (K) | > 1.2 | Chaque utilisateur génère en moyenne 1.2 nouvel inscrit (invités qui deviennent organisateurs pour leur propre cérémonie) |

---

## 8. Ce qui est HORS SCOPE V1

| Feature exclue | Raison |
|---|---|
| **Paiement intégré / cagnotte** | Trop de complexité réglementaire et technique (licences fintech, sécurité des fonds). Le suivi budget est du tracking uniquement. |
| **Vidéo dans la projection live** | Les vidéos sont trop lourdes pour la connectivité africaine (3G) et compliquent la modération. Photos uniquement en V1. |
| **App native iOS/Android** | L'app est une application web responsive (PWA possible). Pas de développement natif en V1 — 85% du trafic sera mobile via navigateur. |
| **Marketplace de prestataires** | La coordination prestataires VIP est un carnet de contacts simple, pas une marketplace avec profils, avis et réservation en ligne. Trop complexe pour V1. |
| **Thèmes d'invitation personnalisables par l'utilisateur** | L'IA génère le design. Pas de "template store" en V1. Si l'utilisateur veut un changement, il utilise ses crédits de modification IA. |
| **Gestion des régimes alimentaires** | Certains concurrents le proposent (Invyt). Hors scope V1 — pourrait être ajouté en V2 via un champ optionnel au RSVP. |
| **Intégration calendrier (Google Calendar, iCal)** | Nice-to-have pour V2, pas indispensable au lancement. |
| **Notifications push** | En tant qu'app web, les notifications push navigateur sont peu fiables en Afrique. V1 s'appuie sur WhatsApp et email pour les rappels. |
| **Mode hors-ligne complet** | Complexe à implémenter. V1 nécessite une connexion. Un mode hors-ligne basique (consultation du QR code en cache) pourrait être ajouté en V2. |
| **Renouvellement automatique de l'abonnement** | Le modèle trimestriel est à paiement manuel volontaire. Pas de prélèvement automatique en V1 (pas adapté aux habitudes du marché). |

---

## 9. Risques et mitigation

### Risque 1 — Limite de 20 invités trop restrictive pour le marché
**Description :** Les cérémonies africaines rassemblent facilement 50 à 300 personnes. 20 invités en Freemium pourrait décourager les utilisateurs avant qu'ils n'aient vu la valeur du produit (ils quittent avant d'upgrader).
**Probabilité :** Moyenne
**Impact :** Fort
**Mitigation :** Surveiller de près le taux d'abandon au moment de l'ajout du 21e invité. Si plus de 50% des utilisateurs Freemium abandonnent à ce stade sans upgrader dans les 30 premiers jours, envisager de relever la limite à 30-40 invités. Le bouche-à-oreille dépend du nombre d'invités exposés à l'app.

### Risque 2 — Qualité insuffisante de la génération IA
**Description :** Si les invitations générées par l'IA ne sont pas culturellement pertinentes (mauvais ton pour un deuil, formules inadaptées pour un mariage traditionnel ouest-africain), les utilisateurs perdent confiance dès la première utilisation.
**Probabilité :** Moyenne-haute
**Impact :** Critique
**Mitigation :** Constituer une base d'exemples d'invitations réelles par type de cérémonie ET par culture (Sénégal, Cameroun, Côte d'Ivoire, RDC, diaspora). Faire tester les sorties IA par un panel de 10-15 utilisateurs cibles avant le lancement. Itérer sur le prompt engineering en continu pendant les 3 premiers mois.

### Risque 3 — Projection live inutilisable le jour J (connectivité)
**Description :** Le jour de la cérémonie, si la connexion internet du lieu est faible, les invités ne peuvent pas envoyer de photos et la projection tombe à plat — sur la feature la plus visible du palier Premium.
**Probabilité :** Haute (en Afrique, la connectivité des salles de fête est imprévisible)
**Impact :** Fort (déception client, risque de demande de remboursement)
**Mitigation :** Optimiser les photos envoyées (compression automatique côté client avant envoi). Prévoir un mode "file d'attente" : les photos s'envoient dès que la connexion revient (upload différé). Recommander dans l'app : "Vérifiez la connexion internet du lieu la veille".

### Risque 4 — Faible conversion Freemium → Payant
**Description :** Les utilisateurs Freemium trouvent le palier gratuit suffisant (20 invités conviennent pour les petites cérémonies) et ne ressentent pas le besoin d'upgrader.
**Probabilité :** Moyenne
**Impact :** Fort (business model compromis)
**Mitigation :** Rendre les features Premium/VIP visibles mais verrouillées dans le dashboard Freemium (aperçu du plan de table avec cadenas, démo de la projection live). Envoyer un message in-app après la cérémonie : "Votre prochain événement avec plan de table et livre d'or ? Passez en Premium." Offrir une remise de 20% sur le premier trimestre Premium après le premier événement Freemium réussi.

### Risque 5 — Adoption lente par la cible non-tech (Fatou, 52 ans)
**Description :** Les organisatrices de cérémonies les plus fréquentes en Afrique (femmes 40-60 ans) ne sont pas à l'aise avec le digital. Elles ont un smartphone mais utilisent principalement WhatsApp et les appels.
**Probabilité :** Haute
**Impact :** Moyen (limite le marché adressable, mais la diaspora compense)
**Mitigation :** L'interface doit être radicalement simple (3 clics max pour créer et envoyer une invitation). Prévoir des vidéos tuto courtes (30-60s) en français, accessibles depuis l'app. Activer un canal WhatsApp de support client. Miser sur le scénario "le neveu/la nièce en diaspora crée l'événement pour sa tante" — le produit est utilisé PAR la diaspora POUR la famille restée au pays.