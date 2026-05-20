# Nutritor — Contexte de développement

> Document de référence pour reprendre le projet en contexte. À lire en début de session.

---

## État actuel (2026-05-20)

### Derniers commits
- `a21bb3e` — feat: modifier proportions journal, métriques timeline cliquables, fix avis IA
- `0a89638` — feat: mise à jour menus d'aide — nouvelles fonctionnalités
- `31adb6e` — feat: mise à jour onboarding — nouvelles fonctionnalités
- `ad53a18` — feat: annulation IA, modifier aliment, fix recherches OFF + crash brand

### Dernier build APK
- **Build ID** : `8fc6725c-7e2b-484a-9e06-1ddb494e4840`
- **Profil** : `preview` (APK Android signé)
- **Compte EAS** : `nouhailler`

### Dépôt GitHub
- **URL** : https://github.com/nouhailler/nutritor
- **Branche** : `master`

---

## Stack technique

| Élément | Détail |
|---------|--------|
| Framework | React Native + Expo SDK 54 (TypeScript, managed workflow) |
| Navigation | Custom `AppShell` — état `tab` + `stack`, sans React Navigation |
| Persistance | AsyncStorage via `usePersistedState<T>` |
| Build | EAS Build (APK sans Android Studio) |
| Fonts | Instrument Serif · Geist · JetBrains Mono |
| Icons | Feather via `@expo/vector-icons` |

---

## Palette & design tokens (`src/theme/tokens.ts`)

| Token | Hex | Usage |
|-------|-----|-------|
| `Colors.paper` | `#F2EDE2` | Fond principal |
| `Colors.paper2` | `#F7F2E7` | Fond légèrement plus clair |
| `Colors.card` | `#EDE8DC` | Cartes / zones groupées |
| `Colors.ink` | `#1A1814` | Texte principal |
| `Colors.ink2` | `#3A3630` | Texte secondaire sombre |
| `Colors.ok` | `#3F5A3A` | Vert (compatible, valider) |
| `Colors.warn` | `#8B3A2E` | Rouge (alerte, allergie) |
| `Colors.signal` | `#6B5A2E` | Ambre (prudence) |
| `Colors.muted` | `#8A8068` | Texte tertiaire |
| `Colors.muted2` | `#B0A890` | Placeholders |
| `Colors.hairline` | `#E2DAC5` | Bordures principales |
| `Colors.hairline2` | `#EAE4D4` | Bordures légères |

---

## Architecture navigation (`AppShell.tsx`)

```typescript
type Tab = 'home' | 'foods' | 'saved' | 'stats' | 'profile';
type StackScreen =
  | 'search' | 'detail' | 'savedDetail' | 'editProfile'
  | 'settings' | 'addFood' | 'editFood' | 'openFoodFacts' | 'ciqual'
  | 'scanner' | 'editSavedPlate' | 'foodPhoto'
  | 'fodmap' | 'mealGenerator' | 'knowledge' | null;
```

- `stack === null` → écran de l'onglet actif, tabbar visible
- `stack !== null` → écran empilé, tabbar masqué
- Transition : `FadeScreen` (fade-in 350ms, `Easing.out(Easing.quad)`)
- **Règle critique** : tous les `useState`/hooks doivent être déclarés **avant** tout `return` conditionnel

### Onglets (tab bar + DrawerMenu)

| id | Label | Icône | Écran |
|----|-------|-------|-------|
| `home` | Journal | `home` | `HomeScreen` |
| `foods` | Aliments | `leaf` | `FoodListScreen` |
| `saved` | Plats | `book` | `SavedScreen` |
| `stats` | Stats | `chart` | `StatsScreen` |
| `profile` | Profil | `user` | `ProfileScreen` |

### DrawerMenu

En plus des 5 onglets, le drawer expose une section "Intelligence artificielle" :
- **Générateur de repas** → `stack('mealGenerator')`
- **Encyclopédie** → `stack('knowledge')`

---

## Persistance AsyncStorage (`src/storage/`)

### Clés (`store.ts`)

```typescript
KEYS = {
  foods:          'nutritor:foods',
  meals:          'nutritor:meals',
  mealsDate:      'nutritor:meals_date',
  profile:        'nutritor:profile',
  settings:       'nutritor:settings',
  savedPlates:    'nutritor:saved_plates',
  journal:        'nutritor:journal',
  symptoms:       'nutritor:symptoms',
  fodmapProtocol: 'nutritor:fodmap_protocol',
  migrationV1:    'nutritor:migration_v1',
}
```

