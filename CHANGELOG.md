# Changelog

Toutes les modifications notables de Nutritor sont documentées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

---

## [Unreleased]

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
