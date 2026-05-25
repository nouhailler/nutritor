# 🌿 Contribuer à Nutritor

Merci de l'intérêt que tu portes à Nutritor !

Nutritor est une application de connaissance nutritionnelle et digestive — pensée pour les personnes avec SII, intolérances alimentaires, ou simplement curieuses de ce qu'elles mangent. Chaque contribution, même petite, améliore concrètement la vie de ces utilisateurs.

---

## 📋 Table des matières

- [Ce dont le projet a besoin](#-ce-dont-le-projet-a-besoin)
- [Démarrage rapide](#-démarrage-rapide)
- [Workflow de contribution](#-workflow-de-contribution)
- [Conventions du projet](#-conventions-du-projet)
- [Ce qu'on n'accepte pas](#-ce-quon-naccepte-pas)
- [Signaler un bug](#-signaler-un-bug)
- [Proposer une fonctionnalité](#-proposer-une-fonctionnalité)
- [Code de conduite](#-code-de-conduite)

---

## 🎯 Ce dont le projet a besoin

### 🟢 Priorité haute — Contributions bienvenues immédiatement

| Besoin | Type | Niveau |
|--------|------|--------|
| Tests sur vrais appareils Android (phones variés) | QA | Débutant |
| Tests sur iOS via Expo Go | QA | Débutant |
| Traduction espagnole (`src/i18n/es.json`) | Traduction | Débutant |
| Traduction allemande (`src/i18n/de.json`) | Traduction | Débutant |
| Rapports de bugs avec captures d'écran | Bug report | Débutant |
| Vérification des valeurs FODMAP (profils nutrition/santé) | Contenu | Débutant |

### 🟡 Contributions techniques souhaitées

| Besoin | Type | Niveau |
|--------|------|--------|
| Mode sombre (thème dark complet) | Feature | Intermédiaire |
| Rappels de repas (notifications Expo) | Feature | Intermédiaire |
| Tests unitaires (Jest + React Native Testing Library) | Tests | Intermédiaire |
| Optimisation des performances AsyncStorage | Perf | Intermédiaire |
| Build iOS / TestFlight | DevOps | Avancé |
| Synchronisation cloud optionnelle | Feature | Avancé |

### 💡 Contributions non-code également précieuses

- Retours d'expérience utilisateur (ouvrir une Issue)
- Suggestions d'aliments manquants dans la base CIQUAL
- Corrections orthographiques / amélioration des textes UI
- Documentation supplémentaire

> Les issues taguées [`good first issue`](../../issues?q=is%3Aopen+label%3A%22good+first+issue%22) sont idéales pour commencer.

---

## 🚀 Démarrage rapide

### Prérequis

- **Node.js** 18 ou supérieur
- **npm** 9+ ou **yarn**
- **Expo Go** installé sur ton téléphone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- Un compte [expo.dev](https://expo.dev) (gratuit)

### Installation

```bash
# 1. Forker le repo sur GitHub, puis cloner ton fork
git clone https://github.com/TON_USERNAME/nutritor.git
cd nutritor

# 2. Installer les dépendances
npm install

# 3. Lancer en mode développement
npx expo start

# 4. Scanner le QR code avec Expo Go sur ton téléphone
```

L'application devrait être opérationnelle en moins de 5 minutes.

### Configuration IA (optionnelle)

L'IA est entièrement optionnelle — toutes les fonctionnalités de base (journal, CIQUAL, FODMAP, encyclopédie) fonctionnent sans elle. Pour tester les fonctionnalités IA :

- **OpenRouter** (recommandé pour dev) : créer un compte sur [openrouter.ai](https://openrouter.ai), les modèles `:free` sont gratuits
- **Ollama** (100 % local) : `ollama run llama3.2`, puis configurer l'URL dans Paramètres

---

## 🔀 Workflow de contribution

### 1. Ouvrir ou trouver une Issue

Avant de coder, vérifie qu'une Issue existe pour ce que tu veux faire. Si non, ouvre-en une pour en discuter — ça évite le travail inutile.

### 2. Forker et créer une branche

```bash
git checkout -b feat/nom-de-ta-feature
# ou
git checkout -b fix/description-du-bug
```

**Convention de nommage des branches :**

| Préfixe | Usage |
|---------|-------|
| `feat/` | Nouvelle fonctionnalité |
| `fix/` | Correction de bug |
| `i18n/` | Traduction |
| `docs/` | Documentation |
| `perf/` | Optimisation |
| `test/` | Ajout de tests |

Exemples : `feat/dark-mode`, `fix/timeline-fodmap-calcul`, `i18n/spanish`

### 3. Développer

- Commits atomiques et explicites (voir [Conventions](#-conventions-du-projet))
- Tester sur au moins un vrai appareil ou émulateur
- Vérifier qu'aucune fonctionnalité existante n'est cassée

### 4. Ouvrir une Pull Request

- Titre clair : `feat: ajout du mode sombre` / `fix: calcul FODMAP incorrect sur les légumineuses`
- Description : ce que ça fait, pourquoi, captures d'écran si UI
- Lier l'Issue correspondante : `Closes #42`

---

## 📐 Conventions du projet

### Stack technique

```
React Native + Expo SDK 54  ·  TypeScript strict
```

### Style de code

- **TypeScript strict** — pas de `any` implicite
- **CSS Modules uniquement** — pas de StyleSheet inline sauf cas exceptionnel justifié
- **Pas de librairie de navigation externe** — le projet utilise un AppShell custom
- **Composants fonctionnels** + hooks — pas de classes
- **Nommage** : PascalCase pour les composants, camelCase pour les fonctions/variables

### Commits

Format : `type: description courte en français`

```
feat: ajout du mode sombre
fix: correction calcul calories lipides
i18n: traduction espagnole complète
docs: mise à jour README screenshots
perf: optimisation chargement AsyncStorage
```

### Structure des fichiers

```
src/
├── components/     # Composants réutilisables
├── screens/        # Écrans principaux (un fichier par onglet)
├── hooks/          # Hooks personnalisés
├── utils/          # Fonctions utilitaires pures
├── i18n/           # Fichiers de traduction (fr.json, en.json...)
└── types/          # Types TypeScript partagés
```

### Couleurs — utiliser les tokens définis

```typescript
// ✅ Correct
color: 'var(--ink)'
backgroundColor: 'var(--paper)'

// ❌ À éviter
color: '#1A1814'
backgroundColor: '#F2EDE2'
```

| Token | Valeur | Usage |
|-------|--------|-------|
| `--paper` | `#F2EDE2` | Fond général |
| `--ink` | `#1A1814` | Texte principal |
| `--ok` | `#3F5A3A` | Compatible, succès |
| `--warn` | `#8B3A2E` | Incompatible, alerte |
| `--signal` | `#6B5A2E` | Neutre, CIQUAL |

---

## 🚫 Ce qu'on n'accepte pas

Pour maintenir la cohérence et la vision du projet, certaines contributions seront refusées même bien intentionnées :

- ❌ **React Navigation ou toute lib de navigation externe** — le projet a son propre AppShell
- ❌ **Dépendances cloud obligatoires** — l'app doit rester 100 % fonctionnelle hors-ligne sans compte
- ❌ **Monétisation ou publicité** — Nutritor est et restera sans pub
- ❌ **Données nutritionnelles non sourcées** — toute valeur FODMAP ou nutritionnelle doit citer une source (Monash, ANSES/CIQUAL, EFSA...)
- ❌ **Breaking changes sur l'API AsyncStorage** — la migration des données utilisateurs existantes doit toujours être gérée
- ❌ **Styled components, Tailwind ou autre système CSS externe** — CSS Modules uniquement

En cas de doute, ouvre d'abord une Issue pour en discuter.

---

## 🐛 Signaler un bug

Ouvre une [Issue](../../issues/new) avec :

- **Version** de l'app (visible dans Paramètres)
- **Appareil** et version Android/iOS
- **Étapes pour reproduire** le bug
- **Comportement attendu** vs **comportement observé**
- **Capture d'écran ou log** si possible

---

## 💡 Proposer une fonctionnalité

Ouvre une [Issue](../../issues/new) avec le tag `enhancement` en décrivant :

- Le problème que ça résout (ou l'utilisateur que ça aide)
- La solution envisagée
- Des alternatives que tu as considérées

Les features liées aux protocoles digestifs (FODMAP, SII, intolérances) sont particulièrement bienvenues si elles s'appuient sur des sources médicales ou scientifiques.

---

## 🤝 Code de conduite

Ce projet suit des règles simples :

- **Respect** — tout le monde débute quelque part
- **Bienveillance** — les retours sur les PRs sont constructifs, jamais condescendants
- **Inclusivité** — contributions bienvenues quelle que soit ton expérience ou ton origine
- **Focus** — les discussions restent liées au projet

Tout comportement inapproprié peut être signalé en ouvrant une Issue privée ou en contactant les mainteneurs.

---

*Fait avec 🌿 pour les estomacs sensibles — et les développeurs curieux.*
