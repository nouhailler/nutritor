# Nutritor

> **Application mobile de suivi nutritionnel** pensée pour les utilisateurs ayant des contraintes alimentaires fortes — allergies, intolérances, régimes Low FODMAP, sans gluten, sans lactose.

![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-lightgrey?style=flat-square)
![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB?style=flat-square&logo=react)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=flat-square&logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)

---

## Philosophie

Nutritor n'est **pas** une application de comptage de calories pour la perte de poids.

Son objectif est la **transparence totale** sur la composition d'un aliment :

- Profil d'acides aminés complet
- Types d'acides gras (saturés, insaturés, oméga-3/6)
- Vitamines avec rôles physiologiques (13 essentielles)
- Seuils FODMAP par phase (Monash)
- Molécules bioactives et action métabolique
- Profil sensoriel

Et plus largement, un compagnon de **connaissance nutritionnelle** :

- Encyclopédie statique hors-ligne de 80 entrées (vitamines, minéraux, acides aminés, bioactifs, concepts digestifs)
- Protocole FODMAP personnel avec suivi des réintroductions
- Générateur de repas IA tenant compte du profil complet
- Corrélations symptômes / alimentation

---

## Écrans

| Écran | Accès | Description |
|-------|-------|-------------|
| **Journal** | tab `home` | Bilan du jour — anneau kcal SVG, 5 repas, macros, vitamines, avis nutritionnel IA, widget symptômes, commentaire libre quotidien |
| **Aliments** | tab `foods` | Bibliothèque personnelle + accès CIQUAL / OFF / scanner / IA / photo |
| **Plats** | tab `saved` | Grille 2 colonnes de repas sauvegardés — filtres, tri, création |
| **Statistiques** | tab `stats` | Bar chart 7 jours, sparklines macros, heatmap conformité régime, corrélations symptômes |
| **Profil** | tab `profile` | 14 allergènes avec sévérité, 6 régimes actifs, objectif calorique, mémoire digestive IA |
| **Recherche** | stack `search` | Filtres régime, compatibilité allergènes temps réel, récents |
| **Détail aliment** | stack `detail` | 12 sections — acides aminés, FODMAP, bioactifs, sensoriel, ajout journal |
| **Détail plat** | stack `savedDetail` | Recette par ingrédient, macros, calcul IA des macros, commentaire IA, photo, ajout au journal |
| **Créer / éditer plat** | stack `editSavedPlate` | Autocomplete ingrédients, photo galerie/caméra, pairing de plats |
| **Éditer profil** | stack `editProfile` | Nom, kcal, macros cibles, allergènes, régimes |
| **Paramètres** | stack `settings` | Config IA (OpenRouter / Ollama), import/export JSON |
| **Ajouter via IA** | stack `addFood` | Génération d'une fiche aliment par nom libre |
| **Open Food Facts** | stack `openFoodFacts` | Recherche +3 M produits, scoring de pertinence, chips catégories, enrichissement IA |
| **CIQUAL** | stack `ciqual` | 3 167 aliments français embarqués, enrichissement IA |
| **Scanner** | stack `scanner` | Scan EAN-13/8/UPC → Open Food Facts |
| **Photo IA** | stack `foodPhoto` | Reconnaissance d'aliments par photo (vision IA) |
| **FODMAP** | stack `fodmap` | Protocole personnel — phase, réintroductions, réactions |
| **Générateur de repas** | stack `mealGenerator` | Recettes IA profil-aware (allergènes, FODMAP, macros) |
| **Encyclopédie** | stack `knowledge` | 87 entrées hors-ligne, mode simple / expert, catégorie Laboratoire nutritionnel (7 indicateurs) |

---

## Sources de données

| Source | Volume | Intégration |
|--------|--------|-------------|
| **CIQUAL 2020** (ANSES) | 3 167 aliments | JSON embarqué, recherche locale |
| **Open Food Facts** | +3 M produits | API REST, recherche + scan code-barres |
| **IA (OpenRouter / Ollama)** | Modèles `:free` | Génération structurée (JSON schema) |
| **Scanner code-barres** | EAN-13/8, UPC | expo-camera + Open Food Facts |
| **Encyclopédie** | 80 entrées | Statique, 100 % hors-ligne, aucune IA |

