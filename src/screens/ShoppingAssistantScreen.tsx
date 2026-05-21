/**
 * ShoppingAssistantScreen — tab 'shopping'
 * Page d'accueil de l'assistant de courses :
 * historique des scans + bouton pour lancer le scanner.
 */
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { Colors, Fonts } from '../theme/tokens';
import { ScanHistoryEntry } from '../types/shopping';
import { verdictColor, verdictLabel } from '../services/compatibilityEngine';

// ── Time ago helper ────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min  = Math.floor(diff / 60_000);
  const hr   = Math.floor(diff / 3_600_000);
  const day  = Math.floor(diff / 86_400_000);
  if (min < 2)  return 'à l\'instant';
  if (min < 60) return `il y a ${min} min`;
  if (hr < 24)  return `il y a ${hr}h`;
  return `il y a ${day}j`;
}

// ── Score badge ────────────────────────────────────────────────

function ScoreBadge({ score, verdict }: { score: number; verdict: ScanHistoryEntry['verdict'] }) {
  const color = verdictColor(verdict);
  return (
    <View style={[badge.wrap, { borderColor: color + '55' }]}>
      <Text style={[badge.score, { color }]}>{score}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  score: { fontFamily: Fonts.serif, fontSize: 18, letterSpacing: -0.5 },
});

// ── Stats row ──────────────────────────────────────────────────

function StatsRow({ history }: { history: ScanHistoryEntry[] }) {
  if (history.length === 0) return null;
  const good    = history.filter((h) => h.verdict === 'good').length;
  const caution = history.filter((h) => h.verdict === 'caution').length;
  const bad     = history.filter((h) => h.verdict === 'bad').length;

  return (
    <View style={stats.row}>
      <View style={stats.cell}>
        <Text style={[stats.count, { color: verdictColor('good') }]}>{good}</Text>
        <Text style={stats.label}>Compatible</Text>
      </View>
      <View style={stats.divider} />
      <View style={stats.cell}>
        <Text style={[stats.count, { color: verdictColor('caution') }]}>{caution}</Text>
        <Text style={stats.label}>À vérifier</Text>
      </View>
      <View style={stats.divider} />
      <View style={stats.cell}>
        <Text style={[stats.count, { color: verdictColor('bad') }]}>{bad}</Text>
        <Text style={stats.label}>Déconseillé</Text>
      </View>
    </View>
  );
}

const stats = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 2 },
  divider: { width: 1, backgroundColor: Colors.hairline2, marginVertical: 10 },
  count: { fontFamily: Fonts.serif, fontSize: 26, letterSpacing: -0.5 },
  label: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.muted },
});

// ── History item ───────────────────────────────────────────────

function HistoryItem({ entry }: { entry: ScanHistoryEntry }) {
  const vColor = verdictColor(entry.verdict);
  const vLabel = verdictLabel(entry.verdict);
  return (
    <View style={item.wrap}>
      <ScoreBadge score={entry.score} verdict={entry.verdict} />
      <View style={item.text}>
        <Text style={item.name} numberOfLines={1}>{entry.productName}</Text>
        <View style={item.meta}>
          {entry.brand ? <Text style={item.brand} numberOfLines={1}>{entry.brand} · </Text> : null}
          <Text style={item.time}>{timeAgo(entry.ts)}</Text>
        </View>
      </View>
      <View style={[item.verdictBadge, { backgroundColor: vColor + '18', borderColor: vColor + '44' }]}>
        <Text style={[item.verdictText, { color: vColor }]}>{vLabel}</Text>
      </View>
    </View>
  );
}

const item = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.hairline2,
  },
  text: { flex: 1 },
  name: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.ink },
  meta: { flexDirection: 'row', marginTop: 2 },
  brand: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted },
  time:  { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted2 },
  verdictBadge: {
    borderWidth: 1, borderRadius: 100,
    paddingVertical: 3, paddingHorizontal: 9,
  },
  verdictText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' },
});

// ── Main screen ────────────────────────────────────────────────

interface Props {
  scanHistory: ScanHistoryEntry[];
  onOpenMenu: () => void;
  onOpenScanner: () => void;
  onClearHistory: () => void;
}

export function ShoppingAssistantScreen({
  scanHistory,
  onOpenMenu,
  onOpenScanner,
  onClearHistory,
}: Props) {
  const insets = useSafeAreaInsets();
  const sorted = [...scanHistory].sort((a, b) => b.ts - a.ts);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <Text style={styles.eyebrow}>Assistant</Text>
          <Text style={styles.title}>Courses</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={onOpenMenu} activeOpacity={0.7}>
          <Icon name="menu" size={22} color={Colors.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Stats */}
        {scanHistory.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Résumé · {scanHistory.length} scan{scanHistory.length > 1 ? 's' : ''}</Text>
            <StatsRow history={scanHistory} />
          </>
        )}

        {/* Scan CTA */}
        <TouchableOpacity style={styles.scanBtn} onPress={onOpenScanner} activeOpacity={0.85}>
          <View style={styles.scanBtnIcon}>
            <Icon name="scan" size={26} color={Colors.paper2} />
          </View>
          <View style={styles.scanBtnText}>
            <Text style={styles.scanBtnTitle}>Scanner un produit</Text>
            <Text style={styles.scanBtnSub}>Analyse instantanée selon votre profil</Text>
          </View>
          <Icon name="chevron-right" size={18} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        {/* History */}
        {sorted.length > 0 ? (
          <>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionLabel}>Historique</Text>
              <TouchableOpacity onPress={onClearHistory} activeOpacity={0.7}>
                <Text style={styles.clearText}>Effacer</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.historyCard}>
              {sorted.map((entry) => (
                <HistoryItem key={entry.id} entry={entry} />
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="shopping-cart" size={36} color={Colors.muted2} />
            <Text style={styles.emptyTitle}>Aucun scan pour l'instant</Text>
            <Text style={styles.emptyDesc}>
              Scanne un produit pendant tes courses pour savoir immédiatement s'il est compatible avec ton profil.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  topbarLeft: {},
  iconBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: Fonts.mono, fontSize: 9,
    letterSpacing: 2, textTransform: 'uppercase', color: Colors.muted,
  },
  title: {
    fontFamily: Fonts.serif, fontSize: 28, color: Colors.ink, letterSpacing: -0.5,
  },

  content: { paddingTop: 8, paddingBottom: 48, gap: 10 },

  sectionLabel: {
    fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.8,
    textTransform: 'uppercase', color: Colors.muted,
    paddingHorizontal: 16,
  },

  scanBtn: {
    marginHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.ink, borderRadius: 18,
    padding: 18,
  },
  scanBtnIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  scanBtnText: { flex: 1 },
  scanBtnTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 16, color: Colors.paper2 },
  scanBtnSub:   { fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  historyHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
  },
  clearText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted },

  historyCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    overflow: 'hidden',
  },

  emptyState: {
    alignItems: 'center', gap: 12,
    paddingVertical: 48, paddingHorizontal: 32,
  },
  emptyTitle: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.ink, letterSpacing: -0.3 },
  emptyDesc: {
    fontFamily: Fonts.sans, fontSize: 14, color: Colors.muted,
    textAlign: 'center', lineHeight: 20,
  },
});
