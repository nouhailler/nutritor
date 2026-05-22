/**
 * ShoppingAssistantScreen — tab 'shopping'
 * - Boutons de verdict cliquables → filtre l'historique + affiche le détail "pourquoi"
 * - Tap sur un article → l'ajoute/retire de la liste de courses
 * - Section "Liste de courses" : bouton pour ajouter à la base Nutritor
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { Colors, Fonts } from '../theme/tokens';
import { CompatibilityIssue, ScanHistoryEntry, ShoppingListItem } from '../types/shopping';
import { severityColor, verdictColor, verdictLabel } from '../services/compatibilityEngine';

// ── Helpers ────────────────────────────────────────────────────

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
    backgroundColor: Colors.card, flexShrink: 0,
  },
  score: { fontFamily: Fonts.serif, fontSize: 18, letterSpacing: -0.5 },
});

// ── Issue row (compact, for detail panel) ─────────────────────

function IssueRow({ issue }: { issue: CompatibilityIssue }) {
  return (
    <View style={detail.issueRow}>
      <View style={[detail.dot, { backgroundColor: severityColor(issue.severity) }]} />
      <View style={{ flex: 1 }}>
        <Text style={detail.issueLabel}>{issue.label}</Text>
        <Text style={detail.issueDetail}>{issue.detail}</Text>
      </View>
    </View>
  );
}

const detail = StyleSheet.create({
  issueRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  issueLabel: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.ink },
  issueDetail: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted, lineHeight: 15, marginTop: 1 },
  positiveRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 },
  positiveText: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.ink, flex: 1 },
});

// ── Stats row (clickable) ──────────────────────────────────────

type VerdictFilter = 'good' | 'caution' | 'bad' | null;

function StatsRow({
  history,
  activeFilter,
  onFilter,
}: {
  history: ScanHistoryEntry[];
  activeFilter: VerdictFilter;
  onFilter: (v: VerdictFilter) => void;
}) {
  if (history.length === 0) return null;
  const counts = {
    good:    history.filter((h) => h.verdict === 'good').length,
    caution: history.filter((h) => h.verdict === 'caution').length,
    bad:     history.filter((h) => h.verdict === 'bad').length,
  };

  const cells: { verdict: 'good' | 'caution' | 'bad'; label: string }[] = [
    { verdict: 'good',    label: 'Compatible' },
    { verdict: 'caution', label: 'À vérifier' },
    { verdict: 'bad',     label: 'Déconseillé' },
  ];

  return (
    <View style={stats.row}>
      {cells.map(({ verdict, label }, i) => {
        const color   = verdictColor(verdict);
        const active  = activeFilter === verdict;
        return (
          <React.Fragment key={verdict}>
            {i > 0 && <View style={stats.divider} />}
            <TouchableOpacity
              style={[stats.cell, active && { backgroundColor: color + '12' }]}
              onPress={() => onFilter(active ? null : verdict)}
              activeOpacity={0.7}
            >
              <Text style={[stats.count, { color }]}>{counts[verdict]}</Text>
              <Text style={[stats.label, active && { color }]}>{label}</Text>
              {active && <View style={[stats.indicator, { backgroundColor: color }]} />}
            </TouchableOpacity>
          </React.Fragment>
        );
      })}
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
    overflow: 'hidden',
  },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 2 },
  divider: { width: 1, backgroundColor: Colors.hairline2, marginVertical: 10 },
  count: { fontFamily: Fonts.serif, fontSize: 26, letterSpacing: -0.5 },
  label: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.muted },
  indicator: { position: 'absolute', bottom: 0, left: 16, right: 16, height: 2, borderRadius: 1 },
});

// ── History item (tappable, expandable) ───────────────────────

function HistoryItem({
  entry,
  expanded,
  inShoppingList,
  onPress,
  onToggleShoppingList,
}: {
  entry: ScanHistoryEntry;
  expanded: boolean;
  inShoppingList: boolean;
  onPress: () => void;
  onToggleShoppingList: () => void;
}) {
  const vColor = verdictColor(entry.verdict);
  const vLabel = verdictLabel(entry.verdict);

  return (
    <View style={hitem.wrap}>
      {/* Main row */}
      <TouchableOpacity style={hitem.row} onPress={onPress} activeOpacity={0.7}>
        <ScoreBadge score={entry.score} verdict={entry.verdict} />
        <View style={hitem.text}>
          <Text style={hitem.name} numberOfLines={1}>{entry.productName}</Text>
          <View style={hitem.meta}>
            {entry.brand ? <Text style={hitem.brand}>{entry.brand} · </Text> : null}
            <Text style={hitem.time}>{timeAgo(entry.ts)}</Text>
          </View>
        </View>
        <View style={hitem.right}>
          <View style={[hitem.verdictBadge, { backgroundColor: vColor + '18', borderColor: vColor + '44' }]}>
            <Text style={[hitem.verdictText, { color: vColor }]}>{vLabel}</Text>
          </View>
          <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.muted2} />
        </View>
      </TouchableOpacity>

      {/* Expanded detail */}
      {expanded && (
        <View style={hitem.detail}>
          {entry.ultraProcessed && (
            <View style={hitem.ultraBadge}>
              <Icon name="alert-triangle" size={12} color="#c47d0a" />
              <Text style={hitem.ultraText}>Produit ultra-transformé (NOVA 4)</Text>
            </View>
          )}
          {entry.issues.length > 0 && (
            <View style={hitem.section}>
              <Text style={hitem.sectionTitle}>Problèmes détectés</Text>
              {entry.issues.map((issue, i) => <IssueRow key={i} issue={issue} />)}
            </View>
          )}
          {entry.positives.length > 0 && (
            <View style={hitem.section}>
              <Text style={hitem.sectionTitle}>Points positifs</Text>
              {entry.positives.map((p, i) => (
                <View key={i} style={detail.positiveRow}>
                  <Icon name="check" size={12} color="#2d8a4e" />
                  <Text style={detail.positiveText}>{p}</Text>
                </View>
              ))}
            </View>
          )}
          {/* Add to shopping list button */}
          <TouchableOpacity
            style={[hitem.addBtn, inShoppingList && hitem.addBtnActive]}
            onPress={onToggleShoppingList}
            activeOpacity={0.8}
          >
            <Icon
              name={inShoppingList ? 'check' : 'shopping-cart'}
              size={14}
              color={inShoppingList ? '#2d8a4e' : Colors.ink}
            />
            <Text style={[hitem.addBtnText, inShoppingList && { color: '#2d8a4e' }]}>
              {inShoppingList ? 'Dans la liste de courses' : 'Ajouter à la liste de courses'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const hitem = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  text: { flex: 1 },
  name: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.ink },
  meta: { flexDirection: 'row', marginTop: 2 },
  brand: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted },
  time:  { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted2 },
  right: { alignItems: 'flex-end', gap: 4 },
  verdictBadge: {
    borderWidth: 1, borderRadius: 100,
    paddingVertical: 3, paddingHorizontal: 9,
  },
  verdictText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' },
  detail: {
    backgroundColor: Colors.paper2,
    paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4,
    gap: 6,
  },
  ultraBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(196,125,10,0.08)',
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(196,125,10,0.2)',
    paddingVertical: 6, paddingHorizontal: 10, marginBottom: 4,
  },
  ultraText: { fontFamily: Fonts.sans, fontSize: 11, color: '#c47d0a', flex: 1 },
  section: { marginBottom: 4 },
  sectionTitle: {
    fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1.5,
    textTransform: 'uppercase', color: Colors.muted, marginBottom: 6,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 8,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 100, borderWidth: 1, borderColor: Colors.hairline,
    backgroundColor: Colors.card, alignSelf: 'flex-start',
  },
  addBtnActive: {
    borderColor: '#2d8a4e33',
    backgroundColor: '#2d8a4e0d',
  },
  addBtnText: {
    fontFamily: Fonts.sans, fontSize: 13, color: Colors.ink,
  },
});