### Hook `usePersistedState<T>(key, default)`
- Retourne `[value, setValue, loading]`
- Charge depuis AsyncStorage au mount ; `setValue` sauvegarde immédiatement
- `loading = true` jusqu'à la fin du chargement initial

### Reset quotidien des repas
Au démarrage (après chargement), `AppShell` compare `KEYS.mealsDate` à `todayStr()`. Si différent → archive les repas du jour précédent dans `journal`, reset `meals` à `INITIAL_MEALS`, sauvegarde la date.

### Journal historique
`journal: JournalEntry[]` (max 365 entrées) — chaque entrée : `{ date: string; meals: Meal[] }`. Utilisé par `StatsScreen` et le calendrier de `HomeScreen`.

### Symptômes
`symptoms: SymptomEntry[]` — chaque entrée : `{ date: string; scores: SymptomScores }`.
`SymptomScores = { digestion, energie, humeur, douleur: number (0-4) }`.

### Migration V1
Au premier démarrage après mise à jour, recompute les allergènes CIQUAL pour tous les aliments `ciqual-*` existants via `refreshCiqualAllergens`.

---

## Sources de données

### CIQUAL 2020 (`src/data/ciqual.json`)
- 3 167 aliments français, ~1 MB embarqué
- Service : `src/services/ciqual.ts` — `searchCIQUAL(query, limit=30)`
- Conversion : `ciqualToFood(entry): Food` + `refreshCiqualAllergens(food): Food`
- Normalisation des accents, score (startsWith=3, includes=1)
- Catégories avec emoji : chips de filtre sur `CIQUALScreen`

### Open Food Facts (`src/services/openFoodFacts.ts`)
- `searchOFF(query, page)` — `lc=fr&cc=fr`
- `searchOFFByCategory(categoryTag, page)` — filtre via `tagtype_0/tag_contains_0/tag_0`
- `getOFFByBarcode(barcode)`
- `offProductToFood(product): Food` — 14 allergènes depuis `allergens_tags`
- Catégories avec emoji + tag OFF : chips de filtre sur `OpenFoodFactsScreen`
- **Résilience réseau** : `fetchOFF()` helper — 3 tentatives, timeout 12 s (AbortController), backoff exponentiel 800 ms × tentative
- **Cache AsyncStorage** : TTL 12 h — préfixe `nutritor:off_cache:`, clé = requête normalisée. En cas d'erreur réseau, fallback automatique sur le cache existant (badge « hors-ligne »)
- **Historique de recherche** : `getOFFRecentSearches()` / `saveOFFRecentSearch(query)` — jusqu'à 12 entrées, clé `nutritor:off_recent`. Affiché en dropdown sous le champ de recherche

### IA (`src/services/aiService.ts`)
- Providers : `'openrouter'` | `'ollama'`
- `generateFoodWithAI(name, brand, context, settings): Promise<Food>`
- `enrichFoodWithAI(food, settings): Promise<Food>`
- `generateMeals(query, profile, fodmapPhase, settings): Promise<MealGeneratorResult>`
- `generateDayAdvice(totals, profile, settings, signal?): Promise<string>` — accepte `AbortSignal`, valide le contenu (filtre les réponses techniques erronées < 20 chars ou contenant "text is empty")
- `enrichFoodWithAI(food, settings, signal?, onStep?)` et `generateFoodWithAI(name, brand, context, settings, signal?, onStep?)` — appellent `onStep` aux étapes clés pour remonter la progression au bandeau IA
- `analyzeFoodPhoto(imageBase64, settings): Promise<VisionItem[]>`
- `isAIReady(settings): boolean` — vérifie si un provider est configuré
- Valide les réponses JSON, strips markdown fences avant `JSON.parse`
- **⚠️ Typage runtime** : les champs enrichis par l'IA peuvent être `number` au lieu de `string` (ex: `pct`, `overall`). Toujours faire `String(val ?? '')` avant d'appeler des méthodes string sur des données IA persistées en AsyncStorage.

### File d'attente IA (`src/services/aiQueue.ts`)
- Singleton `aiQueue` (module-level) avec pattern subscriber
- `aiQueue.add(label, fn)` → retourne un `jobId` (string)
- `aiQueue.subscribe(callback)` → retourne un `unsubscribe`
- `aiQueue.dismissCompleted()` → retire les jobs `done`/`error` de la liste
- `AIJobSnapshot` : `{ id, label, status: 'pending'|'running'|'done'|'error', error?, step? }`
- `ExecuteFn` : `(signal: AbortSignal, setStep: (step: string) => void) => Promise<void>` — rétrocompatible (les fonctions avec un seul paramètre fonctionnent)
- `AIQueueBanner` s'abonne dans `AppShell` via `useEffect`

