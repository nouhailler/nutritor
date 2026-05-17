# Nutritor — Contexte de développement

> Document de référence pour reprendre le projet en contexte. À lire en début de session.

---

## État actuel (2026-05-17)

### Dernier commit
`66b7fc1` — feat: autocomplete d'ingrédients dans le formulaire de plat

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
  | 'settings' | 'addFood' | 'openFoodFacts' | 'ciqual'
  | 'scanner' | 'editSavedPlate' | null;
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

---

## Persistance AsyncStorage (`src/storage/`)

### Clés (`store.ts`)

```typescript
KEYS = {
  foods:        'nutritor:foods',
  meals:        'nutritor:meals',
  mealsDate:    'nutritor:meals_date',
  profile:      'nutritor:profile',
  settings:     'nutritor:settings',
  savedPlates:  'nutritor:saved_plates',
  journal:      'nutritor:journal',
  migrationV1:  'nutritor:migration_v1',
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

### IA (`src/services/aiService.ts`)
- Providers : `'openrouter'` | `'ollama'`
- `generateFoodWithAI(name, brand, context, settings): Promise<Food>`
- Valide : `id`, `name`, `per100`, `allergens`, `compat` ; strips markdown fences avant `JSON.parse`

### File d'attente IA (`src/services/aiQueue.ts`)
- Singleton `aiQueue` (module-level) avec pattern subscriber
- `aiQueue.subscribe(callback)` → retourne un `unsubscribe`
- `AIQueueBanner` s'abonne dans `AppShell` via `useEffect`
- Bandeau fixe au-dessus de la tab bar, snooze 10 s sur tap

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
```

---

## Écrans et leur localisation

| Écran | Fichier | Accès |
|-------|---------|-------|
| Journal | `HomeScreen.tsx` | tab `home` |
| Liste aliments | `FoodListScreen.tsx` | tab `foods` |
| Recherche | `SearchScreen.tsx` | stack `'search'` |
| Détail aliment | `DetailScreen.tsx` | stack `'detail'` |
| Plats sauvegardés | `SavedScreen.tsx` | tab `saved` |
| Détail plat | `SavedDetailScreen.tsx` | stack `'savedDetail'` |
| Créer/éditer plat | `EditSavedPlateScreen.tsx` | stack `'editSavedPlate'` |
| Stats | `StatsScreen.tsx` | tab `stats` |
| Profil | `ProfileScreen.tsx` | tab `profile` |
| Éditer profil | `EditProfileScreen.tsx` | stack `'editProfile'` |
| Paramètres | `SettingsScreen.tsx` | stack `'settings'` |
| Ajouter via IA | `AddFoodScreen.tsx` | stack `'addFood'` |
| Open Food Facts | `OpenFoodFactsScreen.tsx` | stack `'openFoodFacts'` |
| CIQUAL | `CIQUALScreen.tsx` | stack `'ciqual'` |
| Scanner | `BarcodeScannerScreen.tsx` | stack `'scanner'` |

---

## Composants clés

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `DrawerMenu` | `components/DrawerMenu.tsx` | Menu latéral animé (slide 300ms) |
| `AIQueueBanner` | `components/AIQueueBanner.tsx` | Bandeau IA en bas, snooze 10 s sur tap |
| `Icon` | `components/Icon.tsx` | Feather icons wrappés |

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
- Chips « Découvrir » (CIQUAL, OFF, Scanner, IA)
- Tap sur un aliment → `DetailScreen` (pour ajouter au journal)
- Tap icône livre → `PlatePickerSheet` (bottom sheet maison, pour ajouter à un plat)

---

## Points d'attention / pièges connus

- **Hooks React** : tous les hooks doivent être avant tout `return` conditionnel dans `AppShell`.
- **expo-file-system** : `from 'expo-file-system/legacy'` (le nouveau module ne re-exporte pas `cacheDirectory`/`EncodingType`).
- **CIQUAL nombres** : séparateur décimal français = virgule → `.replace(',', '.')` dans le parser.
- **Scanner** : `scanLocked` ref pour éviter le double-déclenchement de `onBarcodeScanned`.
- **Chips de filtre** : ne pas mettre `backgroundColor: 'transparent'` sur fond beige — utiliser `Colors.paper2` pour que les bordures soient visibles.
- **ScrollView dans flex-column** : ajouter `flex: 1` sur le `ScrollView` si le contenu ne s'affiche pas.
- **Bottom sheet** : utiliser un overlay `View` absolu (pas `Modal`) pour éviter les problèmes de z-index Android.

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
- [ ] Statistiques hebdomadaires avancées (graphes macros)
- [ ] Notifications de repas (rappels)
- [ ] Synchronisation cloud / export JSON
- [ ] Build iOS (TestFlight)
- [ ] Données Monash FODMAP (licence commerciale)
- [ ] Retirer les `console.log` de débogage avant la production
- [ ] Mode hors-ligne complet (cache OFF)
