export type TagKind = 'ok' | 'warn' | '';

export interface SearchTag {
  label: string;
  kind: TagKind;
}

export interface SearchResult {
  id: string;
  name: string;
  brand: string;
  portion: string;
  kcal: number;
  glyph: string;
  tags: SearchTag[];
  macros: { protein: number; carbs: number; fat: number };
  incompatible?: boolean;
}

export interface RecentItem {
  id: string;
  name: string;
  brand: string;
  portion: string;
  kcal: number;
  glyph: string;
  macros: { protein: number; carbs: number; fat: number };
}

export type SearchFilterId = 'gf' | 'lf' | 'vg' | 'vgn' | 'nf' | 'low';

export interface SearchFilter {
  id: SearchFilterId;
  label: string;
  active: boolean;
}

export const SEARCH_FILTERS: SearchFilter[] = [
  { id: 'gf',  label: 'Sans gluten',        active: false },
  { id: 'lf',  label: 'Sans lactose',        active: false },
  { id: 'vg',  label: 'Végétarien',          active: false },
  { id: 'vgn', label: 'Vegan',               active: false },
  { id: 'nf',  label: 'Sans fruits à coque', active: false },
  { id: 'low', label: '< 200 kcal',          active: false },
];

export const SEARCH_RESULTS: SearchResult[] = [
  {
    id: 'qf-001', name: 'Quinoa rouge bio', brand: 'Maison Bertin', portion: '100 g', kcal: 368, glyph: 'Q',
    tags: [{ label: 'sans gluten', kind: 'ok' }, { label: 'vegan', kind: '' }],
    macros: { protein: 14, carbs: 64, fat: 6 },
  },
  {
    id: 'sa-002', name: 'Saumon fumé — Atlantique', brand: 'Pêcherie de Royan', portion: '100 g', kcal: 198, glyph: 'S',
    tags: [{ label: 'sans gluten', kind: 'ok' }, { label: 'poisson', kind: '' }],
    macros: { protein: 25, carbs: 0, fat: 11 },
  },
  {
    id: 'av-003', name: 'Avocat Hass', brand: 'Marché', portion: '1 fruit · 200 g', kcal: 322, glyph: 'A',
    tags: [{ label: 'sans gluten', kind: 'ok' }, { label: 'sans lactose', kind: 'ok' }],
    macros: { protein: 4, carbs: 17, fat: 30 },
  },
  {
    id: 'pn-004', name: 'Pain de seigle complet', brand: 'Boulangerie Roy', portion: '60 g · 2 tranches', kcal: 152, glyph: 'P',
    tags: [{ label: 'contient gluten', kind: 'warn' }],
    macros: { protein: 5, carbs: 30, fat: 1 },
    incompatible: true,
  },
  {
    id: 'ya-005', name: 'Yaourt soja vanille', brand: 'Sojami', portion: '125 g', kcal: 102, glyph: 'Y',
    tags: [{ label: 'sans lactose', kind: 'ok' }, { label: 'vegan', kind: '' }],
    macros: { protein: 4, carbs: 12, fat: 3 },
  },
];

export const RECENT: RecentItem[] = [
  { id: 'r-1', name: 'Œufs brouillés',   brand: 'Maison', portion: '2 œufs',   kcal: 156, glyph: 'Œ', macros: { protein: 13, carbs: 1,  fat: 11 } },
  { id: 'r-2', name: 'Riz basmati cuit', brand: 'Maison', portion: '150 g',    kcal: 195, glyph: 'R', macros: { protein: 4,  carbs: 42, fat: 0  } },
  { id: 'r-3', name: 'Pomme Gala',       brand: 'Marché', portion: '1 fruit',  kcal: 95,  glyph: 'P', macros: { protein: 0,  carbs: 25, fat: 0  } },
];