### Encyclopédie (`src/data/knowledgeBase.ts`)
- 80 entrées statiques, 100 % hors-ligne, aucune IA nécessaire
- Catégories : `vitamin` (13), `mineral` (14), `aminoacid` (16), `bioactive` (21), `concept` (16)
- Chaque entrée : `simple` (what, why, sources, deficiency) + `expert` (mechanism, interactions, dosage, clinicalNote, fodmapNote)
- `relatedIds` pour navigation croisée
- Utilitaires : `searchKnowledge(query)`, `getByCategory(cat)`, `getRelated(entry)`, `getCategoryCounts()`
- Recherche insensible aux accents (`NFD + strip combining`)

---

## Types principaux (`src/types/`)

```typescript
interface Food {
  id: string; name: string; brand: string; category: string;
  unit: string; defaultPortion: number;
  per100: { kcal: number; protein: number; carbs: number; fat: number; ... };
  allergens: Allergen[]; compat: CompatTag[];
  minerals?: Mineral[]; vitamins?: Vitamin[];
}

interface MealItem {
  name: string; qty: string; kcal: number;
  macros: { protein: number; carbs: number; fat: number };
  foodId?: string;      // id dans foodList — permet recalcul macros
  portionNum?: number;  // portion numérique (ex: 150)
  unit?: string;        // unité (ex: 'g', 'ml')
}

interface SavedPlate {
  id: string; name: string; kcal: number; time: string; timeMin: number;
  tags: string[]; items: number; last: string;
  macros: { protein: number; carbs: number; fat: number };
  recipe: SavedPlateItem[];
  photo?: string;           // URI ou base64 data URI
  note?: string;
  pairedWith?: string[];    // IDs de plats compatibles
}

interface AppSettings {
  aiProvider: 'ollama' | 'openrouter';
  ollama: { baseUrl: string; model: string };
  openrouter: { apiKey: string; model: string; models: OpenRouterModel[] };
}

interface JournalEntry {
  date: string;   // 'YYYY-MM-DD'
  meals: Meal[];
}

interface SymptomEntry {
  date: string;
  scores: SymptomScores;   // digestion, energie, humeur, douleur (0-4)
}

interface GeneratedMeal {
  name: string; emoji: string; description: string; mealType: string;
  prepTime: number; cookTime?: number; servings: number;
  ingredients: GeneratedMealIngredient[];
  per_serving: { kcal: number; protein: number; carbs: number; fat: number; fiber?: number };
  micronutrients?: Array<{ name: string; amount: string; pct_anr?: string }>;
  tags: string[];
  fodmapCompatibility?: string;
  antiInflammatoryScore?: number;
  whyGood?: string;
}

type KnowledgeCategory = 'vitamin' | 'mineral' | 'aminoacid' | 'bioactive' | 'concept';

interface KnowledgeEntry {
  id: string; category: KnowledgeCategory; name: string;
  aliases?: string[]; emoji: string; tagline: string;
  simple: { what: string; why: string; sources: string[]; deficiency?: string };
  expert: { mechanism: string; interactions: string[]; dosage?: {...}; clinicalNote?: string; fodmapNote?: string };
  relatedIds?: string[];
}
```

---

## Écrans et leur localisation

| Écran | Fichier | Accès |
|-------|---------|-------|
| Journal | `HomeScreen.tsx` | tab `home` |
| Liste aliments | `FoodListScreen.tsx` | tab `foods` |
| Plats sauvegardés | `SavedScreen.tsx` | tab `saved` |
| Statistiques | `StatsScreen.tsx` | tab `stats` |
| Profil | `ProfileScreen.tsx` | tab `profile` |
| Recherche | `SearchScreen.tsx` | stack `'search'` |
| Détail aliment | `DetailScreen.tsx` | stack `'detail'` |
| Détail plat | `SavedDetailScreen.tsx` | stack `'savedDetail'` |
| Créer/éditer plat | `EditSavedPlateScreen.tsx` | stack `'editSavedPlate'` |
| Éditer profil | `EditProfileScreen.tsx` | stack `'editProfile'` |
| Paramètres | `SettingsScreen.tsx` | stack `'settings'` |
| Ajouter via IA | `AddFoodScreen.tsx` | stack `'addFood'` |
| Éditer aliment | `EditFoodScreen.tsx` | stack `'editFood'` |
| Open Food Facts | `OpenFoodFactsScreen.tsx` | stack `'openFoodFacts'` |
| CIQUAL | `CIQUALScreen.tsx` | stack `'ciqual'` |
| Scanner | `BarcodeScannerScreen.tsx` | stack `'scanner'` |
| Photo IA | `FoodPhotoScreen.tsx` | stack `'foodPhoto'` |
| Protocole FODMAP | `FodmapScreen.tsx` | stack `'fodmap'` |
| Générateur repas | `MealGeneratorScreen.tsx` | stack `'mealGenerator'` (drawer) |
| Encyclopédie | `KnowledgeScreen.tsx` | stack `'knowledge'` (drawer) |

