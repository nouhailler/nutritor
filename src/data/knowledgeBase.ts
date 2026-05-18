import { KnowledgeEntry } from '../types/knowledge';

// ── 80 entrées : 13 vitamines · 14 minéraux · 16 acides aminés · 21 bioactifs · 16 concepts ──

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [

  // ╔══════════════════════════════════════════════════════════╗
  // ║  VITAMINES (13)                                          ║
  // ╚══════════════════════════════════════════════════════════╝

  {
    id: 'vit-a', category: 'vitamin', name: 'Vitamine A', aliases: ['Rétinol', 'Bêta-carotène'],
    emoji: '🥕', tagline: 'Gardienne de la vision et des muqueuses',
    simple: {
      what: 'La vitamine A existe sous deux formes : le rétinol (sources animales) et les provitamines A comme le bêta-carotène (sources végétales). Liposoluble, elle se stocke dans le foie pour plusieurs mois. Le corps convertit le bêta-carotène en rétinol selon ses besoins.',
      why: 'Elle est indispensable à la vision nocturne, à l\'intégrité des muqueuses (poumons, intestins, peau) et au bon fonctionnement du système immunitaire. Elle joue aussi un rôle central dans la croissance cellulaire et le développement embryonnaire.',
      sources: ['Foie de veau', 'Carotte crue', 'Patate douce', 'Épinards cuits', 'Beurre'],
      deficiency: 'Cécité nocturne, puis xérophtalmie (sécheresse oculaire) — première cause de cécité évitable dans le monde.',
    },
    expert: {
      mechanism: 'Le rétinal est cofacteur de la rhodopsine (bâtonnets rétiniens) pour la phototransduction. L\'acide rétinoïque active les récepteurs nucléaires RAR/RXR qui régulent l\'expression de plusieurs centaines de gènes impliqués dans la différenciation cellulaire, l\'immunité innée et l\'hématopoïèse. Le bêta-carotène est clivé par la BCO1 en deux molécules de rétinal ; l\'efficacité de conversion est modulée par le polymorphisme BCMO1 (jusqu\'à 70 % de réduction chez les porteurs variants).',
      interactions: ['Synergie avec la vitamine D (récepteurs RXR partagés pour l\'hétérodimérisation)', 'La vitamine E protège le rétinol de la peroxydation lipidique', 'Le zinc est indispensable à la RBP (retinol-binding protein) hépatique', 'L\'absorption exige la présence de lipides alimentaires et de sels biliaires', 'Toxicité chronique (hypervitaminose A) dès 3 000 µg/j en rétinol — inhibe la vitamine K'],
      dosage: { rda: '700–900', upper: '3 000', unit: 'µg ER/j' },
      clinicalNote: 'Le bêta-carotène en complément à haute dose a augmenté le risque de cancer du poumon chez les fumeurs (CARET, ATBC). L\'hypervitaminose A est tératogène au 1er trimestre — les rétinoïdes topiques (acné) sont contre-indiqués en grossesse.',
    },
    relatedIds: ['vit-e', 'vit-d', 'zinc'],
  },

  {
    id: 'vit-b1', category: 'vitamin', name: 'Vitamine B1', aliases: ['Thiamine'],
    emoji: '⚡', tagline: 'Convertit les glucides en énergie cellulaire',
    simple: {
      what: 'La thiamine est une vitamine hydrosoluble concentrée dans le cerveau et les nerfs. Le corps n\'en stocke que pour 18 jours environ, ce qui en fait l\'une des vitamines les plus rapidement épuisables en cas de carence alimentaire ou d\'alcoolisme.',
      why: 'Sans elle, les cellules ne peuvent pas convertir les glucides en énergie utilisable. Le cerveau — qui dépend quasi-exclusivement du glucose — est le premier touché par une carence.',
      sources: ['Porc (filet rôti)', 'Levure nutritionnelle', 'Haricots blancs', 'Graines de tournesol', 'Pain de seigle complet'],
      deficiency: 'Fatigue, irritabilité, puis béribéri (neuropathie périphérique ou insuffisance cardiaque) et syndrome de Wernicke-Korsakoff chez les sujets alcoolodépendants.',
    },
    expert: {
      mechanism: 'Le pyrophosphate de thiamine (TPP) est le cofacteur de trois complexes enzymatiques majeurs : la pyruvate déshydrogénase (pyruvate → acétyl-CoA, entrée dans le cycle de Krebs), l\'α-cétoglutarate déshydrogénase (cycle de Krebs) et la transketolase (voie des pentoses phosphates — synthèse de NADPH et nucléotides). La carence en TPP accumule du lactate et des α-céto-acides neurotoxiques.',
      interactions: ['L\'éthanol inhibe l\'absorption intestinale et la phosphorylation en TPP', 'Les sulfites (E220-228) clivent la liaison C-N de la thiamine dans les aliments', 'Le magnésium est cofacteur de la thiamine kinase', 'Les thiaminases du poisson cru et du thé vert détruisent la thiamine à haute consommation'],
      dosage: { rda: '1,1–1,2', unit: 'mg/j' },
      clinicalNote: 'Demi-vie plasmatique ~14 jours ; le syndrome de Wernicke est une urgence neurologique — la thiamine IV doit précéder tout apport glucidique pour éviter la précipitation de l\'encéphalopathie.',
    },
    relatedIds: ['vit-b2', 'vit-b3', 'magnesium'],
  },

  {
    id: 'vit-b2', category: 'vitamin', name: 'Vitamine B2', aliases: ['Riboflavine'],
    emoji: '🟡', tagline: 'Moteur central des réactions d\'oxydoréduction',
    simple: {
      what: 'La riboflavine est au cœur de toutes les réactions qui produisent de l\'énergie dans la cellule. Elle donne sa couleur jaune-verte à l\'urine après supplémentation — c\'est un signe d\'absorption correcte, pas de surdosage. Photosensible, elle se dégrade dans les emballages transparents.',
      why: 'Elle est nécessaire à la régénération du glutathion (antioxydant intracellulaire majeur), au métabolisme des vitamines B6 et B9, et à la production des globules rouges. Son déficit est sous-diagnostiqué car les signes sont discrets.',
      sources: ['Foie de bœuf', 'Lait entier', 'Amandes', 'Œufs entiers', 'Champignons de Paris'],
      deficiency: 'Ariboflavinose : fissures aux commissures des lèvres (chéilite angulaire), langue rouge et douloureuse (glossite), photophobie.',
    },
    expert: {
      mechanism: 'La riboflavine est précurseur de FMN et FAD, coenzymes accepteurs-donneurs d\'électrons impliqués dans : la chaîne respiratoire mitochondriale (complexes I et II), la β-oxydation des acides gras (acyl-CoA déshydrogénase), la régénération du GSH (glutathion réductase FAD-dépendante) et le métabolisme du folate (MTHFR nécessite FAD).',
      interactions: ['Synergie avec B6 et B9 (indispensable à leur activation)', 'La photodégradation est majeure — le lait en bouteille transparente perd 50 % en 2h de lumière', 'Les contraceptifs oraux et la grossesse augmentent les besoins de 30 %', 'L\'alcool réduit l\'absorption intestinale'],
      dosage: { rda: '1,1–1,3', unit: 'mg/j' },
      clinicalNote: 'La supplémentation en riboflavine (400 mg/j) réduit la fréquence des migraines de ~50 % sur 3 mois dans des essais contrôlés, probablement via l\'amélioration de la phosphorylation oxydative mitochondriale.',
    },
    relatedIds: ['vit-b6', 'vit-b9', 'vit-b1'],
  },

  {
    id: 'vit-b3', category: 'vitamin', name: 'Vitamine B3', aliases: ['Niacine', 'Nicotinamide', 'Acide nicotinique'],
    emoji: '🔋', tagline: 'Cofacteur de 500+ réactions enzymatiques',
    simple: {
      what: 'La niacine englobe l\'acide nicotinique et le nicotinamide. Particularité : le corps peut la synthétiser à partir du tryptophane (60 mg de tryptophane = 1 mg de niacine). C\'est la vitamine impliquée dans le plus grand nombre de réactions métaboliques.',
      why: 'Elle est nécessaire à la production d\'énergie dans toutes les cellules, à la réparation de l\'ADN et à la régulation du cholestérol. La pellagre — sa maladie de carence classique — se reconnaît aux "3D" : dermatite, diarrhée, démence.',
      sources: ['Thon albacore', 'Poitrine de poulet', 'Cacahuètes', 'Champignons shiitaké', 'Foie de veau'],
      deficiency: 'Pellagre : dermatite aux zones exposées au soleil, diarrhée, déclin cognitif. Historiquement liée aux régimes à base de maïs non nixtamalisé.',
    },
    expert: {
      mechanism: 'Le NAD+ et le NADP+ sont des coenzymes redox impliqués dans >500 réactions enzymatiques. Le NAD+ est substrat des PARP (réparation de cassures de l\'ADN) et des sirtuines (SIRT1-7 : régulation épigénétique, longévité, inflammation). Le NADPH produit par la voie des pentoses et par la malatique déshydrogénase alimente la GSH réductase et la synthèse des acides gras.',
      interactions: ['Le tryptophane compense une carence modérée (60:1)', 'L\'acide nicotinique inhibe la lipolyse adipocytaire via le récepteur GPR109A (flush cutané médié par PGD2)', 'L\'alcool et l\'isoniazide (antituberculeux) diminuent la conversion du tryptophane en niacine', 'Les statines peuvent interagir (myopathie à haute dose de niacine)'],
      dosage: { rda: '14–16', upper: '35', unit: 'mg EN/j' },
      clinicalNote: 'L\'acide nicotinique à 1–3 g/j augmente le HDL de 25-35 % mais les grands essais CV (AIM-HIGH, HPS2-THRIVE) n\'ont pas montré de réduction des événements cardiovasculaires au-delà des statines.',
    },
    relatedIds: ['tryptophane', 'vit-b6'],
  },

  {
    id: 'vit-b5', category: 'vitamin', name: 'Vitamine B5', aliases: ['Acide pantothénique'],
    emoji: '🔗', tagline: 'Précurseur du coenzyme A — carrefour du métabolisme',
    simple: {
      what: 'Son nom vient du grec "pantothen" (de partout) car elle est présente dans quasi tous les aliments. Elle est le précurseur du coenzyme A, la molécule carrefour qui connecte la dégradation des glucides, lipides et protéines au cycle de Krebs.',
      why: 'Sans coenzyme A, aucune graisse ne peut être brûlée, aucun glucide ne peut entrer dans le cycle énergétique, et la synthèse des hormones stéroïdiennes (cortisol, œstradiol, testostérone) est impossible.',
      sources: ['Foie de bœuf', 'Champignons', 'Avocat', 'Graines de tournesol', 'Œufs entiers'],
      deficiency: 'Rarissime (présente dans presque tout). Carence expérimentale : paresthésies plantaires, fatigue, irritabilité.',
    },
    expert: {
      mechanism: 'La pantothénate + cystéine + ATP → 4\'-phosphopantéthéine → CoA. L\'acétyl-CoA est le pivot central du métabolisme : entrée du pyruvate dans la mitochondrie, synthèse des corps cétoniques, synthèse du cholestérol et des hormones stéroïdiennes, acétylation des histones (régulation épigénétique). La protéine ACP (acyl carrier protein) de la FAS contient un bras 4\'-phosphopantéthéine.',
      interactions: ['La biotine partage des voies métaboliques parallèles', 'La pantéthine (forme active) inhibe la HMG-CoA réductase à doses pharmacologiques (900-1 200 mg/j)', 'Le CoA est le point de convergence de la dégradation de tous les carburants énergétiques'],
      dosage: { rda: '5', unit: 'mg/j' },
      clinicalNote: 'La pantéthine (900 mg/j, 3 études randomisées) réduit les LDL de 11-14 % et les TG de 28-32 %, sans effets indésirables — mécanisme : activation de la CoA-thiolase hépatique.',
    },
    relatedIds: ['vit-b1', 'vit-b7'],
  },

  {
    id: 'vit-b6', category: 'vitamin', name: 'Vitamine B6', aliases: ['Pyridoxine', 'Pyridoxal-5-phosphate', 'PLP'],
    emoji: '🧠', tagline: 'Chef d\'orchestre des neurotransmetteurs',
    simple: {
      what: 'La vitamine B6 existe sous 3 formes actives (pyridoxine, pyridoxal, pyridoxamine). Sa forme active, le PLP, est cofacteur de plus de 150 enzymes. Elle est indispensable à la fabrication de quasiment tous les neurotransmetteurs du cerveau.',
      why: 'Sans B6, la sérotonine, la dopamine, le GABA et la noradrénaline ne peuvent pas être synthétisés. Une carence — fréquente chez les femmes sous contraceptifs oraux — peut se manifester par de l\'anxiété, des insomnies et une humeur dépressive.',
      sources: ['Thon albacore', 'Pomme de terre rôtie', 'Banane mûre', 'Poulet rôti', 'Pistaches'],
      deficiency: 'Dermatite, glossite, anémie microcytaire, irritabilité, et élévation de l\'homocystéine plasmatique (facteur de risque cardiovasculaire).',
    },
    expert: {
      mechanism: 'Le PLP est cofacteur des transaminations (ALT, AST — bilan hépatique), des décarboxylations (DOPA → dopamine ; 5-HTP → sérotonine ; glutamate → GABA ; histidine → histamine) et de la transulfuration (cystathionine synthase : homocystéine → cystéine → glutathion). Il est aussi cofacteur de la glycogène phosphorylase (mobilisation du glycogène musculaire).',
      interactions: ['Trio B6-B9-B12 pour la remétylation de l\'homocystéine (MTHFR)', 'Le magnésium est cofacteur de la pyridoxal kinase (phosphorylation du pyridoxal en PLP)', 'L\'isoniazide (antituberculeux) et la pénicillamine séquestrent le PLP', 'Neuropathie sensorielle dose-dépendante documentée > 100 mg/j sur plusieurs mois', 'Les contraceptifs oraux épuisent les réserves de PLP'],
      dosage: { rda: '1,3–1,7', upper: '100', unit: 'mg/j' },
      clinicalNote: 'La supplémentation B6+B12+B9 réduit l\'homocystéine de ~25 % mais les grands essais CV (VITATOPS, HOPE-2) n\'ont pas confirmé de réduction des infarctus — la causalité homocystéine → athérosclérose reste débattue.',
    },
    relatedIds: ['vit-b9', 'vit-b12', 'tryptophane', 'glycine'],
  },

  {
    id: 'vit-b7', category: 'vitamin', name: 'Vitamine B7', aliases: ['Biotine', 'Vitamine H'],
    emoji: '💅', tagline: 'Clé des carboxylases mitochondriales',
    simple: {
      what: 'La biotine (B7 ou H) est partiellement synthétisée par les bactéries intestinales. Elle est surtout médiatisée pour la santé des cheveux et ongles, mais son rôle biochimique est bien plus fondamental : elle active 4 enzymes clés de la fabrication d\'énergie.',
      why: 'Elle est indispensable à la synthèse des acides gras, à la néoglucogenèse (fabrication de glucose pendant le jeûne) et au métabolisme de la leucine. Sa carence peut être déclenchée par la consommation régulière de blanc d\'œuf cru, qui contient l\'avidine — une protéine qui piège la biotine.',
      sources: ['Foie de bœuf', 'Œuf entier cuit', 'Saumon', 'Amandes', 'Patate douce'],
      deficiency: 'Alopécie, dermatite périorificielle, conjonctivite et ataxie — classiquement induit par l\'avidine du blanc d\'œuf cru.',
    },
    expert: {
      mechanism: 'La biotine est liée par covalence (amide avec lysine) à 4 carboxylases : la pyruvate carboxylase (pyruvate → oxaloacétate, néoglucogenèse), l\'acétyl-CoA carboxylase (acétyl-CoA → malonyl-CoA, synthèse des AG), la propionyl-CoA carboxylase (métabolisme des AGCR et AA branchés) et la méthylcrotonyl-CoA carboxylase (catabolisme leucine). La biotinidase recycle la biotine après protéolyse des holoenzymes.',
      interactions: ['L\'avidine du blanc d\'œuf cru lie irréversiblement la biotine (Kd ~10⁻¹⁵ M) — la cuisson dénature l\'avidine', 'ATTENTION : biotine > 1 000 µg interfère avec les immunodosages (troponine, TSH, T4, D-dimères) — arrêt 48h avant bilan', 'Les antibiotiques à large spectre réduisent la synthèse colique de biotine'],
      dosage: { rda: '30', unit: 'µg/j' },
      clinicalNote: 'Aucune preuve robuste que la supplémentation (2 500–10 000 µg/j) améliore les cheveux ou ongles en dehors d\'une carence documentée. Le risque d\'interférence analytique est sous-estimé en pratique clinique.',
    },
    relatedIds: ['vit-b5', 'leucine'],
  },

  {
    id: 'vit-b9', category: 'vitamin', name: 'Vitamine B9', aliases: ['Folate', 'Acide folique', 'Folacine'],
    emoji: '🌿', tagline: 'Protège l\'ADN et prévient les malformations fœtales',
    simple: {
      what: 'Le folate (forme naturelle) et l\'acide folique (forme synthétique, 1,7× plus biodisponible) sont essentiels à la synthèse de l\'ADN et à la division cellulaire. Toute cellule qui se divise — embryon, globules rouges, muqueuse intestinale — en dépend.',
      why: 'Sa carence est l\'une des plus fréquentes dans les pays développés. Elle provoque une anémie mégaloblastique et, pendant la grossesse, des malformations du tube neural (spina bifida). C\'est pourquoi une supplémentation dès la préconception est recommandée par tous les organismes de santé.',
      sources: ['Foies de volaille', 'Épinards crus', 'Asperges', 'Haricots noirs cuits', 'Edamame'],
      deficiency: 'Anémie macrocytaire mégaloblastique, élévation de l\'homocystéine, risque accru de défauts du tube neural en début de grossesse.',
    },
    expert: {
      mechanism: 'Le 5-méthyl-THF transfère son méthyle à l\'homocystéine (méthionine synthase B12-dépendante) → méthionine → SAM (S-adénosylméthionine), donneur universel de méthyle pour la méthylation de l\'ADN, des histones et des neurotransmetteurs. La thymidylate synthase utilise le 5,10-méthylène-THF pour la synthèse de thymidine (ADN). Le polymorphisme MTHFR C677T (40 % de la population) réduit l\'efficacité de conversion de 30-70 %.',
      interactions: ['Interdépendance absolue avec la B12 : la carence en B12 séquestre le folate sous forme 5-méthyl-THF ("piège à folate")', 'Le méthotrexate, le triméthoprime et la pyriméthamine sont des antagonistes du DHFR (folate réductase)', 'La chaleur de cuisson dégrade 50-80 % des folates alimentaires', 'L\'alcool inhibe l\'absorption et augmente l\'excrétion urinaire de folate', 'Polymorphisme MTHFR C677T → recommandation 5-MTHF (méthylfolate actif)'],
      dosage: { rda: '400', upper: '1 000', unit: 'µg EFA/j' },
      clinicalNote: 'Supplémentation 400 µg/j dès la préconception → réduction des défauts du tube neural de 50-70 %. Le méthylfolate (5-MTHF) est recommandé chez les porteurs MTHFR 677TT, qui ne peuvent pas efficacement convertir l\'acide folique.',
    },
    relatedIds: ['vit-b12', 'vit-b6', 'methionine', 'methylation'],
  },

  {
    id: 'vit-b12', category: 'vitamin', name: 'Vitamine B12', aliases: ['Cobalamine', 'Méthylcobalamine', 'Adénosylcobalamine'],
    emoji: '🔴', tagline: 'Unique vitamine contenant un métal — le cobalt',
    simple: {
      what: 'La cobalamine est la seule vitamine contenant un ion métallique (cobalt) et est exclusivement synthétisée par des micro-organismes. Absente des végétaux, elle est indispensable à supplémenter dans les régimes végétaliens stricts. Le foie en stocke pour 3 à 5 ans.',
      why: 'Indispensable à la réparation de l\'ADN, à la myélinisation des nerfs et au contrôle de l\'homocystéine. Sa carence — souvent insidieuse du fait des stocks hépatiques importants — provoque une neuropathie irréversible si elle n\'est pas traitée à temps.',
      sources: ['Foie de veau', 'Palourdes', 'Saumon atlantique', 'Thon', 'Fromages à pâte dure'],
      deficiency: 'Anémie mégaloblastique, neuropathie sous-aiguë combinée (paresthésies, ataxie, troubles cognitifs) — irréversible si prolongée.',
    },
    expert: {
      mechanism: 'Deux enzymes utilisent la B12 comme cofacteur : la méthionine synthase (forme méthylcobalamine : 5-méthyl-THF + homocystéine → THF + méthionine) et la méthylmalonyl-CoA mutase (forme adénosylcobalamine : propionyl-CoA → succinyl-CoA, mitochondrie). La carence crée un "piège à folate" : le THF reste séquestré en 5-méthyl-THF → synthèse d\'ADN compromise même si le folate total est normal.',
      interactions: ['Interdépendance avec le folate (méthionine synthase)', 'La metformine diminue l\'absorption iléale de ~30 % (mécanisme Ca-dépendant) — monitoring annuel recommandé', 'Les IPP (oméprazole) réduisent l\'absorption gastrique nécessitant le facteur intrinsèque (FI)', 'L\'hydroxocobalamine a une rétention tissulaire supérieure à la cyanocobalamine', 'Anticorps anti-FI (gastrite auto-immune/Biermer) → carence sévère nécessitant injection IM'],
      dosage: { rda: '2,4', unit: 'µg/j' },
      clinicalNote: 'Le taux sérique B12 seul est insuffisant — le méthylmalonate urinaire et l\'holotranscobalamine (holoTC) sont les marqueurs fonctionnels les plus sensibles. Après 50 ans, la préférence va aux formes cristallines (sublingual, injections) car 10-30 % ont une gastrite atrophique réduisant l\'absorption.',
    },
    relatedIds: ['vit-b9', 'vit-b6', 'methionine', 'methylation'],
  },

  {
    id: 'vit-c', category: 'vitamin', name: 'Vitamine C', aliases: ['Acide ascorbique', 'Ascorbate'],
    emoji: '🍊', tagline: 'Antioxydant universel et forgeron du collagène',
    simple: {
      what: 'L\'acide ascorbique est un antioxydant hydrosoluble que l\'humain ne peut pas synthétiser (perte évolutive de la GULO il y a 60 millions d\'années). Il se concentre dans le cerveau, les glandes surrénales et les leucocytes, qui en contiennent 50× plus que le plasma.',
      why: 'Indispensable à la synthèse du collagène (cicatrisation, solidité vasculaire), à l\'absorption du fer non-hémique, à la fabrication des neurotransmetteurs (noradrénaline, dopamine) et à la protection contre le stress oxydatif. Les fumeurs ont des besoins 35 % plus élevés.',
      sources: ['Poivron rouge cru', 'Cassis', 'Persil frais', 'Kiwi jaune', 'Brocoli vapeur'],
      deficiency: 'Scorbut (après ~4-6 semaines de carence totale) : gencives hémorragiques, pétéchies, mauvaise cicatrisation, douleurs articulaires.',
    },
    expert: {
      mechanism: 'L\'ascorbate réduit Fe³⁺ → Fe²⁺ pour les prolyl et lysyl hydroxylases (hydroxylation des résidus Pro/Lys du procollagène → réticulation mature). Il régénère le tocophérol radical (cycle ascorbate-tocophérol). Cofacteur de la dopamine bêta-hydroxylase (dopamine → noradrénaline), de la PAM (amidation des neuropeptides) et de la HIF-PHD (régulation de l\'hypoxie). À forte concentration IV, pro-oxydant sélectif in milieu tumoral via H₂O₂.',
      interactions: ['Multiplie par 2-6 l\'absorption du fer non-hémique (FeIII → FeII)', 'Régénère l\'α-tocophérol oxydé (vitamine E), partageant la charge antioxydante', 'La supplémentation > 1 g/j peut augmenter l\'oxalurie chez les prédisposés (lithiases)', 'Inhibe l\'absorption du cuivre à très haute dose (> 2 g/j)'],
      dosage: { rda: '75–110', upper: '2 000', unit: 'mg/j' },
      clinicalNote: 'La saturation tissulaire est atteinte à ~200 mg/j ; au-delà, l\'absorption intestinale chute et l\'excès est éliminé dans les urines. Les méta-analyses (Cochrane) montrent une réduction de la durée du rhume de ~8 % en préventif, non en curatif.',
    },
    relatedIds: ['vit-e', 'fer', 'collagene'],
  },

  {
    id: 'vit-d', category: 'vitamin', name: 'Vitamine D', aliases: ['Calciférol', 'Vitamine D3', 'Cholécalciférol', '25-OH-D'],
    emoji: '☀️', tagline: 'Prohormone stéroïde qui régule 200+ gènes',
    simple: {
      what: 'La vitamine D est techniquement une prohormone stéroïde : le corps la synthétise sous l\'action des UVB sur le 7-déhydrocholestérol cutané. En France, plus de 80 % de la population est en insuffisance en hiver. Les suppléments sont en D3 (cholécalciférol, forme animale supérieure) ou D2 (ergocalciférol, végétalienne).',
      why: 'Elle régule l\'absorption du calcium (os), module le système immunitaire (réduction des infections et maladies auto-immunes), et participe à la régulation de l\'humeur. Le déficit chronique est associé à l\'ostéoporose, aux infections récurrentes et à la dépression saisonnière.',
      sources: ['Huile de foie de morue', 'Saumon sauvage', 'Hareng mariné', 'Champignons séchés au soleil', 'Jaune d\'œuf'],
      deficiency: 'Rachitisme (enfant), ostéomalacie (adulte), fractures de stress, fatigue chronique, infections fréquentes, dépression saisonnière.',
    },
    expert: {
      mechanism: 'La 25-hydroxylation hépatique (CYP2R1) puis la 1α-hydroxylation rénale (CYP27B1) produisent le calcitriol (1,25(OH)₂D₃). Le VDR (vitamin D receptor), présent dans 37+ types cellulaires, forme un hétérodimère avec RXR et régule : CATHELICIDIN/DEFB4 (immunité innée), RANKL/OPG (remodelage osseux), l\'insulino-sécrétion pancréatique, et la différenciation des lymphocytes T-reg. CYP24A1 catabolise l\'excès.',
      interactions: ['Synergie avec la vitamine K2 (D active la synthèse d\'ostéocalcine, K2 la carboxyle pour fixer le calcium dans l\'os)', 'Le magnésium est cofacteur des deux hydroxylases CYP2R1 et CYP27B1 — un déficit en Mg bloque l\'activation de la vit. D', 'L\'obésité séquestre la vit. D dans le tissu adipeux (besoins 2-3× plus élevés)', 'Les corticostéroïdes induisent CYP24A1 et augmentent le catabolisme'],
      dosage: { rda: '800–1 000', upper: '4 000', unit: 'UI/j' },
      clinicalNote: 'Objectif thérapeutique : 25(OH)D > 30 ng/mL (75 nmol/L), idéalement 40-60 ng/mL. Pas de toxicité documentée < 10 000 UI/j en adulte ; la toxicité (hypercalcémie) survient typiquement > 40 000 UI/j chroniques.',
    },
    relatedIds: ['vit-k', 'calcium', 'magnesium'],
  },

  {
    id: 'vit-e', category: 'vitamin', name: 'Vitamine E', aliases: ['Tocophérol', 'α-Tocophérol', 'Tocotriénols'],
    emoji: '🛡️', tagline: 'Gardien des membranes lipidiques contre l\'oxydation',
    simple: {
      what: 'La vitamine E regroupe 8 molécules (4 tocophérols + 4 tocotriénols), l\'α-tocophérol étant la forme la plus active. C\'est le principal antioxydant liposoluble des membranes cellulaires — elle protège les acides gras polyinsaturés de la peroxydation en chaîne.',
      why: 'Elle protège les LDL de l\'oxydation (étape clé de l\'athérogenèse), soutient l\'immunité et prévient les neuropathies dans les cas de malabsorption lipidique. Les huiles de qualité, les noix et les graines en sont les meilleures sources.',
      sources: ['Huile de germe de blé', 'Amandes', 'Noisettes', 'Graines de tournesol', 'Huile de noisette'],
      deficiency: 'Ataxie spinocérébelleuse et neuropathie périphérique (rares, surtout dans les malabsorptions graisseuses), anémie hémolytique du nouveau-né prématuré.',
    },
    expert: {
      mechanism: 'L\'α-tocophérol interrompt les chaînes de peroxydation lipidique en donnant un H· au radical peroxyle ROO·, formant le tocophéryl radical récupéré par l\'ascorbate ou le GSH (cycle antioxydant liposoluble-hydrosoluble). Les tocotriénols inhibent HMG-CoA réductase indépendamment des statines. L\'α-TTP hépatique sélectionne préférentiellement l\'α-tocophérol pour sécrétion en VLDL.',
      interactions: ['Régénéré par la vitamine C (cycle antioxydant couplé)', 'Synergie avec le sélénium (GPx) pour la protection des membranes', 'À haute dose, inhibe l\'absorption des vitamines A, D et K', 'Anticoagulant à > 800 UI/j (inhibition de la carboxylation vit-K-dépendante)'],
      dosage: { rda: '15', upper: '1 000', unit: 'mg α-TE/j' },
      clinicalNote: 'La méta-analyse Miller 2005 (>150 000 personnes) suggère une légère surmortalité à > 400 UI/j en prévention primaire. La supplémentation haute dose est déconseillée sauf malabsorption documentée.',
    },
    relatedIds: ['vit-c', 'selenium', 'stress-oxydatif'],
  },

  {
    id: 'vit-k', category: 'vitamin', name: 'Vitamine K', aliases: ['Phylloquinone', 'K1', 'Ménaquinone', 'K2', 'MK-7'],
    emoji: '🦴', tagline: 'Coagulation, santé osseuse et protection vasculaire',
    simple: {
      what: 'La vitamine K regroupe K1 (phylloquinone, présente dans les légumes verts) et K2 (ménaquinones MK-4 à MK-13, issues de la fermentation bactérienne). Toutes activent les mêmes protéines par γ-carboxylation. La K2-MK-7 (natto) a une demi-vie de 72h contre 1h pour K1.',
      why: 'K1 régule la coagulation sanguine (facteurs II, VII, IX, X). K2 active l\'ostéocalcine (fixation du calcium dans les os) et la MGP (Matrix Gla Protein, qui empêche la calcification des artères). Un déficit en K2 est associé aux fractures et aux calcifications artérielles — souvent silencieux.',
      sources: ['Natto (soja fermenté)', 'Chou kale', 'Épinards', 'Brocoli', 'Gouda affiné'],
      deficiency: 'Coagulopathie hémorragique (K1), et de façon moins visible : ostéoporose et calcifications artérielles accélérées (K2).',
    },
    expert: {
      mechanism: 'La γ-glutamylcarboxylase (GGCX) convertit les résidus Glu → γ-carboxyglutamate (Gla) dans : la prothrombine et les facteurs VII/IX/X (coagulation), les protéines C et S (anticoagulation), l\'ostéocalcine (minéralisation) et la MGP (inhibition des calcifications). La VKORC1 recycle la vitamine K oxydée (cible des AVK). La MGP sous-carboxylée (dp-ucMGP) est un biomarqueur de déficit en K2 vasculaire.',
      interactions: ['Antagonisme majeur avec les AVK (warfarine) — tout apport variable peut dérègler l\'INR', 'Synergie vitamine D-vitamine K2 : D stimule la synthèse d\'ostéocalcine, K2 l\'active par carboxylation', 'La vitamine A en excès peut inhiber la γ-carboxylation', 'Les antibiotiques à large spectre réduisent la production colique de K2'],
      dosage: { rda: '90–120', unit: 'µg/j (K1)' },
      clinicalNote: 'La K2-MK-7 à 180 µg/j pendant 3 ans augmente la dureté osseuse et réduit la rigidité aortique (Vermeer 2015). La K2 alimentaire n\'interagit pas avec les AVK aux doses normales, mais la supplémentation est contre-indiquée chez les patients anticoagulés.',
    },
    relatedIds: ['vit-d', 'calcium', 'magnesium'],
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  MINÉRAUX (14)                                           ║
  // ╚══════════════════════════════════════════════════════════╝

  {
    id: 'calcium', category: 'mineral', name: 'Calcium',
    emoji: '🦷', tagline: 'Minéral le plus abondant du corps — os, nerfs, muscles',
    simple: {
      what: 'Le calcium est le minéral le plus abondant du corps humain : 99 % se trouve dans les os et les dents. Le 1 % restant, dans le sang et les cellules, joue des rôles physiologiques critiques que l\'organisme maintient avec une précision redoutable au détriment du capital osseux si les apports sont insuffisants.',
      why: 'Il est indispensable à la contraction musculaire (y compris le cœur), à la transmission nerveuse, à la coagulation sanguine et à la libération de neurotransmetteurs. Sa carence chronique silencieuse mène à l\'ostéoporose, qui fragilise les os des décennies plus tard.',
      sources: ['Gruyère', 'Sardines en boîte (avec arêtes)', 'Yaourt entier', 'Lait', 'Tofu ferme (coagulé au calcium)'],
      deficiency: 'Ostéoporose à long terme, tétanie (crampes et spasmes musculaires) en cas de carence aiguë ou d\'hypocalcémie.',
    },
    expert: {
      mechanism: 'Le calcitriol (vit D active) stimule l\'expression de la calbindine-D9K (absorption iléale transcellulaire). La PTH (parathormone) mobilise le calcium osseux via RANKL/OPG et stimule la réabsorption rénale. Le calcium intracellulaire (Ca²⁺, ~100 nM au repos vs ~1 mM extracellulaire) est le second messager de la contraction (troponine C, myosine), de la sécrétion (SNARE), de la fertilisation et de l\'apoptose. La calmoduline est le principal senseur de Ca²⁺ intracellulaire.',
      interactions: ['La vitamine D est indispensable à son absorption (en dessous de 30 ng/mL de 25-OH-D : absorption < 20 %)', 'La vitamine K2 oriente le calcium vers les os (ostéocalcine) et hors des artères (MGP)', 'Le phosphore en excès (sodas ultra-transformés) peut réduire l\'absorption calcique', 'Les oxalates (épinards crus) et phytates (son de blé non traité) forment des sels insolubles avec le calcium', 'Le magnésium en excès compète avec l\'absorption'],
      dosage: { rda: '1 000–1 200', upper: '2 500', unit: 'mg/j' },
      clinicalNote: 'La supplémentation calcique isolée (sans K2 ni D) est associée à une augmentation du risque de calcifications artérielles (méta-analyse Bolland 2010) — le calcium doit être obtenu prioritairement par l\'alimentation.',
    },
    relatedIds: ['vit-d', 'vit-k', 'magnesium', 'phosphore'],
  },

  {
    id: 'magnesium', category: 'mineral', name: 'Magnésium',
    emoji: '⚡', tagline: 'Cofacteur de 300+ enzymes · muscle · sommeil · stress',
    simple: {
      what: 'Le magnésium est le 4ème minéral le plus abondant dans l\'organisme. 60 % se trouve dans les os, 39 % dans les cellules (muscles, foie) et seulement 1 % dans le sang — d\'où l\'insuffisance du dosage sérique pour évaluer le statut global. 70 % de la population française a des apports insuffisants.',
      why: 'Il intervient dans plus de 300 réactions enzymatiques : production d\'énergie (ATP est actif sous forme Mg-ATP), synthèse des protéines, contraction musculaire, régulation du rythme cardiaque et de la glycémie. Il est aussi le "minéral anti-stress" : il module les récepteurs NMDA du glutamate et favorise la relaxation musculaire et le sommeil.',
      sources: ['Graines de courge', 'Chocolat noir 85 %', 'Noix du Brésil', 'Haricots noirs cuits', 'Quinoa cuit'],
      deficiency: 'Crampes musculaires nocturnes, irritabilité, anxiété, insomnie, arythmies cardiaques — souvent subclinique.',
    },
    expert: {
      mechanism: 'Le Mg²⁺ est cofacteur de toutes les ATPases, kinases et GTPases — en pratique, tout transfert de groupement phosphate nécessite Mg-ATP². Il stabilise l\'ADN double brin et est indispensable à l\'ARN polymérase. Dans le SNC, il bloque le canal NMDA (antiexcitotoxique) et module la libération de substance P. Il est cofacteur de la thymidine kinase (synthèse d\'ADN) et des hydroxylases CYP2R1/CYP27B1 (activation vitamine D).',
      interactions: ['Indispensable à l\'activation de la vitamine D (CYP2R1, CYP27B1)', 'Synergie avec la vitamine B6 pour la synthèse de GABA et de sérotonine', 'Le calcium et le magnésium entrent en compétition pour l\'absorption intestinale (ratio Ca/Mg optimal ~2:1)', 'Les diurétiques thiazidiques et de l\'anse augmentent l\'excrétion urinaire de Mg', 'L\'alcool et le café augmentent l\'élimination rénale de magnésium'],
      dosage: { rda: '300–380', unit: 'mg/j' },
      clinicalNote: 'Le bisglycinate et le malate de magnésium ont la meilleure biodisponibilité (vs oxyde, faible). La supplémentation (300 mg/j bisglycinate) réduit la fréquence des migraines de 41 % (méta-analyse 2016) et améliore la résistance à l\'insuline chez les diabétiques carencés.',
    },
    relatedIds: ['vit-d', 'vit-b6', 'calcium', 'stress-oxydatif'],
  },

  {
    id: 'fer', category: 'mineral', name: 'Fer', aliases: ['Iron'],
    emoji: '🩸', tagline: 'Transporte l\'oxygène et alimente l\'énergie mitochondriale',
    simple: {
      what: 'Le fer existe sous deux formes dans l\'alimentation : le fer héminique (viandes, poissons — absorbé à 25-35 %) et le fer non-héminique (végétaux, légumineuses — absorbé à 2-20 %). L\'organisme régule finement ses réserves via l\'hepcidine : il ne peut pas éliminer l\'excès, seulement réduire l\'absorption.',
      why: 'Composant de l\'hémoglobine (transport de l\'oxygène) et de la myoglobine (réserve d\'O₂ musculaire), il est aussi indispensable à la chaîne respiratoire mitochondriale et à la synthèse de l\'ADN. La carence — la plus répandue au monde — provoque fatigue, troubles cognitifs et immunodépression.',
      sources: ['Foie de veau', 'Huîtres', 'Viande de bœuf', 'Tofu ferme', 'Lentilles cuites'],
      deficiency: 'Anémie ferriprive : fatigue, pâleur, essoufflement à l\'effort, troubles de concentration, pica (envie de mâcher de la glace, de la terre).',
    },
    expert: {
      mechanism: 'L\'hepcidine hépatique (régulée par les réserves en ferritine et l\'érythropoïèse) inhibe la ferroportine intestinale → réduction de l\'absorption et de la libération des macrophages. Dans la mitochondrie, le fer est le centre réactif des complexes I, II et III de la chaîne respiratoire, et des cytochromes P450. La ferritine stocke le fer sous forme non-réactive (jusqu\'à 4 500 atomes Fe par molécule).',
      interactions: ['La vitamine C multiplie par 2-6 l\'absorption du fer non-héminique (FeIII → FeII)', 'Le calcium inhibe l\'absorption du fer héminique et non-héminique (ne pas prendre avec le lait)', 'Les polyphénols du thé/café forment des complexes insolubles avec le fer non-héminique — espacer de 1h', 'Phytates (céréales complètes non trempées) chélatent le fer végétal', 'L\'hémochromatose génétique (HFE) provoque une absorption incontrôlée → toxicité organique'],
      dosage: { rda: '8–18', upper: '45', unit: 'mg/j' },
      clinicalNote: 'La ferritine < 30 µg/L est signe de déplétion des réserves même si l\'hémoglobine est normale. Le fer bisglycinate (forme chélatée) a moins d\'effets digestifs que le sulfate ferreux et une absorption supérieure à jeun.',
    },
    relatedIds: ['vit-c', 'vit-b9', 'vit-b12', 'stress-oxydatif'],
  },

  {
    id: 'zinc', category: 'mineral', name: 'Zinc',
    emoji: '🔬', tagline: 'Immunité, goût, fertilité et cicatrisation',
    simple: {
      what: 'Le zinc est un oligo-élément essentiel présent dans toutes les cellules. Il est cofacteur de plus de 300 enzymes et de 2 000 facteurs de transcription — ce qui en fait l\'un des nutriments les plus polyvalents du corps humain. Le corps n\'a pas de réserves à proprement parler : des apports quotidiens sont nécessaires.',
      why: 'Il est indispensable à la division cellulaire, à l\'immunité (maturation des lymphocytes T), à la cicatrisation, à la perception du goût et de l\'odorat, et à la fertilité masculine (qualité du sperme). Sa carence est fréquente chez les végétariens, les personnes âgées et les sportifs.',
      sources: ['Huîtres (champion absolu)', 'Bœuf haché', 'Graines de courge', 'Noix de cajou', 'Pois chiches'],
      deficiency: 'Déficit immunitaire, retard de croissance, perte du goût et de l\'odorat (anosmie), mauvaise cicatrisation des plaies, diarrhée.',
    },
    expert: {
      mechanism: 'Le zinc est le cœur catalytique de la superoxyde dismutase Cu/Zn (protection antioxydante), de l\'anhydrase carbonique (pH), des métalloprotéases matricielles (remodelage tissulaire) et de l\'ADN polymérase. Les doigts de zinc (zinc-finger motifs) dans les facteurs de transcription (p53, récepteurs stéroïdiens) le rendent indispensable à la régulation génique. La métallothionéine hépatique régule les réserves.',
      interactions: ['Le cuivre et le zinc sont antagonistes à haute dose (compétition pour le transporteur ZIP4)', 'Les phytates réduisent fortement l\'absorption du zinc végétal (trempage/fermentation améliorent la biodisponibilité)', 'La vitamine A dépend du zinc pour la synthèse de sa protéine de transport (RBP)', 'Le calcium inhibe l\'absorption du zinc dans le tube digestif', 'Le fer en excès réduit l\'absorption du zinc'],
      dosage: { rda: '8–11', upper: '40', unit: 'mg/j' },
      clinicalNote: 'Les lozenges de zinc acétate/gluconate (75-92 mg/j dès les 24 premières heures) réduisent la durée du rhume de 33 % (méta-analyse Cochrane 2015). L\'effet s\'explique par l\'inhibition de la neuraminidase rhinovirale et l\'interférence avec les protéines d\'attachement viral.',
    },
    relatedIds: ['vit-a', 'cuivre', 'vit-b7'],
  },

  {
    id: 'potassium', category: 'mineral', name: 'Potassium',
    emoji: '🍌', tagline: 'Régule la pression artérielle et la contraction cardiaque',
    simple: {
      what: 'Le potassium est le principal cation intracellulaire : 98 % se trouve à l\'intérieur des cellules. Il travaille en équilibre constant avec le sodium pour maintenir le potentiel électrique des membranes. Les régimes occidentaux sont souvent inversés : trop de sodium, trop peu de potassium.',
      why: 'Il est essentiel à la contraction musculaire (y compris le cœur), à la régulation de la pression artérielle et à la transmission nerveuse. Des apports élevés en potassium contrebalancent l\'effet hypertenseur du sodium — c\'est l\'un des nutriments les plus protecteurs sur le plan cardiovasculaire.',
      sources: ['Haricots blancs cuits', 'Patate douce', 'Avocat', 'Épinards cuits', 'Saumon'],
      deficiency: 'Hypokaliémie (souvent liée aux diurétiques) : crampes musculaires, fatigue, arythmies cardiaques, constipation.',
    },
    expert: {
      mechanism: 'La Na⁺/K⁺-ATPase (pompe sodium-potassium) maintient le gradient électrochimique transmembranaire en échangeant 3 Na⁺ (sortie) contre 2 K⁺ (entrée) par cycle, consommant 30 % de l\'ATP cellulaire total. Ce gradient est la base du potentiel d\'action neuronal et de la contraction musculaire. L\'hypokaliémie dépolarise le potentiel de repos → hyperexcitabilité neuromusculaire et troubles du rythme.',
      interactions: ['L\'aldostérone (cortex surrénalien) augmente l\'excrétion urinaire de potassium et la rétention de sodium', 'Les diurétiques thiazidiques et de l\'anse provoquent une déplétion potassique', 'Le magnésium est nécessaire à la fonction de la Na⁺/K⁺-ATPase', 'Les IEC/ARA2 (antihypertenseurs) retiennent le potassium → risque d\'hyperkaliémie'],
      dosage: { rda: '3 500', unit: 'mg/j' },
      clinicalNote: 'Chaque augmentation de 1 g/j de potassium alimentaire est associée à une réduction de 11 % du risque d\'AVC (méta-analyse D\'Elia 2011). Les reins excrètent l\'excès efficacement sauf insuffisance rénale.',
    },
    relatedIds: ['sodium', 'magnesium'],
  },

  {
    id: 'iode', category: 'mineral', name: 'Iode',
    emoji: '🫧', tagline: 'Unique composant des hormones thyroïdiennes',
    simple: {
      what: 'L\'iode est le seul minéral qui soit un composant structurel d\'une hormone : les hormones thyroïdiennes T3 (triiodothyronine) et T4 (thyroxine). Le corps en stocke 70-80 % dans la thyroïde. La France connaît une carence modérée dans certaines régions, et la grossesse représente un risque particulier.',
      why: 'Les hormones thyroïdiennes régulent le métabolisme basal de toutes les cellules (production de chaleur, croissance, développement cérébral). Une carence pendant la grossesse peut provoquer un retard intellectuel irréversible chez l\'enfant — d\'où l\'iodation du sel.',
      sources: ['Algue kombu', 'Morue', 'Crevettes', 'Yaourt nature', 'Sel iodé'],
      deficiency: 'Goitre, hypothyroïdie, crétinisme (carence fœtale), fatigue et prise de poids chez l\'adulte.',
    },
    expert: {
      mechanism: 'La thyroïde concentre l\'iodure sérique via le symporteur NIS (Na⁺/I⁻ symporter). La thyroperoxydase (TPO) oxyde l\'iodure en iode actif et l\'incorpore dans la thyroglobuline (résidus tyrosine → MIT et DIT). Le couplage MIT+DIT → T3, DIT+DIT → T4. La conversion périphérique de T4 → T3 active (déiodase sélénodépendante) assure 80 % de la T3 circulante.',
      interactions: ['Le sélénium est cofacteur des déiodases (conversion T4→T3)', 'Les goitrogènes (choux crus, manioc) inhibent l\'absorption et l\'organification de l\'iode — inactivés par la cuisson', 'Le fluor et les perchlorates (eau, légumes) compètent avec le NIS', 'L\'apport excessif d\'iode peut induire une hypothyroïdie (effet Wolff-Chaikoff)'],
      dosage: { rda: '150', upper: '600', unit: 'µg/j' },
      clinicalNote: 'La carence iodée est la première cause évitable de retard intellectuel dans le monde. En France, le sel de cuisine est iodé mais l\'apport reste marginal chez les végétaliens sans algues ni poissons.',
    },
    relatedIds: ['selenium'],
  },

  {
    id: 'selenium', category: 'mineral', name: 'Sélénium', aliases: ['Se', 'Sélénoproteines'],
    emoji: '🌰', tagline: 'Antioxydant enzymatique et régulateur thyroïdien',
    simple: {
      what: 'Le sélénium est un métalloïde essentiel incorporé dans les sélénoproteines via l\'acide aminé rare sélénocystéine. Le sol détermine la teneur des aliments : les sols européens sont pauvres en sélénium, contrairement aux États-Unis et au Brésil (noix du Brésil). Une seule noix du Brésil par jour couvre les besoins.',
      why: 'Il est au cœur de la glutathion peroxydase (GPx) — le principal système enzymatique qui neutralise les peroxydes lipidiques — et des thyrédoxines réductases (protection de la thyroïde contre le H₂O₂ généré lors de la synthèse des hormones thyroïdiennes).',
      sources: ['Noix du Brésil (1–2 par jour)', 'Thon', 'Huîtres', 'Poulet', 'Blé dur (si sol riche)'],
      deficiency: 'Maladie de Keshan (cardiomyopathie, zones de carence sévère en Chine), faiblesse musculaire, dysthyroïdie.',
    },
    expert: {
      mechanism: 'Le sélénium est incorporé comme sélénocystéine (21ème acide aminé codé par un codon UGA "stop" recodé par SECIS) dans 25 sélénoproteines : les glutathion peroxydases GPx1-4 (neutralisation de H₂O₂ et LOOH), les thiorédoxines réductases TrxR1-3 (régénération de la thiorédoxine, protection cellulaire), les iodothyronine déiodases DIO1-3 (conversion T4→T3) et la sélénoprotéine P (transport plasmatique).',
      interactions: ['Synergie avec la vitamine E pour la protection des membranes lipidiques', 'La vitamine C peut réduire la biodisponibilité du sélénium à haute dose', 'Le sélénium protège contre la toxicité du mercure (formation de complexes insolubles)', 'Indispensable aux déiodases (conversion T4→T3 active) — interaction avec l\'iode'],
      dosage: { rda: '55', upper: '300', unit: 'µg/j' },
      clinicalNote: 'La fenêtre thérapeutique est étroite. > 400 µg/j provoque une séléniose (chute des cheveux, ongles cassants, odeur d\'ail). L\'essai SELECT (sélénium + vit E) n\'a pas montré de prévention du cancer de prostate et suggère même une légère augmentation du risque avec la vit E.',
    },
    relatedIds: ['vit-e', 'iode', 'stress-oxydatif'],
  },

  {
    id: 'phosphore', category: 'mineral', name: 'Phosphore',
    emoji: '🔋', tagline: 'Épine dorsale de l\'ADN et monnaie énergétique de la cellule',
    simple: {
      what: 'Le phosphore est le 2ème minéral le plus abondant du corps (après le calcium) : 85 % dans les os, 15 % dans les cellules. Les carences sont rarissimes en Occident — le problème est plutôt l\'excès, via les additifs phosphatés des aliments ultra-transformés.',
      why: 'Il est la "monnaie énergétique" de toutes les cellules vivantes (ATP = adénosine TRI-phosphate), le squelette de l\'ADN et de l\'ARN, et un composant structural des phospholipides des membranes cellulaires. Sans lui, ni la mémoire ni la pensée ne seraient possibles.',
      sources: ['Graines de citrouille', 'Fromages affinés', 'Viande de bœuf', 'Sardines', 'Légumineuses'],
      deficiency: 'Hypophosphatémie : faiblesse musculaire extrême, douleurs osseuses, troubles cardiaques — rare, surtout lors de renutrition rapide (syndrome de renutrition).',
    },
    expert: {
      mechanism: 'L\'ATP (adénosine triphosphate) couple les réactions exergoniques (catabolisme) aux réactions endergoniques (biosynthèses, pompes ioniques). Le 2,3-DPG (diphosphoglycérate) dans les érythrocytes régule l\'affinité de l\'hémoglobine pour l\'O₂. La phosphorylation des protéines (kinases → phosphatases) est le mécanisme de signalisation intracellulaire le plus universel. Les phospholipides (PC, PE, PS, PI) constituent les bicouches membranaires.',
      interactions: ['Rapport Ca/P idéal ~1:1 dans l\'alimentation ; un excès de P (sodas, charcuteries) augmente la PTH et mobilise le calcium osseux', 'Les antiacides à base d\'aluminium chélatent le phosphore alimentaire', 'La vitamine D augmente son absorption intestinale (via NAPI2b)', 'L\'excès alimentaire de phosphore (> 3 500 mg/j) est associé à une accélération de la dégradation ossière et à une mortalité cardiovasculaire accrue en insuffisance rénale'],
      dosage: { rda: '700', upper: '3 000', unit: 'mg/j' },
      clinicalNote: 'Le phosphore des additifs alimentaires (E339, E340, E341, E343) est absorbé à ~100 % contre 50-60 % pour le phosphore alimentaire naturel (lié aux phytates). Les personnes consommant beaucoup d\'aliments ultra-transformés peuvent atteindre 3 000-5 000 mg/j sans s\'en rendre compte.',
    },
    relatedIds: ['calcium', 'vit-d', 'magnesium'],
  },

  {
    id: 'sodium', category: 'mineral', name: 'Sodium', aliases: ['Sel', 'Chlorure de sodium', 'NaCl'],
    emoji: '🧂', tagline: 'Volume plasmatique et transmission de l\'influx nerveux',
    simple: {
      what: 'Le sodium est le principal cation extracellulaire : il détermine le volume liquidien du plasma et du liquide interstitiel. Le corps en régule la teneur avec une précision remarquable via l\'axe rénine-angiotensine-aldostérone. Le problème actuel est l\'excès : les Français en consomment en moyenne 8-9 g de sel/jour, contre les 5 g recommandés.',
      why: 'En quantité adéquate, il est indispensable à la transmission nerveuse, à la contraction musculaire et à l\'absorption de certains nutriments (glucose, acides aminés) dans l\'intestin. En excès chronique, il augmente la pression artérielle et la rigidité vasculaire.',
      sources: ['Pain (source majeure)', 'Charcuteries', 'Fromages', 'Plats préparés', 'Sauces industrielles'],
    },
    expert: {
      mechanism: 'La Na⁺/K⁺-ATPase maintient le gradient Na⁺ transmembranaire (145 mM extracellulaire / 12 mM intracellulaire) qui alimente les cotransporteurs secondaires (SGLT1 pour le glucose, PAT1 pour les acides aminés). L\'axe RAAS : l\'angiotensine II stimule la sécrétion d\'aldostérone surrénalienne → réabsorption rénale de Na⁺ → expansion du volume plasmatique → élévation de la pression artérielle.',
      interactions: ['Le potassium s\'oppose à l\'effet hypertenseur du sodium (rapport Na/K alimentaire est le meilleur prédicteur CV)', 'L\'aldostérone régule simultanément Na (rétention) et K (excrétion)', 'Les AINS retiennent le sodium par inhibition des prostaglandines rénales vasodilatrices'],
      dosage: { rda: '< 5 g sel/j (= 2 g Na/j)', unit: 'selon OMS' },
      clinicalNote: 'Une réduction de 3 g de sel/jour réduit la pression systolique de ~3-5 mmHg en population générale. L\'impact est plus marqué chez les hypertendus sensibles au sel (50 % d\'entre eux).',
    },
    relatedIds: ['potassium', 'inflammation'],
  },

  {
    id: 'chrome', category: 'mineral', name: 'Chrome', aliases: ['Cr', 'Picolinate de chrome'],
    emoji: '🔩', tagline: 'Potentialise l\'action de l\'insuline',
    simple: {
      what: 'Le chrome trivalent est un oligo-élément essentiel présent en quantités infimes dans l\'organisme (total < 6 mg). Il est connu pour son rôle dans la régulation de la glycémie, bien que ses mécanismes d\'action restent partiellement débattus dans la littérature scientifique actuelle.',
      why: 'Il renforce l\'action de l\'insuline en facilitant l\'entrée du glucose dans les cellules. Des apports insuffisants sont associés à une moins bonne tolérance au glucose, une résistance à l\'insuline et des fringales de sucre.',
      sources: ['Levure de bière', 'Brocoli', 'Haricots verts', 'Bœuf', 'Noix de cajou'],
      deficiency: 'Résistance à l\'insuline, dysglycémie, élévation des triglycérides — souvent subclinique.',
    },
    expert: {
      mechanism: 'La chromomoduline (Low-Molecular-Weight Chromium-Binding Substance, LMWCr) lie 4 ions Cr³⁺ et potentialise l\'autophosphorylation du récepteur à l\'insuline (sous-unité β → activation de la tyrosine kinase → signalisation IRS-1/PI3K/Akt → translocation de GLUT4). Le chrome favorise aussi l\'expression de GLUT4 dans les adipocytes et myocytes.',
      interactions: ['L\'aspirine et l\'indométacine augmentent l\'absorption du chrome', 'L\'antiacide diminue l\'absorption du chrome', 'La vitamine C augmente légèrement l\'absorption du chrome', 'Les sucres simples augmentent l\'excrétion urinaire de chrome (cycle vicieux)'],
      dosage: { rda: '25–35', unit: 'µg/j' },
      clinicalNote: 'Les études sur le picolinate de chrome et le contrôle glycémique sont hétérogènes. Une méta-analyse 2014 montre une réduction modeste de la glycémie à jeun (-0,5 mmol/L) chez les diabétiques de type 2 mais sans effet sur l\'HbA1c. L\'EFSA considère les données insuffisantes pour établir une recommandation.',
    },
    relatedIds: ['insulinoresistance', 'index-glycemique'],
  },

  {
    id: 'cuivre', category: 'mineral', name: 'Cuivre', aliases: ['Cu', 'Copper'],
    emoji: '🪙', tagline: 'Antioxydant enzymatique et synthèse du collagène',
    simple: {
      what: 'Le cuivre est un oligo-élément essentiel cofacteur d\'enzymes clés. Le foie est son principal organe de régulation via la céruloplatéine (protéine de transport) et la métallothionéine (stockage). La carence est rare mais sous-diagnostiquée chez les patients ayant eu une chirurgie bariatrique.',
      why: 'Il est indispensable à la superoxyde dismutase (protection antioxydante), à la lysyl oxydase (réticulation du collagène et de l\'élastine), à la cytochrome c oxydase (respiration mitochondriale) et à la ceruloplasmine (métabolisme du fer).',
      sources: ['Foie de bœuf', 'Huîtres', 'Noix de cajou', 'Graines de sésame', 'Chocolat noir'],
      deficiency: 'Anémie microcytaire (résistante au fer), neutropénie, neuropathie, ostéoporose — souvent après chirurgie bariatrique.',
    },
    expert: {
      mechanism: 'La superoxyde dismutase Cu/Zn (SOD1, cytoplasme) catalyse 2O₂·⁻ + 2H⁺ → H₂O₂ + O₂. La cytochrome c oxydase (complexe IV mitochondrial) contient 2 centres Cu et est l\'étape finale de la phosphorylation oxydative. La lysyl oxydase Cu-dépendante oxyde les lysines du collagène et de l\'élastine pour permettre la réticulation covalente (solidité des fibres). La ceruloplasmine oxyde Fe²⁺ → Fe³⁺ pour le chargement de la transferrine.',
      interactions: ['Antagonisme fort avec le zinc : > 50 mg/j de zinc inhibe l\'absorption du cuivre (métallothionéine)', 'La vitamine C à très haute dose (> 2 g/j) peut réduire la biodisponibilité du cuivre', 'Le molybdène compète avec l\'absorption du cuivre', 'Maladie de Wilson (accumulation toxique de cuivre) : D-pénicillamine chélate le cuivre'],
      dosage: { rda: '900', upper: '10 000', unit: 'µg/j' },
      clinicalNote: 'La neuropathie par carence en cuivre post-chirurgie bariatrique imite cliniquement la carence en B12 (myélopathie sous-aiguë combinée) — dosage de la ceruloplasmine systématique dans ce contexte.',
    },
    relatedIds: ['zinc', 'fer', 'vit-c'],
  },

  {
    id: 'manganese', category: 'mineral', name: 'Manganèse', aliases: ['Mn'],
    emoji: '🟤', tagline: 'Antioxydant mitochondrial et métabolisme osseux',
    simple: {
      what: 'Le manganèse est un oligo-élément cofacteur d\'enzymes spécifiquement localisées dans la mitochondrie. Il est souvent confondu avec le magnésium mais a des fonctions distinctes. Les aliments végétaux complets en sont les meilleures sources.',
      why: 'Il est l\'antioxydant spécifique de la mitochondrie (MnSOD — la seule superoxyde dismutase mitochondriale), cofacteur de la pyruvate carboxylase (néoglucogenèse), et intervient dans la synthèse des glycosaminoglycanes du cartilage et des os.',
      sources: ['Noix de pécan', 'Ananas', 'Graines de citrouille', 'Flocons d\'avoine', 'Epinards'],
      deficiency: 'Rarement décrite : troubles de la croissance, anomalies du squelette, dysglycémie légère.',
    },
    expert: {
      mechanism: 'La MnSOD (Mn-superoxyde dismutase, mitochondrie) catalyse la dismutation de O₂·⁻ mitochondrial — protection contre la peroxydation lipidique et le maintien de l\'intégrité de l\'ADN mitochondrial. La glutamine synthétase manganèse-dépendante convertit le glutamate + NH₃ → glutamine (détoxification de l\'ammoniac). La pyruvate carboxylase (cofacteur manganèse) amorce la néoglucogenèse hépatique.',
      interactions: ['Compétition avec le fer pour l\'absorption intestinale (DMT1 transporte les deux)', 'Le calcium en excès peut réduire légèrement l\'absorption du manganèse', 'La voie des radicaux libres (stress oxydatif) augmente les besoins en manganèse (MnSOD)', 'L\'excès chronique (travailleurs des mines) provoque le manganisme : syndrome parkinsonien'],
      dosage: { rda: '2,0–2,3', upper: '11', unit: 'mg/j' },
    },
    relatedIds: ['magnesium', 'stress-oxydatif'],
  },

  {
    id: 'fluor', category: 'mineral', name: 'Fluor', aliases: ['Fluorure', 'F'],
    emoji: '🦷', tagline: 'Protège l\'émail dentaire de la déminéralisation',
    simple: {
      what: 'Le fluor est un halogène qui s\'incorpore dans l\'hydroxyapatite de l\'émail dentaire et des os pour former la fluoroapatite, une structure plus résistante à l\'acidification bactérienne. C\'est le seul oligo-élément dont le bénéfice sanitaire principal est préventif (caries) plutôt qu\'enzymatique.',
      why: 'La fluoration de l\'eau (0,5-1 mg/L) et les dentifrices fluorés ont réduit de 50-60 % la prévalence des caries dans les pays l\'ayant adopté. Il peut aussi réduire l\'ostéoporose à faible dose.',
      sources: ['Eau fluorée du robinet', 'Thé infusé', 'Poissons de mer', 'Dentifrice (ingestion involontaire)'],
    },
    expert: {
      mechanism: 'Le fluorure remplace les ions OH⁻ de l\'hydroxyapatite [Ca₁₀(PO₄)₆(OH)₂] → fluoroapatite [Ca₁₀(PO₄)₆F₂] : moins soluble à pH acide (résistance accrue aux acides bactériens). Il inhibe aussi les enolases bactériennes (glycolyse de Streptococcus mutans). À doses médicinales élevées (thérapie antiostéoporotique), stimule les ostéoblastes via MAP kinase.',
      interactions: ['Le calcium et le magnésium forment des complexes insolubles avec le fluorure en réduisant l\'absorption', 'L\'aluminium alimentaire et les phytates réduisent aussi l\'absorption', 'L\'excès (> 4 mg/j) provoque une fluorose dentaire (tâches blanches/brunes) ; > 10 mg/j chronique → fluorose squelettique'],
      dosage: { rda: '3–4', upper: '10', unit: 'mg/j' },
    },
    relatedIds: ['calcium', 'phosphore'],
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  ACIDES AMINÉS (16)                                      ║
  // ╚══════════════════════════════════════════════════════════╝

  {
    id: 'leucine', category: 'aminoacid', name: 'Leucine',
    emoji: '💪', tagline: 'Interrupteur principal de la synthèse musculaire (mTOR)',
    simple: {
      what: 'La leucine est le plus important des trois acides aminés à chaîne ramifiée (BCAA). C\'est le seul acide aminé capable d\'activer seul la synthèse des protéines musculaires, en agissant comme un véritable "signal nutritionnel" déclenchant la construction musculaire.',
      why: 'Sans un apport suffisant de leucine à chaque repas (seuil ~2-3 g), la synthèse protéique musculaire est sous-optimale — même si l\'apport total en protéines est adéquat. C\'est particulièrement important après 60 ans, où la résistance anabolique augmente.',
      sources: ['Parmesan', 'Blanc de poulet', 'Thon', 'Lentilles', 'Whey (lactosérum)'],
    },
    expert: {
      mechanism: 'La leucine active mTORC1 (mechanistic target of rapamycin complex 1) via le complexe SESAME kinase (sensor of amino acids sensing machinery). mTORC1 phosphoryle S6K1 et 4E-BP1 → dérepression de la traduction des ARNm ribosomaux et d\'eIF4E → initiation de la synthèse protéique. La leucine est aussi catabolisée via l\'α-cétoisocaproate → acétyl-CoA + acétoacétate (corps cétoniques — légèrement cétogène).',
      interactions: ['Le couple leucine + insuline est synergique pour mTORC1 (l\'insuline active PI3K/Akt/TSC2)', 'La vitamine D potentialise la réponse anabolique à la leucine dans le muscle âgé', 'En excès, la leucine consomme la B6 (coenzyme des BCAA aminotransférases) et la B1 (BCKDH)', 'La leucine inhibe la sécrétion de ghréline (satiété)'],
      dosage: { rda: '39', unit: 'mg/kg/j' },
      clinicalNote: 'Un apport de ~3 g de leucine par repas est le seuil pour une activation maximale de mTORC1 dans le muscle squelettique. La whey protéine est particulièrement efficace (12-14 % de leucine vs 8 % pour la caséine).',
    },
    relatedIds: ['isoleucine', 'valine', 'vit-b6', 'vit-b7'],
  },

  {
    id: 'isoleucine', category: 'aminoacid', name: 'Isoleucine',
    emoji: '🔋', tagline: 'BCAA · mobilisation du glucose musculaire',
    simple: {
      what: 'L\'isoleucine est le deuxième des trois BCAA. Contrairement à la leucine (synthèse musculaire), l\'isoleucine se distingue par son rôle dans la régulation de la glycémie au niveau du muscle : elle stimule l\'absorption du glucose indépendamment de l\'insuline.',
      why: 'Elle contribue à la synthèse des protéines, à la production d\'énergie musculaire et à la régulation de la glycémie. Son déficit, rare en alimentation variée, peut survenir dans les régimes très restrictifs.',
      sources: ['Blanc de poulet', 'Thon', 'Fromage cottage', 'Lentilles', 'Graines de citrouille'],
    },
    expert: {
      mechanism: 'L\'isoleucine stimule la translocation de GLUT4 vers la membrane plasmique musculaire via un mécanisme insulino-indépendant (PI3K dépendant mais Akt-indépendant). Elle est catabolisée via la leucine/isoleucine aminotransférase et le BCKDH (branched-chain α-ketoacid dehydrogenase) → succinyl-CoA et acétyl-CoA (glucogénique ET cétogène — seul BCAA à double nature).',
      interactions: ['Les trois BCAA partagent le même transporteur intestinal (LAT1) — la supplémentation isolée en leucine peut réduire l\'absorption des deux autres', 'La vitamine B6 est cofacteur des BCAA aminotransférases (PLP-dépendant)', 'Compétition avec le tryptophane pour la BHE (blood-brain barrier) — BCAA élevés réduisent l\'entrée de tryptophane → serotonine'],
      dosage: { rda: '20', unit: 'mg/kg/j' },
    },
    relatedIds: ['leucine', 'valine', 'tryptophane'],
  },

  {
    id: 'valine', category: 'aminoacid', name: 'Valine',
    emoji: '🔩', tagline: 'BCAA · énergie musculaire et stabilisation neurologique',
    simple: {
      what: 'La valine est le troisième BCAA. Principalement glucogénique (elle se convertit en succinyl-CoA), elle est une source d\'énergie directe pour le tissu musculaire et contribue à la coordination neurologique et aux fonctions cognitives.',
      why: 'Elle participe à la synthèse protéique, fournit de l\'énergie au muscle pendant l\'effort et est impliquée dans la régulation de l\'humeur et de l\'appétit. Son action neurologique passe par l\'inhibition de la recapture de la sérotonine.',
      sources: ['Graines de chanvre', 'Thon', 'Parmesan', 'Haricots rouges', 'Flocons d\'avoine'],
    },
    expert: {
      mechanism: 'La valine est strictement glucogénique : elle est catabolisée par transamination (BCAT) → α-cétoisovalérate → méthylmalonyl-CoA → succinyl-CoA (cycle de Krebs). Elle est le seul BCAA à ne pas générer de corps cétoniques. Sa compétition avec le tryptophane pour le transporteur LAT1 au niveau de la barrière hémato-encéphalique module indirectement la synthèse de sérotonine.',
      interactions: ['Compétition avec le tryptophane et la phénylalanine pour LAT1 (BHE)', 'Catabolisme partagé avec leucine et isoleucine (BCKDH)', 'Les ratios BCAA/tryptophane influencent la synthèse cérébrale de sérotonine'],
      dosage: { rda: '26', unit: 'mg/kg/j' },
    },
    relatedIds: ['leucine', 'isoleucine', 'tryptophane'],
  },

  {
    id: 'lysine', category: 'aminoacid', name: 'Lysine',
    emoji: '🦠', tagline: 'Collagène, immunité et bloque la réplication herpétique',
    simple: {
      what: 'La lysine est souvent le premier acide aminé limitant des régimes végétariens (faible dans les céréales mais abondante dans les légumineuses — d\'où l\'importance des associations). Elle est le seul acide aminé que le corps ne peut pas utiliser pour les transaminations.',
      why: 'Indispensable à la synthèse du collagène (hydroxylysine), à la production des anticorps, à la synthèse de carnitine (transport des acides gras vers la mitochondrie) et à l\'absorption du calcium. Elle inhibe aussi la réplication du virus herpès simplex en bloquant l\'utilisation de l\'arginine virale.',
      sources: ['Légumineuses', 'Viandes maigres', 'Fromages', 'Quinoa', 'Edamame'],
    },
    expert: {
      mechanism: 'La lysine n\'est pas substrat des aminotransférases — elle est catabolisée spécifiquement par la saccharopine pathway (lysine → α-aminoadipate → acétyl-CoA). Les résidus lysine du collagène sont hydroxylés par la prolyl hydroxylase et lysyl hydroxylase (vit C-dépendantes) → hydroxyproline et hydroxylysine → réticulation par lysyl oxydase (Cu-dépendante). La carnitine est synthétisée à partir de lysine + méthionine (étapes B3/B6/B12/vit C-dépendantes).',
      interactions: ['Antagonisme fonctionnel avec l\'arginine pour la réplication herpétique (HSV utilise l\'arginine pour la capside virale)', 'Synergie avec la vitamine C pour la synthèse du collagène (hydroxylysine)', 'La lysine augmente l\'absorption intestinale du calcium (mécanisme CLDN2)', 'La carnitine dérive partiellement de la lysine (+ méthionine)'],
      dosage: { rda: '38', unit: 'mg/kg/j' },
      clinicalNote: 'La supplémentation en lysine (1–3 g/j) réduit la fréquence et la durée des récurrences d\'herpès labial dans plusieurs essais contrôlés, probablement en limitant la disponibilité de l\'arginine virale.',
    },
    relatedIds: ['arginine', 'vit-c', 'carnitine'],
  },

  {
    id: 'methionine', category: 'aminoacid', name: 'Méthionine',
    emoji: '🧬', tagline: 'Fournit tous les groupements méthyle du corps humain',
    simple: {
      what: 'La méthionine est l\'acide aminé soufré essentiel de départ de toutes les protéines. Elle est le précurseur de la SAM (S-adénosylméthionine), le principal donneur de méthyle du corps humain — impliqué dans la méthylation de l\'ADN, des hormones, des neurotransmetteurs et des lipides.',
      why: 'Sans méthionine, aucune protéine ne peut être synthétisée (c\'est le codon START universel). Elle fournit le soufre pour la synthèse du glutathion et de la cystéine, et conditionne la méthylation de l\'ADN — process épigénétique fondamental pour l\'expression des gènes.',
      sources: ['Blanc d\'œuf', 'Thon', 'Bœuf', 'Fromage cottage', 'Graines de sésame'],
    },
    expert: {
      mechanism: 'La méthionine + ATP → SAM (S-adénosylméthionine), donneur universel de groupements méthyle pour : la méthylation des cytosines de l\'ADN (DNMT1/3A/3B), des histones (HMT), des ARN (m⁶A), des phospholipides (PEMT : PE → PC), et la synthèse de mélatonine et créatine. SAM → SAH → homocystéine (remétylée par B12/folate → méthionine, ou transsulfurée par B6 → cystéine → glutathion).',
      interactions: ['Trio méthionine-B12-folate pour le cycle de méthylation (remétylation de l\'homocystéine)', 'B6 est indispensable à la transsulfuration (méthionine → cystéine → glutathion)', 'La restriction en méthionine allonge la durée de vie dans les modèles animaux (réduction du stress oxydatif mitochondrial)', 'Un excès d\'homocystéine (carence B12/B9/B6) est cardiotoxique'],
      dosage: { rda: '19', unit: 'mg/kg/j' },
      clinicalNote: 'La restriction en méthionine alimentaire est une stratégie antiâge explorée : elle réduit la production de radicaux libres mitochondriaux et active AMPK/mTOR. Les régimes végétaliens sont naturellement plus pauvres en méthionine.',
    },
    relatedIds: ['vit-b9', 'vit-b12', 'vit-b6', 'methylation', 'glutamine'],
  },

  {
    id: 'phenylalanine', category: 'aminoacid', name: 'Phénylalanine', aliases: ['Phe', 'Précurseur tyrosine'],
    emoji: '⚙️', tagline: 'Précurseur de la dopamine, tyrosine et mélanine',
    simple: {
      what: 'La phénylalanine est convertie en tyrosine par la phénylalaline hydroxylase (enzyme dépendante du BH4). La tyrosine est elle-même le précurseur de la dopamine, la noradrénaline, l\'adrénaline, la thyronine (hormones thyroïdiennes) et la mélanine. En cas de phénylcétonurie (PKU), cette conversion est défectueuse.',
      why: 'Sans phénylalanine, la chaîne de biosynthèse des catécholamines (dopamine, noradrénaline, adrénaline) est compromise — avec des conséquences sur la motivation, la vigilance et la réponse au stress. Elle est aussi impliquée dans la production d\'endorphines.',
      sources: ['Aspartame (source à éviter)', 'Viandes', 'Poissons', 'Œufs', 'Légumineuses'],
      deficiency: 'Rare isolément, mais une restriction sévère affecte la synthèse des catécholamines.',
    },
    expert: {
      mechanism: 'La phénylalaline hydroxylase (PAH, tétrahydrobioptérine-dépendante) convertit Phe → Tyr. La tyrosine hydroxylase (TH, BH4/Fe-dépendante) : Tyr → L-DOPA (étape limitante de la synthèse des catécholamines). L-DOPA → dopamine (AADC, PLP) → noradrénaline (DBH, vit C/Cu) → adrénaline (PNMT, SAM-méthyle). La PKU (déficit PAH) provoque une accumulation de phénylpyruvate neurotoxique.',
      interactions: ['BH4 (tétrahydrobioptérine) est le cofacteur limitant de la PAH — un déficit en BH4 peut simuler une PKU', 'La vitamine C est cofacteur de la DBH (dopamine → noradrénaline)', 'La méthionine (SAM) est nécessaire à la PNMT (noradrénaline → adrénaline)', 'Compétition avec les autres grands acides aminés neutres (LNAA) pour la BHE'],
      dosage: { rda: '33 (Phe+Tyr)', unit: 'mg/kg/j' },
    },
    relatedIds: ['tyrosine', 'vit-b6', 'vit-c'],
  },

  {
    id: 'threonine', category: 'aminoacid', name: 'Thréonine',
    emoji: '🏗️', tagline: 'Mucines intestinales et protéines structurelles',
    simple: {
      what: 'La thréonine est l\'acide aminé essentiel le plus concentré dans la couche de mucus intestinal. Elle est indispensable à la synthèse des mucines (glycoprotéines qui tapissent et protègent l\'intestin) et des protéines structurelles du cœur et des muscles squelettiques.',
      why: 'Sans thréonine, l\'intégrité de la barrière intestinale se compromet, augmentant la perméabilité et les infections digestives. Elle contribue aussi à la synthèse de la glycine et de la sérine.',
      sources: ['Blanc de poulet', 'Fromage cottage', 'Thon', 'Lentilles', 'Quinoa'],
    },
    expert: {
      mechanism: 'La thréonine est catabolisée par deux voies : la thréonine déshydratase (→ α-cétobutyrate → propionyl-CoA → succinyl-CoA, glucogénique) et la thréonine aldolase (→ glycine + acétaldéhyde → acétyl-CoA). Les résidus thréonine des mucines sont les sites de O-glycosylation (N-acétylgalactosamine → chaînes oligosaccharidiques formant le gel muqueux). Le phénotype de restriction en thréonine inclut une réduction de la masse musculaire cardiaque.',
      interactions: ['La glycine et la sérine dérivent partiellement de la thréonine (voie aldolase)', 'Indispensable à la mucosynthèse intestinale — un apport insuffisant compromet la barrière mucosale', 'La vitamine B6 est cofacteur de la thréonine déshydratase'],
      dosage: { rda: '20', unit: 'mg/kg/j' },
    },
    relatedIds: ['glycine', 'permeabilite-intestinale'],
  },

  {
    id: 'tryptophane', category: 'aminoacid', name: 'Tryptophane', aliases: ['Trp', 'Précurseur sérotonine'],
    emoji: '😴', tagline: 'Précurseur de la sérotonine · mélatonine · niacine',
    simple: {
      what: 'Le tryptophane est l\'acide aminé en plus faible concentration dans les protéines alimentaires — c\'est souvent l\'acide aminé limitant des régimes végétaliens. Son cheminement est multiple : il peut devenir sérotonine, mélatonine, niacine (vitamine B3) ou kynurénine.',
      why: 'L\'axe tryptophane → sérotonine → mélatonine est fondamental pour l\'humeur, le sommeil et l\'appétit. 95 % de la sérotonine du corps est produite dans l\'intestin, d\'où le lien profond entre alimentation, microbiote et bien-être psychologique.',
      sources: ['Graines de courge', 'Parmesan', 'Dinde', 'Graines de chia', 'Chocolat noir'],
    },
    expert: {
      mechanism: 'La voie de la kynurénine (95 % du tryptophane) : indoléamine 2,3-dioxygénase (IDO) → kynurénine → acide nicotinique (niacine) ou acide quinolinique (neurotoxique). La voie sérotonine (5 %) : tryptophane hydroxylase (TPH1, entérochromaffines intestinales ; TPH2, raphé dorsal) → 5-HTP → sérotonine (AADC, PLP) → N-acétylsérotonine → mélatonine (AANAT). L\'IDO est activée par les cytokines pro-inflammatoires — l\'inflammation "vole" le tryptophane à la sérotonine.',
      interactions: ['Les BCAA (leucine, valine, isoleucine) compètent avec le tryptophane pour LAT1 (BHE) — ratios BCAA/Trp influencent la synthèse cérébrale de sérotonine', 'B6 (PLP) et magnésium sont cofacteurs des deux voies', 'L\'inflammation (IDO suractivée) réduit la disponibilité cérébrale en tryptophane → dépression liée aux maladies chroniques', 'Les inhibiteurs de la MAO (IMAO) potentialisent l\'effet du tryptophane alimentaire'],
      dosage: { rda: '5', unit: 'mg/kg/j' },
      clinicalNote: 'Le ratio kynurénine/tryptophane plasmatique est un biomarqueur de l\'activation immunitaire (IDO). La nuit, le jeûne et l\'obscurité stimulent la conversion sérotonine → mélatonine (voie AANAT dans la pinéale et l\'intestin).',
    },
    relatedIds: ['vit-b3', 'vit-b6', 'magnesium', 'axe-intestin-cerveau'],
  },

  {
    id: 'histidine', category: 'aminoacid', name: 'Histidine',
    emoji: '🧪', tagline: 'Histamine, carnosine et protection contre l\'oxydation musculaire',
    simple: {
      what: 'L\'histidine est le seul acide aminé qui est essentiel chez l\'adulte tout en étant synthétisé en petites quantités. Elle est particulièrement abondante dans l\'hémoglobine (site de liaison de l\'O₂ et du CO₂) et est le précurseur de l\'histamine et de la carnosine.',
      why: 'Elle régule le pH dans le muscle (via la carnosine — tampon intracellulaire) et dans l\'hémoglobine, participe aux réponses inflammatoires et allergiques (histamine), et protège les cellules contre les dommages oxydatifs (imidazole scavenger).',
      sources: ['Viandes rouges', 'Poulet', 'Thon', 'Fromages affinés', 'Légumineuses'],
    },
    expert: {
      mechanism: 'L\'histidine décarboxylase (PLP-dépendante) convertit His → histamine (neurotransmetteur, médiateur inflammatoire, sécrétion acide gastrique via H₂). La β-alanine + His → carnosine (dipeptide tampon musculaire, pKa ~6,8 — parfaitement adapté au tamponnage des H⁺ générés par la glycolyse anaérobie). Le noyau imidazole de l\'histidine est un accepteur de protons amphotère essentiel au site actif de nombreuses enzymes (sérines protéases, carboanhydrase).',
      interactions: ['La carnosine (histidine + β-alanine) est plus efficacement augmentée par la supplémentation en β-alanine qu\'en histidine directe', 'Les antihistaminiques H1 et H2 bloquent respectivement les effets allergiques et gastriques de l\'histamine', 'Le cuivre et le zinc forment des complexes avec l\'imidazole de l\'histidine'],
      dosage: { rda: '14', unit: 'mg/kg/j' },
    },
    relatedIds: ['vit-b6', 'cuivre', 'zinc'],
  },

  {
    id: 'glutamine', category: 'aminoacid', name: 'Glutamine',
    emoji: '🦋', tagline: 'Carburant préféré des entérocytes et des lymphocytes',
    simple: {
      what: 'La glutamine est l\'acide aminé le plus abondant dans le plasma et les muscles. Conditionnellement essentielle (indispensable lors du stress, des maladies, des traumatismes), elle est la principale source d\'énergie des cellules intestinales et des globules blancs — qui ne peuvent pas brûler du glucose aussi efficacement.',
      why: 'Elle est fondamentale pour maintenir l\'intégrité de la paroi intestinale, pour alimenter le système immunitaire en période de stress, et pour équilibrer l\'acido-basique rénal. Les chirurgies, brûlures et infections sévères épuisent rapidement les réserves musculaires.',
      sources: ['Blanc d\'œuf', 'Blanc de poulet', 'Tofu', 'Fromage cottage', 'Haricots rouges'],
    },
    expert: {
      mechanism: 'La glutamine est le donneur d\'azote dans la synthèse des purines et pyrimidines (bases de l\'ADN), des acides aminés non-essentiels (asparagine, sérine) et du NAD+. Dans les entérocytes et les lymphocytes, elle est oxydée via la glutaminolyse : glutamine → glutamate (glutaminase) → α-cétoglutarate → cycle de Krebs (70 % de l\'énergie des entérocytes). Dans le rein, sa désamidation libère de l\'ammonium (tampon acide-base). Elle régule mTORC1 via les transporteurs SLC1A5/ASCT2.',
      interactions: ['La glutamine active mTORC1 via le complexe Ragulator (cofacteur de la leucine pour mTOR)', 'La vitamine B6 (PLP) est cofacteur de la glutamine synthétase et de la glutaminase', 'L\'ammoniaque issue de la glutaminolyse est détoxifiée par le cycle de l\'urée (arginine)', 'En cas de carence, l\'intégrité de la muqueuse intestinale se compromet (perméabilité accrue)'],
      fodmapNote: 'La glutamine en poudre est testée comme traitement du syndrome de l\'intestin irritable — son rôle dans la réparation de la muqueuse est pertinent pour les personnes FODMAP.',
      dosage: { rda: 'Conditionnelle 5–10 g/j en cas de stress métabolique', unit: '' },
      clinicalNote: 'La supplémentation péri-opératoire (0,5 g/kg/j) réduit la durée d\'hospitalisation et les complications infectieuses en chirurgie abdominale majeure. Effet neutre en population générale saine.',
    },
    relatedIds: ['arginine', 'permeabilite-intestinale', 'microbiote'],
  },

  {
    id: 'arginine', category: 'aminoacid', name: 'Arginine', aliases: ['L-arginine'],
    emoji: '❤️', tagline: 'Précurseur du monoxyde d\'azote — vasodilatateur majeur',
    simple: {
      what: 'L\'arginine est un acide aminé semi-essentiel (le corps peut en produire, mais pas toujours en quantité suffisante). Elle est surtout connue comme précurseur du monoxyde d\'azote (NO), un gaz vasodilatateur qui détend les vaisseaux sanguins et régule la pression artérielle.',
      why: 'Elle améliore la circulation sanguine, stimule la libération de l\'hormone de croissance, participe au cycle de l\'urée (élimination de l\'ammoniaque) et accélère la cicatrisation. Sa supplémentation est populaire chez les sportifs pour l\'afflux sanguin musculaire.',
      sources: ['Noix (toutes)', 'Graines de citrouille', 'Dinde', 'Poulet', 'Pois chiches'],
    },
    expert: {
      mechanism: 'La NO synthase (eNOS, nNOS, iNOS) : arginine + O₂ → citrulline + NO. Le NO active la guanylate cyclase soluble → cGMP → relaxation des cellules musculaires lisses vasculaires (Monoxyde d\'azote = EDRF, endothelium-derived relaxing factor de Furchgott). Le cycle de l\'urée hépatique : citrulline + aspartate → argininosuccinate → arginine + fumarate → urée. L\'arginine est aussi précurseur de la créatine (arginine + glycine + méthionine) et des polyamines (spermidine, spermine) via l\'ornithine.',
      interactions: ['Antagonisme avec la lysine pour la réplication du virus herpès', 'Arginase compète avec eNOS pour l\'arginine — l\'inflammation élève l\'arginase → réduction du NO', 'La citrulline (pastèque) est un meilleur précurseur de l\'arginine plasmatique que l\'arginine directe (contourne le métabolisme de premier passage hépatique)', 'La tetrahydrobioptérine (BH4) est cofacteur indispensable de toutes les NOS'],
      dosage: { rda: '3–5 g/j conditionnelle', unit: '' },
      clinicalNote: 'La L-citrulline (3-6 g/j) est supérieure à la L-arginine pour augmenter l\'arginine plasmatique et le NO. La supplémentation en arginine contre-indiquée en phase active d\'herpès (stimule la réplication virale via les polyamines).',
    },
    relatedIds: ['lysine', 'glycine', 'citrulline'],
  },

  {
    id: 'glycine', category: 'aminoacid', name: 'Glycine',
    emoji: '🤸', tagline: 'Collagène · neurotransmetteur inhibiteur · désintoxication',
    simple: {
      what: 'La glycine est l\'acide aminé le plus simple (sans chaîne latérale). Elle est considérée non-essentielle mais devient conditionnellement essentielle avec l\'âge — le corps ne peut pas en synthétiser suffisamment pour couvrir tous les besoins, surtout pour la synthèse du collagène (qui est à 1/3 de la glycine).',
      why: 'Elle est indispensable à la synthèse du collagène (chaque 3ème acide aminé est une glycine), du glutathion (tripeptide Gly-Cys-Glu), du foie (conjugaison des acides biliaires), et agit comme neurotransmetteur inhibiteur dans la moelle épinière.',
      sources: ['Bouillon d\'os', 'Peau de poulet', 'Gélatine', 'Légumineuses', 'Épinards'],
    },
    expert: {
      mechanism: 'La glycine contribue à la synthèse du collagène : chaque triplet Gly-X-Y est nécessaire à la triple hélice du collagène. Elle est substrat de la glycine N-méthyltransférase (GNMT) qui régule le ratio SAM/SAH (tamponnant les variations de méthylation). La glycine conjugue les acides biliaires (acide cholique → acide glycocholique — solubilité), les acides benzoïques urinaires (détoxification hépatique) et participe à la synthèse de la porphyrine (hème) avec le succinyl-CoA.',
      interactions: ['Le magnésium potentialise l\'effet inhibiteur de la glycine sur le récepteur NMDA (réduction de l\'excitotoxicité)', 'La méthionine et le folate modulent la GNMT (régulation de la méthylation)', 'La glycine est le précurseur du GSH avec la cystéine et le glutamate', 'Le collagène hydrolysé (source de glycine biodisponible) améliore la qualité du cartilage (études 2017-2022)'],
      dosage: { rda: '3–5 g/j conditionnelle', unit: '' },
      clinicalNote: 'La glycine (3 g avant le coucher) améliore la qualité du sommeil et réduit la somnolence diurne dans deux essais randomisés japonais — mécanisme probable : baisse de la température corporelle core via vasodilatation périphérique.',
    },
    relatedIds: ['lysine', 'arginine', 'methylation'],
  },

  {
    id: 'taurine', category: 'aminoacid', name: 'Taurine', aliases: ['Acide 2-aminoéthylsulfonique'],
    emoji: '⚡', tagline: 'Protection cellulaire · osmorégulation · cœur',
    simple: {
      what: 'La taurine est un acide aminé soufré non protéinogène (elle n\'est pas incorporée dans les protéines). Présente en grande concentration dans le cerveau, le cœur, la rétine et les muscles squelettiques, elle est synthétisée à partir de la cystéine mais les apports alimentaires sont importants.',
      why: 'Elle protège les cellules du stress osmotique, stabilise les membranes cellulaires, module les récepteurs GABA et glycine (effets calmants), et est essentielle au développement de la rétine et du cerveau chez le nourrisson (d\'où sa présence dans les laits infantiles).',
      sources: ['Poulpe', 'Palourdes', 'Crevettes', 'Thon', 'Dinde'],
      deficiency: 'Dégénérescence rétinienne et cardiomyopathie dilatée — décrites chez les chats (obligatoirement carnivores), plus rares chez l\'humain.',
    },
    expert: {
      mechanism: 'La taurine est synthétisée via : cystéine → cystéinesulphinate (CDO, cystéine dioxygénase) → hypotaurine → taurine. Elle forme des acides biliaires taurinés (acide taurocholique) avec une solubilité et une activité détergente supérieures aux acides biliaires glycinés. Dans le cœur, elle régule le flux de Ca²⁺ intracellulaire (stabilisation des canaux RyR2), expliquant les cardiomyopathies des déficits félins. Elle module GlyR et GABA_A en tant qu\'agoniste partiel.',
      interactions: ['Interaction compétitive avec GABA et glycine pour leurs récepteurs ionotropiques', 'L\'apport de méthionine et cystéine conditionne la synthèse endogène', 'Le zinc potentialise certains effets neuroprotecteurs de la taurine', 'Les boissons énergisantes (250 mg taurine + caféine) : les effets "énergisants" sont principalement liés à la caféine'],
      dosage: { rda: '400–3 000 mg/j conditionnelle', unit: '' },
      clinicalNote: 'Une étude observationnelle (Yonsei Univ., 2023) sur 11 000 personnes montre une association inverse entre les taux de taurine plasmatiques et les marqueurs du vieillissement biologique. Chez la souris, la supplémentation allonge la durée de vie de 10-12 %.',
    },
    relatedIds: ['glycine', 'magnesium', 'axe-intestin-cerveau'],
  },

  {
    id: 'carnitine', category: 'aminoacid', name: 'L-Carnitine', aliases: ['Carnitine', 'Acétyl-L-carnitine'],
    emoji: '🔥', tagline: 'Navette des acides gras vers la mitochondrie',
    simple: {
      what: 'La carnitine est synthétisée dans le foie et les reins à partir de lysine et méthionine (avec B3, B6 et vit C). 95 % des réserves de l\'organisme se trouvent dans les muscles. Elle est conditionnellement essentielle chez les végétaliens stricts et les prématurés.',
      why: 'Son rôle principal est de transporter les acides gras à longue chaîne (AGLC) à travers la membrane interne mitochondriale pour leur β-oxydation. Sans carnitine, les graisses ne peuvent pas être brûlées efficacement — d\'où son rôle dans la production d\'énergie et la récupération musculaire.',
      sources: ['Agneau', 'Bœuf', 'Porc', 'Lait entier', 'Poulet (moindre)'],
    },
    expert: {
      mechanism: 'La carnitine palmitoyltransférase I (CPT1, membrane mitochondriale externe) : acyl-CoA + carnitine → acylcarnitine. Le transporteur CACT (carnitine/acylcarnitine translocase) porte l\'acylcarnitine dans la matrice. La CPT2 libère l\'acyl-CoA pour la β-oxydation. L\'acétyl-L-carnitine (ALCAR) franchit la barrière hémato-encéphalique et fournit des groupements acétyle pour la synthèse d\'acétylcholine et de l\'ATP neural. Régulée par l\'insuline (inhibe CPT1 via malonyl-CoA).',
      interactions: ['La malonyl-CoA (intermédiaire de la synthèse des acides gras) inhibe CPT1 — empêchant la dégradation simultanée et la synthèse des AG', 'La synthèse endogène requiert lysine, méthionine, vit C, B3, B6 et Fe', 'Les valproates et les AZT (antirétroviraux) induisent un déficit en carnitine', 'L\'insuline favorise l\'expression de CPT1 à jeun ; l\'alimentation riche en glucides l\'inhibe'],
      dosage: { rda: '500–2 000 mg/j conditionnelle', unit: '' },
      clinicalNote: 'Méta-analyse 2020 (12 essais, IRC) : L-carnitine réduit la fatigue, l\'anémie résistante à l\'EPO et la résistance à l\'insuline chez les dialysés. L\'ALCAR (1-2 g/j) améliore légèrement les fonctions cognitives dans la démence légère à modérée.',
    },
    relatedIds: ['lysine', 'methionine', 'vit-c'],
  },

  {
    id: 'citrulline', category: 'aminoacid', name: 'Citrulline', aliases: ['L-Citrulline', 'Précurseur NO'],
    emoji: '🍉', tagline: 'Booste le NO et la récupération musculaire sans effet hépatique',
    simple: {
      what: 'La citrulline (abondante dans la pastèque) est un acide aminé non-essentiel non-protéinogène — intermédiaire du cycle de l\'urée. Sa particularité : ingérée oralement, elle est bien plus efficace que l\'arginine pour augmenter l\'arginine plasmatique, car elle contourne le métabolisme hépatique de premier passage.',
      why: 'Elle stimule la production de NO (monoxyde d\'azote) pour améliorer la vasodilatation, réduit l\'accumulation d\'ammoniaque musculaire (fatigue), et accélère la récupération post-exercice. C\'est le précurseur préféré pour les effets ergogéniques.',
      sources: ['Pastèque (chair et jus)', 'Courges', 'Concombre', 'Melon amer', 'Synthèse hépatique'],
    },
    expert: {
      mechanism: 'Dans l\'intestin, citrulline → absorption → rein → arginine (argininosuccinate synthase + lyase). Bypass du foie (qui capte et catabolise 60 % de l\'arginine ingérée via arginase hépatique). Dans les cellules endothéliales : arginine + O₂ (eNOS) → NO + citrulline (cycle perpétuel). Le NO active sGC → cGMP → PKG → relaxation du muscle lisse vasculaire. La citrulline réduit aussi l\'accumulation de lactate et d\'ammoniac musculaire pendant l\'exercice anaérobie.',
      interactions: ['Supérieure à l\'arginine pour élever l\'argininemie plasmatique et la production de NO (+50 % de biodisponibilité)', 'Synergie avec la bétaïne et le nitrate alimentaire (betterave) pour la production de NO', 'Attention chez les patients sous IPDE-5 (sildénafil) — potentialisation des effets'],
      dosage: { rda: '3–6 g/j conditionnelle', unit: '' },
      clinicalNote: 'La citrulline malate (6-8 g) 60 min avant l\'exercice augmente le nombre de répétitions à l\'échec de 20 % et réduit les courbatures de 40 % à 48h (Pérez-Guisado, 2010). Plus efficace que l\'arginine pour la pression artérielle.',
    },
    relatedIds: ['arginine', 'glycine'],
  },

  {
    id: 'tyrosine', category: 'aminoacid', name: 'Tyrosine', aliases: ['L-Tyrosine', 'Précurseur catécholamines'],
    emoji: '🎯', tagline: 'Précurseur de la dopamine, adrénaline et hormones thyroïdiennes',
    simple: {
      what: 'La tyrosine est un acide aminé semi-essentiel synthétisé à partir de la phénylalanine. Elle est le précurseur commun des catécholamines (dopamine, noradrénaline, adrénaline), des hormones thyroïdiennes (T3, T4) et de la mélanine (pigment de la peau et des cheveux).',
      why: 'Sa supplémentation améliore les fonctions cognitives et la résistance au stress dans des situations de privation de sommeil ou de froid intense — en maintenant les stocks de catécholamines cérébrales. Elle est particulièrement utile en conditions de stress aigu.',
      sources: ['Parmesan', 'Graines de sésame', 'Dinde', 'Thon', 'Avoine'],
    },
    expert: {
      mechanism: 'La tyrosine hydroxylase (TH, tetrahydrobioptérine-dépendante) est l\'étape limitante : Tyr → L-DOPA → dopamine (AADC, PLP) → noradrénaline (DBH, Cu/vit C) → adrénaline (PNMT, SAM). Dans la thyroïde, la tyrosinase (TPO) iode les résidus Tyr de la thyroglobuline → MIT/DIT → T3/T4. La tyrosinase mélanocytaire (Cu-dépendante) : Tyr → DOPA → mélanine. La disponibilité de la tyrosine au cerveau dépend du ratio tyrosine/LNAA plasmatiques.',
      interactions: ['Les IMAO potentialisent l\'effet de la tyrosine alimentaire (fromages riches) → crise hypertensive ("syndrome du fromage")', 'Le BH4 est cofacteur limitant de la TH — déficit en BH4 → Parkinson-like', 'La méthionine (SAM) est nécessaire à la N-méthylation (noradrénaline → adrénaline)', 'La Phénylalanine est le précurseur obligatoire de la tyrosine (PAH)'],
      dosage: { rda: '33 (Phe+Tyr)', unit: 'mg/kg/j' },
      clinicalNote: 'La tyrosine (100-300 mg/kg) avant des tâches cognitives sous stress (privation de sommeil, froid, altitude) améliore significativement la mémoire de travail et le temps de réaction (Lieberman 1994, Mahoney 2007).',
    },
    relatedIds: ['phenylalanine', 'vit-b6', 'iode'],
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  COMPOSÉS BIOACTIFS (21)                                 ║
  // ╚══════════════════════════════════════════════════════════╝

  {
    id: 'quercetine', category: 'bioactive', name: 'Quercétine', aliases: ['Quercetin', 'Flavonol'],
    emoji: '🍎', tagline: 'Flavonoïde anti-inflammatoire et antihistaminique naturel',
    simple: {
      what: 'La quercétine est le flavonol le plus abondant dans l\'alimentation — présent dans la plupart des fruits et légumes colorés. Mal absorbée seule (5-17 %), sa biodisponibilité est améliorée par la bromélaïne (ananas) et la pipérine (poivre noir), et par la fermentation.',
      why: 'Elle inhibe les enzymes de l\'inflammation (cyclo-oxygénase, lipoxygénase), stabilise les mastocytes (anti-allergique), chélate les métaux lourds et inhibe l\'enzyme ACE (antihypertenseur modéré). C\'est l\'un des flavonoïdes les mieux étudiés.',
      sources: ['Câpres', 'Oignon rouge', 'Pomme (avec peau)', 'Kale', 'Thé vert'],
    },
    expert: {
      mechanism: 'La quercétine inhibe la phosphodiestérase (augmente AMPc → relaxation vasculaire), PI3K/Akt et NF-κB (anti-inflammatoire), COMT (ralentit la dégradation des catécholamines), et l\'ACE (hypotenseur). Elle active AMPK (autophagie, biogenèse mitochondriale) et SIRT1 (effet senolytique démontré in vitro contre les cellules sénescentes). Chélation des ions Fe²⁺ et Cu²⁺ (réduction du stress de Fenton).',
      interactions: ['La pipérine (20 mg) augmente l\'absorption de la quercétine de 20 %', 'Synergie avec la vitamine C pour la régénération et l\'effet antioxydant', 'Inhibe les cytochromes CYP3A4 et CYP2C9 → interactions médicamenteuses potentielles (cyclosporine, warfarine)'],
      clinicalNote: 'Dasatinib + quercétine (traitement sénolytique) : essais cliniques en cours pour l\'ostéoporose et la BPCO liées au vieillissement. La dose de 500-1 000 mg/j (quercetin phytosome) réduit les marqueurs d\'inflammation systémique (CRP, IL-6) de 15-25 % dans des essais randomisés.',
    },
    relatedIds: ['egcg', 'anthocyanes', 'stress-oxydatif'],
  },

  {
    id: 'curcumine', category: 'bioactive', name: 'Curcumine', aliases: ['Curcumin', 'Turmeric polyphenol'],
    emoji: '🟡', tagline: 'Polyphénol anti-inflammatoire multivoie du curcuma',
    simple: {
      what: 'La curcumine est le principal polyphénol du curcuma (Curcuma longa), responsable de sa couleur jaune intense. Son défi majeur est sa très faible biodisponibilité sous forme brute (~1 %) due à sa mauvaise solubilité dans l\'eau et sa dégradation rapide.',
      why: 'Elle module simultanément plusieurs voies inflammatoires (NF-κB, COX-2, TNF-α) sans les effets indésirables gastro-intestinaux des AINS. Des études montrent des effets bénéfiques sur l\'arthrose, la dépression légère-modérée, la glycémie et la santé intestinale.',
      sources: ['Curcuma moulu', 'Curry maison', 'Lait d\'or (golden milk)', 'Curcuma frais'],
    },
    expert: {
      mechanism: 'La curcumine inhibe IKKβ → blocage de la translocation nucléaire de NF-κB → réduction de l\'expression de COX-2, iNOS, TNF-α, IL-6, MCP-1. Elle active Nrf2 → expression des gènes antioxydants (HO-1, GSH-S-transférase, NQO1). Elle inhibe mTOR, active AMPK (mimétique de restriction calorique), et présente une activité inhibitrice des HDAC (épigénétique). Chélation du Fe²⁺ et Cu²⁺ (pro-oxydant à haute dose dans les systèmes Fe-riches).',
      interactions: ['La pipérine (20 mg) augmente la biodisponibilité de la curcumine de 2 000 % (inhibition UGT et CYP3A4 intestinal)', 'Les formulations lipidiques (Meriva®, Longvida®, BCM-95®) améliorent l\'absorption de 7 à 100×', 'Inhibe CYP3A4, CYP1A2, CYP2C9 → interactions médicamenteuses (anticoagulants, immunosuppresseurs)', 'Synergie démontrée avec la pipérine (absorption) et le gingembre (anti-inflammatoire)'],
      fodmapNote: 'Le curcuma en poudre est safe Low FODMAP jusqu\'à 1 cuillère à café. Les suppléments de curcumine n\'ont pas d\'impact FODMAP significatif.',
      clinicalNote: 'Méta-analyse 2021 (15 essais, arthrose) : 1 000 mg/j de curcumine phytosome = effet analgésique comparable à 1 000 mg d\'ibuprofène sur 12 semaines. Dans la dépression légère-modérée, la curcumine (500-1000 mg/j) est supérieure au placebo avec une taille d\'effet modérée (SMD ~0,4).',
    },
    relatedIds: ['quercetine', 'inflammation', 'stress-oxydatif'],
  },

  {
    id: 'resveratrol', category: 'bioactive', name: 'Resvératrol', aliases: ['Resveratrol', 'Trans-resvératrol'],
    emoji: '🍇', tagline: 'Mimétique de la restriction calorique · sirtuines',
    simple: {
      what: 'Le resvératrol est un stilbène phénolique produit par les plantes comme défense contre les pathogènes et le stress UV. Présent en grande concentration dans la peau du raisin rouge et dans le vin rouge (mais en quantités trop faibles dans un verre pour un effet physiologique), c\'est l\'une des molécules de la longévité les plus étudiées.',
      why: 'Il active les sirtuines (SIRT1) — les mêmes enzymes activées par la restriction calorique — et AMPK, induisant un état métabolique semblable au jeûne. Il améliore la sensibilité à l\'insuline, la fonction vasculaire et présente des effets neuroprotecteurs.',
      sources: ['Raisin rouge (peau)', 'Mûres', 'Myrtilles', 'Vin rouge (< 1 mg/verre)', 'Arachides (cacahuètes)'],
    },
    expert: {
      mechanism: 'Le resvératrol active SIRT1 (directement ou via AMPK → NAD⁺ → SIRT1). SIRT1 désacétyle PGC-1α → biogenèse mitochondriale, FOXO3 → antioxydant et longévité, et NF-κB → anti-inflammatoire. Il inhibe PI3K/mTOR (favorise l\'autophagie) et l\'aromatase (réduction des œstrogènes dans les tissus). La biodisponibilité est faible (rapide glucuronidation hépatique) — les formulations liposomales et à diffusion lente améliorent la pharmacocinétique.',
      interactions: ['Synergique avec la quercétine et la fisetin (sénolytique)', 'Potentialise les effets de la metformine (AMPK)', 'Inhibe CYP3A4, CYP2C9 et les glucuronyl-transférases → interactions médicamenteuses', 'La combinaison resvératrol + NAD⁺ précurseurs (NMN, NR) est synergique pour SIRT1'],
      clinicalNote: 'Les études humaines restent hétérogènes. La dose efficace chez l\'humain (500-1 000 mg/j) est difficile à atteindre par l\'alimentation. L\'essai CALERIE-2 avec 150 mg/j ne montre qu\'un effet modeste sur les biomarqueurs métaboliques.',
    },
    relatedIds: ['egcg', 'stress-oxydatif', 'autophagie'],
  },

  {
    id: 'egcg', category: 'bioactive', name: 'EGCG', aliases: ['Épigallocatéchine gallate', 'Catéchine thé vert'],
    emoji: '🍵', tagline: 'Catéchine principale du thé vert · autophagie · cancéro-prévention',
    simple: {
      what: 'L\'EGCG (épigallocatéchine-3-gallate) est la catéchine la plus abondante et la plus active du thé vert. Une tasse de thé vert de qualité contient 50-150 mg d\'EGCG. Les thés verts japonais (matcha, gyokuro) sont les plus riches.',
      why: 'Elle est le composé phytochimique le plus étudié dans la prévention des cancers, la santé cardiovasculaire et la neuroprotection. Elle augmente la thermogenèse et la β-oxydation des graisses, expliquant son utilisation dans les suppléments minceur.',
      sources: ['Matcha', 'Gyokuro', 'Thé vert sencha', 'Thé blanc'],
    },
    expert: {
      mechanism: 'L\'EGCG inhibe la télomérase (anti-tumoral), PI3K/Akt/mTOR, et l\'EGFR (croissance cellulaire). Il active AMPK (biogenèse mitochondriale, β-oxydation), Nrf2 (défenses antioxydantes), et induit l\'autophagie via Beclin-1. Dans le SNS, il inhibe la COMT (catéchol-O-méthyltransférase) → prolongation des effets des catécholamines (synergique avec la caféine pour la thermogenèse). Chélatation forte du fer et du cuivre.',
      interactions: ['Pris avec un repas riche en fer non-héminique : réduit significativement l\'absorption du fer (à éviter en cas de carence)', 'Synergique avec la caféine pour la thermogenèse et l\'oxydation des graisses (synergie COMT + adénosine)', 'Inhibe la biodisponibilité de certains médicaments (nadolol, rosuvastatine) via OATP1B1'],
      clinicalNote: 'Méta-analyse 2011 (11 essais) : l\'EGCG (> 300 mg/j) réduit la pression artérielle systolique de ~3 mmHg. Hépatotoxicité rare mais documentée à doses > 800 mg/j en extrait sec concentré à jeun — recommandation : prendre avec les repas.',
    },
    relatedIds: ['quercetine', 'resveratrol', 'fer', 'stress-oxydatif'],
  },

  {
    id: 'luteine', category: 'bioactive', name: 'Lutéine & Zéaxanthine', aliases: ['Lutein', 'Zeaxanthin', 'Caroténoïdes maculaires'],
    emoji: '👁️', tagline: 'Filtres naturels de la macula rétinienne',
    simple: {
      what: 'La lutéine et la zéaxanthine sont les seuls caroténoïdes sélectivement accumulés dans la macula rétinienne, formant le pigment maculaire. Ils filtrent la lumière bleue (400-460 nm) hautement énergétique qui endommage les photorécepteurs.',
      why: 'Un pigment maculaire dense est associé à une meilleure acuité visuelle, une réduction du risque de DMLA (dégénérescence maculaire liée à l\'âge) et à une meilleure résistance à l\'éblouissement. Ils protègent aussi le cristallin (prévention des cataractes).',
      sources: ['Kale/chou frisé (cuit)', 'Épinards cuits', 'Jaune d\'œuf (très biodisponible)', 'Pistaches', 'Maïs'],
    },
    expert: {
      mechanism: 'La lutéine et la zéaxanthine absorbent la lumière bleue (440-460 nm) par transfert d\'énergie électronique → éteint les espèces réactives de l\'oxygène (¹O₂, O₂·⁻). Ils sont concentrés dans les segments externes des cônes de la fovéa (densité ~1 mM vs ~100 nM plasmatique). La zéaxanthine est produite à partir de la lutéine par la maculaxanthine réductase (BCDO2). La densité du pigment maculaire (MPOD) mesurée par hétérochromic flicker photometry prédit le risque de DMLA.',
      interactions: ['Absorption facilitée par les lipides alimentaires (caroténoïdes liposolubles)', 'Le β-carotène en excès compète pour l\'absorption avec la lutéine', 'Synergie avec la zinc (cofacteur de l\'alcool déshydrogénase rétinienne), le cuivre et les vitamines C et E dans la formulation AREDS2'],
      clinicalNote: 'L\'essai AREDS2 (NCT00345176) montre que la substitution du β-carotène par lutéine (10 mg) + zéaxanthine (2 mg) réduit la progression vers la DMLA avancée de 26 % chez les patients à haut risque, sans le risque cancéreux du β-carotène chez les fumeurs.',
    },
    relatedIds: ['lycopene', 'vit-a', 'vit-e'],
  },

  {
    id: 'lycopene', category: 'bioactive', name: 'Lycopène', aliases: ['Lycopene', 'Caroténoïde tomate'],
    emoji: '🍅', tagline: 'Protège la prostate et les vaisseaux de l\'oxydation',
    simple: {
      what: 'Le lycopène est un caroténoïde rouge produit par les tomates, les pastèques et les pamplemousses rouges. Sa particularité : la cuisson améliore drastiquement sa biodisponibilité (la tomate cuite dans l\'huile libère 5× plus de lycopène que la tomate crue). C\'est le caroténoïde le plus abondant dans le plasma humain.',
      why: 'C\'est l\'un des antioxydants les plus puissants pour neutraliser l\'oxygène singulet (¹O₂). Il est sélectivement accumulé dans la prostate, les testicules et les glandes surrénales. Les données épidémiologiques suggèrent une association inverse entre l\'apport en lycopène et le risque de cancer de la prostate.',
      sources: ['Concentré de tomate', 'Sauce tomate cuisinée à l\'huile', 'Pastèque', 'Pamplemousse rose', 'Papaye'],
    },
    expert: {
      mechanism: 'Le lycopène est le caroténoïde avec la plus haute capacité de désactivation de l\'oxygène singulet (k₂ = 3×10¹⁰ M⁻¹s⁻¹ vs β-carotène 1,4×10¹⁰). Il inhibe IGF-1 signaling (prolifération cellulaire), la progression du cycle cellulaire (G1/S arrest via cyclines), et modifie l\'expression de plusieurs gènes liés à la détoxification de phase II (Nrf2). Il n\'est pas converti en vitamine A (absence de β-ionone). Sa géométrie all-trans est principalement transformée en cis-isomères in vivo (plus biodisponibles).',
      interactions: ['La cuisson brise les parois cellulaires et isomérise trans → cis (meilleure absorption)', 'L\'huile d\'olive est synergique pour l\'absorption (liposoluble)', 'Le lycopène et le β-sitostérol (phytostérols) ont une action synergique sur l\'hypertrophie bénigne de la prostate', 'Les tabagistes ont des niveaux plasmatiques de lycopène 30-40 % plus bas'],
      clinicalNote: 'Les études d\'intervention randomisées sur la prévention du cancer de prostate sont hétérogènes. L\'association épidémiologique est cohérente (réduction de ~15 % du risque) mais la causalité n\'est pas établie. Dose efficace suggérée : 15-30 mg/j (sauce tomate 5× par semaine).',
    },
    relatedIds: ['luteine', 'stress-oxydatif'],
  },

  {
    id: 'beta-glucanes', category: 'bioactive', name: 'Bêta-glucanes', aliases: ['Beta-glucans', 'Fibres avoine'],
    emoji: '🌾', tagline: 'Fibres solubles · cholestérol · immunité · glycémie',
    simple: {
      what: 'Les bêta-glucanes sont des polysaccharides de glucose présents dans les céréales (avoine, orge) et les champignons (shiitaké, maitaké, reishi). Leur structure β(1→3)/(1→4) dans les céréales diffère de la structure β(1→3)/(1→6) des champignons, avec des activités biologiques distinctes.',
      why: 'Les bêta-glucanes de l\'avoine sont reconnus par l\'EFSA pour réduire le cholestérol LDL (3 g/j suffisent) et atténuer la glycémie postprandiale. Ceux des champignons sont des immunomodulateurs puissants, activant les macrophages et les cellules NK.',
      sources: ['Flocons d\'avoine', 'Orge mondé', 'Champignons shiitaké', 'Levure de bière', 'Sarrasin'],
    },
    expert: {
      mechanism: 'Dans l\'intestin, les bêta-glucanes céréaliers (visceux) piègent les acides biliaires → réabsorption réduite → le foie synthétise de nouveaux acides biliaires à partir du cholestérol → réduction du LDL-C. Ils ralentissent le transit et l\'absorption des sucres (ralentissement de l\'index glycémique). Les bêta-glucanes de champignons se lient au récepteur Dectin-1 des macrophages → activation NF-κB → production de cytokines pro-inflammatoires (immunostimulant, pas anti-inflammatoire).',
      interactions: ['La solubilité et la viscosité déterminent l\'effet : l\'avoine instantanée (hydrolysée) a un effet hypocholestérolémiant réduit vs flocons entiers', 'Associés aux statines : effets synergiques sur le LDL-C', 'Potentiellement fermentescibles (FODMAP modérés en grande quantité) — mais les données Monash sur l\'avoine sont rassurantes à doses normales'],
      fodmapNote: 'Les flocons d\'avoine sont Low FODMAP jusqu\'à 52 g (cuit). Les bêta-glucanes d\'avoine à dose usuelle (3 g/j) ne déclenchent pas de symptômes FODMAP significatifs.',
      clinicalNote: 'Allégation santé autorisée EFSA (2010) : "3 g de bêta-glucanes d\'avoine ou d\'orge par jour contribuent au maintien d\'un taux normal de cholestérol sanguin." Un bol de flocons d\'avoine (80 g) fournit ~2 g de bêta-glucanes.',
    },
    relatedIds: ['fibres-alimentaires', 'microbiote', 'index-glycemique'],
  },

  {
    id: 'epa', category: 'bioactive', name: 'EPA', aliases: ['Acide eicosapentaénoïque', 'Oméga-3 marin'],
    emoji: '🐟', tagline: 'Oméga-3 anti-inflammatoire · dépression · cœur',
    simple: {
      what: 'L\'EPA (acide éicosapentaénoïque) est un acide gras oméga-3 à longue chaîne (C20:5n-3) présent dans les poissons gras et les algues marines (qui le produisent directement). Avec le DHA, c\'est la forme directement utilisable par l\'organisme — l\'ALA végétal est converti en EPA avec une efficacité très faible (< 5-10 %).',
      why: 'L\'EPA est la source des résolvines de série E et des protectines — des médiateurs lipidiques qui resolvent activement l\'inflammation (contraire des prostaglandines pro-inflammatoires issues des oméga-6). Il est aussi le plus efficace des oméga-3 contre la dépression.',
      sources: ['Maquereau', 'Saumon sauvage', 'Sardines', 'Hareng', 'Algues marines (huile)'],
    },
    expert: {
      mechanism: 'L\'EPA est substrat de la COX-1/2 → prostaglandines de série 3 (PGE3, anti-inflammatoires vs PGE2 oméga-6), de la 5-LOX → leucotriènes de série 5 (LTB5, moins chemotactiques que LTB4 oméga-6), et des SPMs (specialized pro-resolving mediators) : résolvines E1-E4, protectines, marésines. L\'EPA compétitionne directement avec l\'acide arachidonique (AA, oméga-6) pour la COX et la 5-LOX, déplaçant le profil éicosanoïde vers l\'anti-inflammation.',
      interactions: ['EPA + DHA sont synergiques (les deux sont dans la même capsule de poisson)', 'Le rapport oméga-6/oméga-3 de l\'alimentation doit être < 4:1 (occident : ~15:1) — l\'excès d\'LA et AA réduit la conversion et l\'efficacité des oméga-3', 'La vitamine E protège l\'EPA de l\'oxydation (lipides PUFA)', 'L\'EPA peut légèrement allonger le temps de saignement à très haute dose (> 3 g/j)'],
      clinicalNote: 'L\'essai REDUCE-IT (icosapentaénoïque 4 g/j vs placebo) : réduction de 25 % des événements cardiovasculaires majeurs chez des patients à risque élevé. L\'essai STRENGTH (oméga-3 mixte 4 g/j) n\'a pas reproduit ces résultats — suggérant un effet spécifique à l\'EPA pur.',
    },
    relatedIds: ['dha', 'ala', 'inflammation'],
  },

  {
    id: 'dha', category: 'bioactive', name: 'DHA', aliases: ['Acide docosahexaénoïque', 'Oméga-3 cérébral'],
    emoji: '🧠', tagline: 'Structure du cerveau · rétine · développement fœtal',
    simple: {
      what: 'Le DHA (acide docosahexaénoïque, C22:6n-3) est le composant lipidique majoritaire des membranes des neurones et de la rétine — il représente 97 % des oméga-3 cérébraux. Le cerveau humain contient ~60 g de DHA. Il est produit par les algues marines et concentré dans les poissons gras.',
      why: 'Indispensable au développement cérébral fœtal et postnatal (cerveau triplé de volume pendant les 3 premières années), à la fluidité des membranes synaptiques, à la transduction du signal visuel et à la neuroprotection contre la maladie d\'Alzheimer. La supplémentation en DHA est recommandée pendant la grossesse.',
      sources: ['Thon albacore', 'Saumon sauvage', 'Maquereau', 'Huile d\'algues (végétalien)', 'Huîtres'],
    },
    expert: {
      mechanism: 'Le DHA est converti en neuroprotectine D1 (NPD1) et marésines (MaR1, MaR2) : médiateurs de la résolution de l\'inflammation cérébrale. Dans les membranes synaptiques, le DHA augmente la fluidité et la déformabilité des radeaux lipidiques (lipid rafts), facilitant la signalisation des récepteurs couplés aux protéines G. Il active le récepteur nucléaire PPARγ (neuroprotection, insulinosensibilité) et RXR (rétinome, mémoire). Précurseur du DHA-synaptoïde (22-hydroxy-DHA) neuronal.',
      interactions: ['Synergique avec l\'EPA pour l\'anti-inflammation et la résolution', 'La choline est indispensable à son incorporation dans les phosphatidylcholines des membranes (PC → lyso-PC DHA → cerveau)', 'La vitamine D (VDR) régule positivement les gènes de synthèse DHA dans le cerveau', 'L\'AA (oméga-6) est l\'antagoniste fonctionnel du DHA dans les membranes'],
      clinicalNote: 'Les études sur la prévention de la maladie d\'Alzheimer par le DHA (MIDAS, PREADVISE) sont négatives sur les sujets déjà atteints, mais une étude génétique (APOE-ε4) montre une protection chez les non-porteurs. La DHA reste la supplémentation la mieux étayée en pré et post-natal.',
    },
    relatedIds: ['epa', 'ala', 'axe-intestin-cerveau'],
  },

  {
    id: 'ala', category: 'bioactive', name: 'ALA', aliases: ['Acide alpha-linolénique', 'Oméga-3 végétal'],
    emoji: '🌱', tagline: 'Oméga-3 végétal · précurseur EPA/DHA à faible rendement',
    simple: {
      what: 'L\'ALA (acide alpha-linolénique, C18:3n-3) est l\'acide gras oméga-3 de base, présent dans les huiles de lin, chanvre, noix et les graines de chia. Il est l\'unique oméga-3 véritablement "essentiel" — le corps ne peut pas le fabriquer. Mais sa conversion en EPA (~5-10 %) et DHA (< 1-3 %) est très inefficace.',
      why: 'Il réduit la compétition oméga-6/oméga-3 pour les enzymes désaturases, a un léger effet anti-inflammatoire direct, et contribue à la fluidité des membranes. Mais pour les effets neurologiques et cardiovasculaires des oméga-3, les sources marines (EPA, DHA) sont nettement supérieures.',
      sources: ['Huile de lin (première pression à froid)', 'Graines de chia', 'Noix', 'Graines de chanvre', 'Huile de colza'],
    },
    expert: {
      mechanism: 'L\'ALA est compétiteur direct de l\'acide linoléique (LA, oméga-6) pour les Δ6-désaturase et la Δ5-désaturase (FADS1/FADS2) et les élongases. La conversion ALA → EPA est limitée par la disponibilité de ces enzymes et par l\'excès de LA dans l\'alimentation occidentale (ratio LA/ALA ~20:1). Le polymorphisme FADS1/FADS2 rs174537 module fortement cette conversion (jusqu\'à 50 % de variation). La peroxydation de l\'ALA en solution est rapide (stockage à l\'abri de la lumière et à froid).',
      interactions: ['Un excès d\'acide linoléique (oméga-6, huiles de tournesol/soja) inhibe la conversion ALA → EPA/DHA', 'La vitamine B6, B7 (biotine), et le zinc sont cofacteurs des désaturases et élongases', 'L\'ALA oxydé est pro-inflammatoire — huile de lin à consommer fraîche et non chauffée', 'Synergie avec les sources directes d\'EPA/DHA pour le rapport optimal oméga-3/6'],
    },
    relatedIds: ['epa', 'dha', 'inflammation'],
  },

  {
    id: 'sulforaphane', category: 'bioactive', name: 'Sulforaphane', aliases: ['SFN', 'Glucoraphanine → sulforaphane'],
    emoji: '🥦', tagline: 'Active Nrf2 — le maître régulateur des défenses cellulaires',
    simple: {
      what: 'Le sulforaphane est un isothiocyanate produit quand les crucifères sont mâchés ou coupés : la myrosinase (enzyme libérée) convertit la glucoraphanine en sulforaphane. La cuisson détruit la myrosinase — pour maximiser la production, manger les crucifères légèrement cuits ou crus, ou ajouter des graines de moutarde moulues.',
      why: 'C\'est le bioactif végétal qui active Nrf2 de la façon la plus puissante parmi les composés alimentaires — déclenchant une cascade d\'enzymes de détoxification et d\'antioxydants qui durent 72h après une seule ingestion. Les pousses de brocoli contiennent 50-100× plus de glucoraphanine que le brocoli mature.',
      sources: ['Pousses de brocoli (champion)', 'Brocoli cru', 'Chou de Bruxelles', 'Roquette', 'Radis'],
    },
    expert: {
      mechanism: 'Le sulforaphane est un inducteur électrophile de phase II : il alkyle les résidus cystéine du répresseur KEAP1 → libération de Nrf2 → translocation nucléaire → liaison ARE (antioxidant response element) → induction de HO-1 (hème oxygénase), NQO1, GSH-S-transférases, UDP-glucuronyl-transférases, thiorédoxines. Ces enzymes durent 48-72h. Le sulforaphane inhibe aussi HDAC1/3 (épigénétique : déacétylation des histones → expression p21, p27) et NF-κB (anti-inflammatoire).',
      interactions: ['La myrosinase bactérienne du côlon peut convertir les glucosinolates non-hydrolysés → sulforaphane même après cuisson (microbiote-dépendant)', 'La moutarde moulue (myrosinase stable) ajoutée à des légumes cuits restaure 30-70 % de la production de SFN', 'Synergique avec l\'EGCG et la quercétine pour l\'activation de Nrf2'],
      clinicalNote: 'Essai clinique COSMOS-Nrf2 (600 µmol SFN/j, pousses de brocoli) : réduction de 20 % des biomarqueurs d\'inflammation (CRP, IL-6) sur 12 semaines. Essai pilote dans l\'autisme infantile : réduction des symptômes comportementaux sur 18 semaines (n=44, p<0.001).',
    },
    relatedIds: ['quercetine', 'egcg', 'stress-oxydatif'],
  },

  {
    id: 'anthocyanes', category: 'bioactive', name: 'Anthocyanes', aliases: ['Anthocyanins', 'Pigments bleus/violets/rouges'],
    emoji: '🫐', tagline: 'Pigments anti-âge des baies · mémoire · inflammation',
    simple: {
      what: 'Les anthocyanes sont les pigments responsables des couleurs rouge, violette et bleue des baies, fruits rouges et légumes colorés. Plus de 600 structures différentes existent dans la nature, toutes dérivées de la base flavyline. Leur biodisponibilité est faible (< 5 %) mais leurs métabolites coliques ont une activité biologique importante.',
      why: 'Ils protègent contre la neurodégénérescence (mémoire et cognition), améliorent la santé vasculaire, ont des effets antidiabétiques (inhibition des α-glucosidases intestinales) et réduisent les marqueurs d\'inflammation systémique. Les myrtilles sauvages sont les sources les plus riches.',
      sources: ['Myrtilles sauvages', 'Cassis', 'Mûres', 'Sureau noir', 'Chou rouge cuit'],
    },
    expert: {
      mechanism: 'Les anthocyanes inhibent NF-κB et la cyclo-oxygénase (anti-inflammatoire), activent Nrf2 (défenses antioxydantes), et inhibent les α-glucosidases intestinales (ralentissent l\'absorption du glucose). Dans le cerveau, les métabolites coliques des anthocyanes (acide protocatéchique, acide phénylacétique) traversent la BHE et modulent la plasticité synaptique via BDNF. Ils inhibent la fibrillogénèse de l\'amyloïde-β et de la synucléine α (Alzheimer, Parkinson).',
      interactions: ['La matrice alimentaire influence fortement la biodisponibilité (fruit entier > jus > extrait)', 'Le microbiote dégrade les anthocyanes en acides phénoliques actifs (activité synergique microbiote-hôte)', 'La vitamine C stabilise les anthocyanes (formes d\'anthocyanidines thermostables)', 'Synergie avec les résveratrols et les flavonols pour la neuroprotection'],
      clinicalNote: 'L\'essai MIND (dietary pattern) et les études d\'intervention avec myrtilles (35 g/j de poudre lyophilisée pendant 12 semaines) montrent une amélioration de la mémoire épisodique de 5-15 % chez les sujets âgés (Krikorian 2010).',
    },
    relatedIds: ['quercetine', 'resveratrol', 'stress-oxydatif'],
  },

  {
    id: 'inuline-fos', category: 'bioactive', name: 'Inuline & FOS', aliases: ['Fructo-oligosaccharides', 'Prébiotiques', 'Fructanes'],
    emoji: '🧅', tagline: 'Prébiotiques · nourriture du microbiote · mais FODMAP élevé',
    simple: {
      what: 'L\'inuline et les fructo-oligosaccharides (FOS) sont des fructanes — des chaînes de molécules de fructose — présents naturellement dans de nombreux légumes. Ce sont les prébiotiques les plus étudiés : ils nourrissent sélectivement les bifidobactéries et certains lactobacilles du microbiote.',
      why: 'Ils augmentent la diversité du microbiote, stimulent la production d\'acides gras à courte chaîne (AGCC : butyrate, propionate, acétate) protecteurs de la muqueuse intestinale, et ont des effets sur la glycémie, les graisses sanguines et l\'immunité. MAIS — ils sont FODMAP et peuvent déclencher des symptômes digestifs chez les personnes sensibles.',
      sources: ['Racine de chicorée', 'Topinambour', 'Ail cru', 'Oignon cru', 'Salsifis'],
      deficiency: 'Pas de carence spécifique, mais un apport insuffisant en prébiotiques réduit la diversité du microbiote (dysbiose).',
    },
    expert: {
      mechanism: 'Les bifidobactéries possèdent les inulinases nécessaires pour fermenter les fructanes → acide lactique + AGCC. Le butyrate est l\'énergie principale des colonocytes (épithélium colique) et inhibe les HDAC → effet anti-cancéreux et anti-inflammatoire colique. Le propionate rejoint le foie → réduction de la lipogenèse de novo. L\'acétate est exporté vers les muscles et le cerveau. Les fructanes augmentent aussi l\'absorption du calcium et du magnésium (acidification colique → solubilisation).',
      interactions: ['Antagonisme FODMAP : chez les patients IBS/SII, les fructanes déclenchent fermentation + gaz + douleurs', 'La cuisson réduit modérément la teneur en fructanes (mais ne les élimine pas)', 'Interaction positive avec le calcium : augmentent son absorption colique de 8-20 %', 'L\'inuline à hautes doses (> 15 g/j) peut entraîner des ballonnements chez les personnes sans sensibilité préalable'],
      fodmapNote: 'FODMAP ÉLEVÉ : inuline et FOS sont strictement limités en phase d\'élimination. En phase de réintroduction, tester avec de petites quantités. Les suppléments d\'inuline (chicorée) sont particulièrement problématiques.',
      clinicalNote: 'Méta-analyse 2021 (22 essais) : la supplémentation en inuline/FOS (8-12 g/j) augmente les bifidobactéries de ~1 log UFC/g, réduit le LDL-C de 0.2 mmol/L et améliore la régularité intestinale dans les populations sans IBS.',
    },
    relatedIds: ['microbiote', 'fibres-alimentaires', 'fodmap-mecanisme'],
  },

  {
    id: 'phytosterols', category: 'bioactive', name: 'Phytostérols', aliases: ['Beta-sitostérol', 'Campestérol', 'Stigmastérol'],
    emoji: '🌿', tagline: 'Réduisent le cholestérol LDL de 8-10 % sans médicament',
    simple: {
      what: 'Les phytostérols sont des stérols d\'origine végétale, structurellement très proches du cholestérol (une seule différence sur la chaîne latérale). Le bêta-sitostérol, le campestérol et le stigmastérol sont les plus communs. Les margarines fonctionnelles (Proactiv®, etc.) en sont enrichies à 2-3 g par portion.',
      why: 'Ils réduisent l\'absorption intestinale du cholestérol de 30-50 % en entrant en compétition directe avec lui pour les micelles et les transporteurs intestinaux (NPC1L1). L\'effet sur le LDL-C est de 8-10 % avec 2 g/j — comparable à une faible dose de statine.',
      sources: ['Huile de son de riz', 'Graines de sésame', 'Germe de blé', 'Noix du Brésil', 'Margarine enrichie'],
    },
    expert: {
      mechanism: 'Les phytostérols s\'incorporent préférentiellement aux micelles mixtes (sels biliaires + lipides) dans la lumière intestinale, déplaçant le cholestérol. Au niveau des entérocytes, ils compètent avec le cholestérol pour NPC1L1 (Niemann-Pick C1-Like 1, cible de l\'ézétimibe). L\'excès de phytostérols est activement sécrété dans la lumière par ABCG5/ABCG8. La sitostérolémie (ABCG5/ABCG8 muté) est une maladie rare d\'accumulation de phytostérols à risque cardiovasculaire paradoxalement élevé.',
      interactions: ['Synergie avec les statines : ajout de 2 g/j de phytostérols à une statine réduit le LDL de 10 % supplémentaire', 'Peuvent réduire légèrement l\'absorption des caroténoïdes (β-carotène, lycopène) — prendre avec des aliments riches en caroténoïdes', 'L\'ézétimibe et les phytostérols agissent sur la même cible (NPC1L1) — pas de synergie attendue'],
      clinicalNote: 'Allégation santé autorisée EFSA (2008) et FDA : 2 g/j de phytostérols réduisent le cholestérol LDL de 7-10 % dans le cadre d\'une alimentation saine. Aucune preuve de réduction des événements cardiovasculaires dans les essais d\'intervention.',
    },
    relatedIds: ['beta-glucanes', 'epa'],
  },

  {
    id: 'coq10', category: 'bioactive', name: 'Coenzyme Q10', aliases: ['CoQ10', 'Ubiquinol', 'Ubiquinone'],
    emoji: '⚡', tagline: 'Électron-navette mitochondriale · antioxydant membranaire',
    simple: {
      what: 'Le CoQ10 (ubiquinone/ubiquinol) est une molécule liposoluble synthétisée par toutes les cellules de l\'organisme. Sa synthèse décline naturellement après 40 ans et est réduite par les statines (médicaments anti-cholestérol) — d\'où la fatigue musculaire parfois associée à ces traitements.',
      why: 'Il est indispensable au transfert d\'électrons dans la chaîne respiratoire mitochondriale (complexes I, II → III) — il est littéralement l\'électron-navette qui alimente la production d\'ATP. Il protège aussi les membranes lipidiques contre la peroxydation.',
      sources: ['Cœur de bœuf', 'Sardines', 'Maquereau', 'Bœuf haché', 'Cacahuètes'],
    },
    expert: {
      mechanism: 'Le CoQ10 sous forme ubiquinone (Q, oxydée) accepte 2e⁻ du complexe I (NADH déshydrogénase) et du complexe II (succinate DH) → ubiquinol (QH₂, réduite) → cède ses e⁻ au complexe III (cytochrome bc₁). Ce cycle Q-cycle pompe des protons à travers la membrane interne → gradient de H⁺ → ATP synthase (complexe V). L\'ubiquinol est aussi un antioxydant membranaire : régénère la vitamine E, neutralise les radicaux lipidiques (ROO·).',
      interactions: ['Les statines inhibent la HMG-CoA réductase → réduction de 25-50 % du CoQ10 musculaire (voie mévalonate partagée)', 'La vitamine E est synergique (cycle redox membranaire)', 'La forme ubiquinol (réduite) est mieux absorbée que l\'ubiquinone (oxydée) chez les sujets > 50 ans (absorption 3× supérieure)', 'Les bêta-bloquants peuvent interférer avec le métabolisme du CoQ10'],
      clinicalNote: 'Méta-analyse 2013 : CoQ10 (200-300 mg/j) réduit la mortalité cardiovasculaire de 38 % et améliore la fraction d\'éjection dans l\'insuffisance cardiaque (essai Q-SYMBIO). Bénéfice sur les myalgies aux statines inconsistant entre les études (probablement effet placebo partiel).',
    },
    relatedIds: ['vit-e', 'magnesium', 'stress-oxydatif'],
  },

  {
    id: 'acide-lipoique', category: 'bioactive', name: 'Acide α-lipoïque', aliases: ['ALA', 'Acide alpha-lipoïque', 'Acide thioctique'],
    emoji: '🔄', tagline: 'Antioxydant universel · régénère tous les antioxydants',
    simple: {
      what: 'L\'acide α-lipoïque (ALA) est un antioxydant unique — à la fois hydrosoluble et liposoluble, il agit dans tous les compartiments cellulaires. Il est synthesé en petites quantités dans les mitochondries et est cofacteur de deux complexes enzymatiques du cycle de Krebs.',
      why: 'Il régénère directement la vitamine C, la vitamine E, le CoQ10 et le glutathion oxydés — d\'où son surnom d\'"antioxydant des antioxydants". Sa forme réduite (DHLA) est l\'un des réducteurs biologiques les plus puissants. Très étudié dans les neuropathies diabétiques.',
      sources: ['Rognon de bœuf', 'Foie de bœuf', 'Cœur de bœuf', 'Épinards', 'Brocoli (traces)'],
    },
    expert: {
      mechanism: 'L\'ALA est cofacteur (sous forme acide dihydrolipoïque, DHLA) du complexe pyruvate déshydrogénase (PDH) et de l\'α-cétoglutarate déshydrogénase (α-KGDH). En dehors de ce rôle enzymatique, l\'ALA/DHLA est un couple redox (E°\' = -0.32 V) qui régénère le glutathion oxydé (GSSG → GSH), la vitamine C (DHA → ascorbate), la vitamine E (tocophéryl radical → tocophérol) et le CoQ10. Il active Nrf2 et induit HO-1. L\'ALA est chélateur des ions Cu²⁺ et Mn²⁺.',
      interactions: ['Régénère vitamine C, vitamine E, glutathion et CoQ10 (réseau antioxydant complet)', 'L\'ALA peut chélater le zinc et le cuivre à haute dose — espacer de 2h avec les suppléments de minéraux', 'Légère réduction de la glycémie via activation d\'AMPK — surveillance des antidiabétiques', 'La forme R-ALA est biologiquement active (endogène) vs racémique RS-ALA (commerciale)'],
      clinicalNote: 'Quatre méta-analyses concluent à une réduction significative de la douleur neuropathique diabétique avec 600 mg/j d\'ALA IV ou oral pendant 3 semaines. La forme R-ALA est 2-4× plus biodisponible que RS-ALA et plus efficace à dose équivalente.',
    },
    relatedIds: ['vit-c', 'vit-e', 'coq10', 'glutamine'],
  },

  {
    id: 'capsaicine', category: 'bioactive', name: 'Capsaïcine', aliases: ['Capsaicin', 'Vanilloïde piment'],
    emoji: '🌶️', tagline: 'Active TRPV1 · thermogenèse · analgésique topique',
    simple: {
      what: 'La capsaïcine est l\'alcaloïde responsable de la sensation de brûlure du piment. Elle active les récepteurs TRPV1 (Transient Receptor Potential Vanilloid 1) — les mêmes que ceux qui détectent la chaleur physique, ce qui explique pourquoi le piment "brûle" sans véritablement chauffer.',
      why: 'Elle augmente la dépense énergétique (thermogenèse de ~50-100 kcal/j), réduit l\'appétit, a un puissant effet analgésique topique (contre-irritant qui épuise la substance P locale), et présente des effets cardiovasculaires protecteurs dans les populations d\'Asie du Sud-Est.',
      sources: ['Piment rouge séché', 'Piment de Cayenne', 'Tabasco', 'Piment habanero', 'Poivron rouge (traces)'],
    },
    expert: {
      mechanism: 'La capsaïcine se lie à TRPV1 (récepteur ionique Ca²⁺/Na⁺) des nocicepteurs → dépolarisation → libération de substance P → douleur initiale (brûlure) → épuisement progressif de la substance P → analgésie durable. L\'activation de TRPV1 sur les cellules adipeuses brunes stimule l\'UCP1 (thermogenine) → découplage mitochondrial → chaleur. Elle active aussi AMPK dans le muscle (→ β-oxydation). L\'exposition chronique (populations asiatiques) provoque désensibilisation de TRPV1.',
      interactions: ['La piperine (poivre noir) a des propriétés TRPV1 similaires et synergiques', 'L\'acide ascorbique (vit C) stabilise la capsaïcine dans les préparations', 'Attention avec les IECA (médicaments HTA) : la capsaïcine peut induire une toux sèche par le même mécanisme (substance P)'],
      clinicalNote: 'Le patch de capsaïcine 8 % (Qutenza) est approuvé par l\'EMA et la FDA pour la neuropathie périphérique post-zostérienne. Une seule application soulage pendant 12 semaines en épuisant la substance P locale.',
    },
    relatedIds: ['stress-oxydatif', 'inflammation'],
  },

  {
    id: 'berberine', category: 'bioactive', name: 'Berbérine', aliases: ['Berberine', 'Alcaloïde épine-vinette'],
    emoji: '💛', tagline: 'Activateur puissant d\'AMPK · antidiabétique naturel',
    simple: {
      what: 'La berbérine est un alcaloïde isoquinoléinique extrait de plusieurs plantes (épine-vinette, coptide, berbéris). Sa couleur jaune vive est utilisée comme teinture naturelle depuis des siècles. C\'est l\'un des composés végétaux les plus étudiés en médecine moderne pour ses effets métaboliques.',
      why: 'Elle active AMPK (kinase senseur de l\'énergie) avec une efficacité comparable à la metformine, ce qui se traduit par une réduction de la glycémie, des triglycérides et du LDL-C. Des méta-analyses la comparent favorablement aux antidiabétiques oraux sur l\'HbA1c.',
      sources: ['Épine-vinette (Berberis vulgaris)', 'Coptide chinois', 'Hydraste du Canada', 'Supplément uniquement (pas dans les aliments courants)'],
    },
    expert: {
      mechanism: 'La berbérine inhibe la NADH oxydoréductase mitochondriale (complexe I) → rapport AMP/ATP ↑ → activation d\'AMPK (par phosphorylation Thr172) → phosphorylation d\'ACC (inhibition lipogenèse) → activation de CPT1 (β-oxydation) → inhibition de mTOR → autophagie. Elle inhibe la PCSK9 (réduction du LDL-C par augmentation des récepteurs LDL hépatiques). Elle active aussi GLP-1 (voie intestinale) et modifie le microbiote (↑ Bifidobacterium, ↓ Firmicutes).',
      interactions: ['Synergie avec la metformine (même voie AMPK) — potentialisation des effets hypoglycémiants : risque d\'hypoglycémie', 'Inhibiteur de CYP3A4, CYP2D6 et P-gp → interactions médicamenteuses multiples (cyclosporine, digoxine)', 'Synergie avec les statines pour la réduction du LDL-C (mécanismes complémentaires)', 'Réduit la biodisponibilité de certains antibiotiques fluoroquinolones'],
      clinicalNote: 'Méta-analyse 2015 (27 essais, 2 569 patients) : berbérine 0,9-1,5 g/j réduit l\'HbA1c de -0,71 % vs placebo, avec une efficacité comparable à la metformine et aux thiazolidinediones sur 12 semaines. L\'EFSA n\'a pas encore accordé d\'allégation santé formelle.',
    },
    relatedIds: ['beta-glucanes', 'insulinoresistance', 'index-glycemique'],
  },

  {
    id: 'probiotiques', category: 'bioactive', name: 'Probiotiques', aliases: ['Lactobacillus', 'Bifidobacterium', 'Ferments lactiques'],
    emoji: '🦠', tagline: 'Bactéries vivantes qui renforcent le microbiote intestinal',
    simple: {
      what: 'Les probiotiques sont des micro-organismes vivants qui, ingérés en quantité suffisante, confèrent un bénéfice de santé à l\'hôte. Les souches les plus étudiées appartiennent aux genres Lactobacillus (maintenant reclassifiés : Limosilactobacillus, Lactiplantibacillus...) et Bifidobacterium.',
      why: 'Ils renforcent la barrière intestinale, modulent l\'immunité locale et systémique, produisent des vitamines (K2, B12), des neurotransmetteurs (GABA, sérotonine) et des AGCC. Leurs effets sont souche-spécifiques — il n\'existe pas de "probiotique universel".',
      sources: ['Yaourt nature vivant', 'Kéfir de lait', 'Choucroute crue (non stérilisée)', 'Kimchi', 'Miso (non pasteurisé)'],
    },
    expert: {
      mechanism: 'Les mécanismes varient selon la souche : compétition pour les sites d\'adhésion (colonisation protectrice), production de bactériocines (lantibiotiques antibactériens), stimulation de la sécrétion d\'IgA sécrétoire, activation des cellules dendritiques (tolérance immunitaire), renforcement des jonctions serrées (ZO-1, claudine-3, occludine → ↑ résistance transépithéliale), production de SCFA (butyrate → énergie colonocytes + anti-inflammatoire). Certaines souches traversent la BHE via le nerf vague (axe intestin-cerveau).',
      interactions: ['Synergie avec les prébiotiques (inuline, FOS) → symbiotiques', 'La réfrigération est indispensable pour maintenir la viabilité (minimum 10⁹ UFC/dose)', 'Les antibiotiques détruisent les probiotiques — espacer de 2h minimum', 'Contre-indiqués chez les immunodéprimés sévères (risque de translocation bactérienne)'],
      clinicalNote: 'Cochrane 2020 : Lactobacillus rhamnosus GG (LGG) réduit la diarrhée associée aux antibiotiques de ~40 %. La dépression et l\'anxiété légère à modérée sont influencées par les psychobiotiques (L. helveticus R0052 + B. longum R0175) avec des effets modestes mais cohérents sur 30 jours (Messaoudi 2011).',
    },
    relatedIds: ['microbiote', 'permeabilite-intestinale', 'axe-intestin-cerveau'],
  },

  {
    id: 'astaxanthine', category: 'bioactive', name: 'Astaxanthine', aliases: ['Astaxanthin', 'Caroténoïde marin'],
    emoji: '🦞', tagline: 'Caroténoïde marin · antioxydant 6 000× plus puissant que la vitamine C',
    simple: {
      what: 'L\'astaxanthine est le caroténoïde rouge-orange produit par l\'algue Haematococcus pluvialis en réponse au stress — elle donne leur couleur aux flamants roses, saumons et crevettes. C\'est l\'un des antioxydants biologiques les plus puissants jamais identifiés.',
      why: 'Son pouvoir antioxydant est 6 000× celui de la vitamine C, 800× celui de la CoQ10 et 550× celui de la vitamine E sur certaines mesures. Elle traverse la barrière hémato-encéphalique et la barrière hémato-rétinienne — protégeant le cerveau et les yeux — contrairement à la plupart des caroténoïdes.',
      sources: ['Saumon sauvage (Pacifique)', 'Crevettes sauvages', 'Crabe', 'Homard', 'Algue H. pluvialis (supplément)'],
    },
    expert: {
      mechanism: 'L\'astaxanthine est un caroténoïde de type céto-caroténoïde (groupements céto et hydroxy sur les cycles β-ionone) lui conférant une capacité unique à "traverser" de part en part la bicouche phospholipidique — stabilisant la membrane entière (vs β-carotène, incorporé seulement dans la région centrale). Sa constante de désactivation de l\'¹O₂ est k₂ > 2×10¹⁰ M⁻¹s⁻¹. Elle inhibe NF-κB (anti-inflammatoire), active Nrf2 (antioxydant inductible), et réduit les marqueurs d\'oxydation du LDL.',
      interactions: ['Les lipides alimentaires sont indispensables à son absorption (liposoluble)', 'Synergique avec la vitamine E et la lutéine pour la protection oculaire', 'Pas d\'interférence avec la conversion du β-carotène en vitamine A (ne la partage pas)', 'La forme naturelle (3S,3\'S) est biologiquement plus active que la forme synthétique racémique'],
      clinicalNote: 'Études cliniques (4-12 mg/j, 12 semaines) : réduction des marqueurs d\'inflammation (CRP) de 20 %, amélioration de la fluidité membranaire des érythrocytes, réduction des douleurs musculaires post-exercice. FDA GRAS (Generally Recognized As Safe) pour l\'astaxanthine naturelle de H. pluvialis.',
    },
    relatedIds: ['luteine', 'lycopene', 'vit-e', 'stress-oxydatif'],
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  CONCEPTS DIGESTIFS & MÉTABOLIQUES (16)                  ║
  // ╚══════════════════════════════════════════════════════════╝

  {
    id: 'microbiote', category: 'concept', name: 'Microbiote intestinal', aliases: ['Microbiome', 'Flore intestinale'],
    emoji: '🌍', tagline: '38 000 milliards de bactéries · 2ème cerveau de l\'immunité',
    simple: {
      what: 'Le microbiote intestinal humain est l\'ensemble des micro-organismes (bactéries, archées, virus, champignons) colonisant le tube digestif — principalement le côlon. Il représente 38 000 milliards de cellules (comparable au nombre de cellules humaines) et 1,5 kg de masse microbienne. Chaque humain héberge ~160 espèces bactériennes différentes parmi les 1 000 répertoriées.',
      why: 'Il forme 70 % du système immunitaire, produit des vitamines (K2, B12, B8), convertit les fibres alimentaires en acides gras à courte chaîne (AGCC — énergie des colonocytes, anti-inflammatoire), régule l\'humeur via l\'axe intestin-cerveau et conditionne le poids corporel, la glycémie et même certains comportements.',
      sources: ['Fermentés vivants (kéfir, choucroute, kimchi)', 'Fibres prébiotiques (poireaux, ail, avoine)', 'Végétaux diversifiés (objectif : 30 variétés/semaine)'],
    },
    expert: {
      mechanism: 'Le microbiote est organisé en un continuum fonctionnel : Bacteroidetes (Bacteroides, Prevotella — dégradation des polysaccharides complexes → AGCC) et Firmicutes (Clostridia, Ruminococcus — fermentation → butyrate) dominent. Le butyrate est le carburant des colonocytes (70 % de l\'énergie), inhibe les HDAC des cellules épithéliales (différenciation colonocytaire), et active PPARγ (anti-inflammatoire). Le propionate rejoint le foie (néoglucogenèse, saturation). L\'acétate est exporté vers les muscles. Le microbiote régule aussi la production de sérotonine intestinale (90 % du pool via les cellules entérochromaffines) et de GABA (par certains Lactobacilles).',
      interactions: ['Sensible aux antibiotiques, au stress, à l\'alimentation, aux polyphénols et aux émulsifiants (carraghénane, CMC)', 'La diversité alimentaire (30+ végétaux/semaine) est le meilleur prédicteur de la diversité microbienne', 'L\'axe microbiote-intestin-cerveau via le nerf vague, l\'axe HPA et les cytokines immunitaires', 'Le transit intestinal doit être < 24-48h pour éviter la fermentation prolongée des résidus alimentaires'],
      fodmapNote: 'Les FODMAP fermentent rapidement → production excessive de gaz dans les 2-4h. Le protocole Low FODMAP modifie transitoirement la composition du microbiote — les prébiotiques tolérants (pectines cuites, beta-glucanes) aident à le préserver.',
      clinicalNote: 'Le gradient alpha-diversité microbienne (richesse des espèces) est inversement corrélé au risque d\'obésité, diabète type 2, MICI, dépression et maladie d\'Alzheimer. La transplantation fécale (FMT) est approuvée pour les infections récurrentes à C. difficile.',
    },
    relatedIds: ['probiotiques', 'inuline-fos', 'fibres-alimentaires', 'axe-intestin-cerveau', 'permeabilite-intestinale'],
  },

  {
    id: 'fodmap-mecanisme', category: 'concept', name: 'Mécanisme FODMAP', aliases: ['FODMAP', 'Fermentescibles', 'IBS', 'SII'],
    emoji: '⚗️', tagline: 'Sucres fermentescibles · pression osmotique · ballonnements',
    simple: {
      what: 'FODMAP = Fermentable Oligosaccharides, Disaccharides, Monosaccharides and Polyols. Ce sont des glucides à courte chaîne mal absorbés dans l\'intestin grêle qui arrivent dans le côlon où ils sont rapidement fermentés par les bactéries. L\'Université Monash (Australie) a cartographié leur teneur dans plus de 500 aliments.',
      why: 'Chez les personnes avec un intestin irritable (SII) ou un syndrome de l\'intestin perméable, cette fermentation rapide produit un excès de gaz (H₂, CH₄, CO₂) et attire de l\'eau dans l\'intestin par effet osmotique, causant ballonnements, douleurs abdominales, diarrhées ou constipation.',
      sources: ['Fruits à grains (pomme, poire, mangue — fructose)', 'Légumineuses (oligosaccharides)', 'Lait (lactose)', 'Blé (fructanes)', 'Champignons (mannitol)'],
    },
    expert: {
      mechanism: 'Mécanisme en 2 temps : (1) Dans l\'intestin grêle — les FODMAP sont osmotiquement actifs (pression osmotique ↑ → afflux d\'eau dans la lumière → distension → urgences/douleurs immédiates). (2) Dans le côlon — les FODMAP arrivent intacts et sont fermentés en < 4h par les Bifidobacterium, Bacteroides et Ruminococcus → production massive de H₂, CH₄, CO₂ → distension colique → activation des mécanorécepteurs de la paroi → douleurs viscérales (sensibilisation centrale souvent associée). Les polyols (sorbitol, mannitol) ont une absorption passive très faible (< 5-10 %).',
      interactions: ['La perméabilité intestinale amplifie les symptômes FODMAP (LPS bactériens entrent en circulation)', 'Le stress psychologique augmente la sensibilité viscérale aux FODMAP (axe intestin-cerveau)', 'Les SIBO (small intestinal bacterial overgrowth) fermentent les FODMAP dès l\'intestin grêle → symptômes plus précoces', 'Les enzymes (lactase, alpha-galactosidase) réduisent les symptômes du lactose et des oligosaccharides respectivement'],
      fodmapNote: 'Le protocole d\'élimination Monash dure 4-6 semaines (éviction stricte), suivi d\'une réintroduction systématique groupe par groupe pour identifier la tolérance individuelle. 75 % des patients SII répondent au régime Low FODMAP.',
    },
    relatedIds: ['microbiote', 'permeabilite-intestinale', 'enzymes-digestives', 'inflammation'],
  },

  {
    id: 'permeabilite-intestinale', category: 'concept', name: 'Perméabilité intestinale', aliases: ['Leaky gut', 'Intestin perméable', 'Barrière intestinale'],
    emoji: '🧱', tagline: 'Quand la barrière intestinale laisse passer ce qu\'elle ne devrait pas',
    simple: {
      what: 'La barrière intestinale est une monocouche de cellules épithéliales reliées par des jonctions serrées (tight junctions). Elle laisse passer les nutriments et bloque les bactéries, toxines et protéines alimentaires partiellement digérées. La perméabilité intestinale augmentée (leaky gut) correspond à une altération de ces jonctions.',
      why: 'Quand la barrière est compromise, des fragments bactériens (LPS, lipopolysaccharides), des protéines alimentaires non digérées et des métabolites toxiques entrent dans la circulation systémique, déclenchant une inflammation chronique de bas grade. Ce processus est lié au SII, aux maladies auto-immunes, à la stéatose hépatique et à la dépression.',
      sources: ['Fibres (nourrissent les bactéries qui renforcent la barrière)', 'Glutamine (énergie des entérocytes)', 'Zinc (maturation des jonctions serrées)', 'Butyrate (fermentation des fibres)'],
      deficiency: 'Augmentation de la zonuline (biomarqueur sanguin), LPS plasmatique élevé, infections récurrentes, allergies alimentaires multiples.',
    },
    expert: {
      mechanism: 'Les jonctions serrées (ZO-1, claudine-3/4, occludine, tricelluline) forment une barrière paracellulaire. La zonuline (préhaptoglobine 2, régulée par le gluten via CXCR3 et par certaines bactéries) ouvre transitoirement les jonctions serrées → ↑ perméabilité paracellulaire. Les LPS bactériens qui franchissent la barrière se lient à TLR4 sur les macrophages → NF-κB → production de TNF-α, IL-6, IL-1β (inflammation systémique chronique). La glutamine (énergie préférentielle des entérocytes), le butyrate (HDAC inhibiteur → expression des claudines), et le zinc (dimérisation de ZO-1) renforcent les jonctions.',
      interactions: ['Le gluten (en excès) active la signalisation zonuline même chez les non-cœliaques', 'Les AINS (ibuprofène) altèrent la barrière intestinale (inhibition des prostaglandines protectrices PGE2)', 'L\'alcool est un puissant perméabilisateur via l\'acétaldéhyde intestinal', 'Le stress aigu augmente le cortisol qui affaiblit les jonctions serrées'],
      fodmapNote: 'Une perméabilité intestinale accrue potentialise les symptômes FODMAP : les mêmes quantités d\'aliments déclenchent des symptômes plus intenses chez les personnes avec une barrière fragilisée.',
    },
    relatedIds: ['microbiote', 'glutamine', 'fodmap-mecanisme', 'inflammation'],
  },

  {
    id: 'inflammation', category: 'concept', name: 'Inflammation chronique', aliases: ['Inflammation de bas grade', 'Neuroinflammation', 'Inflammaging'],
    emoji: '🔥', tagline: 'L\'inflammation silencieuse à la racine des maladies chroniques',
    simple: {
      what: 'L\'inflammation aiguë est une réponse protectrice nécessaire (guérison des blessures, défense contre les infections). L\'inflammation chronique de bas grade est différente : silencieuse, persistante, sans infection à traiter, elle "cuit à feu doux" les tissus pendant des années. C\'est le dénominateur commun du diabète, de l\'athérosclérose, de la dépression, du cancer et des maladies auto-immunes.',
      why: 'L\'alimentation moderne (sucres raffinés, acides gras trans, excès d\'oméga-6) est pro-inflammatoire. À l\'inverse, le régime méditerranéen, riche en polyphénols, oméga-3, fibres et antioxydants, réduit les biomarqueurs inflammatoires (CRP, IL-6, TNF-α) de 20-40 %.',
      sources: ['Anti-inflammatoires : poissons gras, huile d\'olive, baies, curcuma, gingembre, légumes crucifères', 'Pro-inflammatoires à limiter : huiles végétales riches en oméga-6, sucres raffinés, viandes transformées'],
    },
    expert: {
      mechanism: 'La voie centrale : NF-κB (nuclear factor κ-light-chain-enhancer of activated B cells) est le maître régulateur pro-inflammatoire. Activé par : les LPS (TLR4), les acides gras saturés (TLR2/4), l\'hyperglycémie (AGE-RAGE), les cytokines (IL-1β, TNF-α), et le stress oxydatif. NF-κB induit COX-2 (prostaglandines PGE2), iNOS (NO en excès), IL-6, TNF-α, VCAM-1. L\'"inflammaging" (inflammation liée au vieillissement) est associé à l\'accumulation de cellules sénescentes (SASP) qui libèrent chroniquement des cytokines.',
      interactions: ['Les EPA/DHA génèrent des résolvines/protectines qui actuvent la résolution (SPMs)', 'La curcumine, quercétine, EGCG, sulforaphane inhibent tous NF-κB par des mécanismes différents', 'Le cortisol (stress chronique) est anti-inflammatoire aigu mais pro-inflammatoire chronique (épuisement de l\'axe HPA)', 'Le microbiote module l\'inflammation via les LPS (dysbiose → endotoxémie métabolique)'],
    },
    relatedIds: ['epa', 'curcumine', 'sulforaphane', 'quercetine', 'microbiote', 'stress-oxydatif'],
  },

  {
    id: 'index-glycemique', category: 'concept', name: 'Index glycémique & Charge glycémique', aliases: ['IG', 'CG', 'Glycémie postprandiale'],
    emoji: '📈', tagline: 'Mesure la vitesse à laquelle les glucides élèvent la glycémie',
    simple: {
      what: 'L\'index glycémique (IG) mesure la vitesse à laquelle 50 g de glucides d\'un aliment élèvent la glycémie, relativement au glucose pur (IG=100). La charge glycémique (CG = IG × quantité de glucides / 100) est plus pertinente car elle tient compte de la portion réelle.',
      why: 'Les repas à IG/CG élevés provoquent des pics de glycémie suivis de "crashs" (hypoglycémie réactionnelle) : fatigue, fringales, difficulté de concentration. À long terme, les pics répétés fatigueront le pancréas et contribuent à la résistance à l\'insuline. Le riz basmati (IG 50) vs riz blanc rond (IG 72) — même aliment, comportement différent.',
      sources: ['Bas IG : légumineuses, orge, pâtes al dente, patate douce', 'Modéré : riz basmati, quinoa, flocons d\'avoine', 'Élevé : pain blanc, riz blanc cuit/refroidi est mieux (amidon résistant)'],
    },
    expert: {
      mechanism: 'Après ingestion de glucides, l\'amylase salivaire puis pancréatique clive l\'amidon → di- et oligosaccharides. Les disaccharidases (sucrase, maltase, lactase) de la bordure en brosse libèrent les monosaccharides. Le SGLT1 (sodium-glucose cotransporter) absorbe le glucose → hyperglycémie → sécrétion d\'insuline (cellules β pancréatiques). L\'index glycémique est modulé par : la teneur en fibres solubles (↓ absorption), la structure physique (grains entiers vs broyés), la cuisson (gélatinisation de l\'amidon ↑ absorption), le refroidissement (amidon résistant type 3), et les protéines/lipides co-ingérés.',
      interactions: ['Les lipides et protéines co-ingérés avec un glucide réduisent son IG (retardent la vidange gastrique)', 'Le vinaigre (acide acétique) réduit l\'IG d\'un repas de 20-35 % (inhibition des amylases)', 'La résistance à l\'insuline (obésité, sédentarité) amplifie les effets négatifs des IG élevés', 'Le microbiote module la réponse glycémique individuelle — deux personnes répondent différemment au même aliment (Zeevi 2015)'],
    },
    relatedIds: ['insulinoresistance', 'fibres-alimentaires', 'beta-glucanes', 'chrome'],
  },

  {
    id: 'insulinoresistance', category: 'concept', name: 'Insulinorésistance', aliases: ['Résistance à l\'insuline', 'Prédiabète'],
    emoji: '🔑', tagline: 'Les cellules n\'entendent plus le signal de l\'insuline',
    simple: {
      what: 'L\'insulinorésistance (IR) correspond à une réduction de la sensibilité des cellules à l\'insuline — la "clé" hormonale qui permet au glucose d\'entrer dans les cellules. Pour compenser, le pancréas sécrète plus d\'insuline, jusqu\'à l\'épuisement des cellules β. C\'est l\'état précurseur du diabète de type 2 et un composant clé du syndrome métabolique.',
      why: 'Touchant ~35 % des adultes dans les pays occidentaux (souvent sans le savoir), l\'IR est silencieuse jusqu\'aux complications. Elle s\'accompagne de dépôts de graisses viscérales, d\'une inflammation chronique et d\'un risque accru de maladies cardiovasculaires, de NASH et de syndrome des ovaires polykystiques (SOPK).',
      sources: ['Améliorent : activité physique, jeûne intermittent, magnésium, oméga-3, EGCG, berbérine, cannelle', 'Aggravent : sucres raffinés, sédentarité, stress chronique, alcool, manque de sommeil'],
    },
    expert: {
      mechanism: 'La séquence : acides gras libres + diacylglycérides intracellulaires activent PKCθ → phosphorylation inhibitrice de l\'IRS-1 (Ser307) → blocage de la cascade PI3K/Akt → GLUT4 ne se transloque plus → glucose n\'entre plus dans le myocyte/adipocyte. Parallèlement, l\'inflammasome NLRP3 (activé par les acides gras saturés et les céramides) produit de l\'IL-1β → inhibition de la signalisation insulinique. La lipotoxicité hépatique (accumulation d\'acyl-CoA) inhibe l\'IRS-2 hépatique → néoglucogenèse non supprimée → hyperglycémie à jeun.',
      interactions: ['L\'adipokine adiponectine (sécrétée par le tissu adipeux sain) améliore la sensibilité à l\'insuline via AMPK', 'La leptine en excès (obésité) crée une résistance à la leptine qui aggrave l\'IR', 'L\'exercice physique est le traitement le plus efficace : contraction musculaire → translocation GLUT4 indépendante de l\'insuline', 'Le sommeil < 7h augmente la cortisol et les acides gras libres → aggrave l\'IR en 3 jours'],
    },
    relatedIds: ['index-glycemique', 'inflammation', 'magnesium', 'berberine', 'microbiote'],
  },

  {
    id: 'axe-intestin-cerveau', category: 'concept', name: 'Axe intestin-cerveau', aliases: ['Gut-brain axis', 'Axe microbiote-intestin-cerveau'],
    emoji: '🧠', tagline: 'La connexion bidirectionnelle entre intestin et cerveau',
    simple: {
      what: 'L\'axe intestin-cerveau est un réseau de communication bidirectionnel complexe entre le système nerveux entérique (SNA intestinal — 500 millions de neurones, le "deuxième cerveau") et le système nerveux central. Il passe par le nerf vague (80 % des fibres sont ascendantes : intestin → cerveau), les hormones intestinales, le microbiote et le système immunitaire.',
      why: 'C\'est pourquoi on "ressent dans le ventre" les émotions, pourquoi le stress aggrave le SII, pourquoi 95 % de la sérotonine est produite dans l\'intestin, et pourquoi certaines bactéries intestinales influencent l\'humeur, le sommeil et les comportements. La connexion est aussi physique : inflammation intestinale → neuroinflammation → dépression.',
      sources: ['Psychobiotiques : kéfir, yaourt L. rhamnosus, L. helveticus', 'Tryptophane (précurseur sérotonine)', 'Magnésium, DHA (santé neuronale)'],
    },
    expert: {
      mechanism: 'Voies ascendantes (intestin → cerveau) : (1) Nerf vague (80 % afférent) : fibres chémoceptrices et mécanorceptrices de la muqueuse intestinale → noyau du tractus solitaire → cortex → perception viscérale consciente. (2) Entéroendocrines (GLP-1, CCK, PYY, ghréline) → circulation systémique → organes circumventriculaires. (3) Cytokines (IL-6, TNF-α en dysbiose) → activation microgliale → neuroinflammation. Voies descendantes : cortisol (axe HPA), noradrénaline (axe sympathique) → altèrent la motilité, la sécrétion de mucus et la composition du microbiote.',
      interactions: ['Le microbiote module l\'axe HPA (réponse au stress) dès la naissance — les germ-free mice ont une réponse au stress exagérée', 'Le tryptophane alimentaire est compétiteur avec les BCAA pour la BHE — impact sur la sérotonine centrale', 'Les AGCC produits par fermentation modulent la synthèse de GABA et sérotonine dans la muqueuse intestinale', 'Les psychobiotiques (L. rhamnosus JB-1 chez la souris, L. helveticus R0052 + B. longum R0175 chez l\'humain) réduisent les marqueurs d\'anxiété et de dépression'],
    },
    relatedIds: ['microbiote', 'tryptophane', 'serotonine', 'probiotiques', 'inflammation'],
  },

  {
    id: 'enzymes-digestives', category: 'concept', name: 'Enzymes digestives', aliases: ['Amylase', 'Lipase', 'Protéase', 'Digestases'],
    emoji: '⚙️', tagline: 'Les ciseaux moléculaires qui découpent les aliments en nutriments',
    simple: {
      what: 'Les enzymes digestives sont des protéines catalytiques qui découpent les molécules complexes des aliments (protéines, glucides, lipides) en molécules assez petites pour être absorbées. Chaque enzyme est spécifique : l\'amylase coupe les glucides, la lipase les graisses, les protéases les protéines.',
      why: 'Une insuffisance enzymatique (pancréatite chronique, mucoviscidose, déficit en lactase) se traduit par une malabsorption, des ballonnements, des selles graisseuses et des carences nutritionnelles. La production enzymatique décline naturellement avec l\'âge et sous certains médicaments (IPP, metformine).',
      sources: ['Enzymes naturelles : papaye (papaïne), ananas (bromélaïne), kiwi (actinidine), gingembre (zingibain)', 'Suppléments : α-galactosidase (Beano), lactase, lipase pancréatique'],
    },
    expert: {
      mechanism: 'Digestion par étapes : Bouche (amylase salivaire α-1,4-glucosidase → maltose, amylodextrine). Estomac (pepsine, pH 1.5-3.5 → oligopeptides ; lipase gastrique → AG + MAG). Pancréas (amylase II, trypsine, chymotrypsine, élastase, carboxypeptidases A/B, lipase + colipase, phospholipase A2, nucléases). Bordure en brosse (sucrase-isomaltase, lactase-phlorizine hydrolase, peptidases). Les entérocytes finalisent l\'hydrolyse et absorbent les monosaccharides via SGLT1 (glucose, galactose), GLUT5 (fructose), les acides aminés via multiples transporteurs, et les AGCM/AGC via la voie portale ou lymphatique.',
      interactions: ['Les IPP (oméprazole) réduisent l\'activation de la pepsine (pH gastrique trop haut) → maldigestion protéique', 'La pancréatite chronique (alcool, obésité) → insuffisance exocrine → malabsorption lipidique → carences ADEK', 'Le deficit en lactase (75 % de la population mondiale adulte) est génétiquement déterminé (polymorphisme LCT -13910 C>T)', 'L\'alcool inhibe la synthèse de la lipase pancréatique'],
      fodmapNote: 'L\'α-galactosidase (BEANO) dégrade les galacto-oligosaccharides des légumineuses avant leur fermentation colique → réduction des gaz et ballonnements (essais randomisés positifs).',
    },
    relatedIds: ['microbiote', 'permeabilite-intestinale', 'biodisponibilite'],
  },

  {
    id: 'stress-oxydatif', category: 'concept', name: 'Stress oxydatif', aliases: ['Radicaux libres', 'ROS', 'RONS'],
    emoji: '⚡', tagline: 'Le déséquilibre entre radicaux libres et défenses antioxydantes',
    simple: {
      what: 'Le stress oxydatif est le déséquilibre entre la production de radicaux libres (ROS — molécules réactives avec un électron non apparié) et la capacité de l\'organisme à les neutraliser. Les ROS sont produits naturellement lors de la respiration cellulaire, mais leur excès endommage l\'ADN, les protéines et les lipides.',
      why: 'Le stress oxydatif chronique est au cœur du vieillissement cellulaire, de l\'athérosclérose (oxydation du LDL), des cancers (dommages à l\'ADN), des maladies neurodégénératives (Alzheimer, Parkinson) et du diabète. Tabac, pollution, alimentation pro-inflammatoire et stress psychologique l\'amplifient.',
      sources: ['Antioxydants alimentaires : vitamine C, E, sélénium, polyphénols, coenzyme Q10, acide α-lipoïque', 'Anti-ROS enzymatiques endogènes : SOD (Mn, Cu/Zn), catalase, glutathion peroxydase (Se)'],
    },
    expert: {
      mechanism: 'Les principales ROS : superoxyde (O₂·⁻, produit par les complexes I et III mitochondriaux et la NADPH oxydase NOX), peroxyde d\'hydrogène (H₂O₂, disproportionation de O₂·⁻ par SOD), radical hydroxyle (HO·, réaction de Fenton : H₂O₂ + Fe²⁺ → HO· + OH⁻ + Fe³⁺ — le plus destructeur). La peroxydation lipidique en chaîne : PUFA + HO· → lipidyl radical → LOO· → LOOH → aldéhydes (MDA, 4-HNE) qui forment des adduits avec l\'ADN et les protéines. Nrf2/KEAP1 est le thermostat cellulaire : stress oxydatif → alkylation de KEAP1 → Nrf2 libre → induction d\'HO-1, SOD2, catalase, GSH-S-Tx.',
      interactions: ['Le réseau antioxydant est couplé : vit C régénère vit E, l\'ALA régénère les deux, le GSH régénère l\'ALA', 'Le fer libre (hors ferritine) est le principal catalyseur de la réaction de Fenton → danger de supplementation en fer non justifiée', 'L\'exercice physique intense produit un burst de ROS → adaptation antioxydante (hormèse) → avantage net à long terme', 'Les antioxydants en excès peuvent paradoxalement réduire l\'hormèse de l\'exercice (paradoxe antioxydant)'],
    },
    relatedIds: ['vit-c', 'vit-e', 'selenium', 'coq10', 'acide-lipoique', 'sulforaphane'],
  },

  {
    id: 'chronobiologie', category: 'concept', name: 'Chronobiologie nutritionnelle', aliases: ['Chrononutrition', 'Alimentation circadienne', 'Time-restricted feeding'],
    emoji: '🕐', tagline: 'Le moment du repas influence autant que sa composition',
    simple: {
      what: 'La chronobiologie nutritionnelle étudie comment l\'horloge biologique interne (rythme circadien de 24h) influence la façon dont le corps traite les aliments. Nos gènes de l\'horloge (CLOCK, BMAL1, PER, CRY) régulent le métabolisme glucose, la sensibilité à l\'insuline et la digestion selon l\'heure de la journée.',
      why: 'La même quantité de calories est moins bien métabolisée le soir qu\'au matin : la tolérance au glucose est maximale à 8h et minimale à 20h. Manger trop tard amplifie la glycémie postprandiale, perturbe la synthèse de mélatonine et dérègle l\'horloge du foie — ce qui explique les effets néfastes des horaires décalés sur la santé métabolique.',
      sources: ['Concentrer les calories en début de journée', 'Jeûne nocturne > 12h (ex : 8h-20h)', 'Dîner léger avant 19h'],
    },
    expert: {
      mechanism: 'L\'horloge centrale (noyau suprachiasmatique, NSC) est synchronisée par la lumière. Les horloges périphériques hépatiques et intestinales sont synchronisées principalement par la prise alimentaire (zeitgeber). CLOCK/BMAL1 activent la transcription de PER1/2/3 et CRY1/2 → feedback négatif sur CLOCK/BMAL1 (boucle circadienne ~24h). CLOCK acétyle BMAL1 et H3K9/H3K14 (régulation épigénétique des gènes métaboliques). L\'insulino-sécrétion maximale est le matin (rythme des cellules β), l\'activité du foie et la motilité intestinale suivent aussi des rythmes de 24h.',
      interactions: ['La mélatonine nocturne inhibe la sécrétion d\'insuline (récepteurs MT1/MT2 sur les cellules β) → repas tardifs → hyperglycémie nocturne', 'L\'exercice matinal amplifie la resynchronisation circadienne hépatique', 'Le jeûne intermittent (16:8, 5:2) améliore les rythmes circadiens hépatiques indépendamment de la restriction calorique', 'Les travailleurs de nuit ont un risque 2× plus élevé de diabète type 2 (désynchronisation chronique)'],
      clinicalNote: 'Essai clinique de Sutton (2018) : le TRE (time-restricted eating, 8h-15h) chez des hommes prédiabétiques réduit l\'insulinémie de 29 %, la pression artérielle de 11 mmHg et le stress oxydatif — sans réduction calorique intentionnelle.',
    },
    relatedIds: ['index-glycemique', 'insulinoresistance', 'microbiote'],
  },

  {
    id: 'biodisponibilite', category: 'concept', name: 'Biodisponibilité des nutriments', aliases: ['Absorption', 'Assimilation', 'Bioaccessibilité'],
    emoji: '🎯', tagline: 'Ce qui compte, ce n\'est pas ce qu\'on mange mais ce qu\'on absorbe',
    simple: {
      what: 'La biodisponibilité est la fraction d\'un nutriment ingéré qui atteint réellement la circulation systémique et est disponible pour les organes cibles. Elle dépend de la libération du nutriment de la matrice alimentaire (bioaccessibilité), de son absorption intestinale, et de sa transformation en forme active.',
      why: 'Le fer de la viande (fer héminique) est absorbé à 25-35 %, celui des épinards à 1-7 %. Le curcuma pris seul est absorbé à ~1 %, avec la pipérine à ~20 %. La vitamine D produite sous UVB est mieux retenue que la vitamine D3 en supplément. Comprendre la biodisponibilité permet d\'optimiser les combinaisons alimentaires.',
      sources: ['Optimiser : ajouter de la vit C avec le fer végétal, de l\'huile avec les caroténoïdes, la pipérine avec la curcumine, tremper les légumineuses (↓ phytates)'],
    },
    expert: {
      mechanism: 'Quatre étapes : (1) Libération de la matrice (cuisson, mastication, enzymes) : caroténoïdes liposolubles libérés par la cuisson, polyphénols par la fermentation. (2) Solubilisation dans la lumière (micelles biliaires pour les liposolubles, chélation des minéraux). (3) Transport transmembranaire (transporteurs spécifiques : SGLT1/GLUT2/5 glucides, DMT1/TfR fer, NPC1L1 stérols, peptides oligo via PEPT1). (4) Métabolisme de premier passage hépatique. Facteurs modulateurs : pH gastrique (crucial pour les minéraux), matrice alimentaire, état nutritionnel (carence ↑ absorption adaptative), génétique (FADS, BCMO1, HFE).',
      interactions: ['Les anti-nutriments (phytates, oxalates, tannins, lectines) réduisent la biodisponibilité des minéraux', 'La fermentation, le trempage et la germination réduisent les anti-nutriments et améliorent la biodisponibilité', 'L\'état nutritionnel module l\'absorption : carence en fer → DMT1 régulé positivement → absorption ↑ jusqu\'à 40 %', 'Les lipides alimentaires sont indispensables à l\'absorption des vitamines ADEK et des caroténoïdes'],
      fodmapNote: 'La cuisson et la fermentation améliorent souvent la biodisponibilité tout en réduisant les FODMAP. Ex : la cuisson de l\'ail réduit les fructanes (FODMAP) et améliore la biodisponibilité des composés organosulfurés.',
    },
    relatedIds: ['enzymes-digestives', 'fer', 'calcium', 'vit-d', 'curcumine'],
  },

  {
    id: 'fibres-alimentaires', category: 'concept', name: 'Fibres alimentaires', aliases: ['Fibres solubles', 'Fibres insolubles', 'Amidon résistant'],
    emoji: '🌾', tagline: 'Solubles · insolubles · résistantes — chacune a son rôle',
    simple: {
      what: 'Les fibres alimentaires sont des glucides non digestibles qui résistent aux enzymes humaines et arrivent intacts dans le côlon. On distingue les fibres solubles (se dissolvent dans l\'eau, forment un gel — pectines, bêta-glucanes, inuline) et les insolubles (cellulose, lignine — accélèrent le transit). L\'amidon résistant est une troisième catégorie importante (riz/pomme de terre refroidis).',
      why: 'Les fibres solubles (gels) ralentissent l\'absorption du glucose et des graisses, réduisent le cholestérol et nourrissent le microbiote (prébiotiques). Les fibres insolubles accélèrent le transit, réduisent le risque de cancer colorectal et de diverticulose. Les deux types sont nécessaires — la diversité des sources est la clé.',
      sources: ['Solubles : pomme, avoine, orge, graines de lin, légumineuses', 'Insolubles : son de blé, brocoli, chou, noix', 'Amidon résistant : riz refroidi, pomme de terre froide, banane verte'],
    },
    expert: {
      mechanism: 'Fibres solubles : forment des gels visqueux → ralentissent la vidange gastrique → absorption glucose plus lente → IG réduit. Dans le côlon, fermentées en AGCC (butyrate, propionate, acétate) par les Bacteroides, Bifidobactéries et Ruminococcus. Fibres insolubles : non fermentées (lignine), augmentent la masse fécale → dilution des carcinogènes → accélération du transit → réduction du temps de contact mucosal. Amidon résistant type 3 (rétrogradation) : les chaînes d\'amylose recristallisent lors du refroidissement → résistance à l\'amylase pancréatique → fermentation colique préférentielle en butyrate.',
      interactions: ['FODMAP : les fibres solubles fermentescibles (inuline, FOS) sont problématiques en SII', 'La viscosité est la propriété clé pour les effets métaboliques des fibres solubles (pectines > guar > xanthane)', 'L\'excès de fibres insolubles (son de blé) peut réduire l\'absorption du zinc, fer et calcium (phytates associés)', 'L\'amidon résistant est le substrat prébiotique préférentiel de Faecalibacterium prausnitzii (anti-inflammatoire)'],
      fodmapNote: 'Les fibres insolubles (cellulose, lignine) sont généralement Low FODMAP et bien tolérées. Éviter les fibres solubles fermentescibles (inuline, FOS) en phase d\'élimination.',
    },
    relatedIds: ['microbiote', 'beta-glucanes', 'inuline-fos', 'index-glycemique'],
  },

  {
    id: 'hormones-satiete', category: 'concept', name: 'Hormones de satiété', aliases: ['Leptine', 'Ghréline', 'GLP-1', 'PYY', 'CCK'],
    emoji: '⚖️', tagline: 'Le système de régulation hormonale de la faim et la satiété',
    simple: {
      what: 'La faim et la satiété sont régulées par un orchestre d\'hormones : la ghréline (estomac vide = "j\'ai faim"), la leptine (tissu adipeux = "j\'ai assez de réserves"), le GLP-1 et le PYY (intestin = "je suis rassasié"), et la CCK (duodénum = "je suis plein"). Ces signaux convergent vers l\'hypothalamus.',
      why: 'L\'alimentation ultra-transformée, le manque de sommeil et le stress chronique dérèglent ce système : la résistance à la leptine (similaire à la résistance à l\'insuline) fait que le cerveau ne "voit" plus les réserves en graisses → faim permanente malgré l\'obésité. Comprendre ces mécanismes permet de choisir des aliments qui maximisent naturellement la satiété.',
      sources: ['Améliorent la satiété : protéines (max GLP-1/PYY), fibres solubles (viscosité → ralentissement), graisses saines (CCK), eau avec repas'],
    },
    expert: {
      mechanism: 'Voie anorexigène hypothalamique : leptine (adipokine) + GLP-1, PYY, CCK → activation des neurones POMC/CART (nucleus arcuate) → α-MSH → récepteur MC4R → satiété + dépense énergétique. Voie orexigène : ghréline (fundus gastrique) + NPY/AgRP (nucleus arcuate) → activation de MC3R → faim. La ghréline pulse 30 min avant l\'heure habituelle des repas (mémoire circadienne de l\'alimentation). Le GLP-1 (cellules L iléales et coliques, incrétine) stimule aussi la sécrétion d\'insuline glucose-dépendante — cible des GLP-1 agonistes (semaglutide).',
      interactions: ['La résistance à la leptine (obésité) ne répond plus aux signaux de satiété — le leptine sérique est élevée mais inefficace (similarité avec l\'insulinorésistance)', 'Le manque de sommeil (< 6h) augmente la ghréline de 28 % et réduit le PYY de 20 % → surplus alimentaire de ~350 kcal/j', 'Les protéines sont les macronutriments les plus satiétogènes (stimulation GLP-1, PYY, insuline) à volume calorique égal', 'Les édulcorants intenses dissocient la douceur perçue de l\'apport calorique → confusion hypothalamique → dérèglement partiel'],
      clinicalNote: 'Le semaglutide (GLP-1 agoniste) à 2,4 mg/semaine réduit le poids de 15-17 % en 68 semaines (STEP trials) en mimant les effets post-prandiaux du GLP-1. Les aliments ultra-transformés ont un IG satiétogène artificiel — même caloriquement denses, ils n\'activent pas les voies de satiété normalement.',
    },
    relatedIds: ['insulinoresistance', 'chronobiologie', 'tryptophane', 'axe-intestin-cerveau'],
  },

  {
    id: 'epigenetique', category: 'concept', name: 'Épigénétique nutritionnelle', aliases: ['Nutri-épigénétique', 'Méthylation ADN', 'Histones', 'miRNA'],
    emoji: '🧬', tagline: 'L\'alimentation modifie l\'expression des gènes sans changer leur séquence',
    simple: {
      what: 'L\'épigénétique étudie les modifications de l\'expression des gènes sans altération de la séquence d\'ADN. Ces modifications — méthylation de l\'ADN, acétylation des histones, microARN — peuvent être transmises aux cellules filles et parfois aux générations suivantes. L\'alimentation est le principal modulateur épigénétique externe.',
      why: 'Ce que vous mangez influence quels gènes "s\'allument" ou "s\'éteignent" dans vos cellules. Le groupe méthyle de la méthionine, du folate et de la B12 méthyle les cytosines de l\'ADN → silencing de certains gènes (cancer, immunité). Le sulforaphane et la curcumine inhibent les HDAC → désilencing de gènes suppresseurs de tumeurs.',
      sources: ['Donateurs de méthyle : légumes verts (folate), œufs (choline), viandes (méthionine)', 'Inhibiteurs HDAC : brocoli (sulforaphane), curcuma (curcumine), raisin (resvératrol)'],
    },
    expert: {
      mechanism: 'Méthylation ADN : les DNMT1/3A/3B ajoutent des groupes méthyle (CH₃) sur les cytosines en 5\' des dinucléotides CpG → condensation de la chromatine → silencing transcriptionnel. SAM (S-adénosylméthionine) est le donneur universel de méthyle — requiert méthionine + folate (5-MTHF) + B12 + B6. Histones : les HAT (histone acétyltransférases, activatrices) vs HDAC (histone désacétylases, répressions) modulent l\'accessibilité de l\'ADN. miRNA : petits ARN non codants qui dégradent des ARNm cibles — les polyphénols alimentaires en modifient l\'expression (anti-oncogènes). Fenêtres critiques : in utero, petite enfance, adolescence.',
      interactions: ['Le polymorphisme MTHFR C677T réduit la méthylation génomique globale → susceptibilité aux maladies liées à l\'hypométhylation', 'L\'excès de méthionine (régimes hyperprotéinés) peut saturer SAM → perturbation de la méthylation normale', 'Le jeûne (autophagie) remodèle les marques épigénétiques via AMPK et SIRT1', 'La restriction calorique déméthyle des loci d\'inflammation → effet anti-vieillissement'],
    },
    relatedIds: ['methylation', 'vit-b9', 'vit-b12', 'methionine', 'sulforaphane'],
  },

  {
    id: 'methylation', category: 'concept', name: 'Cycle de méthylation', aliases: ['One-carbon metabolism', 'Méthionine cycle', 'MTHFR'],
    emoji: '🔄', tagline: 'Le cycle biochimique qui méthyle l\'ADN, les gènes et les neurotransmetteurs',
    simple: {
      what: 'La méthylation est le transfert d\'un groupement méthyle (-CH₃) sur l\'ADN, les histones, les neurotransmetteurs et les lipides. C\'est le processus épigénétique central qui régule quels gènes s\'expriment. La SAM (S-adénosylméthionine) est la "boîte aux lettres" universelle qui livre les groupes méthyle.',
      why: 'Un cycle de méthylation dysfonctionnel (souvent dû au polymorphisme MTHFR et à des carences en B9/B12/B6) est associé à l\'hyperhomocystéinémie, aux maladies cardiovasculaires, à la dépression, aux troubles de l\'attention et à un vieillissement biologique accéléré.',
      sources: ['Précurseurs indispensables : méthionine (viandes, œufs), folate (légumes verts), vitamine B12 (produits animaux), vitamine B6, choline, zinc'],
    },
    expert: {
      mechanism: 'Cycle : méthionine + ATP → SAM (méthyltransférases de 200+ réactions) → SAH → homocystéine. Remétylation : homocystéine + 5-méthyl-THF (MTHFR + B12) → méthionine. Transulfuration (B6) : homocystéine → cystathionine → cystéine → glutathion. SAM est donneur de CH₃ pour : méthylation de l\'ADN (DNMT), méthylation des histones (HMT), biosynthèse de créatine (40 % des CH₃ de SAM), phosphatidylcholine (PEMT), méthylation des neurotransmetteurs (COMT : catécholamines → méthyl-catécholamines ; INMT : tryptamine → diméthyltryptamine).',
      interactions: ['MTHFR C677T (polymorphisme fréquent) réduit l\'activité MTHFR de 30-70 % → recommandation de méthylfolate (5-MTHF) plutôt qu\'acide folique', 'Le rapport SAM/SAH est le "méthylation index" — un SAH élevé (carence B12/folate) inhibe toutes les méthyltransférases', 'La choline (œufs, foie) est un donneur de méthyle alternatif via la BHMT (bétaïne-homocystéine méthyltransférase)', 'L\'alcool réduit le SAM hépatique et augmente le SAH → hypométhylation → activation de proto-oncogènes'],
    },
    relatedIds: ['vit-b9', 'vit-b12', 'methionine', 'vit-b6', 'epigenetique'],
  },

  {
    id: 'autophagie', category: 'concept', name: 'Autophagie', aliases: ['Autophagy', 'Autolyse cellulaire', 'Mitophagie'],
    emoji: '♻️', tagline: 'Le système de recyclage cellulaire activé par le jeûne',
    simple: {
      what: 'L\'autophagie (du grec "se manger soi-même") est le mécanisme par lequel les cellules dégradent et recyclent leurs composants endommagés ou en excès : protéines mal repliées, organites dysfonctionnels, pathogènes intracellulaires. C\'est un processus fondamental de maintenance cellulaire, prix Nobel de médecine 2016 (Yoshinori Ohsumi).',
      why: 'L\'autophagie est la "grande lessive" cellulaire : elle élimine les protéines toxiques qui s\'accumulent dans les maladies neurodégénératives (agrégats tau, amyloïde-β, α-synucléine), renouvelle les mitochondries vieillissantes (mitophagie) et supprime les cellules cancéreuses naissantes. Le jeûne (> 14-16h) est son déclencheur principal.',
      sources: ['Déclencheurs : jeûne intermittent, restriction calorique, exercice physique, privation de nutriments', 'Activateurs alimentaires : resvératrol, EGCG, spermidine (blé germé), curcumine'],
    },
    expert: {
      mechanism: 'Voie canonique : déplétion en nutriments → ↓ mTORC1 (inhibé par faible leucine, glucose, insuline) → activation de ULK1/2 kinase → formation du phagophore (membranes de réticulum endoplasmique) → élongation (complexe Beclin-1/PI3K-III, LC3-II) → maturation de l\'autophagosome → fusion avec le lysosome → dégradation par les cathepsines. AMPK (activée par le jeûne : rapport AMP/ATP ↑) inhibe mTORC1 et phosphoryle directement ULK1. La mitophagie sélective : récepteurs PINK1/Parkin sur les mitochondries dépolarisées → ciblage autophagosomal.',
      interactions: ['mTOR est le principal inhibiteur de l\'autophagie — les repas riches en leucine et en glucides l\'activent → freinent l\'autophagie', 'La spermidine (polyamine, blé germé, produits fermentés) est le principal inducteur alimentaire de l\'autophagie via inhibition des EP300 acétyltransférases', 'Le resvératrol et l\'EGCG activent l\'autophagie via AMPK et Beclin-1', 'L\'exercice intense (AMPK → PGC-1α) induit une autophagie sélective des mitochondries âgées (mitophagie), régénérant la biogenèse mitochondriale'],
      clinicalNote: 'L\'autophagie est activée après ~14-16h de jeûne chez l\'humain (marqueurs : LC3-II, p62/SQSTM1 dans les leucocytes). Elle est réduite de 40-60 % dans le cerveau des patients Alzheimer (accumulation de protéines agrégées). Les études sur la restriction protéique comme stratégie pro-autophagique sont en cours.',
    },
    relatedIds: ['resveratrol', 'egcg', 'insulinoresistance', 'chronobiologie', 'epigenetique'],
  },

];

// ── Utilitaires ───────────────────────────────────────────────

export function searchKnowledge(query: string): KnowledgeEntry[] {
  if (!query.trim()) return KNOWLEDGE_BASE;
  const q = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return KNOWLEDGE_BASE.filter((e) => {
    const haystack = [
      e.name,
      e.tagline,
      ...(e.aliases ?? []),
      e.simple.what,
    ].join(' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return haystack.includes(q);
  });
}

export function getByCategory(category: KnowledgeEntry['category']): KnowledgeEntry[] {
  return KNOWLEDGE_BASE.filter((e) => e.category === category);
}

export function getRelated(entry: KnowledgeEntry): KnowledgeEntry[] {
  if (!entry.relatedIds?.length) return [];
  return entry.relatedIds
    .map((id) => KNOWLEDGE_BASE.find((e) => e.id === id))
    .filter((e): e is KnowledgeEntry => e !== undefined);
}

export function getCategoryCounts(): Record<KnowledgeEntry['category'], number> {
  const counts: Record<KnowledgeEntry['category'], number> = {
    vitamin: 0, mineral: 0, aminoacid: 0, bioactive: 0, concept: 0,
  };
  for (const e of KNOWLEDGE_BASE) counts[e.category]++;
  return counts;
}
