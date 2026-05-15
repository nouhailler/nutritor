# Nutritor

Application mobile de suivi nutritionnel pensée pour les utilisateurs ayant des **contraintes alimentaires fortes** — allergies, intolérances, régimes sans gluten / sans lactose / Low FODMAP.

Le focus n'est pas le comptage de calories pour la perte de poids — c'est la **transparence totale sur la composition d'un aliment** : macros, profil d'acides aminés, types d'acides gras, vitamines avec rôle physiologique, seuils FODMAP par phase, molécules bioactives, action métabolique et profil sensoriel.

---

## Écrans

| Écran | Description |
|-------|-------------|
| **Journal** | Bilan du jour — anneau kcal SVG, macros, panel vitamines (13 essentielles), 5 repas |
| **Recherche** | Recherche d'aliments avec filtres régime, résultats compatibles / filtrés / récents |
| **Détail aliment** | 12 sections éditoriales — acides aminés, FODMAP, bioactives, profil sensoriel |
| **Plats sauvegardés** | Bibliothèque de repas — grille 2 colonnes avec filtres |
| **Détail plat** | Recette complète par ingrédient, macros, ajout au journal |
| **Statistiques** | Bar chart 7 jours, sparklines macros, heatmap conformité régime |
| **Profil** | Allergènes (14), régimes (6), objectifs, édition complète |

---

## Stack

- **React Native + Expo** (TypeScript)
- **react-native-svg** — anneau kcal, sparklines, patron rayé, barre acides gras
- **@expo-google-fonts** — Instrument Serif · Geist · JetBrains Mono
- **@expo/vector-icons** — set Feather
- **react-native-safe-area-context**
- Navigation custom (pas de React Navigation) — shell `AppShell` avec état `tab` + `stack`

---

## Lancer le projet

```bash
# Installer les dépendances
npm install

# Démarrer Expo Go (scan QR avec l'app Expo Go)
npx expo start

# Android
npx expo start --android

# iOS
npx expo start --ios
```

**Prérequis** : Node 18+, Expo CLI, app Expo Go sur le téléphone (ou émulateur).

---

## Structure

```
src/
├── theme/tokens.ts          # Design tokens — Colors, Fonts, FA_COLORS
├── types/index.ts           # Interfaces TypeScript — Food, Meal, Allergen, Fodmap…
├── data/
│   ├── food.ts              # Aliment détail (Quinoa rouge bio) + repas initiaux
│   ├── user.ts              # Profil utilisateur par défaut
│   ├── saved.ts             # 6 plats sauvegardés avec recettes complètes
│   ├── search.ts            # Résultats de recherche et récents
│   └── stats.ts             # Données hebdomadaires
├── components/
│   ├── Icon.tsx             # Wrapper Feather avec mapping noms design
│   └── DrawerMenu.tsx       # Menu hamburger animé
├── navigation/
│   └── AppShell.tsx         # Shell principal — navigation + état global
└── screens/
    ├── HomeScreen.tsx
    ├── SearchScreen.tsx
    ├── DetailScreen.tsx
    ├── SavedScreen.tsx
    ├── SavedDetailScreen.tsx
    ├── StatsScreen.tsx
    ├── ProfileScreen.tsx
    └── EditProfileScreen.tsx
```

---

## Design

Palette **ivoire éditorial** — `#F2EDE2` (paper) · `#1A1814` (ink) · `#3F5A3A` (ok) · `#8B3A2E` (warn) · `#6B5A2E` (signal).

Maquettes haute-fidélité dans `../design_handoff_nutritor/` (HTML + React + Babel, ouvrir `index.html` dans Chrome).

---

## Données

Les valeurs nutritionnelles sont **indicatives à des fins de prototype**. En production, brancher :

- [CIQUAL](https://ciqual.anses.fr/) — table de composition des aliments (ANSES)
- [Open Food Facts](https://world.openfoodfacts.org/) — codes-barres
- [Monash FODMAP](https://www.monashfodmap.com/) — seuils par phase (licence)
- EFSA / ANSES — ANR vitamines et minéraux

---

## Prochaines étapes

- [ ] Persistance locale (AsyncStorage / SQLite)
- [ ] Branchement API données réelles
- [ ] Scanner code-barres
- [ ] Transitions d'écran (fade-enter)
- [ ] Thème dark et thème sage
- [ ] Création / édition de plats sauvegardés
