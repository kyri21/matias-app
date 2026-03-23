# CLAUDE.md — Matias PWA (v6)

## ⚠️ RÈGLES ABSOLUES — lire avant toute action

1. **Ne JAMAIS appeler `initializeApp()`** dans un module ou une page.
   → Seul `src/firebase/config.ts` initialise Firebase, une seule fois.

2. **Un seul projet Firestore : `cuisine-yorgios`.**
   → `src/modules/cuisine/firebase/firebase.ts` est un simple re-export de `src/firebase/config.ts`.
   → Aucun autre projet Firebase n'est utilisé nulle part.

3. **Toujours importer** `db`, `auth`, `storage` directement depuis `src/firebase/config.ts`.

4. **Modules indépendants** → zéro import croisé entre modules.
   Exception autorisée : `src/pages/CommandePublique.tsx` importe `CommandeFormBody`
   depuis `modules/corner/pages/Commandes.tsx`.

5. **Rôle `administrateur`** = alias de `patron` (mêmes droits complets).
   → Partout où `patron` est vérifié, ajouter `administrateur`.

6. **Deploy functions** → toujours compiler d'abord :
   ```bash
   cd functions && npm run build && cd .. && firebase deploy --only functions:nomFonction
   ```

7. **Températures** → doc ID format : `{YYYY-MM-DD}_{fridgeId}_{session}` (session = `matin` ou `soir`).
   → Ne plus utiliser l'ancien format `{date}_{fridgeId}` sans session.

---

## Projet Firebase

- **Project ID** : `cuisine-yorgios`
- **Firestore DB ID** : `test`
- **Région Functions** : `europe-west1`
- **Auth** : Email / Password
- **Hosting URL** : https://cuisine-yorgios.web.app
- **Service account** : `cuisine-yorgios-firebase-adminsdk-fbsvc-1c759ed390.json` (racine, NE PAS commiter)
- ~~`yorgios-app-6a715-e74c29ecbcc3.json`~~ → ancien projet Streamlit, NE PAS utiliser

---

## Équipe & Rôles

| Rôle | Accès | Redirection login |
|------|-------|-------------------|
| `patron` | Tout | `/planning` |
| `administrateur` | Tout (= patron) | `/planning` |
| `manager` | Planning + Corner + CA + Commandes + Pointages | `/planning` |
| `corner` | `/corner` (+ CA lecture seule) + `/messages` + `/planning` (lecture) + `/pointage` | `/corner` |
| `cuisine` | `/cuisine` + `/messages` + `/pointage` | `/cuisine` |

### Utilisateurs connus
| Nom | Rôle |
|-----|------|
| Alexandre | `patron` |
| Arthur | `administrateur` |
| Sébastien | `manager` (supervise, ne pointe pas) |
| Ali, Timour, Perikles, Célestin, Dayoko | `cuisine` |
| Markella, Mellina, Elena, Wahib | `corner` |

---

## Structure dossiers
```
src/
  firebase/
    config.ts           ← UNIQUE initializeApp() — DB 'test' — projet cuisine-yorgios
    messaging.ts        ← FCM
  modules/cuisine/
    firebase/firebase.ts ← re-export de src/firebase/config.ts + ensureAnonAuth()
  auth/
    useAuth.ts / AuthGuard.tsx
  router/index.tsx
  components/
    Layout.tsx          ← sidebar dark + bottom nav + bouton ⣿ Corner/Cuisine + lien Pointages + Paramètres
    ModuleGridPanel.tsx ← grille 3×3 sous-pages Corner/Cuisine (bottom sheet)
  pages/
    Login.tsx
    CommandePublique.tsx
    CA.tsx              ← lecture seule si role=corner
    AdminUsers.tsx
    AdminSettings.tsx   ← /admin/settings (patron/admin) — Firestore: settings/
    AdminPointages.tsx  ← /admin/pointages — relevés hebdo/mensuel + export CSV
    Pointage.tsx        ← onglets Aujourd'hui / Historique (semaine)
    AllergeneMenu.tsx   ← /admin/allergenes (patron/admin/manager) — fiche allergènes client + impression A4
    Profile.tsx
  modules/
    planning/           ← COMPLET — vue mobile distincte (MobilePlanningView)
      components/
        Mobile/MobilePlanningView.tsx ← vue jour par jour pour mobile < 768px
        Grid/PlanningGrid.tsx         ← grille desktop (drag-paint)
    cuisine/            ← COMPLET — Livraisons, Fabrication, Temperatures, Reception, Controle
    corner/             ← COMPLET — 10 pages (dont CA lecture seule pour corner)
      pages/
        Temperatures.tsx ← 2 relevés/jour (matin + soir), doc ID {date}_{fridgeId}_{session}
        Hygiene.tsx      ← items mis à jour pour correspondre à l'Excel réel
        Livraison.tsx / Ruptures.tsx / Commandes.tsx / StockageFrigo.tsx
    messagerie/         ← COMPLET

scripts/
  import_historique.py  ← Import Excel → Firestore — SA key: cuisine-yorgios-firebase-adminsdk-fbsvc-1c759ed390.json

functions/
  src/index.ts          ← 16 Cloud Functions
  .env                  ← GCAL_CALENDAR_ID + GMAIL_USER + GMAIL_APP_PASSWORD

reference/data/
  releve_temperature.xlsx    ← données historiques températures (importées ✅)
  Hygiene.xlsx               ← checklists hygiène historiques (importées ✅)
  europoseidon_liaison.xlsx  ← livraisons température + objectifs CA (importés ✅)
  Liste_produits_Yorgios.xlsx
```

