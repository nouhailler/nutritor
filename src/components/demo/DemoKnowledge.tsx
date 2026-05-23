import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../../theme/tokens';
import { useDemoEngine, SW, SH } from './useDemoEngine';
import { DemoShell } from './DemoShell';

const PHASES = ['home', 'list', 'entry'] as const;
type Phase = typeof PHASES[number];

// ── Fake data ──────────────────────────────────────────────────

const CATEGORIES = [
  { label: 'Vitamines',          emoji: '🌟', color: '#A0620A', bg: 'rgba(160,98,10,0.08)',   count: 13 },
  { label: 'Minéraux',           emoji: '🪨', color: '#2E5A8B', bg: 'rgba(46,90,139,0.08)',   count: 15 },
  { label: 'Acides aminés',      emoji: '🧬', color: '#3F5A3A', bg: 'rgba(63,90,58,0.08)',    count: 11 },
  { label: 'Composés bioactifs', emoji: '🌿', color: '#6B3A8B', bg: 'rgba(107,58,139,0.08)',  count: 18 },
  { label: 'Concepts digestifs', emoji: '🧠', color: '#8B3A2E', bg: 'rgba(139,58,46,0.08)',   count: 10 },
  { label: 'Laboratoire',        emoji: '🧪', color: '#2E4E8B', bg: 'rgba(46,78,139,0.08)',   count:  7 },
];

const FEATURED = [
  { emoji: '🌿', name: 'Curcumine',   tagline: 'Anti-inflammatoire polyphénolique majeur',        color: '#6B3A8B', bg: 'rgba(107,58,139,0.08)' },
  { emoji: '☀️',  name: 'Vitamine D',  tagline: 'Régulateur immunitaire, osseux et hormonal',      color: '#A0620A', bg: 'rgba(160,98,10,0.08)'  },
  { emoji: '⚡', name: 'Magnésium',   tagline: 'Cofacteur de 300+ enzymes · muscle · sommeil',    color: '#2E5A8B', bg: 'rgba(46,90,139,0.08)'  },
  { emoji: '🦠', name: 'Microbiote',  tagline: 'Écosystème intestinal et axe cerveau-intestin',   color: '#8B3A2E', bg: 'rgba(139,58,46,0.08)'  },
  { emoji: '💤', name: 'Tryptophane', tagline: 'Précurseur de la sérotonine et de la mélatonine', color: '#3F5A3A', bg: 'rgba(63,90,58,0.08)'   },
  { emoji: '🥦', name: 'Sulforaphane', tagline: 'Inducteur de Nrf2 et détoxification de phase II', color: '#6B3A8B', bg: 'rgba(107,58,139,0.08)' },
];

const MINERAL_LIST = [
  { emoji: '⚡', name: 'Magnésium',  tagline: 'Cofacteur de 300+ enzymes · muscle · sommeil · stress' },
  { emoji: '🩸', name: 'Fer',        tagline: 'Transporte l\'oxygène et alimente l\'énergie mitochondriale' },
  { emoji: '🔬', name: 'Zinc',       tagline: 'Immunité, goût, fertilité et cicatrisation' },
  { emoji: '🦴', name: 'Calcium',    tagline: 'Architecture osseuse et signalisation cellulaire' },
  { emoji: '🫀', name: 'Potassium',  tagline: 'Pression artérielle et fonction musculaire' },
];

const ENTRY_SIMPLE = {
  emoji: '⚡', name: 'Magnésium',
  aliases: 'Mg · Bisglycinate · Malate',
  tagline: 'Cofacteur de 300+ enzymes · muscle · sommeil · stress',
  catLabel: 'Minéraux', catColor: '#2E5A8B', catBg: 'rgba(46,90,139,0.08)',
  what: 'Le 4ᵉ minéral le plus abondant dans l\'organisme. 70 % de la population française a des apports insuffisants.',
  why: 'Production d\'énergie (ATP), contraction musculaire, régulation de la glycémie, relaxation et qualité du sommeil.',
  deficiency: 'Crampes nocturnes, irritabilité, anxiété, insomnie, arythmies cardiaques.',
  sources: ['Graines de courge', 'Chocolat noir 85 %', 'Noix du Brésil', 'Haricots noirs', 'Quinoa'],
};