---

## Navigation interne `KnowledgeScreen`

La navigation dans l'encyclopédie est gérée par un état local `KView` (pas de StackScreen supplémentaire) :

```typescript
type KView =
  | { type: 'home' }
  | { type: 'list'; category: KnowledgeCategory | null; query: string }
  | { type: 'entry'; entry: KnowledgeEntry; from: KView };
```

- `home` → grille de catégories + barre de recherche + 6 entrées vedettes
- `list` → liste filtrée par catégorie ou par requête
- `entry` → fiche complète avec toggle simple/expert + entrées liées
- `from` dans `entry` permet un retour multi-niveaux (entrée liée → retour à la liste précédente)

---

## Composants clés

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `DrawerMenu` | `components/DrawerMenu.tsx` | Menu latéral animé (slide 300ms), section IA (générateur + encyclopédie) |
| `AIQueueBanner` | `components/AIQueueBanner.tsx` | Bandeau IA en bas — tap snooze 10 s, décompte secondes, étapes temps réel, bouton "Voir" fiche, dismiss si terminé |
| `Icon` | `components/Icon.tsx` | Feather icons wrappés |
| `CalendarModal` | `components/CalendarModal.tsx` | Sélecteur de date pour navigation journal |
| `CompatibilityBadge` | `components/CompatibilityBadge.tsx` | Badge/carte compatibilité allergènes |
| `HelpModal` | `components/HelpModal.tsx` | Modales d'aide contextuelles |
| `PlateFilterSheet` | `components/PlateFilterSheet.tsx` | Bottom sheet filtres plats |
| `SymptomWidget` | `components/SymptomWidget.tsx` | Widget saisie symptômes quotidiens |
| `AIGenIcon` | inline dans `AppShell.tsx` | Icône flottante ✦ (haut-droite) — clignote pendant génération repas, verte quand terminé |

---

## Fonctionnalités notables

