export type AutoEventKind =
  | 'meal'
  | 'caffeine'
  | 'glycemic'
  | 'postprandial'
  | 'anabolic'
  | 'fermentation'
  | 'digestion';

export interface AutoTimelineEvent {
  kind: 'auto';
  type: AutoEventKind;
  time: string;      // 'HH:MM'
  label: string;
  emoji: string;
  mealId?: string;
}

export type QuickSymptomKey =
  | 'bloating'
  | 'nausea'
  | 'pain'
  | 'fatigue'
  | 'energy'
  | 'good'
  | 'thirst'
  | 'heat'
  | 'transit';

export const QUICK_SYMPTOMS: Record<QuickSymptomKey, { emoji: string; label: string }> = {
  bloating:  { emoji: '💨', label: 'Ballonnements' },
  nausea:    { emoji: '🤢', label: 'Nausées' },
  pain:      { emoji: '🤕', label: 'Douleurs' },
  fatigue:   { emoji: '😴', label: 'Fatigue' },
  energy:    { emoji: '💪', label: 'Énergie' },
  good:      { emoji: '😊', label: 'Bien' },
  thirst:    { emoji: '💧', label: 'Soif' },
  heat:      { emoji: '🔥', label: 'Chaleur' },
  transit:   { emoji: '🚽', label: 'Transit' },
};

export interface UserTimelineEvent {
  kind: 'user';
  id: string;
  date: string;      // 'YYYY-MM-DD'
  time: string;      // 'HH:MM'
  symptom: QuickSymptomKey;
  severity: number;  // 1–5
  note?: string;
}

export type TimelineEvent = AutoTimelineEvent | UserTimelineEvent;
