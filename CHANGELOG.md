# Changelog

Toutes les modifications notables de Nutritor sont documentées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

---

## [Unreleased]

---

## [0.38.0] — 2026-06-01

### Ajouté
- **Déploiement web sur Netlify** — l'application est maintenant accessible sur [nutritor.netlify.app](https://nutritor.netlify.app) sans installation
  - `netlify.toml` : commande `npx expo export --platform web`, dossier `dist/`, redirect SPA `/* → /index.html`, cache long (`immutable`) sur les assets hachés `_expo/static/*`
  - `src/utils/webDownload.ts` : utilitaire cross-platform — `downloadBlob()` (Blob + ancre HTML, déclenche le téléchargement navigateur) et `readFileAsText()` (lecture via `fetch()` sur web, `expo-file-system` sur native)

### Modifié
- **Exports CSV/JSON/HTML** (`AppShell`, `SettingsScreen`) : branche `Platform.OS === 'web'` → téléchargement direct via `downloadBlob()` ; comportement mobile inchangé (FileSystem + Sharing)
  - Journal CSV, symptômes CSV, aliments CSV, rapport HTML professionnel
  - Bibliothèque d'aliments JSON, bibliothèque de plats JSON
- **Imports JSON/CSV** (`SettingsScreen`) : lecture du fichier via `readFileAsText()` qui fait `fetch(blob_uri)` sur web au lieu de `FileSystem.readAsStringAsync` — `expo-document-picker` fonctionne nativement sur web (input `<file>`)
- **`BarcodeScannerScreen`** : restructuré en deux composants (`BarcodeScannerNative` + `BarcodeScannerWeb`) ; le composant public dispatche selon `Platform.OS`. Sur web : champ de saisie EAN + bouton recherche + lookup Open Food Facts — même résultat que le scan natif
- **`ShoppingScannerScreen`** : même pattern — `ShoppingScannerNative` + `ShoppingScannerWeb` avec saisie manuelle du code-barres

### Notes techniques
- `@react-native-async-storage/async-storage` v2.2 supporte `localStorage` nativement sur web — aucune modification requise
- La structure des composants camera respecte les règles des Hooks React : le dispatcher public n'appelle aucun hook, les hooks restent dans les composants feuilles (`*Native`, `*Web`)

---

## [0.37.0] — 2026-05-27

### Ajouté
- **Nutri-Score Perso** — score personnalisé A-E calculé selon le profil utilisateur
  - `src/utils/nutriScorePerso.ts` : wrapper de `computeCompatibilityScore()`, grades A (≥80) à E (<20), blockers, positives, texte d'explication
  - `src/components/NutriScoreBadge.tsx` : badge circulaire compact (score + lettre, couleur par grade) + modal détail avec blockers (rouge) et positives (vert)
  - `DetailScreen` : `NutriScoreBadge` affiché à côté de la `CompatCard` dans la fiche aliment
- **Comparateur de produits** — comparaison côte à côte de 2 aliments
  - `src/screens/ComparateurScreen.tsx` : NutriScore Perso, macros/100g (gagnant surligné en vert), FODMAP, Allergènes, footer ajout au journal
  - `FoodListScreen` : bouton `columns` dans la topbar → mode sélection → 2 aliments → `ComparateurScreen`
  - `AppShell` : routing `'comparateur'` + état `comparateurFoods`
- **Suivi du sommeil enrichi**
  - `SymptomEntry.sleepDuration?: number` (4-12 h, pas 0.5 h) dans `src/types/symptoms.ts`
  - `SymptomWidget` : stepper durée de sommeil + emoji picker qualité (😴/😐/😊 → `scores.sleep`)
  - `StatsScreen` : section "Sommeil & digestion" (Expert uniquement, ≥7 nuits) — courbes superposées durée sommeil / énergie / douleurs abdominales + corrélation textuelle automatique
- **Export / Import CSV**
  - `src/services/csvService.ts` : exports journal, symptômes, aliments en CSV UTF-8 BOM + import journal avec parsing complet (champs quotés, matching repas par nom)
  - `SettingsScreen` : section "Export / Import CSV" avec 3 exports + 1 import
- `Icon` : 5 nouvelles icônes (`x`, `check-circle`, `arrow-left`, `columns`, `file-text`)
- Traductions : clés `settings.sectionCSV`, `exportJournalCSV`, `exportSymptomsCSV`, `exportFoodsCSV`, `importJournalCSV` (+ `Desc`) dans `fr.ts` + `en.ts`

---

## [0.36.0] — 2026-05-27

### Ajouté
- **Mode Débutant / Expert global** — bascule persistante appliquée à toute l'application
  - `src/contexts/ModeContext.tsx` : `AppMode = 'beginner' | 'expert'`, `ModeProvider`, `useMode()` hook — persisté via `usePersistedState` sur `KEYS.appMode`
  - `src/components/ModeOnboarding.tsx` : overlay plein-écran affiché une seule fois après l'onboarding — deux cartes 🙂 Débutant / 🤸 Expert
  - Badge flottant gauche dans `AppShell` : `🙂 Débutant` (couleur signal) ou `🔬 Expert` (couleur ok), cliquable vers les Paramètres
  - `SettingsScreen` : section "Interface" avec toggle Débutant / Expert et description contextuelle
  - `src/storage/store.ts` : clés `appMode` et `modeSelected`

### Modifié (adaptations par écran en mode débutant)
- **HomeScreen** : timeline filtrée sur 4 événements principaux, mini-métriques masquées
- **PhysioTimeline** : section "Et si…" (simulation nutritionnelle) masquée
- **DetailScreen** : sections micronutriments, bioactifs, métabolique et sensorielle masquées — apports, FODMAP, allergènes et composition restent visibles
- **KnowledgeScreen** : toggle local initialisé depuis le mode global
- **StatsScreen** : onglets "Mois" et "Bien-être" masqués — seul l'onglet "Semaine" reste
- **ProfileScreen** : export professionnel, carte FODMAP, mémoire digestive et résultats biologiques masqués
- **i18n** : clés `mode.*` et `settings.sectionInterface` ajoutées dans `fr.ts` + `en.ts`

---

## [0.35.0] — 2026-05-27