---

## Collections Firestore (DB `test`)

| Collection | Accès | Usage |
|-----------|-------|-------|
| `users` | tous (own) + patron/admin/manager (all) | profils, role, fcmToken, employeeId |
| `employees` | patron/admin/manager | employés planning |
| `planningWeeks` | lecture tous, écriture patron/admin/manager | semaines planning |
| `produits` | lecture tous, écriture patron/admin/manager | catalogue produits — champs: `name`, `abrv`, `defaultCategory`, `dlcDays`, `allergenes[]`, `active`, `inVitrine`, `inReception`, `inMenu` |
| `receptions` | cuisine | réceptions HACCP |
| `lots_cuisine` | cuisine | lots fabrication |
| `lot_counters` | cuisine | séquences numéros de lot |
| `livraisons` | tous | livraisons cuisine → corner (departTempC, receptionTempC, result…) |
| `temperatures` | tous | relevés frigos — doc ID `{date}_{fridgeId}_{session}` (matin/soir) |
| `archives` | cuisine | archives mensuelles |
| `hygiene_corner` | corner | checklists — doc ID `{date}_quotidien` / `{YYYY-WXX}_hebdo` / `{YYYY-MM}_mensuel` |
| `corner_stock` | corner | produits vitrine avec DLC |
| `corner_commandes` | corner | ruptures jour (legacy) |
| `messages` | tous | messagerie interne (TTL 7j) |
| `commandes_externes` | create public, read/update corner | commandes clients |
| `non_conformites` | corner | livraisons refusées + décisions |
| `objectifs_ca` | patron/admin/manager (écriture) — corner (lecture) | CA mensuel (doc ID = YYYY-MM) |
| `stockage_frigo` | tous | stock frigos corner |
| `pointages` | write tous, read patron/admin/manager | pointages GPS |
| `notifications_log` | own uniquement | anti-doublon notifs |
| `settings` | patron/admin | paramètres app (notifications, emails, exports) |

---

## Cloud Functions déployées (`europe-west1`) — 16 fonctions

| Fonction | Déclencheur | Rôle |
|----------|------------|------|
| `onNewMessage` | Firestore create `messages/{id}` | Push FCM à tous sauf expéditeur |
| `purgeOldMessages` | Scheduler quotidien | Supprime messages expiresAt < now |
| `onNewCommande` | Firestore create `commandes_externes/{id}` | Push FCM patron + manager |
| `onCommandeUpdated` | Firestore update `commandes_externes/{id}` | Acceptée → GCal + FCM ; Refusée/Livrée → FCM |
| `notifCommandesJ2` | Scheduler 14h00 | Rappel J-2 livraisons |
| `notifCommandesJJ` | Scheduler 09h00 | Rappel jour-J livraisons |
| `onCommandePrete` | httpsCallable | FCM patron+manager+cuisine + message messagerie |
| `onPointageLate` | Firestore create `pointages/{id}` | Email si retard > 10 min (⏳ credentials Gmail manquants) |
| `notifTemperatures` | Scheduler 8h30 | FCM corner si frigos non saisis ✅ corrigé format `_matin` |
| `notifTooGoodToGo` | Scheduler 9h00 | FCM aux employés ayant pointé |
| `notifPlatsJour` | Scheduler 11h00 | FCM cuisine + corner |
| `notifUrgences` | Scheduler 15h00 | FCM aux employés ayant pointé |
| `createUser` | httpsCallable (patron/admin) | Créer un compte utilisateur |
| `deleteUser` | httpsCallable (patron/admin) | Supprimer un compte utilisateur |
| `onLivraisonTemperature` | Firestore create `livraisons/{id}` | FCM patron+admin+manager — départ |
| `onLivraisonReception` | Firestore update `livraisons/{id}` (receptionTempC null→valeur) | FCM patron+admin+manager — réception |

