export type TipTag = 'fodmap' | 'digestion' | 'glycemia' | 'protein' | 'fiber' | 'timing' | 'bioactive';

export interface EducationalTip {
  id: string;
  tag: TipTag;
  emoji: string;
  message: string;
}

export const EDUCATIONAL_TIPS: EducationalTip[] = [
  // FODMAP
  {
    id: 'edu_01',
    tag: 'fodmap',
    emoji: '💡',
    message: 'Les fructanes (blé, oignon, ail) fermentent généralement 2 à 4h après l\'ingestion, souvent dans l\'après-midi ou la soirée.',
  },
  {
    id: 'edu_02',
    tag: 'fodmap',
    emoji: '💡',
    message: 'Le lactose non digéré atteint le côlon en 1 à 2h. Les inconforts apparaissent donc en fin de repas ou peu après.',
  },
  {
    id: 'edu_03',
    tag: 'fodmap',
    emoji: '💡',
    message: 'Les polyols (mannitol, sorbitol) sont absorbés lentement : leurs effets fermentescibles se font sentir 4 à 6h après l\'ingestion.',
  },
  {
    id: 'edu_04',
    tag: 'fodmap',
    emoji: '💡',
    message: 'La cuisson prolongée réduit la teneur en fructanes de certains légumes. Les poireaux et choux sont souvent mieux tolérés bien cuits.',
  },
  {
    id: 'edu_05',
    tag: 'fodmap',
    emoji: '💡',
    message: 'Le fructose en excès du glucose est mal absorbé. Les jus de fruits concentrés et le sirop d\'agave sont fréquemment à l\'origine d\'inconforts.',
  },
  // Digestion / Lipides
  {
    id: 'edu_06',
    tag: 'digestion',
    emoji: '💡',
    message: 'Les repas riches en lipides ralentissent la vidange gastrique de 3 à 5 heures. La digestion reste active bien après le repas.',
  },
  {
    id: 'edu_07',
    tag: 'digestion',
    emoji: '💡',
    message: 'La mastication prolongée active les enzymes salivaires et réduit le travail de l\'estomac — elle améliore souvent le confort post-prandial.',
  },
  {
    id: 'edu_08',
    tag: 'digestion',
    emoji: '💡',
    message: 'Une marche légère de 10 à 15 minutes après un repas copieux stimule le transit et réduit le pic glycémique postprandial.',
  },
  {
    id: 'edu_09',
    tag: 'digestion',
    emoji: '💡',
    message: 'Fractionner un repas copieux en deux prises plus légères, espacées de 2h, peut améliorer sensiblement le confort digestif.',
  },
  // Glycémie
  {
    id: 'edu_10',
    tag: 'glycemia',
    emoji: '💡',
    message: 'Manger les légumes avant les glucides peut réduire le pic glycémique postprandial de 30 à 40% en ralentissant l\'absorption intestinale.',
  },
  {
    id: 'edu_11',
    tag: 'glycemia',
    emoji: '💡',
    message: 'Les fibres solubles (avoine, légumineuses, pomme cuite) forment un gel dans l\'intestin qui ralentit l\'absorption du glucose.',
  },
  {
    id: 'edu_12',
    tag: 'glycemia',
    emoji: '💡',
    message: 'Inclure une source de protéines en début de repas stimule l\'insuline en amont et modère le pic glycémique des glucides.',
  },
  {
    id: 'edu_13',
    tag: 'glycemia',
    emoji: '💡',
    message: 'La charge glycémique (index glycémique × quantité réelle de glucides) est plus utile que l\'IG seul pour évaluer l\'impact réel d\'un repas.',
  },
  // Protéines
  {
    id: 'edu_14',
    tag: 'protein',
    emoji: '💡',
    message: 'La synthèse protéique musculaire est maximale dans les 2h après un effort physique — une collation protéinée dans cette fenêtre est particulièrement efficace.',
  },
  {
    id: 'edu_15',
    tag: 'protein',
    emoji: '💡',
    message: 'Les protéines complètes (9 acides aminés essentiels) se trouvent principalement dans les produits animaux, le quinoa et certaines associations légumineuses-céréales.',
  },
  {
    id: 'edu_16',
    tag: 'protein',
    emoji: '💡',
    message: 'Répartir les protéines sur 3 à 4 repas optimise la synthèse musculaire mieux qu\'une seule grande prise quotidienne.',
  },
  // Fibres / Microbiome
  {
    id: 'edu_17',
    tag: 'fiber',
    emoji: '💡',
    message: 'Le microbiote intestinal se nourrit principalement de fibres fermentescibles. Plus l\'alimentation est variée, plus la diversité microbienne est élevée.',
  },
  {
    id: 'edu_18',
    tag: 'fiber',
    emoji: '💡',
    message: 'Les aliments fermentés (yaourt, kéfir, choucroute non pasteurisée) apportent des bactéries vivantes bénéfiques qui soutiennent le microbiote.',
  },
  {
    id: 'edu_19',
    tag: 'fiber',
    emoji: '💡',
    message: 'Augmenter les fibres progressivement sur 2 à 3 semaines réduit les ballonnements d\'adaptation — l\'intestin a besoin de s\'ajuster.',
  },
  {
    id: 'edu_20',
    tag: 'fiber',
    emoji: '💡',
    message: 'Les prébiotiques (poireau cuit, topinambour, ail en petite quantité) nourrissent sélectivement les bactéries bénéfiques du côlon.',
  },
  // Timing / Hydratation
  {
    id: 'edu_21',
    tag: 'timing',
    emoji: '💡',
    message: 'Boire 400 à 500 ml d\'eau 20 à 30 minutes avant le repas améliore souvent la satiété et facilite la digestion.',
  },
  {
    id: 'edu_22',
    tag: 'timing',
    emoji: '💡',
    message: 'Les repas après 20h30 retardent la fenêtre de jeûne nocturne et peuvent perturber la régulation glycémique et la qualité du sommeil.',
  },
  {
    id: 'edu_23',
    tag: 'timing',
    emoji: '💡',
    message: 'Le café ou le thé pris en fin de repas peut réduire l\'absorption du fer non-héminique des végétaux de 50 à 70%.',
  },
  // Bioactifs / Micronutriments
  {
    id: 'edu_24',
    tag: 'bioactive',
    emoji: '💡',
    message: 'Les polyphénols des fruits et légumes colorés ont un effet anti-inflammatoire documenté et nourrissent sélectivement les bonnes bactéries intestinales.',
  },
  {
    id: 'edu_25',
    tag: 'bioactive',
    emoji: '💡',
    message: 'Associer un aliment riche en vitamine C (agrume, poivron) à une source de fer végétal multiplie son absorption par 3 à 6.',
  },
];