### Ajouté
- **Mode Défi 30 jours** — 3 protocoles intégrés avec suivi quotidien
  - `src/types/challenge.ts` : types `ProtocolId`, `DailyObjective`, `DailyCheckIn`, `Challenge`
  - `src/data/challenge.ts` : protocoles FODMAP 28j, Anti-inflammatoire 30j, Sans gluten 21j + helpers (`getDayNumber`, `getStreak`, `getCompletionPct`, `createChallenge`)
  - `ChallengeScreen` : picker protocoles → dashboard (anneau progression, checklist objectifs du jour, calendrier historique, streak, abandon)
  - `HomeScreen` : widget `ChallengeWidget` compact (barre progression + count objectifs) visible quand défi actif
  - `DrawerMenu` : section "Protocoles" avec liens Challenge et FODMAP, icône verte si défi actif
  - Persistance : `KEYS.challenge = 'nutritor:challenge'`
  - Intégration FODMAP : le protocole `fodmap-elimination` ouvre automatiquement `FodmapScreen` au démarrage

---

## [0.34.0] — 2026-05-24

### Ajouté
- **Internationalisation complète (i18n)** — toute l'interface est maintenant traduite en français et en anglais via `i18next` / `react-i18next`
  - `src/i18n/fr.ts` et `src/i18n/en.ts` : ~900 clés de traduction couvrant les 20 écrans, les composants, les messages d'alerte, les labels et les descriptions
  - `src/i18n/index.ts` : initialisation `i18next` avec détection automatique et fallback `fr`
- **Sélecteur de langue dans les Paramètres** — nouvelle section "Langue" avec deux pills FR / EN
  - Le choix est persisté dans `AppSettings.language` (AsyncStorage)
  - `AppShell` recharge la langue sauvegardée au démarrage via `i18n.changeLanguage()`
  - Le changement de langue est instantané (rechargement reactif de tous les composants)

---

## [0.33.1] — 2026-05-23

### Ajouté
- **Import / Export de la bibliothèque de plats** (`SettingsScreen`) : nouvelle section "Bibliothèque de plats"
  - **Export** : sérialise tous les `SavedPlate[]` en JSON (`nutritor_plats.json`) et partage via le système (AirDrop, email, Google Drive…)
  - **Import** : sélectionne un fichier JSON, valide la structure (`id`, `name`, `kcal`), fusionne les nouveaux plats sans écraser les existants (déduplication par `id`)
  - `SettingsScreen` : nouveaux props `savedPlates`, `onImportPlates` ; deux lignes dédiées avec indicateurs de chargement
  - `AppShell` : handler `onImportPlates` câblé (filtre par `Set<id>`)

---

## [0.33.0] — 2026-05-23

### Ajouté
- **Journal de symptômes enrichi** : 6 métriques remplacent les 4 anciennes — `abdominal` (douleurs), `bloating` (ballonnements), `energy` (énergie), `transit`, `sleep` (sommeil), `inflammation` (inflammation perçue) — scores 0–4, -1 = non renseigné
- **Moteur de corrélation aliment → symptômes** (`src/services/symptomCorrelation.ts`, nouveau fichier)
  - 10 facteurs alimentaires : Polyols, Fructanes, Lactose, Fructose en excès, GOS (légumineuses), Gluten, Histamine, Aliments gras, Caféine, Alcool
  - Détection mot-clé (insensible aux accents) sur les noms d'ingrédients des repas
  - Comparaison des scores de symptômes les jours avec vs sans chaque facteur (minimum 3 jours par groupe)
  - Effet retard : même jour + lendemain (J+1) pour les facteurs alimentaires
  - Score de "badness" normalisé selon `cfg.inverse` (nul, croissant ou décroissant)
  - Retourne le top 10 corrélations, déduplicatées par paire facteur × symptôme, triées par force (forte > modérée > faible)
- **Résultats biologiques dans le profil** : interface `BioResult` { name, value, unit, date?, status?: 'low'|'normal'|'high', note? } dans `src/data/user.ts`
  - Nouveau champ `UserProfile.bioResults?: BioResult[]`
  - Nouveau champ `UserProfile.medications?: string[]`
  - Formulaire complet dans `EditProfileScreen` : saisie nom/valeur/unité, sélection statut avec pills colorés (Bas/Normal/Élevé), suppression, ajout dynamique
  - Section médicaments : pill list + champ saisie + touche "Ajouter"
- **Rapport professionnel enrichi** (`src/services/professionalReport.ts`) : 4 nouvelles sections
  - **Bien-être & Symptômes 30j** : barres visuelles colorées (vert < 30 %, ambre < 60 %, rouge ≥ 60 %) pour chaque métrique sur les 30 derniers jours renseignés
  - **Corrélations aliment → symptômes** : table facteur / symptôme / direction (↑ Aggravé / ↓ Amélioré) / force (badges) / scores moyens avec vs sans
  - **Résultats biologiques** : table avec marqueur, valeur+unité, badge statut (Bas/Normal/Élevé), date, note
  - **Médicaments en cours** : liste en pills

---

## [0.32.0] — 2026-05-23

### Ajouté
- **Photo de profil** : l'avatar circulaire de la page Profil est maintenant cliquable (badge caméra en bas à droite) — ouvre la galerie via `expo-image-picker`, recadrage carré, URI sauvegardée dans `UserProfile.photoUri`
- Photo affichée dans la page Profil et dans le menu hamburger si définie, sinon l'initiale reste affichée
- `UserProfile` : nouveau champ `photoUri?: string`

### Modifié
- **Menu hamburger** : toute la section profil (avatar + nom + régime + objectif) est désormais un bouton cliquable qui ferme le drawer et navigue directement vers l'onglet Profil

---

## [0.31.0] — 2026-05-23

### Ajouté
- **Export professionnel** (`src/services/professionalReport.ts`) : génère un rapport HTML auto-contenu partageable pour nutritionnistes, gastro-entérologues et diététiciens
  - Sections : anthropométrie + IMC, cibles nutritionnelles, allergènes avec sévérité, pathologies, sensibilités digestives, tolérances alimentaires, protocole FODMAP complet (aliments testés, journal de réactions, corrélations aliment→symptôme), bilan nutritionnel 30 jours (moyennes kcal/macros, top 10 aliments), disclaimer légal
  - Partagé via `expo-sharing` comme fichier `.html` (ouvrable dans Safari/Chrome, imprimable en PDF via la fonction impression native)
