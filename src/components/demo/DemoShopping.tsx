import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../../theme/tokens';
import { useDemoEngine, SW, SH } from './useDemoEngine';
import { DemoShell } from './DemoShell';

const PHASES = ['history', 'detail', 'list'] as const;
type Phase = typeof PHASES[number];

// ── Fake data ──────────────────────────────────────────────────

const VERDICT_COLOR: Record<string, string> = {
  good:    Colors.ok,
  caution: Colors.signal,
  bad:     Colors.warn,
};
const VERDICT_LABEL: Record<string, string> = {
  good: 'Compatible', caution: 'À vérifier', bad: 'Déconseillé',
};

const HISTORY = [
  { id: '1', name: 'Yaourt nature',    brand: 'Danone', score: 82, verdict: 'good',    time: 'il y a 5 min' },
  { id: '2', name: 'Chips Lay\'s',     brand: "Lay's",  score: 28, verdict: 'bad',     time: 'il y a 12 min' },
  { id: '3', name: 'Houmous',          brand: 'Florentin', score: 67, verdict: 'caution', time: 'il y a 18 min' },
];

const EXPANDED_ISSUES = [
  { label: 'Lactose',           detail: 'Contient du lait en poudre · Sévère',      severity: 'critical' },
  { label: 'Ultra-transformé',  detail: 'NOVA 4 — additifs, arômes artificiels',    severity: 'strong'   },
  { label: 'Sel élevé',         detail: '1.8 g / 100 g · dépasse la recommandation',severity: 'medium'   },
];

const SHOPPING_LIST = [
  { id: '1', name: 'Yaourt nature', brand: 'Danone', score: 82, verdict: 'good',    added: false },
  { id: '3', name: 'Houmous',       brand: 'Florentin', score: 67, verdict: 'caution', added: false },
];

const SEV_COLOR: Record<string, string> = {
  critical: Colors.warn,
  strong:   Colors.signal,
  medium:   Colors.signal + 'cc',
};

// ── Component ──────────────────────────────────────────────────

interface Props { visible: boolean; onClose: () => void; }

