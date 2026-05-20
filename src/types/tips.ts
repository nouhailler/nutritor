export type TipKind = 'educational' | 'contextual' | 'behavioral' | 'pattern' | 'insight';
export type TipLevel = 'info' | 'caution' | 'positive';

export interface DayTip {
  id: string;
  kind: TipKind;
  level: TipLevel;
  emoji: string;
  message: string;
}