- Bouton "👨‍⚕️ Export professionnel" dans la page Profil (au-dessus de la carte FODMAP)

---

## [0.30.1] — 2026-05-23

### Corrigé
- **Badge Compatible sur plusieurs lignes** (`FoodListScreen`, `CompatibilityBadge`) : le badge pouvait s'étaler sur 2 ou 3 lignes selon le nombre de chiffres dans la valeur kcal adjacente
  - `CompatibilityBadge` : `numberOfLines={1}` ajouté sur le label pour empêcher le retour à la ligne
  - `FoodListScreen` : `minWidth: 64` + `textAlign: 'right'` sur la zone kcal pour que `bodyContent` ait toujours la même largeur disponible
- **Bandeau erreur IA** (`AppShell`) : lorsqu'une génération IA échoue, un bandeau rouge persistant apparaît en bas de l'écran (au-dessus de la tabbar) avec l'icône alerte, le label du job et un bouton ✕ pour le fermer manuellement — chaque job n'est affiché qu'une seule fois (tracking par `Set<string>`)

---

## [0.30.0] — 2026-05-23

### Ajouté
- **Cuisine IA** (`PlateAIScreen`) : nouvel écran de génération de recettes personnalisées, accessible depuis Plats sauvegardés via le bouton ✦ (sparkle) dans la topbar
  - **4 modes de génération** en grille 2×2 :
    - 🥬 **Par ingrédients** — barre de recherche, autocomplete depuis la bibliothèque, 12 chips de suggestions rapides, chips d'ingrédients sélectionnés
    - 👤 **Par profil** — carte de synthèse profil (allergènes, régimes, FODMAP) + critères additionnels multi-select
    - ⚡ **Par critères** — chips nutritionnels (low FODMAP, anti-inflammatoire, haute protéine…) + sélecteur de type de repas
    - 🔄 **Variante** — sélection d'un plat sauvegardé + type de variation (allégée, plus protéinée, végétarienne…)
  - **Résultats** : 3 cartes de recettes avec bandeau coloré, badges FODMAP/digestion et explication "pourquoi adapté à votre profil"
  - **Fiche détail** : grille analyse Nutritor (FODMAP, glycémie, digestion, satiété), timeline physiologique, avertissements, ingrédients avec substitutions, étapes numérotées, chips de variante, bouton sauvegarder
  - **Sauvegarde directe** : conversion `SmartRecipe → SavedPlate` et ajout à la bibliothèque de plats
- **`src/types/smartRecipe.ts`** (nouveau) : types `QueryMode`, `SmartIngredient`, `SmartRecipe`, `SmartRecipeQuery` avec champs FODMAP/glycémie/digestion/satiété et `physiologicalTimeline`
- **`generateSmartRecipes()`** dans `aiService.ts` : prompt système expert + schéma JSON strict, routé via `callAI()` vers les 4 providers

---

## [0.29.0] — 2026-05-23

### Ajouté
- **Catégories de plats** (optionnel) : 26 catégories sélectionnables sur chaque plat sauvegardé
  - 19 catégories alimentaires : Salades, Soupes & potages, Pâtes & féculents, Plats mijotés, Viandes & protéines, Végétarien / Vegan, Fast-food, Sandwichs & wraps, Pizzas, Cuisine du monde, Bowls, Accompagnements, Produits laitiers, Desserts, Fruits, Snacks, Petit-déjeuner, Boissons, Autre
  - 7 catégories digestives/nutritionnelles : 🧬 Digestion légère, 🐌 Digestion lente, ⚡ Énergie rapide, 🌿 Anti-inflammatoire, 💪 Riche en protéines, 🌬 Fermentescible, 🍬 Glycémie élevée
  - Sélection dans `EditSavedPlateScreen` (section optionnelle avec badge "Optionnel" et astuce)
  - Pill catégorie affichée sur les cartes `SavedScreen` et dans le détail `SavedDetailScreen`
  - Filtre multi-select "Catégorie" dans `PlateFilterSheet` (en tête de la liste de filtres)
- **Support Anthropic (Claude) et OpenAI (ChatGPT)** :
  - `AIProvider` étendu : `'ollama' | 'openrouter' | 'anthropic' | 'openai'`
  - `AnthropicSettings` + `OpenAISettings` dans `AppSettings`
  - Modèles Anthropic : Claude Opus 4.7, Claude Sonnet 4.6, Claude Haiku 4.5
  - Modèles OpenAI : GPT-4o, GPT-4o Mini, o1, o1 Mini
  - `callAnthropic()` : POST `api.anthropic.com/v1/messages`, headers `x-api-key` + `anthropic-version`, système séparé
  - `callOpenAI()` : POST `api.openai.com/v1/chat/completions`, `Authorization: Bearer`
  - `callAI()` helper unifié — tous les 8 call sites de l'appli sont routés via ce helper
  - Sections dédiées dans `SettingsScreen` pour Anthropic et OpenAI (clé API + sélecteur de modèle)
  - Migration backwards-compat dans `AppShell` pour les anciens `AppSettings` en AsyncStorage

---

## [0.28.0] — 2026-05-23

### Ajouté
- **Démo interactive — Encyclopédie** (`DemoKnowledge`) : 3 phases, ~16 s/boucle
  - Phase `home` : grille de 5 catégories animées + barre de recherche + 3 entrées vedettes
  - Phase `list` : liste filtrée catégorie Acides aminés (6 entrées avec emoji et tagline)
  - Phase `entry` : fiche "Glutamine" — bascule simple/expert, mécanisme biochimique, interactions, notes FODMAP
- Bouton `iconBtnSignal` dans la topbar de `KnowledgeScreen` → déclenche la démo

---

## [0.27.1] — 2026-05-23

### Ajouté
- **Démo interactive — Menu tiroir** (`DemoDrawer`) : 2 phases, ~14 s/boucle
  - Phase `nav` : avatar profil + 5 onglets animés (Journal, Aliments, Plats, Stats, Profil, Courses)
  - Phase `ai` : section Intelligence artificielle — Générateur de repas + Encyclopédie, footer version
