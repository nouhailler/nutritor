export type ProtocolId = 'fodmap-elimination' | 'anti-inflammatory' | 'gluten-free-21';

export interface DailyObjective {
  id: string;
  label: string;
  labelEn: string;
  category: 'food' | 'habit' | 'tracking';
}

export interface DailyCheckIn {
  date: string;
  completedObjectiveIds: string[];
  note?: string;
}

export interface Challenge {
  id: string;
  protocolId: ProtocolId;
  startDate: string;
  durationDays: number;
  objectives: DailyObjective[];
  checkIns: DailyCheckIn[];
  active: boolean;
}