const ENTRY_EXPERT = {
  mechanism: 'Cofacteur de toutes les ATPases et kinases — tout transfert de phosphate nécessite Mg-ATP². Bloque le canal NMDA (antiexcitotoxique) dans le SNC. Cofacteur des hydroxylases CYP2R1/CYP27B1 qui activent la vitamine D.',
  interactions: [
    'Indispensable à l\'activation de la vitamine D (CYP2R1, CYP27B1)',
    'Synergie avec la vitamine B6 pour la synthèse de GABA et de sérotonine',
    'Le calcium entre en compétition pour l\'absorption intestinale (ratio Ca/Mg optimal ≈ 2:1)',
  ],
  rda: '300–380',
  unit: 'mg / j',
  clinicalNote: 'Le bisglycinate et le malate ont la meilleure biodisponibilité. 300 mg/j réduit la fréquence des migraines de 41 % (méta-analyse 2016).',
};

const RELATED = [
  { emoji: '☀️', name: 'Vitamine D',  tagline: 'Activation vitamine D dépend du Mg', color: '#A0620A' },
  { emoji: '🧪', name: 'Vitamine B6', tagline: 'Synergie GABA · sérotonine',          color: '#2E4E8B' },
];

// ── Component ──────────────────────────────────────────────────

interface Props { visible: boolean; onClose: () => void; }