- Bouton "Voir la démo" dans le footer du `DrawerMenu` (icône signal) → déclenche la démo

---

## [0.27.0] — 2026-05-23

### Ajouté
- **Démo interactive — Profil (màj)** : phase 4 ajoutée — Mémoire digestive et 7 métriques labo avec badges de statut
- **Démo interactive — Paramètres** (`DemoSettings`) : 3 phases, ~16 s/boucle
  - Phase `openrouter` : champ clé API, bouton Actualiser, liste de modèles gratuits, sélection
  - Phase `ollama` : URL locale, bouton Tester, modèles détectés, sélection
  - Phase `data` : export JSON, effacer les données, section diagnostic IA
- **Démo interactive — Calendrier** (`DemoCalendar`) : 2 phases, ~14 s/boucle — navigation Mai/Avril, points repas par jour, sélection d'un jour historique
- Long-press sur l'icône calendrier dans `HomeScreen` → déclenche `DemoCalendar`

---

## [0.26.0] — 2026-05-22

### Ajouté
- **Démo interactive — Générateur de repas** (`DemoMealGenerator`) : 3 phases, ~18 s/boucle
  - Phase `input` : champ de requête avec placeholder animé, chips de suggestions profil-aware, bouton Générer
  - Phase `result` : 3 cartes collapsées (Buddha Bowl 🥗, Saumon 🐟, Porridge 🌾) avec kcal, tags régime et badge Low FODMAP
  - Phase `detail` : Buddha Bowl expandé — pills macros P/C/L/F, ingrédients avec notes FODMAP (✓ / ⚠ max), 3 micronutriments, score anti-inflammatoire 78/100, explication "pourquoi c'est adapté", bouton Sauvegarder avec état saved
- Bouton `iconBtnSignal` dans la topbar de `MealGeneratorScreen` → déclenche la démo

---

## [0.25.0] — 2026-05-22

### Ajouté
- **Démo interactive — Assistant de courses** (`DemoShopping`) : 3 phases, ~16 s/boucle
  - Phase `history` : stats historique (total scans, compatibles, déconseillés) avec toggle filtre Compatible, bouton CTA scan, 3 items historique avec badges de score
  - Phase `detail` : fiche "Chips Lay's" — badge ultra-transformé, 3 problèmes avec niveaux de sévérité (point coloré), bouton "Ajouter à la liste" avec état toggle
  - Phase `list` : 2 items dans la liste de courses, bouton "Ajouter à Nutritor" avec état toggle nutriAdded
- Bouton `iconBtnSignal` dans la topbar de `ShoppingAssistantScreen` → déclenche la démo

---

## [0.24.0] — 2026-05-22

### Ajouté
- **Démo interactive — Profil** (`DemoProfile`) : 3 phases, ~16 s/boucle
  - Phase `hero` : avatar "M", nom "Marie D.", stats âge/poids/taille en ligne, carte FODMAP verte (compatible), objectifs kcal et macros
  - Phase `allergens` : 4 allergènes avec LevelPill (sévère/modéré/trace/aucun) et notes, 3 régimes avec Switch fake
  - Phase `lab` : 5 métriques labo avec emoji, nom, badge de statut coloré (ok/warn/signal), valeur quantitative et observation clinique, bouton "Ré-analyser"
- Bouton `iconBtnSignal` dans la topbar de `ProfileScreen` → déclenche la démo

---

## [0.23.0] — 2026-05-22

### Ajouté
- **Démo interactive — Statistiques** (`DemoStats`) : 3 phases, ~15 s/boucle
  - Phase `week` : anneau de score 74/100 coloré signal, bar chart 7 jours (P/C/L empilés), 3 rings macro (protéines 68 %, glucides 82 %, lipides 54 %)
  - Phase `month` : heatmap calendrier mai 2026 (cellules ok/signal/warn/today/future), légende de score
  - Phase `wellness` : 4 sparklines de symptômes (Digestion/Énergie/Humeur/Douleur) sous forme de barres colorées, 2 insights de corrélation
- Bouton `iconBtnSignal` dans la topbar de `StatsScreen` → déclenche la démo

---

## [0.22.0] — 2026-05-22

### Ajouté
- **Démo interactive — Plats sauvegardés** (`DemoSaved`) : 3 phases, ~12 s/boucle — grille 2 colonnes, panneau détail slide-up avec macro bars, bouton "Ajouter au journal" avec feedback
- Bouton `iconBtnSignal` dans la topbar de `SavedScreen` → déclenche la démo

---

## [0.21.0] — 2026-05-22

### Ajouté
- **Démo interactive — Photo IA** (`DemoFoodPhoto`) : 3 phases, ~16 s/boucle — spinner analyse IA, 2 cartes résultat avec scores de confiance, import séquentiel animé
- **Démo interactive — CIQUAL** (`DemoCIQUAL`) : 3 phases, ~14 s/boucle — recherche "tomate", liste résultats, import + bannière IA + fiche détail
- Boutons `iconBtnSignal` dans `FoodPhotoScreen` et `CIQUALScreen`

---

## [0.20.0] — 2026-05-22

### Ajouté
- **Système de démos interactives** — infrastructure complète :
  - `useDemoEngine` : moteur partagé — curseur doigt animé, effet ripple, gestion de phases, boucle automatique, ref `isRunning`
  - `DemoShell` : modal plein-écran — légendes fade-in/out, dots de phase, bouton fermeture
  - `DemoOverlay` : dispatcher central — reçoit `DemoScenario | null` et affiche le bon composant
  - `DemoScenario` union type : `'home' | 'foods' | 'off' | 'ciqual' | 'scanner' | 'photo' | 'saved' | 'stats' | 'profile' | 'shopping' | 'mealGenerator'`
