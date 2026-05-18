export type KnowledgeCategory =
  | 'vitamin'
  | 'mineral'
  | 'aminoacid'
  | 'bioactive'
  | 'concept';

export interface KnowledgeEntry {
  id: string;
  category: KnowledgeCategory;
  name: string;
  aliases?: string[];
  emoji: string;
  tagline: string;
  simple: {
    what: string;
    why: string;
    sources: string[];
    deficiency?: string;
  };
  expert: {
    mechanism: string;
    interactions: string[];
    dosage?: { rda: string; upper?: string; unit: string };
    clinicalNote?: string;
    fodmapNote?: string;
  };
  relatedIds?: string[];
}

export const CATEGORY_META: Record<
  KnowledgeCategory,
  { label: string; emoji: string; color: string; bg: string }
> = {
  vitamin:   { label: 'Vitamines',           emoji: '🌟', color: '#A0620A', bg: 'rgba(160,98,10,0.08)'  },
  mineral:   { label: 'Minéraux',            emoji: '🪨', color: '#2E5A8B', bg: 'rgba(46,90,139,0.08)' },
  aminoacid: { label: 'Acides aminés',       emoji: '🧬', color: '#3F5A3A', bg: 'rgba(63,90,58,0.08)'  },
  bioactive: { label: 'Composés bioactifs',  emoji: '🌿', color: '#6B3A8B', bg: 'rgba(107,58,139,0.08)'},
  concept:   { label: 'Concepts digestifs',  emoji: '🧠', color: '#8B3A2E', bg: 'rgba(139,58,46,0.08)' },
};
