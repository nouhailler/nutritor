# 🌿 Nutritor

> **Application mobile de suivi nutritionnel** pensée pour les utilisateurs ayant des contraintes alimentaires fortes — allergies, intolérances, régimes Low FODMAP, sans gluten, sans lactose.

![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-lightgrey?style=flat-square)
![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB?style=flat-square&logo=react)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=flat-square&logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)

---

## ✨ Philosophie

Nutritor n'est **pas** une application de comptage de calories pour la perte de poids.

Son objectif est la **transparence totale** sur la composition d'un aliment :

- 🧬 Profil d'acides aminés complet
- 🫀 Types d'acides gras (saturés, insaturés, oméga-3/6)
- 💊 Vitamines avec rôles physiologiques (13 essentielles)
- 🌾 Seuils FODMAP par phase (Monash)
- 🔬 Molécules bioactives et action métabolique
- 🎨 Profil sensoriel

---

## 📱 Écrans

| Écran | Description |
|-------|-------------|
| 🏠 **Journal** | Bilan du jour — anneau kcal SVG, macros, vitamines, 5 repas |
| 🔍 **Recherche** | Filtres régime, résultats compatibles / filtrés / récents, debounce 300ms |
| 🥦 **Détail aliment** | 12 sections éditoriales — acides aminés, FODMAP, bioactives, sensoriel |
| 📚 **Plats sauvegardés** | Bibliothèque de repas — grille 2 col, filtres, création & édition |
| 📋 **Détail plat** | Recette complète par ingrédient, macros, ajout au journal |
| 📊 **Statistiques** | Bar chart 7 jours, sparklines macros, heatmap conformité régime |
| 👤 **Profil** | 14 allergènes, 6 régimes, objectifs, édition complète |
| ⚙️ **Paramètres** | Config IA (Ollama / OpenRouter), import/export JSON |

---

## 🗄️ Sources de données

| Source | Volume | Intégration |
|--------|--------|-------------|
| 🇫🇷 **CIQUAL 2020** (ANSES) | 3 167 aliments | JSON embarqué, recherche locale |
| 🌍 **Open Food Facts** | +3 M produits | API REST, recherche + scan code-barres |
| 🤖 **IA (OpenRouter / Ollama)** | Modèles :free | Génération structurée (JSON schema) |
| 📷 **Scanner code-barres** | EAN-13/8, UPC | expo-camera + Open Food Facts |

---

## 🛠️ Stack technique

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

## 🚀 Lancer le projet

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

## 📁 Structure du projet

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
    │   └── settings.ts               # AppSettings, AIProvider
    ├── hooks/
    │   └── useDebounce.ts            # Hook debounce générique (300ms)
    ├── storage/
    │   ├── store.ts                  # AsyncStorage service (load/save/remove)
    │   └── usePersistedState.ts      # Hook persistance générique
    ├── data/
    │   ├── food.ts                   # Aliment exemple + repas initiaux
    │   ├── user.ts                   # Profil utilisateur par défaut
    │   ├── saved.ts                  # Plats sauvegardés (types + données)
    │   ├── search.ts                 # Résultats de recherche
    │   ├── stats.ts                  # Données statistiques
    │   └── ciqual.json               # Base CIQUAL 2020 — 3 167 aliments (~1 MB)
    ├── services/
    │   ├── aiService.ts              # Génération IA (OpenRouter + Ollama)
    │   ├── openFoodFacts.ts          # Client API Open Food Facts
    │   └── ciqual.ts                 # Recherche et conversion CIQUAL
    ├── components/
    │   ├── Icon.tsx                  # Wrapper Feather avec mapping design
    │   └── DrawerMenu.tsx            # Menu hamburger animé
    ├── navigation/
    │   └── AppShell.tsx              # Shell principal — navigation + état global
    └── screens/
        ├── HomeScreen.tsx
        ├── SearchScreen.tsx
        ├── DetailScreen.tsx
        ├── SavedScreen.tsx
        ├── SavedDetailScreen.tsx
        ├── EditSavedPlateScreen.tsx  # Création & édition de plats
        ├── StatsScreen.tsx
        ├── ProfileScreen.tsx
        ├── EditProfileScreen.tsx
        ├── SettingsScreen.tsx
        ├── AddFoodScreen.tsx         # Ajout via IA
        ├── OpenFoodFactsScreen.tsx
        ├── CIQUALScreen.tsx
        └── BarcodeScannerScreen.tsx  # Scan code-barres
```

---

## 🎨 Design system

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

## 🧠 Configuration IA

Nutritor supporte deux fournisseurs d'IA pour générer les fiches nutritionnelles :

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

---

## 📦 Format d'import / export JSON

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

## ✅ Fonctionnalités implémentées

- [x] 📊 Journal nutritionnel avec 5 repas et reset quotidien automatique
- [x] 💾 Persistance locale (AsyncStorage) — profil, aliments, repas, plats
- [x] 🔍 Recherche avec debounce 300ms
- [x] 🇫🇷 Base CIQUAL 2020 embarquée (3 167 aliments français)
- [x] 🌍 Open Food Facts — recherche et import
- [x] 📷 Scanner code-barres (EAN-13, EAN-8, UPC)
- [x] 🤖 Génération IA de fiches nutritionnelles (OpenRouter + Ollama)
- [x] ⚙️ Écran paramètres — config IA, import/export JSON
- [x] ✏️ Création et édition de plats sauvegardés
- [x] 🎬 Animations de transition (fade-enter 350ms)
- [x] 👤 Profil allergènes (14) et régimes (6)
- [x] 🎨 Icône app personnalisée (Instrument Serif + feuille verte)

## 🔜 Prochaines étapes

- [ ] 🌙 Thème dark / thème sage
- [ ] 📈 Statistiques hebdomadaires avancées
- [ ] 🔔 Rappels de repas
- [ ] ☁️ Synchronisation cloud
- [ ] 🍎 Build iOS (TestFlight)
- [ ] 🌾 Données Monash FODMAP (licence commerciale)

---

## 📄 Sources & Licences

| Donnée | Source | Licence |
|--------|--------|---------|
| Composition nutritionnelle FR | [CIQUAL — ANSES](https://ciqual.anses.fr/) | Open data |
| Codes-barres & produits | [Open Food Facts](https://world.openfoodfacts.org/) | ODbL |
| Seuils FODMAP | [Monash University](https://www.monashfodmap.com/) | Licence commerciale |
| ANR vitamines & minéraux | EFSA / ANSES | Réglementation UE |

> Les valeurs nutritionnelles sont **indicatives à des fins de prototype**.