- **Démo interactive — Scanner** (`DemoScanner`) : animation scan EAN-13 (~12 s) — laser, résultat slide-up
- **Démo interactive — Home** (`DemoHome`) : Journal → recherche banane → fiche → ajout → timeline → insight IA (~14 s)
- **Démo interactive — Aliments** (`DemoFoods`) : CIQUAL poivron → import → bannière IA → portion → repas (~14 s)
- **Démo interactive — Open Food Facts** (`DemoOFF`) : catégorie légumes → score Carotte → import → édition (~14 s)
- Boutons `iconBtnSignal` (cercle ambre) dans les topbars de `HomeScreen`, `FoodListScreen`, `OpenFoodFactsScreen`, `BarcodeScannerScreen`

---

## [0.19.0] — 2026-05-21

### Ajouté
- **Timeline physiologique interactive — fiches détaillées** : chaque événement auto de la timeline est désormais cliquable (chevron visible). Tap → fiche complète slide-up : déclencheurs identifiés, mécanisme physiologique, durée, impact, note personnalisée, simulation "Et si…" nutritionnelle, recommandation
- `timelineService.ts` étendu avec fiches détaillées pour tous les types d'événements (caféine, glycémie, digestion lipidique, FODMAP, anabolique, satiété, creux post-prandial)
- `src/types/timeline.ts` : types `PhysioDetail`, `TimelineEvent` étendu avec champ `detail?`
- `PhysioTimeline` mis à jour — tap handler, slide-up modal, chevron conditionnel

---

## [0.18.0] — 2026-05-21

### Ajouté
- **Enrichissement IA depuis la fiche aliment** : bouton ⚡ en haut à droite de `DetailScreen` (visible si `isAIReady(settings)`). Lance `enrichFoodWithAI` via `aiQueue`, met à jour l'aliment en temps réel. Badge "IA" affiché sous le bouton

---

## [0.17.0] — 2026-05-21

### Ajouté
- **Liste de courses persistée** : `AppShell` state `shoppingList` via `KEYS.shoppingList`
- `ShoppingAssistantScreen` : section liste de courses, items expandables, boutons stats filtrables (compatible / à vérifier / déconseillé)
- `ShoppingScannerScreen` : transmet `issues`, `positives`, `ultraProcessed` dans le callback `onScanComplete`
- Handlers dans `AppShell` : `toggleShoppingItem`, `addShoppingItemToNutritor`, `removeShoppingItem`

---

## [0.16.0] — 2026-05-21

### Ajouté
- **Onglet Courses** : nouvel onglet `shopping` dans la tabbar → `ShoppingAssistantScreen`
- `ShoppingScannerScreen` : scan code-barres → Open Food Facts → analyse de compatibilité instantanée
- `compatibilityEngine.ts` : scoring pondéré par intensité de sensibilité, détection allergènes croisée, détection ultra-transformé (NOVA 4 heuristic), problèmes classés par sévérité (critical/strong/medium/low)
- `src/types/shopping.ts` : types partagés — sensitivities, compatibilité, historique, liste
- `EditProfileScreen` : 4 nouvelles sections — sensibilités digestives, objectifs, tolérances, pathologies
- `src/data/user.ts` : données de référence pour profil étendu
- Icônes ajoutées : `shopping-cart`, `heart`, `x-circle`
- Clé store ajoutée : `nutritor:scan_history`

---

## [0.15.0] — 2026-05-20

### Ajouté
- **Diagnostic IA** : `aiLogger.ts` — singleton qui capture chaque étape, durée et erreur des appels IA
- Timeout automatique 90 s sur chaque job de la file IA (abort + log)
- Logs détaillés dans `callOpenRouter` / `callOllama` : durée fetch, statut HTTP, taille réponse
- Section "Diagnostic enrichissement IA" dans `SettingsScreen` : zone monospace scrollable + boutons Copier/Effacer
- Dépendance ajoutée : `expo-clipboard`

---

## [0.14.0] — 2026-05-20

### Ajouté
- **Saisie libre d'aliment** (`ManualFoodScreen`, stack `manualFood`) : nouvel écran de saisie manuelle complète accessible depuis "Ajouter avec l'IA" via le bouton "Saisie libre de l'aliment". Permet de créer un aliment sans IA, sans CIQUAL et sans Open Food Facts — utile en cas d'indisponibilité réseau, de modèle non configuré, ou d'aliment introuvable dans les bases.
  - **Section 01** — Informations générales : nom*, catégorie, marque, description courte, portion par défaut, unité g/ml.
  - **Section 02** — Macronutriments (pour 100 g/ml) : kcal, protéines, glucides (dont sucres), lipides (dont saturés), fibres, sel.
  - **Section 03** — Protéines (optionnel, collapsible) : protéines complètes (switch oui/non), BCAA (g).
  - **Section 04** — Glucides (optionnel, collapsible) : index glycémique (0-100), charge glycémique.
  - **Section 05** — Lipides (optionnel, collapsible) : ratio Oméga ω6/ω3 (ex : "5:1").
  - **Section 06** — Minéraux & Vitamines (optionnel, collapsible) : liste dynamique de nutriments avec nom, quantité et ANR%.
  - **Section 10** — Profil sensoriel : chips de goûts (sucré, salé, amer, acide, umami, neutre), textures, arômes, pairings texte libre.
  - **Section 11** — Allergènes : grille des 14 allergènes prioritaires avec cycle absent → présent → traces au tap.
  - **Section 12** — Composition : champ ingrédients multilignes.
  - **Compatibilité personnalisée** : calculée en temps réel (`useMemo`) à partir des macros et allergènes saisis. Affiche "Données manquantes" si aucun macro n'est renseigné (kcal, protéines, glucides, lipides tous à 0). Se met à jour à chaque modification sans action utilisateur.
- **Bandeau IA — Messages rotatifs** : au lieu de rester bloqué sur "Envoi à l'IA…" pendant toute la durée de la requête, le bandeau cycled désormais toutes les 8 secondes à travers des messages contextuels. Pour `generateFoodWithAI` : macros (CIQUAL/USDA), profil FODMAP (Monash), vitamines & minéraux, allergènes, bioactifs, impact métabolique, profil sensoriel. Pour `enrichFoodWithAI` : les messages sont générés depuis le tableau `missing` — l'utilisateur voit exactement quels champs sont en cours de calcul ("FODMAP — données Monash…", "Minéraux (Mg, Ca, Fe…)…", "Vitamines (B, C, D, E…)…", etc.). Le timer est nettoyé dans un `finally` — aucune fuite mémoire en cas d'annulation ou d'erreur.

