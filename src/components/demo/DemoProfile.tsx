import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../../theme/tokens';
import { useDemoEngine, SW, SH } from './useDemoEngine';
import { DemoShell } from './DemoShell';

const PHASES = ['hero', 'allergens', 'memory', 'lab'] as const;
type Phase = typeof PHASES[number];

// ── Fake data ──────────────────────────────────────────────────

const PROFILE = {
  initial: 'M',
  name: 'Marie D.',
  goal: 'Améliorer mon confort digestif',
  age: 32, weight: 64, height: 168,
  activity: 'Activité modérée · 3×/sem.',
  kcalTarget: 1950,
  macros: { protein: 95, carbs: 210, fat: 65 },
};

const ALLERGENS = [
  { name: 'Lactose',   level: 'sévère',  note: 'Douleurs abdominales' },
  { name: 'Gluten',    level: 'modéré',  note: 'Ballonnements' },
  { name: 'Fructose',  level: 'trace',   note: null },
  { name: 'Soja',      level: 'aucun',   note: null },
];

const DIETS = [
  { label: 'Sans lactose',  rule: 'Exclut les produits laitiers',       on: true  },
  { label: 'Low FODMAP',    rule: 'Réduction des fermentescibles',       on: false },
  { label: 'Méditerranéen', rule: 'Privilégie huile olive, légumes',     on: true  },
];

const MEMORY_LINES = [
  'Légumineuses bien tolérées · aucun symptôme depuis 3 semaines',
  'Lactose > 20 g déclenche des ballonnements modérés · préférer les fromages affinés',
  'Repas riches en FODMAPs le soir corrèlent avec un sommeil moins réparateur',
  'Activité physique le matin réduit la charge digestive perçue après le repas',
];

const LAB = [
  { emoji: '🐟', name: 'Ratio ω-3 / ω-6',        status: 'mid',  label: 'À améliorer', value: '1:10',    comment: 'Augmenter les sources oméga-3' },
  { emoji: '🌿', name: 'Densité micronutrit.',     status: 'ok',   label: 'Bon',         value: '78/100',  comment: 'Bonne variété végétale' },
  { emoji: '🔥', name: 'Score inflammatoire',      status: 'ok',   label: 'Faible',      value: '24/100',  comment: 'Alimentation anti-inflammatoire' },
  { emoji: '🎨', name: 'Diversité alimentaire',    status: 'mid',  label: 'Moyen',       value: '12 fam.', comment: 'Objectif 20+ familles / semaine' },
  { emoji: '🏭', name: 'Ultra-transformé',         status: 'ok',   label: 'Faible',      value: '8 %',     comment: 'Bien en dessous des 20 % recommandés' },
  { emoji: '🪣', name: 'Charge FODMAP',            status: 'ok',   label: 'Faible',      value: 'Basse',   comment: 'Phase de réintroduction envisageable' },
  { emoji: '🧬', name: 'Équilibre acides aminés',  status: 'mid',  label: 'Incomplet',   value: '6/9 AA',  comment: 'Ajouter des protéines complètes' },
];

const STATUS_COLOR: Record<string, string> = {
  ok: Colors.ok, mid: Colors.signal, warn: Colors.warn,
};

type LevelKey = 'sévère' | 'modéré' | 'trace' | 'aucun';
const LEVEL_STYLE: Record<LevelKey, { bg: string; color: string; border: string }> = {
  sévère: { bg: Colors.warn,   color: '#fff',        border: Colors.warn },
  modéré: { bg: 'transparent', color: Colors.warn,   border: 'rgba(139,58,46,0.3)' },
  trace:  { bg: 'transparent', color: Colors.signal, border: 'rgba(107,90,46,0.3)' },
  aucun:  { bg: Colors.card,   color: Colors.muted2, border: Colors.hairline },
};

// ── Component ──────────────────────────────────────────────────

interface Props { visible: boolean; onClose: () => void; }

