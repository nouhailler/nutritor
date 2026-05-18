/**
 * CIQUALScreen — stack 'ciqual'
 * Recherche dans la base CIQUAL 2020 embarquée (3 167 aliments français).
 * Chips de catégories, enrichissement optionnel via IA, import direct dans la bibliothèque.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { HelpButton, HelpModal } from '../components/HelpModal';
import { HELP } from '../data/helpContent';
import { Colors, Fonts } from '../theme/tokens';
import { Food } from '../types';
import { AppSettings } from '../types/settings';
import { CIQUALEntry, CIQUAL_DATA, ciqualToFood, searchCIQUAL } from '../services/ciqual';
import { enrichFoodWithAI, isAIReady } from '../services/aiService';
import { aiQueue } from '../services/aiQueue';

// ── Result row ─────────────────────────────────────────────────

function ResultRow({
  entry,
  imported,
  onImport,
}: {
  entry: CIQUALEntry;
  imported: boolean;
  onImport: () => void;
}) {
  const glyph = entry.name.charAt(0).toUpperCase();

  return (
    <View style={styles.row}>
      <View style={styles.glyph}>
        <Text style={styles.glyphText}>{glyph}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={2}>{entry.name}</Text>
        <Text style={styles.rowGroup} numberOfLines={1}>{entry.sub || entry.group}</Text>
        <View style={styles.pills}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{entry.kcal} kcal</Text>
          </View>
          {entry.protein > 0 && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{entry.protein}g prot.</Text>
            </View>
          )}
          {entry.fiber > 0 && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{entry.fiber}g fibres</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[styles.importBtn, imported && styles.importBtnDone]}
        onPress={onImport}
        activeOpacity={0.7}
        disabled={imported}
      >
        {imported ? (
          <Icon name="check" size={16} color={Colors.ok} />
        ) : (
          <Icon name="plus" size={16} color={Colors.ink} />
        )}
      </TouchableOpacity>
    </View>
  );
}

// ── Group badge ────────────────────────────────────────────────

function GroupChip({ label, icon, active, onPress }: { label: string; icon: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.groupChip, active && styles.groupChipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.groupChipIcon}>{icon}</Text>
      <Text style={[styles.groupChipText, active && styles.groupChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────

const GROUPS: { label: string; icon: string }[] = [
  { label: 'Céréales',          icon: '🌾' },
  { label: 'Légumineuses',      icon: '🌱' },
  { label: 'Viandes',           icon: '🥩' },
  { label: 'Poissons',          icon: '🐟' },
  { label: 'Fruits',            icon: '🍎' },
  { label: 'Légumes',           icon: '🥦' },
  { label: 'Produits laitiers', icon: '🥛' },
  { label: 'Corps gras',        icon: '🧈' },
  { label: 'Boissons',          icon: '🥤' },
];

function matchesGroup(entry: CIQUALEntry, group: string): boolean {
  const g = (entry.group + ' ' + (entry.sub ?? '')).toLowerCase();
  switch (group) {
    case 'Céréales':       return g.includes('céréale') || g.includes('pain') || g.includes('pâte') || g.includes('riz') || g.includes('farine');
    case 'Légumineuses':   return g.includes('légumineuse') || g.includes('lentille') || g.includes('pois') || g.includes('haricot') || g.includes('fève');
    case 'Viandes':        return g.includes('viande') || g.includes('volaille') || g.includes('charcuterie') || g.includes('abats');
    case 'Poissons':       return g.includes('poisson') || g.includes('crustacé') || g.includes('mollusque') || g.includes('fruits de mer');
    case 'Fruits':         return g.includes('fruit') && !g.includes('fruits de mer') && !g.includes('à coque');
    case 'Légumes':        return g.includes('légume') || g.includes('champignon') || g.includes('herbe') || g.includes('condiment');
    case 'Produits laitiers': return g.includes('lait') || g.includes('fromage') || g.includes('yaourt') || g.includes('crème') || g.includes('beurre');
    case 'Corps gras':     return g.includes('corps gras') || g.includes('huile') || g.includes('margarine');
    case 'Boissons':       return g.includes('boisson') || g.includes('eau') || g.includes('jus') || g.includes('alcool');
    default:               return false;
  }
}

interface Props {
  existingIds: Set<string>;
  onImport: (food: Food) => void;
  onUpdateFood: (food: Food) => void;
  onBack: () => void;
  onOpenMenu: () => void;
  settings?: AppSettings;
  initialQuery?: string;
}

export function CIQUALScreen({ existingIds, onImport, onUpdateFood, onBack, onOpenMenu, settings, initialQuery = '' }: Props) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState(initialQuery);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [helpVisible, setHelpVisible] = useState(false);

  const results = useMemo(() => {
    if (query.trim().length >= 2) return searchCIQUAL(query, 40);
    if (activeGroup) return CIQUAL_DATA.filter((e) => matchesGroup(e, activeGroup)).slice(0, 40);
    return [];
  }, [query, activeGroup]);

  const handleImport = (entry: CIQUALEntry) => {
    if (isImported(entry)) return;

    const baseFood = ciqualToFood(entry);
    if (existingIds.has(baseFood.id)) {
      setImportedIds((prev) => new Set([...prev, entry.id]));
      return;
    }

    // Import immediately with partial data
    onImport(baseFood);
    setImportedIds((prev) => new Set([...prev, entry.id]));

    // Queue enrichment in background if AI is ready
    if (settings && isAIReady(settings)) {
      const capturedUpdate = onUpdateFood;
      aiQueue.add(`Enrichissement · ${entry.name}`, async () => {
        const enriched = await enrichFoodWithAI(baseFood, settings);
        capturedUpdate(enriched);
      });
    }
  };

  const isImported = (e: CIQUALEntry) =>
    importedIds.has(e.id) || existingIds.has(`ciqual-${e.id}`);

  const showIntro = query.length < 2 && !activeGroup;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
          <Icon name="back" size={20} color={Colors.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Base officielle française</Text>
          <Text style={styles.title}>CIQUAL — ANSES</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={onOpenMenu} activeOpacity={0.7}>
          <Icon name="menu" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <HelpButton onPress={() => setHelpVisible(true)} />
      </View>
      <HelpModal visible={helpVisible} content={HELP.ciqual} onClose={() => setHelpVisible(false)} />

      {/* Search input */}
      <View style={styles.searchWrap}>
        <Icon name="search" size={18} color={Colors.muted2} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Rechercher parmi 3 167 aliments…"
          placeholderTextColor={Colors.muted2}
          value={query}
          onChangeText={(t) => { setQuery(t); if (t) setActiveGroup(null); }}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
            <Text style={styles.clearBtn}>Effacer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Group filter strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.groupStrip}
      >
        {GROUPS.map((g) => (
          <GroupChip
            key={g.label}
            label={g.label}
            icon={g.icon}
            active={activeGroup === g.label}
            onPress={() => {
              setActiveGroup(activeGroup === g.label ? null : g.label);
              setQuery('');
            }}
          />
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
      >
        {/* Intro */}
        {showIntro && (
          <View style={styles.intro}>
            <Icon name="database" size={28} color={Colors.muted2} />
            <Text style={styles.introTitle}>3 167 aliments officiels</Text>
            <Text style={styles.introDesc}>
              La table CIQUAL 2020 de l'ANSES contient la composition
              nutritionnelle de référence pour les aliments consommés en France.
              {'\n\n'}
              Recherche par nom ou filtre par groupe alimentaire.
            </Text>
          </View>
        )}

        {/* Results header */}
        {results.length > 0 && (
          <View style={styles.resultHeader}>
            <Text style={styles.resultCount}>{results.length} résultats</Text>
            <Text style={styles.resultSource}>CIQUAL 2020 · ANSES</Text>
          </View>
        )}

        {/* No results */}
        {!showIntro && results.length === 0 && query.length >= 2 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptyDesc}>Essaie un autre terme ou utilise Open Food Facts pour les produits transformés.</Text>
          </View>
        )}

        {/* List */}
        {results.map((entry) => (
          <ResultRow
            key={entry.id}
            entry={entry}
            imported={isImported(entry)}
            onImport={() => handleImport(entry)}
          />
        ))}
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
    gap: 10,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: Colors.muted },
  title: { fontFamily: Fonts.serif, fontSize: 24, color: Colors.ink, letterSpacing: -0.4 },
  badge: {
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8,
    backgroundColor: Colors.signal,
  },
  badgeText: { fontFamily: Fonts.monoMedium, fontSize: 11, letterSpacing: 1, color: Colors.paper2 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: { flex: 1, fontFamily: Fonts.sans, fontSize: 15, color: Colors.ink, paddingVertical: 0 },
  clearBtn: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 1, color: Colors.muted, textTransform: 'uppercase' },

  groupStrip: { paddingHorizontal: 16, paddingBottom: 10, gap: 6, flexDirection: 'row' },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.paper2,
  },
  groupChipActive: { backgroundColor: Colors.signal, borderColor: Colors.signal },
  groupChipIcon: { fontSize: 12 },
  groupChipText: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 0.8, color: Colors.muted },
  groupChipTextActive: { color: Colors.paper2 },

  list: { paddingHorizontal: 16, gap: 8 },

  intro: { alignItems: 'center', paddingVertical: 40, gap: 14 },
  introTitle: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.ink, letterSpacing: -0.3 },
  introDesc: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

  resultHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4,
  },
  resultCount: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink },
  resultSource: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.muted2 },

  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.ink },
  emptyDesc: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 20, maxWidth: 260 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    padding: 12,
  },
  glyph: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.signal,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  glyphText: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.paper2 },
  rowBody: { flex: 1, gap: 3 },
  rowName: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink, lineHeight: 18 },
  rowGroup: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3 },
  pill: {
    paddingVertical: 2, paddingHorizontal: 7, borderRadius: 100,
    backgroundColor: Colors.paper2, borderWidth: 1, borderColor: Colors.hairline,
  },
  pillText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.5, color: Colors.muted },

  importBtn: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.hairline,
    backgroundColor: Colors.paper2,
    alignItems: 'center', justifyContent: 'center',
  },
  importBtnDone: { borderColor: 'rgba(63,90,58,0.3)', backgroundColor: 'rgba(63,90,58,0.06)' },

  enrichingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(180,100,30,0.25)',
    backgroundColor: 'rgba(180,100,30,0.06)',
  },
  enrichingTimer: {
    fontFamily: Fonts.monoMedium,
    fontSize: 12,
    color: Colors.signal,
  },
});