---

## Navigation — bouton ⣿ (grille modules)

- **Bottom nav mobile** : quand on est sur `/corner/*` ou `/cuisine/*`, l'icône de l'item devient ⣿ (9 points)
- Tapper ⣿ ouvre `ModuleGridPanel` : bottom sheet avec grille 3×3 des sous-pages (icônes colorées iOS)
- La page active est mise en avant (bordure orange, ombre colorée)
- Corner : Dashboard, Températures, Livraison, Hygiène, Vitrine, Frigo, Ruptures, Commandes, Contrôle, CA (manager+)
- Cuisine : Réception, Fabrication, Livraisons, Températures, Contrôle

---

## Planning — UI mobile vs desktop

- **Desktop** (≥ 768px) : grille complète drag-paint, cartes employés, tous les boutons
- **Mobile** (< 768px) : `MobilePlanningView` — vue jour par jour, lecture seule
  - Pills 7 jours avec point orange si employés planifiés
  - Cards par employé : initiales colorées, horaires (8h–16h), durée
  - Absences/événements avec emoji
  - Stats du jour (nb employés, total heures)
  - Navigation semaine ← →

---

## Pointage — relevés

- `/pointage` : onglet "Aujourd'hui" (existant) + onglet "Historique" (semaine, navigation ← →)
- `/admin/pointages` (patron/admin/manager) : relevés hebdo/mensuel + export CSV
  - Sélecteur Semaine / Mois avec navigation
  - Stats : employés présents, journées, sans départ
  - Export CSV UTF-8 BOM (compatible Excel)

---

## Frigos — mapping Excel → app

| Excel (ancien) | App (ID Firestore) | Nom affiché |
|----------------|--------------------|-------------|
| Frigo 1 / 2 / 3 (fusionnés) | `FRIGO_3P` | Frigo 3 portes |
| Vitrine 1 | `VITRINE_1` | Vitrine 1 |
| Vitrine 2 | `VITRINE_2` | Vitrine 2 |
| Vitrine 3 | `VITRINE_3` | Vitrine 3 |
| Grand frigo / Grand Frigo | `GRAND_FRIGO` | Grand frigo |

---

## Hygiène Corner — items (correspondance Excel ↔ app)

### Quotidien (13 items)
`plats_service`, `int_vitrines`, `ustensiles`, `meuble_vente`, `comptoir_balance`,
`micro_ondes`, `evier_papier`, `etiquettes`, `plan_travail`, `ext_placards`,
`ext_frigo`, `poubelle`, `vitres`

### Hebdomadaire (5 items)
`int_frigos`, `etageres_materiels`, `support_papier`, `placard_hygiene`, `machine_glacon`

### Mensuel (1 item)
`placard_rangement`

---

## PWA & Notifications push

- **Nom app** : `Matias` (manifest `name` + `short_name`)
- **Icône** : oeil grec (nazar/mati) — source dans `image icon app/`, déployée dans `public/icons/`
  - `icon-192.png` (192×192) et `icon-512.png` (512×512)
- `vite-plugin-pwa` — SW auto-généré
- `public/firebase-messaging-sw.js` — SW FCM background
- `VITE_FIREBASE_VAPID_KEY` dans `.env`
- Tokens FCM dans `users/{uid}.fcmToken`

---

## UI/UX — Design system (dark iOS)

- **Fond** `#000`, **Surface** `#1c1c1e`, **Surface 2** `#2c2c2e`, **Bordure** `#38383a`
- **Accent** orange `#E8760A`, **Danger** `#ff453a`, **Success** `#32d74b`, **Warning** `#ffd60a`
- **Font** : Inter
- **Layout mobile** : bottom nav + safe area iOS
- **Layout desktop** : sidebar 220px (`md:`)
- Toujours tester en navigation privée (SW cache)

