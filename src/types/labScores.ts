export type LabStatus = 'ok' | 'mid' | 'warn';

export interface LabScore {
  status: LabStatus;
  value: string;    // valeur affichée, ex : "1:11", "74/100", "Modérée", "28 %"
  label: string;    // qualification courte, ex : "Déséquilibré", "Bonne densité"
  comment: string;  // observation en 1 phrase
}

export interface LabScores {
  omega: LabScore;          // ratio ω-3 / ω-6
  microDensity: LabScore;   // densité micronutritionnelle (0-100)
  inflammatory: LabScore;   // score inflammatoire (-5 → +5, négatif = anti-inflammatoire)
  diversity: LabScore;      // diversité alimentaire (groupes distincts)
  ultraProcessed: LabScore; // score ultra-transformé (% calorique NOVA 4)
  fodmap: LabScore;         // charge FODMAP cumulée
  aminoBalance: LabScore;   // équilibre acides aminés essentiels (0-100)
}