---

## Stack technique

```
React Native + Expo SDK 54  (TypeScript, managed workflow)
├── Navigation     → AppShell custom (tab + stack state, sans React Navigation)
├── Persistance    → AsyncStorage via usePersistedState<T>
├── Rendu SVG      → react-native-svg (anneau kcal, sparklines, hachures)
├── Typographie    → Instrument Serif · Geist · JetBrains Mono
├── Icônes         → @expo/vector-icons (Feather set)
├── IA             → OpenRouter API + Ollama (modèles locaux)
├── Caméra         → expo-camera v17 (CameraView + useCameraPermissions)
└── Build          → EAS Build (APK Android sans Android Studio)
```

---

## Lancer le projet

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer en mode développement (Expo Go)
npx expo start

# 3. Scanner le QR code avec l'app Expo Go sur Android/iOS
```

> **Prérequis** : Node 18+, compte Expo (expo.dev), app Expo Go sur le téléphone.

### Build APK Android (sans Android Studio)

```bash
# Installer EAS CLI
npm install -g eas-cli

# Connexion à ton compte Expo
eas login

# Lancer le build cloud
eas build --platform android --profile preview
```

Le build se fait sur les serveurs Expo — aucun outil natif requis en local.

---

## Structure du projet

```
nutritor/
├── assets/
│   ├── icon.png                      # Icône app (1024×1024)
│   ├── adaptive-icon.png             # Icône adaptative Android
│   └── splash-icon.png               # Écran de démarrage
├── scripts/
│   └── gen_icon.py                   # Générateur d'icône (Python + Pillow)
└── src/
    ├── theme/tokens.ts               # Design tokens — Colors, Fonts
    ├── types/
    │   ├── index.ts                  # Food, Meal, Allergen, Fodmap…
    │   ├── settings.ts               # AppSettings, AIProvider
    │   ├── mealGenerator.ts          # GeneratedMeal, MealGeneratorResult
    │   ├── knowledge.ts              # KnowledgeEntry, KnowledgeCategory, CATEGORY_META
    │   └── symptoms.ts               # SymptomEntry, SymptomScores
    ├── hooks/
    │   └── useDebounce.ts            # Hook debounce générique (300ms)
    ├── storage/
    │   ├── store.ts                  # AsyncStorage service (load/save/remove)
    │   └── usePersistedState.ts      # Hook persistance générique
    ├── data/
    │   ├── food.ts                   # Aliment exemple + repas initiaux
    │   ├── user.ts                   # Profil utilisateur par défaut
    │   ├── saved.ts                  # Plats sauvegardés (types + données)
    │   ├── fodmapProtocol.ts         # Types et données protocole FODMAP
    │   ├── knowledgeBase.ts          # 80 entrées encyclopédie nutritionnelle
    │   ├── weeklyStats.ts            # JournalEntry, EMPTY_DAY_MEALS, computeDayLog
    │   └── ciqual.json               # Base CIQUAL 2020 — 3 167 aliments (~1 MB)
    ├── services/
    │   ├── aiService.ts              # Génération IA (OpenRouter + Ollama) + generateMeals
    │   ├── aiQueue.ts                # File d'attente IA avec pattern subscriber
    │   ├── openFoodFacts.ts          # Client API Open Food Facts
    │   └── ciqual.ts                 # Recherche et conversion CIQUAL
    ├── components/
    │   ├── Icon.tsx                  # Wrapper Feather avec mapping design
    │   ├── DrawerMenu.tsx            # Menu hamburger animé (slide 300ms)
    │   ├── AIQueueBanner.tsx         # Bandeau IA fixe, snooze 10 s, bouton "Voir" résultat
    │   ├── CalendarModal.tsx         # Sélecteur de date (navigation journal)
    │   ├── CompatibilityBadge.tsx    # Badge / carte compatibilité allergènes
    │   ├── HelpModal.tsx             # Modales d'aide contextuelles
    │   ├── PlateFilterSheet.tsx      # Bottom sheet filtres plats sauvegardés
    │   └── SymptomWidget.tsx         # Widget saisie des symptômes quotidiens
    ├── navigation/
    │   └── AppShell.tsx              # Shell principal — navigation + état global
    └── screens/
        ├── HomeScreen.tsx            # tab 'home'    — journal du jour
        ├── FoodListScreen.tsx        # tab 'foods'   — bibliothèque aliments
        ├── SavedScreen.tsx           # tab 'saved'   — plats sauvegardés
        ├── StatsScreen.tsx           # tab 'stats'   — statistiques hebdo
        ├── ProfileScreen.tsx         # tab 'profile' — profil & allergènes
        ├── SearchScreen.tsx          # stack 'search'
        ├── DetailScreen.tsx          # stack 'detail'
        ├── SavedDetailScreen.tsx     # stack 'savedDetail'
        ├── EditSavedPlateScreen.tsx  # stack 'editSavedPlate'
        ├── EditProfileScreen.tsx     # stack 'editProfile'
        ├── SettingsScreen.tsx        # stack 'settings'
        ├── AddFoodScreen.tsx         # stack 'addFood'
        ├── OpenFoodFactsScreen.tsx   # stack 'openFoodFacts'
        ├── CIQUALScreen.tsx          # stack 'ciqual'
        ├── BarcodeScannerScreen.tsx  # stack 'scanner'
        ├── FoodPhotoScreen.tsx       # stack 'foodPhoto'
        ├── FodmapScreen.tsx          # stack 'fodmap'
        ├── MealGeneratorScreen.tsx   # stack 'mealGenerator'
        └── KnowledgeScreen.tsx       # stack 'knowledge'
