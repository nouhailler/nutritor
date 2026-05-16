# Nutritor — Contexte de développement

> Document de référence pour reprendre le projet en contexte. À lire en début de session.

---

## État actuel (2026-05-16)

### Dernier build APK
- **Build ID** : `8fc6725c-7e2b-484a-9e06-1ddb494e4840`
- **Lien** : https://expo.dev/accounts/nouhailler/projects/nutritor/builds/8fc6725c-7e2b-484a-9e06-1ddb494e4840
- **Profil** : `preview` (APK Android signé)
- **Compte EAS** : `nouhailler`

### Dépôt GitHub
- **URL** : https://github.com/nouhailler/nutritor
- **Branche** : `master`
- **Dernier commit** : `3f75d0a` — feat: persistance, IA, CIQUAL, OFF, scanner, plats, transitions, icône

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

| Token | Hex |
|-------|-----|
| `Colors.paper` | `#F2EDE2` |
| `Colors.ink` | `#1A1814` |
| `Colors.ok` | `#3F5A3A` |
| `Colors.warn` | `#8B3A2E` |
| `Colors.signal` | `#6B5A2E` |
| `Colors.muted` | `#8A8068` |

---

## Architecture navigation (`AppShell.tsx`)

```typescript
type Tab = 'home' | 'saved' | 'stats' | 'profile';
type StackScreen =
  | 'search' | 'detail' | 'savedDetail' | 'editProfile'
  | 'settings' | 'addFood' | 'openFoodFacts' | 'ciqual'
  | 'scanner' | 'editSavedPlate' | null;
```

- `stack === null` → écran de l'onglet actif, tabbar visible
- `stack !== null` → écran empilé, tabbar masqué
- Transition : `FadeScreen` (fade-in 350ms, `Easing.out(Easing.quad)`)
- **Règle critique** : tous les `useState`/hooks doivent être déclarés **avant** tout `return` conditionnel

---

## Persistance AsyncStorage (`src/storage/`)

### Clés (`store.ts`)
```typescript
KEYS = {
  foods:       'nutritor:foods',
  meals:       'nutritor:meals',
  mealsDate:   'nutritor:meals_date',
  profile:     'nutritor:profile',
  settings:    'nutritor:settings',
  savedPlates: 'nutritor:saved_plates',
}
```

### Hook `usePersistedState<T>(key, default)`
- Retourne `[value, setValue, loading]`
- Charge depuis AsyncStorage au mount
- `setValue` sauvegarde immédiatement
- `loading = true` jusqu'à la fin du chargement initial

### Reset quotidien des repas
Au démarrage (après chargement), `AppShell` compare `KEYS.mealsDate` à `todayStr()`. Si différent → reset `meals` à `INITIAL_MEALS` et sauvegarde la date du jour.

---

## Sources de données

### CIQUAL 2020 (`src/data/ciqual.json`)
- 3 167 aliments français, ~1 MB embarqué
- Service : `src/services/ciqual.ts` — `searchCIQUAL(query, limit=30)`
- Conversion : `ciqualToFood(entry): Food`
- Normalisation des accents, score (startsWith=3, includes=1)

### Open Food Facts (`src/services/openFoodFacts.ts`)
- `searchOFF(query, page)` — `lc=fr&cc=fr`
- `getOFFByBarcode(barcode)`
- `offProductToFood(product): Food` — 14 allergènes depuis `allergens_tags`

### IA (`src/services/aiService.ts`)
- Providers : `'openrouter'` | `'ollama'`
- `generateFoodWithAI(name, brand, context, settings): Promise<Food>`
- Valide : `id`, `name`, `per100`, `allergens`, `compat`
- Strips markdown fences avant `JSON.parse`

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
  note?: string;
}

interface AppSettings {
  aiProvider: 'ollama' | 'openrouter';
  ollama: { baseUrl: string; model: string };
  openrouter: { apiKey: string; model: string; models: OpenRouterModel[] };
}
```

---

## Écrans et leur localisation

| Écran | Fichier | Stack key |
|-------|---------|-----------|
| Journal | `HomeScreen.tsx` | tab: `home` |
| Recherche | `SearchScreen.tsx` | `'search'` |
| Détail aliment | `DetailScreen.tsx` | `'detail'` |
| Plats sauvegardés | `SavedScreen.tsx` | tab: `saved` |
| Détail plat | `SavedDetailScreen.tsx` | `'savedDetail'` |
| Créer/éditer plat | `EditSavedPlateScreen.tsx` | `'editSavedPlate'` |
| Stats | `StatsScreen.tsx` | tab: `stats` |
| Profil | `ProfileScreen.tsx` | tab: `profile` |
| Éditer profil | `EditProfileScreen.tsx` | `'editProfile'` |
| Paramètres | `SettingsScreen.tsx` | `'settings'` |
| Ajouter via IA | `AddFoodScreen.tsx` | `'addFood'` |
| Open Food Facts | `OpenFoodFactsScreen.tsx` | `'openFoodFacts'` |
| CIQUAL | `CIQUALScreen.tsx` | `'ciqual'` |
| Scanner | `BarcodeScannerScreen.tsx` | `'scanner'` |

---

## Bugs connus / points d'attention

- **Hooks React** : tous les hooks doivent être avant tout `return` conditionnel dans `AppShell`. Ce bug (crash au démarrage) a été corrigé dans le build `8fc6725c`.
- **expo-file-system** : utiliser `from 'expo-file-system/legacy'` (le nouveau module ne re-exporte pas `cacheDirectory`/`EncodingType`).
- **CIQUAL nombres** : séparateur décimal français = virgule → `.replace(',', '.')` dans le parser.
- **Scanner** : `scanLocked` ref pour éviter le double-déclenchement du callback `onBarcodeScanned`.

---

## Commandes utiles

```bash
# Développement
npx expo start          # Lance Metro + QR code Expo Go

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
- [ ] Statistiques hebdomadaires avancées (vraies données persistées)
- [ ] Suppression d'un plat sauvegardé (swipe ou bouton dans le détail)
- [ ] Suppression d'un aliment de la liste
- [ ] Rappels de repas (notifications)
- [ ] Synchronisation cloud
- [ ] Build iOS (TestFlight)
- [ ] Données Monash FODMAP (licence commerciale)
- [ ] Retirer les logs de débogage avant la production