---

## Routes

| Route | Auth | Accès |
|-------|------|-------|
| `/login` | Non | Public |
| `/commande` | Non | Public |
| `/planning/*` | Oui | patron, admin, manager, corner (lecture) |
| `/cuisine/*` | Oui | patron, admin, manager, cuisine |
| `/corner/*` | Oui | patron, admin, manager, corner |
| `/ca` | Oui | patron, admin, manager |
| `/messages` | Oui | tous |
| `/pointage` | Oui | tous sauf manager |
| `/profile` | Oui | tous |
| `/admin/users` | Oui | patron, admin |
| `/admin/settings` | Oui | patron, admin |
| `/admin/pointages` | Oui | patron, admin, manager |
| `/admin/produits` | Oui | patron, admin |
| `/admin/allergenes` | Oui | patron, admin, manager |

---

## État d'avancement

| Module / Feature | Statut |
|-----------------|--------|
| Planning | ✅ Complet |
| Planning — vue mobile distincte | ✅ Complet |
| Cuisine | ✅ Complet |
| Corner (10 pages dont CA lecture seule) | ✅ Complet |
| Messagerie | ✅ Complet |
| Commandes publiques + gestion | ✅ Complet |
| Non-conformités | ✅ Complet |
| Objectifs CA + Prime | ✅ Complet — lecture seule pour corner |
| Gestion utilisateurs `/admin/users` | ✅ Complet |
| Admin Paramètres `/admin/settings` | ✅ Complet |
| Stockage Frigo | ✅ Complet |
| Pointage GPS multi-zones | ✅ Complet — onglet Historique ajouté |
| Relevés pointage `/admin/pointages` | ✅ Complet — export CSV |
| Bouton ⣿ navigation modules (Corner/Cuisine) | ✅ Complet |
| Températures 2 relevés/jour (matin+soir) | ✅ Complet — UI compacte grille 5×2, un seul bouton save |
| Hygiène items = Excel réel | ✅ Complet — UI dark cohérente (plus de classes light mode) |
| Import historique Excel → Firestore | ✅ Exécuté — 3 540 docs importés |
| Import planning Excel → Firestore | ✅ Exécuté — 24 semaines (oct.2025→avr.2026) via `scripts/import_planning.py` |
| Import livraisons Excel → Firestore | ✅ Exécuté — 82 docs → `livraisons` via `scripts/import_livraisons.py` |
| Import vitrine historique Excel → Firestore | ✅ Exécuté — 3 916 docs `active:false` → `corner_stock` via `scripts/import_vitrine.py` |
| Cloud Functions (16) | ✅ Toutes déployées |
| notifTemperatures — format doc ID `_matin` | ✅ Corrigé et déployé |
| Email retard pointage | ✅ `GMAIL_APP_PASSWORD` configuré, `onPointageLate` + `weeklyHygieneRecap` redéployés |
| Protocoles PDF `/protocoles` | ❌ Non développé (décision reportée) |
| Notifications push avancées (frontend) | ❌ Pas encore développé |
| Icône PWA oeil grec + nom "Matias" | ✅ Complet — icône, `index.html`, manifest, Layout, Login |
| Login page — dark theme Matias | ✅ Complet — fond noir, inputs sombres, icône oeil |
| Vitrine — saisie lot multi-produits | ✅ Complet — date fab + DLC J+3 auto + sélection multiple |
| Node.js 22 upgrade (functions) | ✅ Complet — `firebase.json` + `functions/package.json` mis à jour, 16 fonctions redéployées |
| UI dark mode — Dashboard, CA, Livraison, Commandes, StockageFrigo, Vitrine mobile | ✅ Complet |
| UI dark mode — Ruptures.tsx | ✅ Complet |
| UI dark mode — Module cuisine complet (5 pages) | ✅ Complet — cuisine.css supprimé, dark iOS inline styles |
| Livraison corner — onglet Historique + photos cliquables | ✅ Complet — date picker, modal photo plein écran |
| Vitrine + Dashboard — tables DLC DÉPASSÉE / DLC du JOUR | ✅ Complet — tableaux rouge/jaune avec colonnes Produit/Fab/DLC |
| Contrôle corner — fix index Firestore temperatures | ✅ Corrigé — supprimé orderBy('session') qui nécessitait index composite |
| Contrôle — rapport hygiène complet + export Excel + PDF | ✅ Complet — pivot tables, 6 feuilles, jspdf-autotable |
| Hygiène — date picker pour saisie rétroactive | ✅ Complet |
| Login — redesign Patreon-style + oeil grec watermark | ✅ Complet — no card, fond noir, oeil en arrière-plan |
| Nommage Matias/Yorgios | ✅ Matias = app, Yorgios = restaurant. AdminSettings + DailyPointageGate → Matias |
| Seuil alarme températures corner | ✅ `ALERT_MIN = -3°C` dans `Temperatures.tsx` |
| Renommage "Commandes" → "Commandes clients" | ✅ `ModuleGridPanel.tsx` grille ⣿ |
| Push 22h températures soir manquantes | ✅ CF `notifTemperaturesEvening` déployée (scheduler 22h) |
| Email récap hebdo hygiène + températures | ✅ CF `weeklyHygieneRecap` déployée (lundi 8h) — `GMAIL_APP_PASSWORD` configuré ✅ |
| Bouton TooGoodToGo | ✅ Dashboard corner — deep link `toogoodtogo://fr-fr` + fallback web intelligent (visibilitychange) |
| Formulaire commandes clients — champs événement | ✅ `dateEvenement`, `typeEvenement`, `nombreConvives` — public + interne |
| Températures — vue semaine heatmap | ✅ Onglet "📊 Semaine" — grille frigos × 7 jours, nav semaine, stats |
| Dashboard corner — card Commandes clients | ✅ Remplace Ruptures — nb commandes aujourd'hui / cette semaine |
| Dashboard corner — hygiène 3 niveaux | ✅ Card Hygiène affiche Quotidien + Hebdo + Mensuel (Fait / À faire) |
| Push hygiène hebdo J-1 (samedi 18h) | ✅ CF `notifHygieneHebdo` déployée |
| Push hygiène mensuel J-1 (avant-dernier jour du mois 18h) | ✅ CF `notifHygieneMensuel` déployée |
| Messagerie — dark mode complet | ✅ Fond #000, barre input #1c1c1e, boutons dark, accent orange envoi |
| Profile — planning lié + export ICS | ✅ Complet — lier via `/admin/users` dropdown "LIEN PLANNING" ; bouton "Télécharger .ics" sous les shifts |
| Températures cuisine — 5 frigos corrects | ✅ Complet — Frigo 1 entrée, Grand frigo porte inox, Grand frigo porte verre, Frigo 2 milieu, Frigo four |
| Fabrication — edit + archive + supprimer lots | ✅ Complet — ✏️ modifier qté/date, ✓ Livré archive, 🗑 supprimer, 📦 voir archives |
| Réception — produits depuis Firestore | ✅ Complet — charge `inReception==true`, fallback tous actifs si aucun flag |
| AdminProduits `/admin/produits` | ✅ Complet — CRUD + 🏪 toggle `inVitrine` + 📋 toggle `inReception` + désactiver |
| Vitrine corner — 2 modes ajout | ✅ Complet — "✏️ Saisie manuelle" (liste Firestore `inVitrine`) + "📦 Depuis lot cuisine" (lots archivés) |
| StockageFrigo — ajout depuis lot cuisine | ✅ Complet — bouton "📦 Depuis cuisine" pré-remplit nom/qté/DLC |
| AdminSettings — fournisseurs réception | ✅ Complet — liste éditable dans Paramètres → `settings/reception.fournisseurs[]` |
| Produits Firestore — flags en masse | ✅ Script `scripts/setup_produits_flags.py` — 69 docs vides supprimés, `inVitrine` set par catégorie, 9 produits réception créés |
| Index Firestore composite | ✅ `firestore.indexes.json` — `lots_cuisine`: archived ASC + archivedAt DESC |
| Suppression "Yorgios" dans l'UI | ✅ Tout renommé "Matias" dans src/, public/, vite.config.ts (IDs Firebase cuisine-yorgios conservés) |
| Gmail credentials functions | ✅ `GMAIL_APP_PASSWORD` configuré dans `functions/.env`, fonctions redéployées |
| Planning — header responsive (wrap) + supprimer semaine | ✅ `flexWrap: wrap` — bouton 🗑 vide toute la semaine + sauvegarde Firestore immédiate |
| Livraison corner — onglet 📷 Galerie photos | ✅ Galerie filtrée par plage de dates, miniatures cliquables (départ + réception), modal plein écran |
| Vitrine corner — onglet 📋 Historique | ✅ Tableau filtrable : produit, lot, date ajout, date fab, DLC, date retirée, statut — plage de dates + recherche texte |
| Fabrication cuisine — QR code / étiquette lot | ✅ Bouton ⬛ sur chaque lot → modal QR (api.qrserver.com) + 🖨️ impression fenêtre dédiée (lotCode, produit, fab, DLC, qté) |
| Toast global | ✅ `src/hooks/useToast.ts` + `src/components/Toast.tsx` — 3 états (success/error/info), slide-up 2.5s, branché sur Hygiene, Temperatures, Vitrine, StockageFrigo, Fabrication, Pointage |
| Bandeau hors-ligne | ✅ Layout.tsx — listeners `online`/`offline`, bandeau orange fixed top, disparaît à la reconnexion |
| Heures totales par employé — AdminPointages | ✅ Bloc "Récapitulatif employés" : total heures + jours travaillés par personne sur la période |
| Dashboard corner — "À faire aujourd'hui" | ✅ Card en tête de dashboard : Hygiène quotidienne, Temp matin, Temp soir (jaune <17h / rouge ≥17h), DLC vitrine — vert/rouge + navigation directe |
| Allergènes produits — AdminProduits | ✅ Champ `allergenes: string[]` — 14 allergènes INCO 2014, checkboxes dark iOS, badges orange dans la liste, sauvegardé dans Firestore `produits` |
| Allergènes — affichage dans Reception.tsx | ✅ Bloc orange ⚠️ avec badges après sélection produit si allergènes présents |
| Fiche Allergènes `/admin/allergenes` | ✅ Complet — toggle "en vente" (`inMenu`) persisté Firestore, ajout nouveau produit + allergènes, édition allergènes existants, impression A4 tableau 14 colonnes headers verticaux |