### Modifié
- **`AddFoodScreen`** : ajout du bouton "Saisie libre de l'aliment" (discret, sous le bouton IA principal) et du prop `onManualEntry?: (name: string) => void`. Le nom déjà saisi dans le champ est transmis comme `initialName` à `ManualFoodScreen`.
- **`AppShell`** : ajout du stack `'manualFood'` et rendu de `ManualFoodScreen`. La navigation retourne vers `'search'` après validation. Un toast de confirmation apparaît (2,6 s) avec le nom de l'aliment créé.
- **`aiService.ts`** : `generateFoodWithAI` et `enrichFoodWithAI` utilisent `setInterval` + `finally` pour les messages rotatifs, sans modifier la signature des fonctions.

---

## [0.13.0] — 2026-05-20

### Ajouté
- **Bandeau IA — Décompte en secondes** : le sous-texte du bandeau affiche le nombre de secondes écoulées depuis le début de la tâche courante (`14s`), remis à zéro à chaque nouveau job.
- **Bandeau IA — Étapes en temps réel** : `enrichFoodWithAI` et `generateFoodWithAI` rapportent leur progression via un callback `onStep` transmis par la file d'attente. Les étapes s'affichent dans le bandeau : "Analyse des données…", "Préparation de la requête…", "Envoi à l'IA…", "Lecture de la réponse…", "Mise à jour de la fiche…" (ou "Création de la fiche…").
- **Import rapide depuis le Journal** : en ouvrant CIQUAL, OFF ou le Scanner depuis l'écran "Ajouter un aliment" du Journal, le retour en arrière ouvre désormais directement la fiche détail de l'aliment importé — sans passer par l'onglet Aliments — pour ajouter immédiatement au repas en cours.
- **Recherche — Aliments récents en premier** : la liste de recherche affiche une section "Récemment ajoutés" (récemment consultés + récemment utilisés, sans doublon) avant la liste complète lorsqu'aucune requête n'est saisie.

### Corrigé
- **Bandeau IA — Bouton "Voir"** : après enrichissement depuis CIQUAL ou OFF, le bouton "Voir" ouvre désormais correctement la fiche détail de l'aliment enrichi (régression introduite par la refactorisation des callbacks `onUpdateFood`).
- **Bandeau IA invisible sur le navigateur web** : `useNativeDriver: true` bloquait l'animation `translateY` sur react-native-web, laissant le bandeau hors écran. Corrigé avec `useNativeDriver: Platform.OS !== 'web'` pour les animations `AIQueueBanner` et `PulseDot`.
- **Écran blanc sur navigateur web** : deux causes corrigées — (1) React error #310 (violation des Règles des Hooks) : `dayTips = useMemo(...)` était placé après un `return` conditionnel dans `AppShell` ; (2) `useFonts` pouvait rester bloqué sur web si les assets de polices échouaient silencieusement — corrigé en passant `{}` à `useFonts` sur web. Ajout d'un `ErrorBoundary` pour afficher les erreurs React à l'écran plutôt qu'une page blanche.
- **Filtres Sans Gluten et Sans Lactose sélectionnés par défaut** : ces deux filtres étaient actifs au premier affichage de l'écran de recherche — désactivés par défaut.

### Modifié
- **`aiQueue.ts` — Signature `ExecuteFn`** : `(signal: AbortSignal, setStep: (step: string) => void) => Promise<void>`. Le paramètre `setStep` est rétrocompatible (les fonctions avec un seul paramètre continuent de fonctionner).
- **`AIJobSnapshot`** : ajout du champ `step?: string` pour exposer l'étape courante aux abonnés.
- **`aiService.ts`** : `enrichFoodWithAI` et `generateFoodWithAI` acceptent `onStep?: (step: string) => void` et l'appellent aux étapes clés.
- **`AppShell.tsx`** : états `importScreenOrigin` + `lastImportedFood` + `lastAddedFoodId` pour gérer le flux de retour depuis les écrans d'import et le bouton "Voir" du bandeau.

---

## [0.12.0] — 2026-05-19

### Ajouté
- **Journal — Modifier les proportions** : icône crayon sur chaque ligne d'aliment dans un repas (uniquement pour les aliments ajoutés depuis cette version). Un modal centré présente un sélecteur +/− par 10 g avec estimation kcal en temps réel. La sauvegarde recalcule kcal, protéines, glucides et lipides depuis les données `per100` de l'aliment.
- **Journal — Timeline mini-métriques cliquables** : les 4 chips Énergie / Digestion / FODMAP / Glycémie ouvrent un modal de détail avec explication de la métrique, liste des événements détectés (emoji, label, heure → heure de fin, intensité) et conseil contextuel si le niveau est mid ou warn.
- **Fiche aliment — Éditer** : icône crayon en haut à droite de la fiche détail (`DetailScreen`). Ouvre `EditFoodScreen` (nouveau stack `editFood`) pour corriger nom, marque, catégorie, portion par défaut, unité et valeurs nutritionnelles de base (kcal, protéines, glucides, lipides, fibres, sel). Un tip onboarding contextuel guide les nouveaux utilisateurs.
- **Bandeau IA — Annuler** : bouton "Annuler" sur le bandeau de progression IA pour interrompre l'enrichissement en cours via `AbortController` et laisser la file traiter le job suivant.

### Corrigé
- **Avis Nutritionnel — Régénérer** : timeout de 25 s via `AbortController` — le spinner ne reste plus bloqué indéfiniment si OpenRouter est lent. Les réponses techniques erronées (ex : "The provided text is empty") sont détectées et remplacées par un message utilisateur clair.
- **Open Food Facts — Recherches récentes** : le tap sur un élément de la liste relançait la recherche mais ne repeuplait pas le champ de texte — corrigé via `dropdownPressRef`.
- **Open Food Facts — Filtre énergie** : les produits avec énergie en kJ (`energy_100g`) étaient exclus du filtre — pris en compte désormais.
- **Liste aliments — crash brand** : `f.brand.toLowerCase()` plantait si `brand` était `null` après une génération IA — remplacé par `(f.brand ?? '').toLowerCase()`.