### Photo de plat (`EditSavedPlateScreen`)
- Galerie : `launchImageLibraryAsync` avec `allowsEditing: true`
- Caméra : `launchCameraAsync` **sans** `allowsEditing` (le crop natif n'a pas de bouton Valider sur certains appareils)
- Modal de confirmation en-app : plein écran sombre, boutons « Reprendre » / « Utiliser cette photo »

### Autocomplete ingrédients (`EditSavedPlateScreen` → `AddItemForm`)
- Filtre à partir de 2 caractères sur `name` et `brand`
- Sélection pré-remplit `qty`, `kcal`, `protein`, `carbs`, `fat` via `food.defaultPortion`
- Saisie libre possible si aucun résultat

### Pairing de plats (`EditSavedPlateScreen`)
- Champ texte + suggestions à 2 caractères min
- Stocké dans `savedPlate.pairedWith: string[]`

### Liste aliments (`FoodListScreen`)
- Barre de recherche avec debounce
- Chips « Découvrir » (CIQUAL, OFF, Scanner, IA, Photo)
- Tap sur un aliment → `DetailScreen` (pour ajouter au journal)
- Tap icône livre → `PlatePickerSheet` (bottom sheet maison, pour ajouter à un plat)
- **Bouton de suppression** : icône corbeille sur chaque ligne — `Alert.alert` sur mobile, `window.confirm` sur web ; supprime l'aliment de `foodList`

### Générateur de repas IA (`MealGeneratorScreen`)
- Profile-aware : allergènes avec sévérité, régimes actifs, phase FODMAP, kcal cible, macros
- Chips de suggestions générées à partir du profil
- Cartes expandables : macros, ingrédients (avec note FODMAP par ingrédient), micronutriments, score anti-inflammatoire, note FODMAP globale, "pourquoi c'est adapté"
- Requiert `isAIReady(settings)` — affiche un avertissement si aucune IA configurée
- **Génération en arrière-plan** : via `aiQueue`. `handleGenerateMeals` ajoute un job, navigue immédiatement. L'icône `AIGenIcon` (haut-droite) clignote pendant l'exécution, devient verte une fois terminée. Un tap sur l'icône rouvre l'écran avec le résultat.
- **Sauvegarde** : bouton « Sauvegarder ce repas » dans chaque carte expandée → `handleSaveGeneratedMeal` dans `AppShell` → convertit `GeneratedMeal` en `SavedPlate` (id `gen-<timestamp>`, emoji dans le nom, description comme note, ingrédients comme recipe items) → `setSavedPlates`, toast de confirmation

### Encyclopédie nutritionnelle (`KnowledgeScreen` + `src/data/knowledgeBase.ts`)
- 80 entrées statiques, aucune connexion requise
- Mode **simple** : what/why/sources/carence en langage accessible
- Mode **expert** : mécanisme biochimique, interactions, dosage (RDA/upper), notes cliniques, note FODMAP
- Recherche insensible aux accents (`normalize('NFD')`) sur nom, aliases, tagline
- Navigation croisée via `relatedIds`

### Suivi symptômes (`HomeScreen` → `SymptomWidget`)
- 4 axes : digestion, énergie, humeur, douleur (scores 0–4)
- Persisté par date dans `KEYS.symptoms`
- Corrélations visibles dans `StatsScreen`

---

## Points d'attention / pièges connus

- **Hooks React** : tous les hooks doivent être avant tout `return` conditionnel dans `AppShell`. La violation de cette règle produit l'erreur React #310 (silencieuse en dev mais fatale sur web).
- **`useNativeDriver` sur web** : `useNativeDriver: true` bloque les animations `Animated` sur react-native-web — utiliser `useNativeDriver: Platform.OS !== 'web'`. Symptôme : composant coincé à sa position initiale, invisible si `translateY` commence à une valeur non-nulle.
- **`useFonts` sur web** : peut rester bloqué (`fontsLoaded = false`, `fontError` undefined) si les assets échouent silencieusement. Passer `{}` sur web pour résoudre immédiatement.
- **expo-file-system** : `from 'expo-file-system/legacy'` (le nouveau module ne re-exporte pas `cacheDirectory`/`EncodingType`).
- **CIQUAL nombres** : séparateur décimal français = virgule → `.replace(',', '.')` dans le parser.
- **Scanner** : `scanLocked` ref pour éviter le double-déclenchement de `onBarcodeScanned`.
- **Chips de filtre** : ne pas mettre `backgroundColor: 'transparent'` sur fond beige — utiliser `Colors.paper2` pour que les bordures soient visibles.
- **ScrollView dans flex-column** : ajouter `flex: 1` sur le `ScrollView` si le contenu ne s'affiche pas.
- **Bottom sheet** : utiliser un overlay `View` absolu (pas `Modal`) pour éviter les problèmes de z-index Android.
- **KnowledgeScreen** : la navigation interne (`KView`) est locale à l'écran — pas de StackScreen supplémentaire dans `AppShell`.
- **Chips dans ScrollView horizontal (web)** : les enfants s'étirent pour remplir la hauteur du conteneur sur web. Correction : `alignSelf: 'flex-start'` sur chaque chip. Ne pas mettre `alignItems: 'center'` sur `contentContainerStyle` (provoque la disparition des chips quand les résultats apparaissent).
- **Types IA en AsyncStorage** : l'IA peut retourner des `number` là où on attend des `string` (ex: `pct: 27` au lieu de `"27%"`). Toujours faire `String(val ?? '')` avant `.match()`, `.toUpperCase()`, etc. sur des champs enrichis par l'IA.
- **MealItem.foodId / portionNum** : présents uniquement sur les items ajoutés depuis la version 0.12+. Les items historiques n'ont pas ces champs — toujours vérifier `item.foodId` avant d'afficher l'icône crayon ou de tenter une recalculation.
- **AbortController avis IA** : `handleGenerateAdvice` dans `HomeScreen` crée un nouveau contrôleur à chaque appel (timeout 25 s). Le `finally` garantit `adviceLoading = false` même en cas d'abort — plus de spinner bloqué.

---

## Commandes utiles

```bash
# Développement
npx expo start              # Metro + QR code Expo Go

# Build APK Android
eas build --platform android --profile preview

# Vérification TypeScript
npx tsc --noEmit

# Régénérer les icônes
python3 scripts/gen_icon.py
```

---

## Prochaines étapes suggérées

- [ ] Thème dark / thème sage
- [ ] Notifications de repas (rappels)
- [ ] Synchronisation cloud / export JSON complet
- [ ] Build iOS (TestFlight)
- [ ] Données Monash FODMAP officielles (licence commerciale)
- [ ] Retirer les `console.log` de débogage avant la production