---

## 🔴 À FAIRE — prochaine session

### 1. Protocoles PDF `/protocoles`
- Non développé (décision reportée)

## Cloud Functions déployées — liste complète (18 fonctions)

| Fonction | Déclencheur | Rôle |
|----------|------------|------|
| `onNewMessage` | Firestore create `messages/{id}` | Push FCM à tous sauf expéditeur |
| `purgeOldMessages` | Scheduler quotidien | Supprime messages expiresAt < now |
| `onNewCommande` | Firestore create `commandes_externes/{id}` | Push FCM patron + manager |
| `onCommandeUpdated` | Firestore update `commandes_externes/{id}` | Acceptée → GCal + FCM ; Refusée/Livrée → FCM |
| `notifCommandesJ2` | Scheduler 14h00 | Rappel J-2 livraisons |
| `notifCommandesJJ` | Scheduler 09h00 | Rappel jour-J livraisons |
| `onCommandePrete` | httpsCallable | FCM patron+manager+cuisine + messagerie |
| `onPointageLate` | Firestore create `pointages/{id}` | Email si retard > 10 min (⏳ GMAIL_APP_PASSWORD manquant) |
| `notifTemperatures` | Scheduler 8h30 | FCM si frigos matin non saisis |
| `notifTemperaturesEvening` | Scheduler 22h00 | FCM si frigos soir non saisis |
| `notifTooGoodToGo` | Scheduler 9h00 | FCM aux employés ayant pointé |
| `notifPlatsJour` | Scheduler 11h00 | FCM cuisine + corner |
| `notifUrgences` | Scheduler 15h00 | FCM aux employés ayant pointé |
| `notifHygieneHebdo` | Scheduler samedi 18h | FCM si checklist hebdo non faite |
| `notifHygieneMensuel` | Scheduler 28-31 du mois 18h | FCM si checklist mensuelle non faite (avant-dernier jour) |
| `weeklyHygieneRecap` | Scheduler lundi 8h | Email récap températures + hygiène manquants |
| `createUser` | httpsCallable | Créer un compte utilisateur |
| `deleteUser` | httpsCallable | Supprimer un compte utilisateur |