export function DemoShopping({ visible, onClose }: Props) {
  const engine = useDemoEngine();
  const { overlayA, isRunning, at, clearAll, move, tap, fadeIn } = engine;

  const [phase,        setPhase]        = useState<Phase>('history');
  const [filterActive, setFilterActive] = useState(false);
  const [inList,       setInList]       = useState(false);
  const [nutriAdded,   setNutriAdded]   = useState(false);
  const [caption,      setCaption]      = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!visible) { isRunning.current = false; clearAll(); return; }
    isRunning.current = true;

    const run = () => {
      clearAll();
      setPhase('history');
      setFilterActive(false);
      setInList(false);
      setNutriAdded(false);
      setCaption('');
      overlayA.setValue(0);
      engine.fingerX.setValue(SW * 0.17 - 26);
      engine.fingerY.setValue(SH * 0.195 - 26);
      engine.fOpacity.setValue(0);
      engine.fScale.setValue(1);
      engine.ripS.setValue(0);
      engine.ripO.setValue(0);

      at(100, fadeIn);

      // t=1.0s : doigt → cellule "Compatible" dans stats row
      at(1000, () => {
        engine.fOpacity.setValue(1);
        move(SW * 0.17, SH * 0.195, 400);
        setCaption('Résumé instantané de tes scans');
      });

      // t=2.4s : tap → filtre compatible activé
      at(2400, () => {
        tap();
        setFilterActive(true);
        setCaption('Filtre sur les produits compatibles');
      });

      // t=4.0s : tap → filtre désactivé
      at(4000, () => {
        tap();
        setFilterActive(false);
        setCaption('');
      });

      // t=4.5s : doigt → bouton Scan
      at(4500, () => {
        move(SW * 0.5, SH * 0.305, 500);
        setCaption('Lance le scanner pour analyser un produit');
      });

      // t=6.0s : doigt → item Chips (déconseillé)
      at(6000, () => {
        move(SW * 0.5, SH * 0.455, 500);
        setCaption('');
      });

      // t=6.9s : tap → ouvre détail Chips
      at(6900, () => {
        tap();
        setPhase('detail');
        setCaption('Analyse complète de compatibilité');
      });

      // t=7.8s : doigt → badge ultra-transformé
      at(7800, () => move(SW * 0.5, SH * 0.395, 500));

      // t=9.0s : doigt → première issue (Lactose)
      at(9000, () => {
        move(SW * 0.5, SH * 0.465, 400);
        setCaption('Problèmes détectés selon ton profil');
      });

      // t=10.5s : doigt → bouton "Ajouter à la liste"
      at(10500, () => {
        move(SW * 0.37, SH * 0.635, 500);
        setCaption('');
      });

      // t=11.3s : tap → ajouté à la liste
      at(11300, () => {
        tap();
        setInList(true);
        setCaption('Ajouté à ta liste de courses');
      });

      // t=12.8s : switch → vue liste
      at(12800, () => {
        setPhase('list');
        setCaption('Ta liste de courses personnalisée');
      });

      // t=13.8s : doigt → bouton "Nutritor" sur Yaourt
      at(13800, () => move(SW * 0.72, SH * 0.285, 500));

      // t=14.6s : tap → importé dans Nutritor
      at(14600, () => {
        tap();
        setNutriAdded(true);
        setCaption('Import direct dans ta base Nutritor');
      });

      // t=16.5s : boucle
      at(16500, () => { if (isRunning.current) run(); });
    };

    run();
    return () => { isRunning.current = false; clearAll(); };
  }, [visible]);

  const filteredHistory = filterActive
    ? HISTORY.filter(h => h.verdict === 'good')
    : HISTORY;

  return (
    <DemoShell visible={visible} onClose={onClose} engine={engine} phases={PHASES} currentPhase={phase} caption={caption}>
      <View style={s.bg}>

        {/* ── TOPBAR ── */}
        <View style={s.topbar}>
          <View>
            <Text style={s.eyebrow}>Assistant</Text>
            <Text style={s.title}>Courses</Text>
          </View>
          <View style={s.iconBtnSignal} />
          <View style={s.iconBtn} />
        </View>

        {/* ══ HISTORY ═══════════════════════════════════════════ */}
        {phase === 'history' && (
          <View style={s.content}>

            {/* Stats row */}
            <Text style={s.sectionLabel}>Résumé · 6 scans</Text>
            <View style={s.statsRow}>
              {[
                { verdict: 'good',    count: 3, label: 'Compatible' },
                { verdict: 'caution', count: 2, label: 'À vérifier' },
                { verdict: 'bad',     count: 1, label: 'Déconseillé' },
              ].map(({ verdict, count, label }, i) => {
                const color  = VERDICT_COLOR[verdict];
                const active = filterActive && verdict === 'good';
                return (
                  <React.Fragment key={verdict}>
                    {i > 0 && <View style={s.statsDivider} />}
                    <View style={[s.statsCell, active && { backgroundColor: color + '12' }]}>
                      <Text style={[s.statsCount, { color }]}>{count}</Text>
                      <Text style={[s.statsLabel, active && { color }]}>{label}</Text>
                      {active && <View style={[s.statsIndicator, { backgroundColor: color }]} />}
                    </View>
                  </React.Fragment>
                );
              })}
            </View>

            {/* Scan button */}
            <View style={s.scanBtn}>
              <View style={s.scanBtnIcon} />
              <View style={{ flex: 1 }}>
                <Text style={s.scanBtnTitle}>Scanner un produit</Text>
                <Text style={s.scanBtnSub}>Analyse instantanée selon votre profil</Text>
              </View>
            </View>

            {/* History list */}
            <View style={s.sectionHeaderRow}>
              <Text style={s.sectionLabel}>
                {filterActive ? `Compatible · ${filteredHistory.length} produit` : 'Historique'}
              </Text>
            </View>
            <View style={s.card}>
              {filteredHistory.map(item => {
                const color = VERDICT_COLOR[item.verdict];
                return (
                  <View key={item.id} style={s.historyRow}>
                    <View style={[s.scoreBadge, { borderColor: color + '55' }]}>
                      <Text style={[s.scoreBadgeNum, { color }]}>{item.score}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemName}>{item.name}</Text>
                      <Text style={s.itemMeta}>{item.brand} · {item.time}</Text>
                    </View>
                    <View style={[s.verdictBadge, { backgroundColor: color + '18', borderColor: color + '44' }]}>
                      <Text style={[s.verdictText, { color }]}>{VERDICT_LABEL[item.verdict]}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

          </View>
        )}

        {/* ══ DETAIL (Chips expanded) ════════════════════════════ */}
        {phase === 'detail' && (
          <View style={s.content}>

            {/* Stats row (toujours visible) */}
            <Text style={s.sectionLabel}>Résumé · 6 scans</Text>
            <View style={s.statsRow}>
              {[
                { verdict: 'good', count: 3, label: 'Compatible' },
                { verdict: 'caution', count: 2, label: 'À vérifier' },
                { verdict: 'bad', count: 1, label: 'Déconseillé' },
              ].map(({ verdict, count, label }, i) => {
                const color = VERDICT_COLOR[verdict];
                return (
                  <React.Fragment key={verdict}>
                    {i > 0 && <View style={s.statsDivider} />}
                    <View style={s.statsCell}>
                      <Text style={[s.statsCount, { color }]}>{count}</Text>
                      <Text style={s.statsLabel}>{label}</Text>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>

            {/* Item Chips — expanded */}
            <View style={s.card}>
              {/* Main row */}
              <View style={s.historyRow}>
                <View style={[s.scoreBadge, { borderColor: Colors.warn + '55' }]}>
                  <Text style={[s.scoreBadgeNum, { color: Colors.warn }]}>28</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.itemName}>Chips Lay's</Text>
                  <Text style={s.itemMeta}>Lay's · il y a 12 min</Text>
                </View>
                <View style={[s.verdictBadge, { backgroundColor: Colors.warn + '18', borderColor: Colors.warn + '44' }]}>
                  <Text style={[s.verdictText, { color: Colors.warn }]}>Déconseillé</Text>
                </View>
              </View>

              {/* Detail panel */}
              <View style={s.detailPanel}>
                {/* Ultra badge */}
                <View style={s.ultraBadge}>
                  <Text style={s.ultraText}>⚠ Produit ultra-transformé (NOVA 4)</Text>
                </View>

                {/* Issues */}
                <Text style={s.detailSectionTitle}>Problèmes détectés</Text>
                {EXPANDED_ISSUES.map((issue, i) => (
                  <View key={i} style={s.issueRow}>
                    <View style={[s.issueDot, { backgroundColor: SEV_COLOR[issue.severity] }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.issueLabel}>{issue.label}</Text>
                      <Text style={s.issueDetail}>{issue.detail}</Text>
                    </View>
                  </View>
                ))}

                {/* Add to list button */}
                <View style={[s.addToListBtn, inList && s.addToListBtnActive]}>
                  <Text style={[s.addToListText, inList && s.addToListTextActive]}>
                    {inList ? '✓  Dans la liste de courses' : '+  Ajouter à la liste de courses'}
                  </Text>
                </View>
              </View>
            </View>

          </View>
        )}

        {/* ══ LISTE DE COURSES ═══════════════════════════════════ */}
        {phase === 'list' && (
          <View style={s.content}>

            <View style={s.sectionHeaderRow}>
              <Text style={s.sectionLabel}>Liste de courses · 2 articles</Text>
            </View>

            <View style={s.card}>
              {SHOPPING_LIST.map((item, i) => {
                const color    = VERDICT_COLOR[item.verdict];
                const isAdded  = i === 0 && nutriAdded;
                return (
                  <View key={item.id} style={s.slRow}>
                    <View style={[s.slScore, { borderColor: color + '55' }]}>
                      <Text style={[s.slScoreNum, { color }]}>{item.score}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemName}>{item.name}</Text>
                      <Text style={s.itemMeta}>{item.brand}</Text>
                    </View>
                    <View style={s.slActions}>
                      {isAdded ? (
                        <View style={s.slDoneTag}>
                          <Text style={s.slDoneText}>✓  Ajouté</Text>
                        </View>
                      ) : (
                        <View style={s.slAddBtn}>
                          <Text style={s.slAddBtnText}>+ Nutritor</Text>
                        </View>
                      )}
                      <View style={s.slRemoveBtn} />
                    </View>
                  </View>
                );
              })}
            </View>

            <Text style={s.listHint}>
              Importe un article directement dans ta base d'aliments Nutritor
            </Text>

          </View>
        )}

      </View>
    </DemoShell>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const H_PAD = 16;

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.paper },

  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: H_PAD, paddingTop: 48, paddingBottom: 10, gap: 4,
  },
  eyebrow: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: Colors.muted },
  title:   { fontFamily: Fonts.serif, fontSize: 28, color: Colors.ink, letterSpacing: -0.5 },
  iconBtn: { width: 40, height: 40, borderRadius: 20 },
  iconBtnSignal: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.signal + '55',
    backgroundColor: Colors.signal + '12',
  },

  content: { flex: 1, gap: 8, paddingTop: 4 },

  sectionLabel: {
    fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.8,
    textTransform: 'uppercase', color: Colors.muted, paddingHorizontal: H_PAD,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: H_PAD },

  // Stats row
  statsRow: {
    flexDirection: 'row', marginHorizontal: H_PAD,
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.hairline2, overflow: 'hidden',
  },
  statsCell: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 2 },
  statsDivider: { width: 1, backgroundColor: Colors.hairline2, marginVertical: 10 },
  statsCount: { fontFamily: Fonts.serif, fontSize: 26, letterSpacing: -0.5 },
  statsLabel: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.muted },
  statsIndicator: { position: 'absolute', bottom: 0, left: 16, right: 16, height: 2, borderRadius: 1 },

  // Scan button
  scanBtn: {
    marginHorizontal: H_PAD,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.ink, borderRadius: 18, padding: 16,
  },
  scanBtnIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)' },
  scanBtnTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.paper2 },
  scanBtnSub:   { fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  // Card
  card: {
    marginHorizontal: H_PAD,
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.hairline2, overflow: 'hidden',
  },

  // History item
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.hairline2,
  },
  scoreBadge: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card, flexShrink: 0,
  },
  scoreBadgeNum: { fontFamily: Fonts.serif, fontSize: 17, letterSpacing: -0.5 },
  itemName: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.ink },
  itemMeta: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted, marginTop: 2 },
  verdictBadge: { borderWidth: 1, borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9 },
  verdictText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' },

  // Detail panel
  detailPanel: {
    backgroundColor: Colors.paper2,
    paddingHorizontal: 14, paddingBottom: 14, paddingTop: 6, gap: 6,
  },
  ultraBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(196,125,10,0.08)', borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(196,125,10,0.2)',
    paddingVertical: 6, paddingHorizontal: 10, marginBottom: 4,
  },
  ultraText: { fontFamily: Fonts.sans, fontSize: 11, color: '#c47d0a' },
  detailSectionTitle: {
    fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1.5,
    textTransform: 'uppercase', color: Colors.muted, marginBottom: 4,
  },
  issueRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 6 },
  issueDot: { width: 7, height: 7, borderRadius: 4, marginTop: 4, flexShrink: 0 },
  issueLabel:  { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.ink },
  issueDetail: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted, lineHeight: 15, marginTop: 1 },
  addToListBtn: {
    marginTop: 6, flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 100,
    borderWidth: 1, borderColor: Colors.hairline,
    backgroundColor: Colors.card, alignSelf: 'flex-start',
  },
  addToListBtnActive: { borderColor: Colors.ok + '33', backgroundColor: Colors.ok + '0d' },
  addToListText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.ink },
  addToListTextActive: { color: Colors.ok },

  // Shopping list
  slRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.hairline2,
  },
  slScore: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card, flexShrink: 0 },
  slScoreNum: { fontFamily: Fonts.serif, fontSize: 14, letterSpacing: -0.4 },
  slActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  slAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.ink, borderRadius: 100, paddingVertical: 7, paddingHorizontal: 12 },
  slAddBtnText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.paper2, letterSpacing: 0.3 },
  slDoneTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.ok + '0d', borderRadius: 100, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.ok + '33' },
  slDoneText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.ok },
  slRemoveBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: Colors.hairline, backgroundColor: Colors.card },

  listHint: {
    fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted,
    textAlign: 'center', paddingHorizontal: 24, lineHeight: 18,
  },
});