### Modifié
- **`MealItem`** (types) : ajout de `foodId?`, `portionNum?`, `unit?` — backward-compatible, les items historiques sans ces champs fonctionnent normalement.
- **`generateDayAdvice`** : accepte un `AbortSignal` optionnel et valide le contenu de la réponse avant de la retourner.
- **Menus d'aide** : mis à jour sur tous les écrans pour refléter les nouvelles fonctionnalités (timeline, sections aliments, modifier aliment, annuler IA, honnêteté OFF, correction post-création IA).
- **Onboarding** : flow de bienvenue et tips contextuels mis à jour (timeline, sections, IA cancel, modifier aliment).

---

## [0.11.0] — 2026-05-19

### Ajouté
- **Journal — Timeline physiologique 📊** : nouvelle section entre Repas et Micronutriments affichant une timeline verticale en deux parties : (1) partie automatique générée par Nutritor à partir des repas du jour (heure repas, pic caféine +35 min, pic glycémique +45 min, creux post-prandial +110 min, fenêtre anabolique +90 min, fermentation FODMAP +150 min, digestion ralentie +180 min) ; (2) partie utilisateur — bouton « Ajouter un ressenti » ouvre une bottom-sheet avec 9 chips de symptômes (💨🤢🤕😴💪😊💧🔥🚽), heure pré-remplie, intensité 1-5 et note courte optionnelle. Les événements utilisateur sont persistés par date et supprimables.
- **Marqueur « Maintenant »** : ligne horizontale colorée positionnée à l'heure courante sur la timeline du jour — visualisation immédiate de l'état physiologique en cours.
- **`src/types/timeline.ts`** : interfaces `AutoTimelineEvent`, `UserTimelineEvent`, `TimelineEvent`, constante `QUICK_SYMPTOMS` (9 types).
- **`src/services/timelineService.ts`** : `computeAutoEvents(meals, profile)` — détection par mots-clés des aliments caféinés, glucidiques, lipidiques et FODMAP (fructanes, GOS, lactose, fructose, polyols) ; calcul des événements physiologiques dérivés.
- **`src/components/PhysioTimeline.tsx`** : composant timeline verticale avec dot–line pattern, lignes connectrices, badge utilisateur avec dots de sévérité colorés, modal d'ajout bottom-sheet.
- **Clé store** `nutritor:timeline_events` : `Record<string, UserTimelineEvent[]>` indexé par date.

---

## [0.10.0] — 2026-05-19

### Ajouté
- **Encyclopédie — Laboratoire nutritionnel** : nouvelle catégorie `lab` avec 7 entrées expertes (mode simple + expert) : Ratio ω-3/ω-6, Densité micronutritionnelle, Score inflammatoire, Diversité alimentaire, Score ultra-transformé (NOVA), Charge FODMAP cumulée, Équilibre acides aminés (DIAAS/PDCAAS). Chaque entrée couvre les mécanismes cliniques, les interactions, les doses de référence et les notes FODMAP.
- **Profil — Laboratoire nutritionnel IA** : nouvelle section « 🧪 Laboratoire nutritionnel » dans le Profil — le bouton « Analyser ma journée » envoie les repas du jour à l'IA qui évalue les 7 indicateurs en un seul appel et retourne pour chacun : valeur quantitative, qualification (ok/moyen/à corriger), label court et observation clinique d'une phrase. Les scores sont persistés avec la date d'analyse.
- **`generateLabScores`** dans `aiService.ts` : prompt expert multi-critères avec seuils de status précis par indicateur, retourne JSON structuré (`LabScores`).
- **Types** : `src/types/labScores.ts` — interfaces `LabScore`, `LabScores`, `LabStatus`.

---

## [0.9.0] — 2026-05-19

### Ajouté
- **Mémoire digestive intelligente** (Profil) : nouvelle section "Mémoire digestive" — bouton « Analyser mes données » envoie à l'IA les 21 derniers jours de repas croisés avec les scores de symptômes (douleurs, ballonnements, énergie, transit, sommeil, inflammation) pour générer jusqu'à 30 observations cliniques personnalisées. La mémoire est **cumulative** : à chaque analyse, les nouvelles observations s'ajoutent, les existantes sont affinées ou corrigées selon les données récentes.
- **`updateDigestiveMemory`** dans `aiService.ts` : prompt système dédié à la nutrition clinique fonctionnelle ; format liste numérotée ; fusionne mémoire existante + nouvelles données ; exige au moins 2 occurrences pour déduire un pattern.
- **Documentation aide** : section "Mémoire digestive IA" dans l'aide contextuelle du Profil.

---

## [0.8.0] — 2026-05-19

### Ajouté
- **Journal — Avis Nutritionnel** : nouvelle zone entre Micronutriments et Bien-être — bouton « Générer l'avis IA » appelle `generateDayAdvice`, qui calcule les pourcentages énergétiques P/G/L et envoie les totaux du jour à l'IA pour un commentaire en 2–3 phrases (équilibré ? trop glucidique ? trop lipidique ?). L'avis est persisté par date et régénérable à tout moment.
- **Plats — Commentaire IA** : bouton « Commentaire IA » dans la fiche détail d'un plat — l'IA analyse la composition et génère un avis sur l'équilibre nutritionnel ; le commentaire est sauvegardé avec le plat.
- **Documentation contextuelle** : mise à jour des blocs d'aide de tous les écrans (Journal, Plats, Fiche plat) pour refléter les nouvelles fonctionnalités IA.

---

## [0.7.0] — 2026-05-19

### Ajouté
- **Plats — calcul IA des macros** : bouton « Calculer IA » dans le détail d'un plat — envoie la liste des ingrédients et quantités à l'IA (base CIQUAL/USDA), met à jour kcal + P/G/L par ingrédient et recalcule les totaux du plat en temps réel
- **Plats — aperçu macros** : chaque carte de la bibliothèque affiche désormais une micro-barre colorée P/G/L + valeurs en grammes (visible uniquement si les macros sont renseignées)
- **Paramètres / Dev** : bouton « Simuler passage au lendemain » pour forcer la date du journal à hier et tester la duplication sans attendre minuit