---

## Corrections importantes apportées

### Bug timezone `weekId` (planning)
- `weekId()` dans `src/modules/planning/firebase/planning.ts` utilisait `.toISOString()` (UTC)
- En France (UTC+1), minuit local = veille 23h UTC → mauvaise clé Firestore
- **Fix** : utilise désormais `toLocalISO(monday)` (date locale)

### Import planning Excel
- Script : `scripts/import_planning.py`
- Mapping initiales : D=Arthur, S=Sébastien, A=Alexandre, E=Elena, K=Markella, Y=Layal, N=Mellina, X=Wahib
- 24 semaines importées, 3 feuilles ignorées (dates manquantes)
- Relancer : `python3 scripts/import_planning.py [--dry-run]`

### Vitrine — structure Firestore enrichie
- Nouveaux champs : `fabricationAt` (Timestamp), `dateAjout` (Timestamp)
- DLC = fabrication + 3 jours (calculé côté client, non modifiable)

---

## Règles GEP — températures livraison

| Catégorie | Max standard | Max tolérance |
|-----------|-------------|---------------|
| Viande hachée | 2°C | 3°C |
| Viande | 3°C | 5°C |
| Poisson | 2°C | 3°C |
| Lait | 4°C | 6°C |
| Plat cuisiné frais | 3°C | 5°C |
| Pâtisserie fraîche | 3°C | 5°C |
| Légumes | 8°C | 10°C |

