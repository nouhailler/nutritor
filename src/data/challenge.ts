import { Challenge, DailyObjective, ProtocolId } from '../types/challenge';

export interface ProtocolDef {
  id: ProtocolId;
  emoji: string;
  color: string;
  bgColor: string;
  durationDays: number;
  objectives: DailyObjective[];
}

export const PROTOCOLS: ProtocolDef[] = [
  {
    id: 'fodmap-elimination',
    emoji: '🔴',
    color: '#8B3A2E',
    bgColor: 'rgba(139,58,46,0.07)',
    durationDays: 28,
    objectives: [
      { id: 'fo-1', label: 'Éviter tous les aliments FODMAP élevés', labelEn: 'Avoid all high-FODMAP foods', category: 'food' },
      { id: 'fo-2', label: 'Tenir le journal alimentaire complet', labelEn: 'Complete your food journal', category: 'tracking' },
      { id: 'fo-3', label: 'Noter les symptômes du jour', labelEn: 'Log today\'s symptoms', category: 'tracking' },
      { id: 'fo-4', label: 'Cuisiner soi-même au moins un repas', labelEn: 'Cook at least one meal yourself', category: 'habit' },
    ],
  },
  {
    id: 'anti-inflammatory',
    emoji: '🟢',
    color: '#3F5A3A',
    bgColor: 'rgba(63,90,58,0.07)',
    durationDays: 30,
    objectives: [
      { id: 'ai-1', label: 'Manger 5 portions de légumes et fruits colorés', labelEn: 'Eat 5 servings of colourful vegetables and fruit', category: 'food' },
      { id: 'ai-2', label: 'Éviter les aliments ultra-transformés', labelEn: 'Avoid ultra-processed foods', category: 'food' },
      { id: 'ai-3', label: 'Consommer des oméga-3 (poisson gras, noix, graines)', labelEn: 'Consume omega-3s (oily fish, nuts, seeds)', category: 'food' },
      { id: 'ai-4', label: '20 min d\'activité physique', labelEn: '20 min of physical activity', category: 'habit' },
      { id: 'ai-5', label: 'Boire au minimum 1,5 L d\'eau', labelEn: 'Drink at least 1.5 L of water', category: 'habit' },
    ],
  },
  {
    id: 'gluten-free-21',
    emoji: '🌾',
    color: '#6B5A2E',
    bgColor: 'rgba(107,90,46,0.07)',
    durationDays: 21,
    objectives: [
      { id: 'gf-1', label: 'Zéro gluten dans tous les repas', labelEn: 'Zero gluten across all meals', category: 'food' },
      { id: 'gf-2', label: 'Vérifier les étiquettes avant chaque achat', labelEn: 'Check labels before every purchase', category: 'habit' },
      { id: 'gf-3', label: 'Tenir le journal alimentaire complet', labelEn: 'Complete your food journal', category: 'tracking' },
      { id: 'gf-4', label: 'Noter l\'énergie et les symptômes digestifs', labelEn: 'Log energy levels and digestive symptoms', category: 'tracking' },
    ],
  },
];

export function getProtocol(id: ProtocolId): ProtocolDef {
  return PROTOCOLS.find((p) => p.id === id) ?? PROTOCOLS[0];
}

export function getDayNumber(challenge: Challenge): number {
  const start = new Date(challenge.startDate + 'T12:00:00');
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.floor((today.getTime() - start.getTime()) / 86400000);
  return Math.max(1, Math.min(diff + 1, challenge.durationDays));
}

export function getDaysRemaining(challenge: Challenge): number {
  return Math.max(0, challenge.durationDays - getDayNumber(challenge) + 1);
}

export function getCompletionPct(challenge: Challenge): number {
  const day = getDayNumber(challenge);
  return Math.min(1, (day - 1) / challenge.durationDays);
}

export function getStreak(challenge: Challenge): number {
  const checkInDates = new Set(
    challenge.checkIns
      .filter((c) => c.completedObjectiveIds.length > 0)
      .map((c) => c.date),
  );
  let streak = 0;
  const todayDate = new Date();
  for (let i = 0; i < 100; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    if (checkInDates.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export function getTodayCheckIn(challenge: Challenge, todayStr: string) {
  return challenge.checkIns.find((c) => c.date === todayStr) ?? null;
}

export function createChallenge(protocolId: ProtocolId): Challenge {
  const def = getProtocol(protocolId);
  return {
    id: `challenge-${Date.now()}`,
    protocolId,
    startDate: new Date().toISOString().slice(0, 10),
    durationDays: def.durationDays,
    objectives: def.objectives,
    checkIns: [],
    active: true,
  };
}
