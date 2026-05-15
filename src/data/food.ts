import { Food, Meal } from '../types';

export const DETAIL_FOOD: Food = {
  id: 'qf-001',
  category: 'Céréale complète · Pseudo-céréale',
  name: 'Quinoa rouge bio',
  subtitle:
    "Récolté sur l'Altiplano bolivien, cultivé sans pesticide. Une des rares sources végétales de protéines complètes, naturellement sans gluten.",
  brand: 'Maison Bertin',
  origin: 'Bolivie · Altiplano · 3 800 m',
  defaultPortion: 100,
  unit: 'g',

  per100: {
    kcal: 368,
    fat: 6.1,
    fatSat: 0.7,
    carbs: 64.2,
    sugars: 2.6,
    fiber: 7.0,
    protein: 14.1,
    salt: 0.01,
  },

  proteinDetail: {
    totalG: 14.1,
    complete: true,
    bcaaG: 2.4,
    pdcaas: 0.82,
    amino: [
      { name: 'Leucine', qty: '837 mg', role: 'Synthèse musculaire', essential: true },
      { name: 'Isoleucine', qty: '504 mg', role: 'Énergie musculaire', essential: true },
      { name: 'Valine', qty: '594 mg', role: 'Réparation tissulaire', essential: true },
      { name: 'Lysine', qty: '766 mg', role: 'Synthèse collagène', essential: true },
      { name: 'Méthionine', qty: '309 mg', role: 'Donneur méthyl', essential: true },
      { name: 'Phénylalanine', qty: '593 mg', role: 'Précurseur dopamine', essential: true },
      { name: 'Thréonine', qty: '421 mg', role: 'Muqueuses intestinales', essential: true },
      { name: 'Tryptophane', qty: '167 mg', role: 'Précurseur sérotonine', essential: true },
      { name: 'Histidine', qty: '407 mg', role: 'Anti-inflammatoire', essential: true },
    ],
  },

  carbDetail: {
    totalG: 64.2,
    starchG: 52.2,
    sugarsG: 2.6,
    fiberG: 7.0,
    fiberSolubleG: 2.5,
    fiberInsolubleG: 4.5,
    glycemicIndex: 35,
    glycemicLoad: 22,
    notes:
      'Index glycémique bas (35). Riche en amidons complexes à digestion lente, idéal pour une glycémie stable.',
  },

  lipidDetail: {
    totalG: 6.1,
    fa: [
      { name: 'Acides gras saturés', qty: '0.7 g', pct: '11 %', role: 'Énergie, structure membranaire' },
      {
        name: 'Mono-insaturés (ω-9)',
        qty: '1.6 g',
        pct: '26 %',
        role: 'Acide oléique — santé cardio',
      },
      {
        name: 'Poly-insaturés ω-6',
        qty: '2.8 g',
        pct: '46 %',
        role: 'Acide linoléique — essentiel',
      },
      {
        name: 'Poly-insaturés ω-3',
        qty: '0.3 g',
        pct: '5 %',
        role: 'Acide α-linolénique — anti-inflammatoire',
      },
      { name: 'Trans (naturels)', qty: '< 0.05 g', pct: '<1%', role: 'Négligeable' },
    ],
    ratioOmega: '6 : 1 (ω6/ω3)',
  },

  minerals: [
    {
      name: 'Magnésium',
      qty: '197 mg',
      anr: '52 %',
      role: 'Détente musculaire, sommeil, métabolisme énergétique',
    },
    { name: 'Potassium', qty: '563 mg', anr: '28 %', role: 'Équilibre hydrique, tension artérielle' },
    { name: 'Phosphore', qty: '457 mg', anr: '65 %', role: 'Os, dents, membrane cellulaire' },
    { name: 'Calcium', qty: '47 mg', anr: '6 %', role: 'Trame osseuse, contraction musculaire' },
    { name: 'Sodium', qty: '5 mg', anr: '<1 %', role: 'Équilibre osmotique' },
  ],

  vitamins: [
    {
      name: 'Vitamine B1 — Thiamine',
      qty: '0.36 mg',
      anr: '33 %',
      role: 'Métabolisme des glucides, fonction nerveuse',
    },
    {
      name: 'Vitamine B2 — Riboflavine',
      qty: '0.32 mg',
      anr: '23 %',
      role: "Production d'énergie, vision",
    },
    {
      name: 'Vitamine B3 — Niacine',
      qty: '1.52 mg',
      anr: '10 %',
      role: 'Métabolisme cellulaire, ADN',
    },
    {
      name: 'Vitamine B6 — Pyridoxine',
      qty: '0.49 mg',
      anr: '35 %',
      role: 'Neurotransmetteurs, immunité',
    },
    { name: 'Vitamine B9 — Folates', qty: '184 µg', anr: '92 %', role: 'Synthèse ADN, division cellulaire' },
    {
      name: 'Vitamine E — α-tocophérol',
      qty: '2.4 mg',
      anr: '20 %',
      role: 'Anti-oxydant, intégrité membranes',
    },
  ],

  trace: [
    {
      name: 'Fer',
      qty: '4.6 mg',
      anr: '33 %',
      role: 'Transport oxygène (hémoglobine), enzymes',
    },
    {
      name: 'Zinc',
      qty: '3.1 mg',
      anr: '31 %',
      role: 'Immunité, synthèse protéique, cicatrisation',
    },
    {
      name: 'Manganèse',
      qty: '2.0 mg',
      anr: '100 %',
      role: 'Anti-oxydant SOD, métabolisme glucides',
    },
    { name: 'Cuivre', qty: '0.59 mg', anr: '59 %', role: 'Métabolisme du fer, pigmentation' },
    {
      name: 'Sélénium',
      qty: '8.5 µg',
      anr: '15 %',
      role: 'Cofacteur glutathion peroxydase, thyroïde',
    },
    { name: 'Iode', qty: 'trace', anr: '—', role: 'Hormones thyroïdiennes' },
  ],

  fodmap: {
    overall: 'low',
    types: [
      { name: 'GOS (galacto-oligosaccharides)', present: 'oui', level: 'faible' },
      { name: 'Fructanes', present: 'trace', level: 'très faible' },
      { name: 'Polyols (sorbitol, mannitol)', present: 'non', level: '—' },
      { name: 'Lactose', present: 'non', level: '—' },
      { name: "Fructose en excès", present: 'non', level: '—' },
    ],
    elimination: { portion: '60', status: 'safe', note: 'Sans symptômes prévisibles' },
    reintroduction: {
      portion: '155',
      status: 'safe',
      note: 'Tolérance haute, à confirmer en challenge',
    },
    absoluteLimit: { portion: '220', status: 'warn', note: 'Au-delà, charge GOS significative' },
    alternatives: [
      { name: 'Riz blanc basmati', why: 'Zéro FODMAP, très digeste' },
      { name: 'Millet décortiqué', why: 'Sans gluten, FODMAP très bas' },
      { name: 'Pommes de terre', why: 'Amidon résistant modéré' },
      { name: 'Sarrasin grillé', why: 'Pseudo-céréale alternative' },
    ],
  },

  bioactives: [
    {
      name: 'Bétalaïnes',
      qty: '~120 mg',
      role: 'Pigment rouge · anti-oxydant, anti-inflammatoire',
    },
    {
      name: 'Quercétine',
      qty: '36 mg',
      role: 'Flavonoïde · modulation immunitaire, vaisseaux',
    },
    { name: 'Kaempférol', qty: '20 mg', role: 'Anti-oxydant, protection cardiovasculaire' },
    {
      name: 'Saponines',
      qty: '0.4 %',
      role: "Cholestérol ↓ (effet émulsifiant), goût amer",
    },
    { name: 'Phytostérols', qty: '118 mg', role: "Absorption cholestérol ↓" },
    { name: 'Acide ferulique', qty: '4 mg', role: 'Anti-oxydant, protection neurologique' },
  ],

  metabolic: [
    { axis: 'Glycémie', tone: 'low', text: 'IG bas (35). Pic glycémique étalé sur 90 min.' },
    { axis: 'Satiété', tone: 'high', text: 'Fibres + protéines complètes : satiété 4 h.' },
    {
      axis: 'Inflammation',
      tone: 'low',
      text: 'Ratio ω6/ω3 = 6:1, bétalaïnes anti-inflammatoires.',
    },
    {
      axis: 'Charge digestive',
      tone: 'mid',
      text: 'Saponines : rincer avant cuisson. FODMAP bas à dose normale.',
    },
    {
      axis: 'Récupération',
      tone: 'high',
      text: 'BCAA 2.4 g + Mg 197 mg = signal anabolique modéré.',
    },
  ],

  sensory: {
    taste: ['noisette', 'terreux', 'légère amertume', 'note herbacée'],
    texture: ['ferme', 'pop sous la dent', 'légèrement crémeux à cœur'],
    aroma: ['céréale grillée', 'foin coupé', 'noix verte'],
    pairings: ['Citron', 'Avocat', 'Coriandre', 'Cumin'],
  },

  allergens: [
    { name: 'Gluten', status: 'absent' },
    { name: 'Lactose', status: 'absent' },
    { name: 'Œufs', status: 'absent' },
    { name: 'Arachides', status: 'absent' },
    { name: 'Fruits à coque', status: 'trace' },
    { name: 'Soja', status: 'absent' },
    { name: 'Poisson', status: 'absent' },
    { name: 'Crustacés', status: 'absent' },
    { name: 'Sésame', status: 'absent' },
    { name: 'Moutarde', status: 'absent' },
  ],

  compat: [
    { label: 'Sans gluten', kind: 'ok' },
    { label: 'Sans lactose', kind: 'ok' },
    { label: 'Vegan', kind: 'ok' },
    { label: 'Low FODMAP (≤155g)', kind: 'ok' },
    { label: 'Trace fruits à coque', kind: 'warn' },
  ],

  ingredients:
    "Quinoa rouge bio (Chenopodium quinoa Willd.). Issu de l'agriculture biologique. Conditionné dans un atelier utilisant des fruits à coque et du sésame.",
  ingredientsHighlights: ['fruits à coque', 'sésame'],
};

export const INITIAL_MEALS: Meal[] = [
  {
    id: 'm-brk',
    name: 'Petit-déjeuner',
    time: '08:14',
    items: [
      { name: 'Pain au sarrasin', qty: '50 g', kcal: 162, macros: { protein: 4, carbs: 32, fat: 2 } },
      { name: "Purée d'amande", qty: '15 g', kcal: 94, macros: { protein: 3, carbs: 3, fat: 8 } },
      { name: 'Banane', qty: '1 fruit', kcal: 105, macros: { protein: 1, carbs: 27, fat: 0 } },
    ],
  },
  { id: 'm-lun', name: 'Déjeuner', time: '13:00', items: [] },
  { id: 'm-sn1', name: 'Encas matin', time: '10:30', items: [] },
  { id: 'm-sn2', name: 'Encas après-midi', time: '16:30', items: [] },
  { id: 'm-din', name: 'Dîner', time: '20:00', items: [] },
];