---

## Commandes utiles
```bash
npm run dev
npm run deploy                                                         # build + hosting
cd functions && npm run build && cd .. && firebase deploy --only functions:nomFonction
firebase deploy --only firestore:rules
python3 scripts/import_historique.py --dry-run                        # test import
python3 scripts/import_historique.py                                  # import réel
```

## Variables d'environnement (`.env` racine)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

## Variables d'environnement (`functions/.env`)
```
GCAL_CALENDAR_ID=yorgios.system@gmail.com
GMAIL_USER=a.cozzika@gmail.com
GMAIL_APP_PASSWORD=xxxx     ← à configurer (myaccount.google.com > Mots de passe des applications)
```

> ⚠️ Node.js 20 → déprécié 30/04/2026 : upgrade vers Node 22 dans `functions/package.json` avant cette date.

---

## 🚀 Mettre le code sur GitHub (sauvegarde sécurisée)

> L'app tourne déjà seule : Firebase Hosting + Functions + Firestore sont dans le cloud.
> GitHub sert uniquement à sauvegarder le **code source**.

### Fichiers à NE JAMAIS commiter (déjà dans .gitignore)
- `cuisine-yorgios-firebase-adminsdk-fbsvc-1c759ed390.json` — clé service account Firebase
- `functions/.env` — GMAIL_APP_PASSWORD
- `.streamlit/secrets.toml` — anciens secrets Streamlit
- `memory/` — mémoire Claude locale

### Procédure complète (à faire une seule fois)

```bash
# 1. Vérifier que les fichiers sensibles sont bien ignorés
git status --short
# ✅ Les fichiers .json service account et functions/.env ne doivent PAS apparaître

# 2. Ajouter tous les fichiers source
git add .

# 3. Vérifier ce qui sera commité (RELIRE avant de continuer)
git diff --staged --name-only

# 4. Commiter
git commit -m "Initial commit — Matias PWA v6"

# 5. Pousser sur GitHub
git push origin main
```

### Où retrouver les secrets si tu changes d'ordinateur
Ces fichiers NE sont PAS sur GitHub — à conserver en lieu sûr (ex: clé USB chiffrée, 1Password) :

| Fichier | Où le retrouver |
|---------|----------------|
| `cuisine-yorgios-firebase-adminsdk-fbsvc-1c759ed390.json` | Firebase Console → Paramètres projet → Comptes de service → Générer une nouvelle clé |
| `functions/.env` | Remettre manuellement : `GCAL_CALENDAR_ID`, `GMAIL_USER`, `GMAIL_APP_PASSWORD` |
| `.env` (racine) | Firebase Console → Paramètres projet → Vos applications → Config SDK |

### Pour cloner sur un nouvel ordinateur
```bash
git clone https://github.com/kyri21/yorgios-app.git
cd yorgios-app
npm install

# Remettre les fichiers secrets (voir tableau ci-dessus)
# Copier cuisine-yorgios-firebase-adminsdk-fbsvc-1c759ed390.json à la racine
# Créer .env avec les variables Firebase
# Créer functions/.env avec GMAIL_APP_PASSWORD

npm run dev        # développement local
npm run deploy     # build + push Firebase Hosting
```