### Corrigé
- **Détail aliment** : gardes défensives complètes sur tous les champs optionnels issus de la génération IA (`allergens`, `fodmap`, `lipidDetail.fa`, `proteinDetail.amino`, `sensory`, `metabolic`, `ingredients`) — plus aucun crash à l'ouverture d'une fiche mal formée

---

## [0.6.0] — 2026-05-19

### Ajouté
- **Journal** : duplication automatique de la journée précédente au démarrage si des repas existaient, avec bandeau de confirmation animé (4 s)
- **Journal** : zone de commentaire libre par journée (max 10 lignes), persistée par date, sous le widget Bien-être
- **Bannière IA** : affichage de la destination du résultat (`doneSubText`) et bouton « Voir » pour naviguer directement vers l'aliment ou le repas généré
- **Open Food Facts** : scoring de pertinence côté client — exact > marque > préfixe > inclusion dans le nom > présence dans les ingrédients ; filtrage des résultats hors-sujet
- **Statistiques** : documentation contextuelle complète de tous les graphes (Semaine, Mois, Bien-être) dans la modale d'aide

### Corrigé
- **Bannière IA** : la bannière ne disparaissait pas complètement lors du tap (translateY insuffisant) — valeur augmentée à 200 px pour sortie totale hors écran
- **Open Food Facts / Ajouter un aliment** : le `ScrollView` horizontal des filtres s'étendait verticalement et écrasait la liste des résultats — corrigé avec `flexShrink: 0, flexGrow: 0`
- **Détail aliment** : gardes défensives sur tous les champs optionnels issus de la génération IA (`allergens`, `fodmap`, `lipidDetail`, `proteinDetail`, `sensory`, `metabolic`, `ingredients`) — plus de crash à l'ouverture d'une fiche mal formée

---

## [0.5.0] — 2026-05-18

### Ajouté
- **Onboarding** : flow de bienvenue 3 étapes (présenté à la première ouverture) avec tips contextuels
- **Menu hamburger** : disponible sur tous les écrans via drawer animé (slide 300 ms)
- **Encyclopédie nutritionnelle** : 80 entrées hors-ligne (vitamines, minéraux, acides aminés, bioactifs, concepts digestifs), mode simple / expert, navigation par catégorie
- **Générateur de repas IA** : recettes profil-aware tenant compte des allergènes, régimes, phase FODMAP et objectifs macros
- **Journal symptômes ↔ alimentation** : corrélations entre symptômes quotidiens et apports
- **Reconnaissance photo d'aliments** : identification via IA vision (OpenRouter / Ollama)
- **Autocomplete d'ingrédients** dans le formulaire de création / édition de plat
- **Page Aliments** : bibliothèque personnelle directement accessible comme onglet principal
- **Open Food Facts** : chips de catégorie avec icônes pour filtrer les résultats
- **CIQUAL** : chips de catégorie avec icônes et retaillage
- **Bandeau IA** : masquable par tap avec snooze automatique de 10 s
- **File d'attente IA** : exécution en arrière-plan avec bandeau de statut temps réel

### Corrigé
- `portion.match is not a function` — les valeurs FODMAP stockées via AsyncStorage pouvaient être de type `number` ; conversion systématique en `String()` avant tout appel de méthode string
- Crash de la page Aliments (fichiers `labelAnalysis` et `smartSearch` manquants)
- Filtres de recherche partiellement masqués et layout des résultats incorrect
- Confirmation photo après prise de vue caméra

---

## [0.4.0] — 2026-05-17

### Ajouté
- **Score de compatibilité personnalisé** : calcul temps réel depuis le profil (allergènes + régimes actifs), affiché sur la fiche détail
- **Journal historique** : navigation sur 365 jours via sélecteur calendrier
- **Statistiques hebdomadaires avancées** : bar chart 7 jours avec données réelles, sparklines macros, heatmap de conformité régime
- **Aide contextuelle** : modale d'aide disponible sur chaque écran (icône `?`)
- **Photos de plats** : sélection depuis la galerie ou prise de vue caméra
- **Filtres avancés** : filtrage par allergène et régime dans la recherche d'aliments

### Modifié
- Suppression de la pastille profil / régime dans la topbar Journal (interface épurée)

---

## [0.3.0] — 2026-05-16

### Ajouté
- **Persistance complète** via AsyncStorage — profil, aliments, repas, plats sauvegardés, journal, symptômes
- **Génération IA de fiches nutritionnelles** (OpenRouter + Ollama) : 12 sections, JSON schema strict
- **Enrichissement IA** : complétion automatique des champs manquants sur les fiches CIQUAL / Open Food Facts
- **Base CIQUAL 2020** embarquée (3 167 aliments, ~1 MB JSON, recherche locale)
- **Open Food Facts** : client API REST, recherche textuelle, import en bibliothèque
- **Scanner code-barres** : EAN-13, EAN-8, UPC → Open Food Facts (expo-camera)
- **Plats sauvegardés** : création, édition, grille 2 colonnes, filtres, tri
- **Transitions animées** : fade-enter 350 ms sur tous les changements d'écran
- **Icône app** personnalisée (Instrument Serif + feuille verte)
- **Export / import JSON** de la bibliothèque d'aliments personnelle

---

## [0.2.0] — 2026-05-15

### Ajouté
- Prototype complet avec navigation tab + stack (AppShell custom, sans React Navigation)
- **Journal du jour** : anneau kcal SVG, 5 repas configurables, bilan macros, widget symptômes
- **Fiche détail aliment** : 12 sections (acides aminés, lipides, glucides, minéraux, vitamines, FODMAP, bioactifs, action métabolique, sensoriel, allergènes, composition)
- **Profil utilisateur** : 14 allergènes avec niveaux de sévérité, 6 régimes actifs, objectif calorique et macros
- **Protocole FODMAP** personnel : gestion des phases (élimination, réintroduction, stabilisation) et suivi des réactions
- Design system : palette `paper / ink / ok / warn / signal`, typographie Instrument Serif + Geist + JetBrains Mono

---

## [0.1.0] — 2026-05-15

### Ajouté
- Initialisation du projet React Native / Expo SDK 54 (TypeScript, managed workflow)