export function DemoKnowledge({ visible, onClose }: Props) {
  const engine = useDemoEngine();
  const { overlayA, isRunning, at, clearAll, move, tap, fadeIn } = engine;

  const [phase, setPhase] = useState<Phase>('home');
  const [mode,  setMode]  = useState<'simple' | 'expert'>('simple');
  const [caption, setCaption] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!visible) { isRunning.current = false; clearAll(); return; }
    isRunning.current = true;

    const run = () => {
      clearAll();
      setPhase('home');
      setMode('simple');
      setCaption('');
      overlayA.setValue(0);
      engine.fingerX.setValue(SW * 0.5 - 26);
      engine.fingerY.setValue(SH * 0.17 - 26);
      engine.fOpacity.setValue(0);
      engine.fScale.setValue(1);
      engine.ripS.setValue(0);
      engine.ripO.setValue(0);

      at(100, fadeIn);

      // t=0.9s : doigt → barre de recherche
      at(900, () => {
        engine.fOpacity.setValue(1);
        move(SW * 0.5, SH * 0.17, 400);
        setCaption('80 entrées · vitamines · minéraux · bioactifs · 100 % hors-ligne');
      });

      // t=2.5s : doigt → carte Minéraux (col 1, row 1)
      at(2500, () => {
        move(SW * 0.26, SH * 0.31, 500);
        setCaption('6 catégories · navigation par thème ou recherche');
      });

      // t=3.8s : doigt → carte Bioactifs (col 2, row 2)
      at(3800, () => move(SW * 0.73, SH * 0.44, 500));

      // t=5.0s : doigt → entrée À explorer (Curcumine)
      at(5000, () => {
        move(SW * 0.45, SH * 0.73, 600);
        setCaption('');
      });

      // t=6.2s : tap → liste Minéraux
      at(6200, () => {
        tap();
        setPhase('list');
        setCaption('Minéraux · 15 entrées');
      });

      // t=7.5s : doigt → Magnésium (row 1)
      at(7500, () => {
        move(SW * 0.45, SH * 0.24, 500);
        setCaption('');
      });

      // t=8.7s : doigt → Fer (row 2)
      at(8700, () => move(SW * 0.45, SH * 0.31, 400));

      // t=9.7s : tap → fiche Magnésium, mode simple
      at(9700, () => {
        tap();
        setPhase('entry');
        setMode('simple');
        setCaption('Fiche détaillée · mode Simple');
      });

      // t=10.9s : doigt → tagline
      at(10900, () => {
        move(SW * 0.45, SH * 0.375, 500);
        setCaption('');
      });

      // t=11.9s : doigt → toggle Expert
      at(11900, () => move(SW * 0.82, SH * 0.088, 500));

      // t=12.7s : tap → mode expert
      at(12700, () => {
        tap();
        setMode('expert');
        setCaption('Mode Expert · mécanisme & dosage');
      });

      // t=13.9s : doigt → bloc AJR
      at(13900, () => {
        move(SW * 0.45, SH * 0.64, 500);
        setCaption('');
      });

      // t=15.1s : tap → retour accueil
      at(15100, () => {
        tap();
        setPhase('home');
        setMode('simple');
        setCaption('Base de connaissances · toujours disponible hors-ligne');
      });

      // t=16.8s : boucle
      at(16800, () => { if (isRunning.current) run(); });
    };

    run();
    return () => { isRunning.current = false; clearAll(); };
  }, [visible]);

  return (
    <DemoShell visible={visible} onClose={onClose} engine={engine} phases={PHASES} currentPhase={phase} caption={caption}>
      <View style={s.bg}>

        {/* ── TOPBAR ────────────────────────────────────────── */}
        <View style={s.topbar}>
          <View style={s.iconBtn} />
          {phase !== 'entry' ? (
            <View style={s.topbarCenter}>
              <Text style={s.topbarTitle}>Base de connaissances</Text>
              <Text style={s.topbarSub}>80 entrées · 100 % hors-ligne</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <View style={s.iconBtn} />
          {phase === 'entry' && (
            <View style={s.modeToggle}>
              <View style={[s.modeBtn, mode === 'simple' && s.modeBtnActive]}>
                <Text style={[s.modeBtnText, mode === 'simple' && s.modeBtnTextActive]}>Simple</Text>
              </View>
              <View style={[s.modeBtn, mode === 'expert' && s.modeBtnActive]}>
                <Text style={[s.modeBtnText, mode === 'expert' && s.modeBtnTextActive]}>Expert</Text>
              </View>
            </View>
          )}
        </View>

        {/* ══ HOME ══════════════════════════════════════════════ */}
        {phase === 'home' && (
          <View style={s.content}>

            {/* Barre de recherche */}
            <View style={s.searchWrap}>
              <View style={s.searchIcon} />
              <Text style={s.searchPlaceholder}>Magnésium, curcumine, microbiote…</Text>
            </View>

            {/* Catégories */}
            <Text style={s.homeSection}>Catégories</Text>
            <View style={s.catGrid}>
              {CATEGORIES.map((cat) => (
                <View key={cat.label} style={[s.catCard, { borderColor: cat.color + '35', backgroundColor: cat.bg }]}>
                  <Text style={s.catEmoji}>{cat.emoji}</Text>
                  <Text style={[s.catLabel, { color: cat.color }]}>{cat.label}</Text>
                  <Text style={[s.catCount, { color: cat.color + 'AA' }]}>{cat.count} entrées</Text>
                </View>
              ))}
            </View>

            {/* À explorer */}
            <Text style={[s.homeSection, { marginTop: 20 }]}>À explorer</Text>
            {FEATURED.map((e) => (
              <View key={e.name} style={s.entryRow}>
                <View style={[s.entryRowEmoji, { backgroundColor: e.bg }]}>
                  <Text style={s.entryRowEmojiText}>{e.emoji}</Text>
                </View>
                <View style={s.entryRowText}>
                  <Text style={s.entryRowName}>{e.name}</Text>
                  <Text style={s.entryRowTagline} numberOfLines={1}>{e.tagline}</Text>
                </View>
                <View style={s.chevron} />
              </View>
            ))}

          </View>
        )}

        {/* ══ LIST ══════════════════════════════════════════════ */}
        {phase === 'list' && (
          <View style={s.content}>
            <Text style={s.listCount}>15 entrées</Text>
            {MINERAL_LIST.map((e) => (
              <View key={e.name} style={s.entryRow}>
                <View style={[s.entryRowEmoji, { backgroundColor: 'rgba(46,90,139,0.08)' }]}>
                  <Text style={s.entryRowEmojiText}>{e.emoji}</Text>
                </View>
                <View style={s.entryRowText}>
                  <Text style={s.entryRowName}>{e.name}</Text>
                  <Text style={s.entryRowTagline} numberOfLines={1}>{e.tagline}</Text>
                </View>
                <View style={s.chevron} />
              </View>
            ))}
          </View>
        )}

        {/* ══ ENTRY ═════════════════════════════════════════════ */}
        {phase === 'entry' && (
          <View style={s.content}>

            {/* Hero */}
            <View style={s.entryHero}>
              <View style={[s.emojiWrap, { backgroundColor: ENTRY_SIMPLE.catBg, borderColor: ENTRY_SIMPLE.catColor + '40' }]}>
                <Text style={s.heroEmoji}>{ENTRY_SIMPLE.emoji}</Text>
              </View>
              <View style={[s.catPill, { backgroundColor: ENTRY_SIMPLE.catBg, borderColor: ENTRY_SIMPLE.catColor + '50' }]}>
                <Text style={[s.catPillText, { color: ENTRY_SIMPLE.catColor }]}>{ENTRY_SIMPLE.catLabel}</Text>
              </View>
              <Text style={s.entryName}>{ENTRY_SIMPLE.name}</Text>
              <Text style={s.entryAliases}>{ENTRY_SIMPLE.aliases}</Text>
              <Text style={s.entryTagline}>{ENTRY_SIMPLE.tagline}</Text>
            </View>

            <View style={s.divider} />

            {/* ── Mode Simple ── */}
            {mode === 'simple' && (
              <View style={s.contentBlock}>
                <View style={s.section}>
                  <Text style={s.sectionLabel}>Qu'est-ce que c'est ?</Text>
                  <Text style={s.sectionText}>{ENTRY_SIMPLE.what}</Text>
                </View>
                <View style={s.section}>
                  <Text style={s.sectionLabel}>Pourquoi c'est important</Text>
                  <Text style={s.sectionText}>{ENTRY_SIMPLE.why}</Text>
                </View>
                <View style={s.section}>
                  <Text style={s.sectionLabel}>Signes de carence</Text>
                  <Text style={[s.sectionText, { color: Colors.warn }]}>{ENTRY_SIMPLE.deficiency}</Text>
                </View>
                <View style={s.section}>
                  <Text style={s.sectionLabel}>Meilleures sources</Text>
                  <View style={s.sourcesGrid}>
                    {ENTRY_SIMPLE.sources.map((src) => (
                      <View key={src} style={s.sourceChip}>
                        <Text style={s.sourceChipText}>{src}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* ── Mode Expert ── */}
            {mode === 'expert' && (
              <View style={s.contentBlock}>
                <View style={s.section}>
                  <Text style={s.sectionLabel}>Mécanisme</Text>
                  <Text style={s.sectionText}>{ENTRY_EXPERT.mechanism}</Text>
                </View>
                <View style={s.section}>
                  <Text style={s.sectionLabel}>Interactions & synergies</Text>
                  {ENTRY_EXPERT.interactions.map((inter, i) => (
                    <View key={i} style={s.interactionRow}>
                      <View style={s.interactionDot} />
                      <Text style={s.interactionText}>{inter}</Text>
                    </View>
                  ))}
                </View>
                <View style={s.dosageBlock}>
                  <Text style={s.dosageLabel}>Apport de référence (AJR)</Text>
                  <Text style={s.dosageVal}>
                    {ENTRY_EXPERT.rda}
                    <Text style={s.dosageUnit}> {ENTRY_EXPERT.unit}</Text>
                  </Text>
                </View>
                <View style={s.section}>
                  <Text style={s.sectionLabel}>Note clinique</Text>
                  <Text style={[s.sectionText, { color: '#2E5A8B' }]}>{ENTRY_EXPERT.clinicalNote}</Text>
                </View>
              </View>
            )}

            {/* Entrées liées */}
            <View style={s.relatedSection}>
              <Text style={s.relatedLabel}>Entrées liées</Text>
              <View style={s.relatedGrid}>
                {RELATED.map((r) => (
                  <View key={r.name} style={[s.relatedCard, { borderColor: r.color + '30' }]}>
                    <Text style={s.relatedEmoji}>{r.emoji}</Text>
                    <Text style={s.relatedName}>{r.name}</Text>
                    <Text style={s.relatedTagline}>{r.tagline}</Text>
                  </View>
                ))}
              </View>
            </View>

          </View>
        )}

      </View>
    </DemoShell>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const H_PAD = 20;

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.paper },

  topbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, gap: 8,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, flexShrink: 0 },
  topbarCenter: { flex: 1, alignItems: 'center' },
  topbarTitle: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.ink, letterSpacing: -0.3 },
  topbarSub:   { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.muted, marginTop: 1 },

  modeToggle: {
    flexDirection: 'row', borderWidth: 1, borderColor: Colors.hairline,
    borderRadius: 10, overflow: 'hidden', backgroundColor: Colors.card,
  },
  modeBtn:          { paddingVertical: 7, paddingHorizontal: 14 },
  modeBtnActive:    { backgroundColor: Colors.ink },
  modeBtnText:      { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 0.8, color: Colors.muted },
  modeBtnTextActive: { color: Colors.paper2 },

  content: { flex: 1, paddingHorizontal: H_PAD },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 4, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.hairline, borderRadius: 14,
    backgroundColor: Colors.card, paddingHorizontal: 14, paddingVertical: 12,
  },
  searchIcon:        { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.muted2 + '60' },
  searchPlaceholder: { fontFamily: Fonts.sans, fontSize: 15, color: Colors.muted2 },

  // Category grid
  homeSection: {
    fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2,
    textTransform: 'uppercase', color: Colors.muted, marginBottom: 12,
  },
  catGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard:  { width: '47%', borderWidth: 1, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 16, gap: 4 },
  catEmoji: { fontSize: 28, marginBottom: 4 },
  catLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 14, letterSpacing: -0.1 },
  catCount: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.8 },

  // Entry rows
  listCount: {
    fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.8,
    textTransform: 'uppercase', color: Colors.muted2, marginBottom: 4, marginTop: 8,
  },
  entryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.hairline2,
  },
  entryRowEmoji: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  entryRowEmojiText: { fontSize: 22 },
  entryRowText:  { flex: 1 },
  entryRowName:  { fontFamily: Fonts.serif, fontSize: 17, color: Colors.ink, letterSpacing: -0.2 },
  entryRowTagline: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted, marginTop: 1, lineHeight: 16 },
  chevron: { width: 7, height: 7, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: Colors.muted2, transform: [{ rotate: '45deg' }] },

  // Entry detail
  entryHero: { paddingTop: 4, paddingBottom: 16, gap: 6 },
  emojiWrap:  {
    width: 72, height: 72, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  heroEmoji:  { fontSize: 38 },
  catPill:    { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10, marginBottom: 2 },
  catPillText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' },
  entryName:  { fontFamily: Fonts.serif, fontSize: 34, color: Colors.ink, letterSpacing: -0.8, lineHeight: 38 },
  entryAliases: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 0.3, lineHeight: 15 },
  entryTagline: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.ink2, lineHeight: 22, marginTop: 4 },

  divider: { height: 1, backgroundColor: Colors.hairline2, marginBottom: 18 },

  contentBlock: { gap: 18 },
  section:      { gap: 8 },
  sectionLabel: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: Colors.muted },
  sectionText:  { fontFamily: Fonts.sans, fontSize: 14, color: Colors.ink2, lineHeight: 21 },

  sourcesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  sourceChip:  { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 100, borderWidth: 1, borderColor: Colors.hairline, backgroundColor: Colors.card },
  sourceChipText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.ink2 },

  interactionRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.hairline2,
  },
  interactionDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.muted2, marginTop: 8, flexShrink: 0 },
  interactionText: { flex: 1, fontFamily: Fonts.sans, fontSize: 13, color: Colors.ink2, lineHeight: 19 },

  dosageBlock: {
    padding: 16, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.hairline, backgroundColor: Colors.card, gap: 4,
  },
  dosageLabel: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1.8, textTransform: 'uppercase', color: Colors.muted },
  dosageVal:   { fontFamily: Fonts.serif, fontSize: 28, color: Colors.ink, letterSpacing: -0.5 },
  dosageUnit:  { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted, fontWeight: '400' },

  relatedSection: { marginTop: 20, gap: 12 },
  relatedLabel:   { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: Colors.muted },
  relatedGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  relatedCard:    { width: '47%', borderWidth: 1, borderRadius: 16, backgroundColor: Colors.card, padding: 14, gap: 3 },
  relatedEmoji:   { fontSize: 22, marginBottom: 4 },
  relatedName:    { fontFamily: Fonts.serif, fontSize: 15, color: Colors.ink, letterSpacing: -0.2 },
  relatedTagline: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted, lineHeight: 15 },
});