```

---

## Design system

### Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `paper` | `#F2EDE2` | Fond général |
| `ink` | `#1A1814` | Texte principal, éléments actifs |
| `ok` | `#3F5A3A` | Compatible, succès, vert |
| `warn` | `#8B3A2E` | Incompatible, alerte, rouge |
| `signal` | `#6B5A2E` | CIQUAL, ambre, neutre |
| `muted` | `#8A8068` | Texte secondaire |

### Typographie

| Variable | Police | Usage |
|----------|--------|-------|
| `Fonts.serif` | Instrument Serif | Titres, chiffres clés |
| `Fonts.sans` | Geist | Corps de texte |
| `Fonts.sansSemiBold` | Geist 600 | Labels boutons |
| `Fonts.mono` | JetBrains Mono | Métadonnées, caps, codes |

---

## Configuration IA

Nutritor supporte deux fournisseurs d'IA pour la génération de fiches nutritionnelles et de repas :

### OpenRouter (cloud)
1. Ouvrir **Paramètres** → sélectionner **OpenRouter**
2. Entrer ta clé API ([openrouter.ai](https://openrouter.ai))
3. Cliquer **Actualiser** pour charger les modèles gratuits (`:free`)
4. Sélectionner un modèle et enregistrer

### Ollama (local)
1. Installer [Ollama](https://ollama.ai) sur ta machine
2. Lancer un modèle : `ollama run llama3.2`
3. Dans **Paramètres** → **Ollama**, entrer l'URL (ex: `http://192.168.1.x:11434`)
4. Cliquer **Tester la connexion**

> L'encyclopédie nutritionnelle ne requiert **aucune IA** — elle fonctionne entièrement hors-ligne.

---

## Format d'import / export JSON

```json
{
  "id": "unique-id",
  "name": "Quinoa rouge bio",
  "brand": "Mon marché",
  "category": "Céréales",
  "unit": "g",
  "defaultPortion": 80,
  "per100": {
    "kcal": 368,
    "protein": 14.1,
    "carbs": 64.2,
    "fat": 6.1
  },
  "allergens": [],
  "compat": []
}
```

---

## Fonctionnalités implémentées

- [x] Journal nutritionnel avec 5 repas et reset quotidien automatique
- [x] **Duplication automatique de la journée précédente** au démarrage si des repas existaient, avec bandeau de confirmation 4 s
- [x] **Commentaire libre par journée** — zone texte max 2 000 caractères sous le widget Bien-être, sauvegardée par date
- [x] **Avis Nutritionnel IA dans le Journal** — analyse des répartitions P/G/L (% énergétiques), commentaire en 2–3 phrases persisté par date, régénérable à volonté
- [x] **Mémoire digestive intelligente** — section dans le Profil : l'IA croise 21 jours de repas × symptômes pour générer jusqu'à 30 observations cliniques personnalisées (patterns de tolérance/intolérance, associations alimentaires, effets de la cuisson…). Cumulative et auto-affinée à chaque analyse.
- [x] **Laboratoire nutritionnel** — 7 entrées expertes dans l'Encyclopédie (Ratio ω-3/ω-6, Densité micronutritionnelle, Score inflammatoire, Diversité, NOVA, Charge FODMAP, Équilibre acides aminés) + évaluation IA de la journée dans le Profil (7 scores avec status ok/moyen/à corriger, valeur quantitative et observation clinique)
- [x] **Calcul IA des macros sur les plats** — bouton « Calculer IA » estime kcal + P/G/L de chaque ingrédient depuis son nom et sa quantité
- [x] **Commentaire IA sur les plats** — analyse de l'équilibre nutritionnel (trop glucidique ? trop lipidique ? bien équilibré ?)
- [x] **Barre macros P/G/L sur les cartes de plats** — micro-barre colorée proportionnelle visible dès que les macros sont renseignées
- [x] Persistance locale (AsyncStorage) — profil, aliments, repas, plats, journal, symptômes, commentaires
- [x] Recherche avec debounce 300ms et filtres de compatibilité
- [x] Base CIQUAL 2020 embarquée (3 167 aliments français)
- [x] Open Food Facts — recherche avec **scoring de pertinence** (exact > marque > préfixe > inclusion) et import
- [x] Scanner code-barres (EAN-13, EAN-8, UPC)
- [x] Génération IA de fiches nutritionnelles (OpenRouter + Ollama) avec **robustesse aux données mal formées**
- [x] **Bannière IA** avec destination du résultat et bouton "Voir" pour navigation directe
- [x] Enrichissement IA des fiches CIQUAL / Open Food Facts (champs manquants uniquement)
- [x] Générateur de repas IA profil-aware (allergènes, FODMAP, macros)
- [x] Reconnaissance photo d'aliments via IA vision
- [x] Encyclopédie nutritionnelle statique hors-ligne (80 entrées, mode simple/expert)
- [x] Protocole FODMAP personnel (phases, réintroductions, réactions)
- [x] Journal historique (365 jours) avec calendrier de navigation
- [x] Widget symptômes quotidiens + corrélations alimentation
- [x] Statistiques hebdomadaires (bar chart, sparklines, heatmap) avec documentation contextuelle complète
- [x] Paramètres — config IA, import/export JSON
- [x] Création et édition de plats sauvegardés (photo, autocomplete, pairing)
- [x] Menu drawer animé avec accès IA et encyclopédie
- [x] Animations de transition (fade-enter 350ms)
- [x] Profil allergènes (14) et régimes (6) avec niveaux de sévérité
- [x] Icône app personnalisée (Instrument Serif + feuille verte)

## Prochaines étapes

- [ ] Thème dark / thème sage
- [ ] Notifications de rappels de repas
- [ ] Synchronisation cloud / export complet
- [ ] Build iOS (TestFlight)
- [ ] Données Monash FODMAP officielles (licence commerciale)
- [ ] Retirer les `console.log` de débogage avant la production

---

## Sources & Licences

| Donnée | Source | Licence |
|--------|--------|---------|
| Composition nutritionnelle FR | [CIQUAL — ANSES](https://ciqual.anses.fr/) | Open data |
| Codes-barres & produits | [Open Food Facts](https://world.openfoodfacts.org/) | ODbL |
| Seuils FODMAP | [Monash University](https://www.monashfodmap.com/) | Licence commerciale |
| ANR vitamines & minéraux | EFSA / ANSES | Réglementation UE |

> Les valeurs nutritionnelles sont **indicatives à des fins de prototype**.
