export type AutoEventKind =
  | 'meal'
  | 'satiety'
  | 'caffeine'
  | 'vigilance'
  | 'glycemic'
  | 'postprandial'
  | 'anabolic'
  | 'fermentation'
  | 'digestion';

export type EventCategory = 'meal' | 'cognitive' | 'metabolic' | 'digestive' | 'nutritional';
export type EventIntensity = 'low' | 'mid' | 'high';

export interface AutoTimelineEvent {
  kind: 'auto';
  type: AutoEventKind;
  category: EventCategory;
  time: string;         // 'HH:MM'
  durationMin?: number; // duration → show end time
  label: string;
  sublabel?: string;    // secondary line
  emoji: string;
  intensity: EventIntensity;
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

// ── Derived analytics ──────────────────────────────────────────

export interface MiniMetric {
  emoji: string;
  label: string;
  value: string;
  level: 'ok' | 'mid' | 'warn';
}

export interface DaySummaryLine {
  text: string;
  kind: 'ok' | 'mid' | 'warn';
}