// ── Shopping list item ─────────────────────────────────────────

function ShoppingItem({
  item,
  onAddToNutritor,
  onRemove,
  loading,
}: {
  item: ShoppingListItem;
  onAddToNutritor: () => void;
  onRemove: () => void;
  loading: boolean;
}) {
  const vColor = verdictColor(item.verdict);
  return (
    <View style={sl.wrap}>
      <View style={[sl.scoreCircle, { borderColor: vColor + '55' }]}>
        <Text style={[sl.score, { color: vColor }]}>{item.score}</Text>
      </View>
      <View style={sl.text}>
        <Text style={sl.name} numberOfLines={1}>{item.productName}</Text>
        {item.brand ? <Text style={sl.brand} numberOfLines={1}>{item.brand}</Text> : null}
      </View>
      <View style={sl.actions}>
        {item.addedToNutritor ? (
          <View style={sl.doneTag}>
            <Icon name="check" size={11} color="#2d8a4e" />
            <Text style={sl.doneText}>Ajouté</Text>
          </View>
        ) : (
          <TouchableOpacity style={sl.addBtn} onPress={onAddToNutritor} activeOpacity={0.8} disabled={loading}>
            {loading
              ? <ActivityIndicator size="small" color={Colors.paper2} />
              : <><Icon name="plus" size={13} color={Colors.paper2} /><Text style={sl.addBtnText}>Nutritor</Text></>
            }
          </TouchableOpacity>
        )}
        <TouchableOpacity style={sl.removeBtn} onPress={onRemove} activeOpacity={0.7}>
          <Icon name="close" size={13} color={Colors.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const sl = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.hairline2,
  },
  scoreCircle: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card, flexShrink: 0,
  },
  score: { fontFamily: Fonts.serif, fontSize: 15, letterSpacing: -0.4 },
  text: { flex: 1 },
  name: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink },
  brand: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.ink, borderRadius: 100,
    paddingVertical: 7, paddingHorizontal: 12,
  },
  addBtnText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.paper2, letterSpacing: 0.3 },
  doneTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#2d8a4e0d', borderRadius: 100,
    paddingVertical: 6, paddingHorizontal: 10,
    borderWidth: 1, borderColor: '#2d8a4e33',
  },
  doneText: { fontFamily: Fonts.mono, fontSize: 10, color: '#2d8a4e' },
  removeBtn: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.hairline, backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ── Main screen ────────────────────────────────────────────────