export function DemoProfile({ visible, onClose }: Props) {
  const engine = useDemoEngine();
  const { overlayA, isRunning, at, clearAll, move, tap, fadeIn } = engine;

  const [phase,   setPhase]   = useState<Phase>('hero');
  const [caption, setCaption] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!visible) { isRunning.current = false; clearAll(); return; }
    isRunning.current = true;

    const run = () => {
      clearAll();
      setPhase('hero');
      setCaption('');
      overlayA.setValue(0);
      engine.fingerX.setValue(SW * 0.5 - 26);
      engine.fingerY.setValue(SH * 0.14 - 26);
      engine.fOpacity.setValue(0);
      engine.fScale.setValue(1);
      engine.ripS.setValue(0);
      engine.ripO.setValue(0);

      at(100, fadeIn);

      // t=0.9s : doigt → avatar
      at(900, () => {
        engine.fOpacity.setValue(1);
        move(SW * 0.14, SH * 0.165, 400);
        setCaption('Profil nutritionnel personnalisé');
      });

      // t=2.4s : doigt → stats row
      at(2400, () => {
        move(SW * 0.5, SH * 0.295, 500);
        setCaption('Données biométriques et objectif calorique');
      });

      // t=4.0s : doigt → FODMAP card
      at(4000, () => {
        move(SW * 0.5, SH * 0.385, 500);
        setCaption('Protocole Low FODMAP intégré');
      });

      // t=5.2s : tap → allergènes
      at(5200, () => {
        tap();
        setPhase('allergens');
        setCaption('Allergènes avec 4 niveaux de surveillance');
      });

      // t=6.2s : doigt → pill "sévère" (Lactose)
      at(6200, () => move(SW * 0.78, SH * 0.255, 500));

      // t=7.6s : doigt → pill "modéré" (Gluten)
      at(7600, () => {
        move(SW * 0.78, SH * 0.325, 400);
        setCaption('Les aliments concernés sont filtrés partout');
      });

      // t=9.0s : doigt → toggle régime
      at(9000, () => {
        move(SW * 0.82, SH * 0.535, 500);
        setCaption('Active ou désactive chaque régime alimentaire');
      });

      // t=10.2s : tap → mémoire digestive
      at(10200, () => {
        tap();
        setPhase('memory');
        setCaption('Mémoire digestive — IA analyse tes 21 derniers jours');
      });

      // t=11.2s : doigt → première ligne
      at(11200, () => move(SW * 0.5, SH * 0.315, 500));

      // t=12.6s : doigt → troisième ligne
      at(12600, () => {
        move(SW * 0.5, SH * 0.435, 400);
        setCaption('Croise tes repas, tes symptômes et ton bien-être');
      });

      // t=14.0s : doigt → bouton analyser
      at(14000, () => {
        move(SW * 0.5, SH * 0.62, 500);
        setCaption('');
      });

      // t=14.8s : tap → laboratoire
      at(14800, () => {
        tap();
        setPhase('lab');
        setCaption('Laboratoire nutritionnel IA — 7 indicateurs');
      });

      // t=15.8s : doigt → première métrique
      at(15800, () => move(SW * 0.5, SH * 0.27, 500));

      // t=17.1s : doigt → 4e métrique
      at(17100, () => {
        move(SW * 0.5, SH * 0.42, 400);
        setCaption('Analyse IA basée sur tes repas du jour');
      });

      // t=18.6s : doigt → bouton ré-analyser
      at(18600, () => {
        move(SW * 0.5, SH * 0.72, 500);
        setCaption('');
      });

      // t=19.4s : tap → retour hero
      at(19400, () => {
        tap();
        setPhase('hero');
        setCaption('Allergènes · régimes · mémoire digestive · labo IA');
      });

      // t=21.2s : boucle
      at(21200, () => { if (isRunning.current) run(); });
    };

    run();
    return () => { isRunning.current = false; clearAll(); };
  }, [visible]);

  return (
    <DemoShell visible={visible} onClose={onClose} engine={engine} phases={PHASES} currentPhase={phase} caption={caption}>
      <View style={s.bg}>

        {/* ── TOPBAR ── */}
        <View style={s.topbar}>
          <View style={s.iconBtn} />
          <View style={{ flex: 1 }} />
          <View style={s.iconBtn} />
          <View style={s.iconBtnSignal} />
          <View style={s.iconBtn} />
        </View>

        {/* ══ HERO ══════════════════════════════════════════════ */}
        {phase === 'hero' && (
          <View style={s.content}>

            {/* Avatar + nom */}
            <View style={s.hero}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{PROFILE.initial}</Text>
              </View>
              <Text style={s.eyebrow}>Profil nutritionnel</Text>
              <Text style={s.name}>{PROFILE.name}</Text>
              <Text style={s.goal}>{PROFILE.goal}</Text>

              {/* Stats row */}
              <View style={s.statsRow}>
                {[
                  { label: 'Âge',    value: String(PROFILE.age),    unit: ' ans' },
                  { label: 'Poids',  value: String(PROFILE.weight), unit: ' kg'  },
                  { label: 'Taille', value: String(PROFILE.height), unit: ' cm'  },
                ].map((st, i) => (
                  <View key={st.label} style={[s.statCell, i > 0 && s.statCellBorder]}>
                    <Text style={s.statLabel}>{st.label}</Text>
                    <Text style={s.statVal}>
                      {st.value}<Text style={s.statUnit}>{st.unit}</Text>
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={s.activity}>{PROFILE.activity}</Text>
            </View>

            {/* FODMAP card */}
            <View style={s.fodmapCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.fodmapTitle}>Mode Low FODMAP</Text>
                <Text style={s.fodmapDesc}>Phases · Timers · Aliments testés · Tolérance</Text>
              </View>
              <View style={s.fodmapIcon} />
            </View>

            {/* Objectifs */}
            <View style={s.objectifsCard}>
              <Text style={s.sectionEyebrow}>Objectifs quotidiens</Text>
              <View style={s.nutriRow}>
                <Text style={s.nutriNameLg}>Énergie</Text>
                <Text style={s.nutriValLg}>{PROFILE.kcalTarget} kcal</Text>
              </View>
              {[
                { n: 'Protéines', v: PROFILE.macros.protein, u: 'g' },
                { n: 'Glucides',  v: PROFILE.macros.carbs,   u: 'g' },
                { n: 'Lipides',   v: PROFILE.macros.fat,     u: 'g' },
              ].map(m => (
                <View key={m.n} style={s.nutriRow}>
                  <Text style={s.nutriName}>{m.n}</Text>
                  <Text style={s.nutriVal}>{m.v} {m.u}</Text>
                </View>
              ))}
            </View>

          </View>
        )}

        {/* ══ ALLERGÈNES + RÉGIMES ═══════════════════════════════ */}
        {phase === 'allergens' && (
          <View style={s.content}>

            <View style={s.section}>
              <Text style={s.sectionEyebrow}>Allergènes & intolérances</Text>
              <Text style={s.sectionDesc}>
                Quatre niveaux · Les aliments concernés sont filtrés dans toute l'app.
              </Text>
              <View style={s.allergenList}>
                {ALLERGENS.map(a => {
                  const ls = LEVEL_STYLE[a.level as LevelKey];
                  return (
                    <View key={a.name} style={s.allergenRow}>
                      <View style={s.allergenLeft}>
                        <Text style={s.allergenName}>{a.name}</Text>
                        {a.note && <Text style={s.allergenNote}>{a.note}</Text>}
                      </View>
                      <View style={[s.levelPill, { backgroundColor: ls.bg, borderColor: ls.border }]}>
                        <Text style={[s.levelPillText, { color: ls.color }]}>{a.level}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={s.section}>
              <Text style={s.sectionEyebrow}>Régimes alimentaires</Text>
              {DIETS.map(d => (
                <View key={d.label} style={s.dietRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.dietLabel}>{d.label}</Text>
                    <Text style={s.dietRule}>{d.rule}</Text>
                  </View>
                  {/* Fake switch */}
                  <View style={[s.fakeSwitch, d.on && s.fakeSwitchOn]}>
                    <View style={[s.fakeThumb, d.on && s.fakeThumbOn]} />
                  </View>
                </View>
              ))}
            </View>

          </View>
        )}

        {/* ══ MÉMOIRE DIGESTIVE ══════════════════════════════════ */}
        {phase === 'memory' && (
          <View style={s.content}>

            <View style={s.section}>
              <Text style={s.sectionEyebrow}>Mémoire digestive</Text>
              <Text style={s.sectionDesc}>
                L'IA analyse tes repas des 21 derniers jours croisés avec tes symptômes pour construire ta tolérance digestive.
              </Text>

              <View style={s.memoryCard}>
                <View style={s.memoryHeader}>
                  <View style={s.sparkleDot} />
                  <Text style={s.memoryHeaderText}>Observations personnalisées</Text>
                  <Text style={s.memoryDate}>mis à jour le 21 mai 2026</Text>
                </View>
                <View style={s.memoryLines}>
                  {MEMORY_LINES.map((line, i) => (
                    <View key={i} style={s.memoryLine}>
                      <View style={s.memoryDot} />
                      <Text style={s.memoryLineText}>{line}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Bouton analyser */}
            <View style={s.analyzeBtn}>
              <View style={s.sparkleIcon} />
              <Text style={s.analyzeBtnText}>Mettre à jour la mémoire</Text>
            </View>

          </View>
        )}

        {/* ══ LABORATOIRE ════════════════════════════════════════ */}
        {phase === 'lab' && (
          <View style={s.content}>

            <View style={s.section}>
              <Text style={s.sectionEyebrow}>🧪 Laboratoire nutritionnel</Text>
              <Text style={s.sectionDesc}>
                7 indicateurs avancés analysés par IA sur tes repas du jour.
              </Text>

              <View style={s.labCard}>
                <Text style={s.labDate}>Analysé le 22 mai 2026</Text>
                {LAB.map(m => {
                  const color = STATUS_COLOR[m.status];
                  return (
                    <View key={m.name} style={s.labRow}>
                      <Text style={s.labEmoji}>{m.emoji}</Text>
                      <View style={s.labRowCenter}>
                        <View style={s.labRowTop}>
                          <Text style={s.labName}>{m.name}</Text>
                          <View style={[s.labBadge, { backgroundColor: color + '20', borderColor: color + '50' }]}>
                            <Text style={[s.labBadgeText, { color }]}>{m.label}</Text>
                          </View>
                        </View>
                        <Text style={s.labValue}>{m.value}</Text>
                        <Text style={s.labComment}>{m.comment}</Text>
                      </View>
                      <View style={[s.labDot, { backgroundColor: color }]} />
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Bouton ré-analyser */}
            <View style={s.analyzeBtn}>
              <View style={s.sparkleIcon} />
              <Text style={s.analyzeBtnText}>Ré-analyser la journée</Text>
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
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, gap: 4,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20 },
  iconBtnSignal: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.signal + '55',
    backgroundColor: Colors.signal + '12',
  },

  content: { flex: 1, paddingHorizontal: H_PAD, gap: 12 },

  // ── Hero ────────────────────────────────────────────────────
  hero: { gap: 4 },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.ink,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText:  { fontFamily: Fonts.serif, fontSize: 26, color: Colors.paper },
  eyebrow:     { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: Colors.muted },
  name:        { fontFamily: Fonts.serif, fontSize: 28, letterSpacing: -0.6, color: Colors.ink, lineHeight: 30, marginTop: 2 },
  goal:        { fontFamily: Fonts.sans, fontSize: 13, color: Colors.ink2, marginTop: 2, lineHeight: 18 },
  statsRow:    { flexDirection: 'row', marginTop: 14, borderWidth: 1, borderColor: Colors.hairline2, borderRadius: 14, overflow: 'hidden' },
  statCell:    { flex: 1, paddingVertical: 12, alignItems: 'center', gap: 2 },
  statCellBorder: { borderLeftWidth: 1, borderLeftColor: Colors.hairline2 },
  statLabel:   { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', color: Colors.muted },
  statVal:     { fontFamily: Fonts.serif, fontSize: 20, letterSpacing: -0.4, color: Colors.ink },
  statUnit:    { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted },
  activity:    { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted2, letterSpacing: 0.3, marginTop: 8 },

  fodmapCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.ok + '12', borderWidth: 1, borderColor: Colors.ok + '40',
    borderRadius: 14, padding: 16, gap: 12,
  },
  fodmapTitle: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.ok, letterSpacing: -0.1 },
  fodmapDesc:  { fontFamily: Fonts.mono, fontSize: 9.5, color: Colors.muted, letterSpacing: 0.3, marginTop: 3 },
  fodmapIcon:  { width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.ok + '40' },

  objectifsCard: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.hairline2,
    borderRadius: 14, padding: 16, gap: 6,
  },
  sectionEyebrow: { fontFamily: Fonts.mono, fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: Colors.muted, marginBottom: 2 },
  nutriRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: Colors.hairline2 },
  nutriNameLg: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.ink },
  nutriValLg:  { fontFamily: Fonts.serif, fontSize: 18, letterSpacing: -0.3, color: Colors.ink },
  nutriName:   { fontFamily: Fonts.sans, fontSize: 12, color: Colors.ink2 },
  nutriVal:    { fontFamily: Fonts.serif, fontSize: 15, letterSpacing: -0.2, color: Colors.ink2 },

  // ── Allergènes + Régimes ────────────────────────────────────
  section: { gap: 10 },
  sectionDesc: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted2, lineHeight: 17 },
  allergenList: { gap: 2 },
  allergenRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.hairline2,
    borderRadius: 10,
  },
  allergenLeft: { flex: 1, gap: 1 },
  allergenName: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.ink, letterSpacing: -0.1 },
  allergenNote: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.3 },
  levelPill: { borderWidth: 1, borderRadius: 100, paddingVertical: 3, paddingHorizontal: 10 },
  levelPillText: { fontFamily: Fonts.sansMedium, fontSize: 11, letterSpacing: -0.1 },

  dietRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.hairline2,
    borderRadius: 10, marginTop: 2,
  },
  dietLabel: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink, letterSpacing: -0.1 },
  dietRule:  { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.3, marginTop: 2 },
  fakeSwitch: {
    width: 44, height: 26, borderRadius: 13,
    backgroundColor: Colors.hairline,
    paddingHorizontal: 2, justifyContent: 'center',
  },
  fakeSwitchOn: { backgroundColor: Colors.ink },
  fakeThumb: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.paper,
    alignSelf: 'flex-start',
  },
  fakeThumbOn: { alignSelf: 'flex-end' },

  // ── Mémoire digestive ───────────────────────────────────────
  memoryCard: {
    borderWidth: 1, borderColor: Colors.ok + '40',
    borderRadius: 14, backgroundColor: Colors.ok + '08',
    padding: 14, gap: 4,
  },
  memoryHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap',
  },
  sparkleDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.ok,
  },
  memoryHeaderText: {
    fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.ok, flex: 1,
  },
  memoryDate: {
    fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted2, letterSpacing: 0.3,
  },
  memoryLines: { gap: 8 },
  memoryLine:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  memoryDot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.ok, marginTop: 6, flexShrink: 0 },
  memoryLineText: {
    flex: 1, fontFamily: Fonts.sans, fontSize: 12, color: Colors.ink2, lineHeight: 18,
  },

  // ── Laboratoire ─────────────────────────────────────────────
  labCard: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.hairline2,
    borderRadius: 14, padding: 14, gap: 2,
  },
  labDate: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted2, letterSpacing: 0.3, marginBottom: 6 },
  labRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.hairline2 },
  labEmoji: { fontSize: 14, width: 22, textAlign: 'center', marginTop: 1 },
  labRowCenter: { flex: 1, gap: 1 },
  labRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  labName: { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.ink, letterSpacing: -0.1 },
  labBadge: { borderWidth: 1, borderRadius: 100, paddingVertical: 1, paddingHorizontal: 6 },
  labBadgeText: { fontFamily: Fonts.sansMedium, fontSize: 9 },
  labValue:   { fontFamily: Fonts.serif, fontSize: 12, letterSpacing: -0.2, color: Colors.ink2 },
  labComment: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, letterSpacing: 0.2, lineHeight: 12 },
  labDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },

  // ── Bouton partagé ─────────────────────────────────────────
  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.ink, borderRadius: 100,
    paddingVertical: 14, marginHorizontal: 4,
  },
  sparkleIcon: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.paper + '80' },
  analyzeBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.paper2, letterSpacing: -0.2 },
});
