# Changelog

Toutes les modifications notables de Nutritor sont documentées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

---

## [Unreleased]

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