interface Props {
  scanHistory: ScanHistoryEntry[];
  shoppingList: ShoppingListItem[];
  onOpenMenu: () => void;
  onOpenScanner: () => void;
  onClearHistory: () => void;
  onToggleShoppingList: (entry: ScanHistoryEntry) => void;
  onAddToNutritor: (item: ShoppingListItem) => Promise<void>;
  onRemoveFromShoppingList: (itemId: string) => void;
  onStartDemo?: () => void;
}

export function ShoppingAssistantScreen({
  scanHistory,
  shoppingList,
  onOpenMenu,
  onOpenScanner,
  onClearHistory,
  onToggleShoppingList,
  onAddToNutritor,
  onRemoveFromShoppingList,
  onStartDemo,
}: Props) {
  const insets = useSafeAreaInsets();
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const sorted = [...scanHistory].sort((a, b) => b.ts - a.ts);
  const filtered = verdictFilter ? sorted.filter((e) => e.verdict === verdictFilter) : sorted;
  const shoppingIds = new Set(shoppingList.map((i) => i.id));

  const handleNutritor = async (item: ShoppingListItem) => {
    setLoadingId(item.id);
    try {
      await onAddToNutritor(item);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <View>
          <Text style={styles.eyebrow}>Assistant</Text>
          <Text style={styles.title}>Courses</Text>
        </View>
        <View style={styles.topbarActions}>
          {onStartDemo && (
            <TouchableOpacity style={styles.iconBtnSignal} onPress={onStartDemo} activeOpacity={0.7}>
              <Icon name="activity" size={18} color={Colors.signal} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconBtn} onPress={onOpenMenu} activeOpacity={0.7}>
            <Icon name="menu" size={22} color={Colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Stats */}
        {scanHistory.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>
              Résumé · {scanHistory.length} scan{scanHistory.length > 1 ? 's' : ''}
              {verdictFilter ? ` · filtre actif` : ''}
            </Text>
            <StatsRow
              history={scanHistory}
              activeFilter={verdictFilter}
              onFilter={setVerdictFilter}
            />
            {verdictFilter && (
              <Text style={styles.filterHint}>
                Appuie à nouveau sur le bouton pour annuler le filtre
              </Text>
            )}
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

        {/* Scan history */}
        {filtered.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>
                {verdictFilter
                  ? `${verdictLabel(verdictFilter)} · ${filtered.length} produit${filtered.length > 1 ? 's' : ''}`
                  : 'Historique'}
              </Text>
              {!verdictFilter && (
                <TouchableOpacity onPress={onClearHistory} activeOpacity={0.7}>
                  <Text style={styles.clearText}>Effacer</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.card}>
              {filtered.map((entry) => (
                <HistoryItem
                  key={entry.id}
                  entry={entry}
                  expanded={expandedId === entry.id || verdictFilter !== null}
                  inShoppingList={shoppingIds.has(entry.id)}
                  onPress={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  onToggleShoppingList={() => onToggleShoppingList(entry)}
                />
              ))}
            </View>
          </>
        ) : sorted.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="shopping-cart" size={36} color={Colors.muted2} />
            <Text style={styles.emptyTitle}>Aucun scan pour l'instant</Text>
            <Text style={styles.emptyDesc}>
              Scanne un produit pendant tes courses pour savoir immédiatement s'il est compatible avec ton profil.
            </Text>
          </View>
        ) : (
          <View style={styles.emptyFilter}>
            <Text style={styles.emptyFilterText}>Aucun produit dans cette catégorie</Text>
          </View>
        )}

        {/* Shopping list */}
        {shoppingList.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>
                Liste de courses · {shoppingList.length} article{shoppingList.length > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.card}>
              {shoppingList.map((item) => (
                <ShoppingItem
                  key={item.id}
                  item={item}
                  loading={loadingId === item.id}
                  onAddToNutritor={() => handleNutritor(item)}
                  onRemove={() => onRemoveFromShoppingList(item.id)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },

  topbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    justifyContent: 'space-between',
  },
  topbarActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  iconBtnSignal: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.signal + '55',
    backgroundColor: Colors.signal + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: Fonts.mono, fontSize: 9,
    letterSpacing: 2, textTransform: 'uppercase', color: Colors.muted,
  },
  title: { fontFamily: Fonts.serif, fontSize: 28, color: Colors.ink, letterSpacing: -0.5 },

  content: { paddingTop: 8, paddingBottom: 48, gap: 10 },

  sectionLabel: {
    fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.8,
    textTransform: 'uppercase', color: Colors.muted, paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
  },
  clearText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted },

  filterHint: {
    fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted2,
    paddingHorizontal: 16, marginTop: -4,
  },

  scanBtn: {
    marginHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.ink, borderRadius: 18, padding: 18,
  },
  scanBtnIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  scanBtnText: { flex: 1 },
  scanBtnTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 16, color: Colors.paper2 },
  scanBtnSub:   { fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  card: {
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
  emptyFilter: {
    alignItems: 'center', paddingVertical: 24,
  },
  emptyFilterText: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.muted2 },
});
