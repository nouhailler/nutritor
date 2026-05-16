import React, { useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import {
  RECENT,
  SEARCH_FILTERS,
  SearchFilter,
  SearchResult,
  TagKind,
} from '../data/search';
import { useDebounce } from '../hooks/useDebounce';
import { Colors, Fonts } from '../theme/tokens';
import { Food } from '../types';

function foodToSearchResult(food: Food): SearchResult {
  const kcal = Math.round((food.per100.kcal * food.defaultPortion) / 100);
  return {
    id: food.id,
    name: food.name,
    brand: food.brand,
    portion: `${food.defaultPortion} ${food.unit}`,
    kcal,
    glyph: food.name.charAt(0).toUpperCase(),
    tags: food.compat.map((c) => ({ label: c.label, kind: c.kind as TagKind })),
    macros: {
      protein: food.per100.protein,
      carbs: food.per100.carbs,
      fat: food.per100.fat,
    },
  };
}

// ── Tag pill ─────────────────────────────────────────────────

function TagPill({ label, kind }: { label: string; kind: TagKind }) {
  const tagStyle =
    kind === 'ok'   ? styles.tagOk :
    kind === 'warn' ? styles.tagWarn :
    styles.tag;
  const textStyle =
    kind === 'ok'   ? styles.tagTextOk :
    kind === 'warn' ? styles.tagTextWarn :
    styles.tagText;
  return (
    <View style={tagStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

// ── Result row ───────────────────────────────────────────────

function ResultRow({
  name, brand, portion, kcal, glyph, tags, onPress,
}: {
  name: string;
  brand: string;
  portion: string;
  kcal: number;
  glyph: string;
  tags: SearchResult['tags'];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.thumb}>
        <Text style={styles.thumbGlyph}>{glyph}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.bodyName} numberOfLines={1}>{name}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaBrand}>{brand.toUpperCase()}</Text>
          <Text style={styles.metaPortion}>· {portion}</Text>
        </View>
        <View style={styles.tags}>
          {tags.map((t, i) => <TagPill key={i} label={t.label} kind={t.kind} />)}
        </View>
      </View>
      <Text style={styles.kcalRight}>
        {kcal}<Text style={styles.kcalUnit}> kcal</Text>
      </Text>
    </TouchableOpacity>
  );
}

// ── Section header ────────────────────────────────────────────

function SectionLabel({ left, right }: { left: string; right?: string }) {
  return (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionLabelText}>{left}</Text>
      {right ? <Text style={styles.sectionCount}>{right}</Text> : null}
    </View>
  );
}

// ── Search screen ─────────────────────────────────────────────

interface Props {
  foodList: Food[];
  onBack: () => void;
  onPickItem: (food: Food) => void;
  onAddWithAI: () => void;
  onOpenFoodFacts: () => void;
  onOpenCIQUAL: () => void;
  onOpenScanner: () => void;
}

export function SearchScreen({ foodList, onBack, onPickItem, onAddWithAI, onOpenFoodFacts, onOpenCIQUAL, onOpenScanner }: Props) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [filters, setFilters] = useState<SearchFilter[]>(SEARCH_FILTERS);

  const toggle = (id: string) =>
    setFilters((fs) => fs.map((f) => (f.id === id ? { ...f, active: !f.active } : f)));

  const allResults = foodList.map(foodToSearchResult);
  const filtered = allResults.filter(
    (item) => !debouncedQuery || item.name.toLowerCase().includes(debouncedQuery.toLowerCase())
  );
  const compatible   = filtered.filter((i) => !i.incompatible);
  const incompatible = filtered.filter((i) => i.incompatible);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
            <Icon name="back" size={20} color={Colors.ink} />
          </TouchableOpacity>
          <View>
            <Text style={styles.eyebrow}>Étape 1 sur 3</Text>
            <Text style={styles.title}>Ajouter un aliment</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={onOpenScanner}>
          <Icon name="scan" size={20} color={Colors.ink} />
        </TouchableOpacity>
      </View>

      {/* Search input */}
      <View style={styles.searchHead}>
        <View style={styles.searchInput}>
          <Icon name="search" size={18} color={Colors.muted2} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Rechercher un aliment, une marque…"
            placeholderTextColor={Colors.muted2}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
              <Text style={styles.clearBtn}>Effacer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterStrip}
      >
        <TouchableOpacity style={styles.chip} activeOpacity={0.7}>
          <Icon name="sliders" size={14} color={Colors.ink2} />
          <Text style={styles.chipText}>Filtres</Text>
        </TouchableOpacity>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.chip, f.active && styles.chipActive]}
            onPress={() => toggle(f.id)}
            activeOpacity={0.7}
          >
            {f.active && <Icon name="check" size={12} color={Colors.paper2} />}
            <Text style={[styles.chipText, f.active && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Compatible */}
        <SectionLabel
          left="Résultats compatibles"
          right={`${compatible.length} aliment${compatible.length !== 1 ? 's' : ''}`}
        />
        {compatible.map((item) => (
          <ResultRow
            key={item.id}
            name={item.name}
            brand={item.brand}
            portion={item.portion}
            kcal={item.kcal}
            glyph={item.glyph}
            tags={item.tags}
            onPress={() => {
              const food = foodList.find((f) => f.id === item.id);
              if (food) onPickItem(food);
            }}
          />
        ))}

        {/* Incompatible */}
        {incompatible.length > 0 && (
          <>
            <SectionLabel left="Filtré · ne correspond pas à ton profil" />
            <View style={{ opacity: 0.55 }}>
              {incompatible.map((item) => (
                <ResultRow
                  key={item.id}
                  name={item.name}
                  brand={item.brand}
                  portion={item.portion}
                  kcal={item.kcal}
                  glyph={item.glyph}
                  tags={item.tags}
                  onPress={() => {
                    const food = foodList.find((f) => f.id === item.id);
                    if (food) onPickItem(food);
                  }}
                />
              ))}
            </View>
          </>
        )}

        {/* Recents */}
        <SectionLabel left="Récents" />
        {RECENT.map((item) => (
          <ResultRow
            key={item.id}
            name={item.name}
            brand={item.brand}
            portion={item.portion}
            kcal={item.kcal}
            glyph={item.glyph}
            tags={[{ label: 'récent', kind: '' }]}
            onPress={() => {
              const food = foodList.find((f) => f.id === item.id);
              if (food) onPickItem(food);
            }}
          />
        ))}

        {/* Add with AI / OFF */}
        <View style={styles.aiSection}>
          <View style={styles.aiDivider}>
            <View style={styles.aiDividerLine} />
            <Text style={styles.aiDividerText}>ajouter un aliment</Text>
            <View style={styles.aiDividerLine} />
          </View>
          <View style={styles.addBtns}>
            <TouchableOpacity style={styles.ciqualBtn} onPress={onOpenCIQUAL} activeOpacity={0.8}>
              <Icon name="database" size={14} color={Colors.signal} />
              <Text style={styles.ciqualBtnText}>CIQUAL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.offBtn} onPress={onOpenFoodFacts} activeOpacity={0.8}>
              <Icon name="search" size={14} color={Colors.ok} />
              <Text style={styles.offBtnText}>Open Food Facts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.aiBtn} onPress={onAddWithAI} activeOpacity={0.8}>
              <Icon name="sparkle" size={14} color={Colors.paper2} />
              <Text style={styles.aiBtnText}>IA</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.aiHint}>CIQUAL · 3 167 FR  ·  OFF · 3M mondial  ·  IA · données complètes</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    lineHeight: 24,
    letterSpacing: -0.4,
    color: Colors.ink,
    marginTop: 2,
  },

  searchHead: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14 },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 100,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.ink,
    padding: 0,
  },
  clearBtn: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.muted,
  },

  filterStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  chipText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink2,
  },
  chipTextActive: {
    color: Colors.paper2,
  },

  sectionLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  sectionLabelText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  sectionCount: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.muted2,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  thumb: {
    width: 52, height: 52,
    borderRadius: 14,
    backgroundColor: Colors.paper2,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbGlyph: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.ink,
  },
  body: { flex: 1, minWidth: 0 },
  bodyName: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    letterSpacing: -0.1,
    lineHeight: 18,
    color: Colors.ink,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  metaBrand: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.5,
    color: Colors.muted,
  },
  metaPortion: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted,
  },
  tags: { flexDirection: 'row', gap: 6, marginTop: 6 },
  tag: {
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  tagOk: {
    borderWidth: 1,
    borderColor: 'rgba(63,90,58,0.3)',
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  tagWarn: {
    borderWidth: 1,
    borderColor: 'rgba(139,58,46,0.3)',
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  tagText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  tagTextOk: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.ok,
  },
  tagTextWarn: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.warn,
  },

  kcalRight: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    letterSpacing: -0.2,
    color: Colors.ink,
  },
  kcalUnit: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    color: Colors.muted,
  },

  aiSection: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 12 },
  aiDivider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiDividerLine: { flex: 1, height: 1, backgroundColor: Colors.hairline2 },
  aiDividerText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted2,
  },
  addBtns: { flexDirection: 'row', gap: 6 },
  ciqualBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 100,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: 'rgba(107,90,46,0.35)',
    backgroundColor: 'rgba(107,90,46,0.07)',
  },
  ciqualBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.signal,
  },
  offBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 100,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: 'rgba(63,90,58,0.35)',
    backgroundColor: 'rgba(63,90,58,0.07)',
  },
  offBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.ok,
  },
  aiBtn: {
    flex: 0.7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Colors.ink,
    borderRadius: 100,
    paddingVertical: 13,
  },
  aiBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.paper2,
  },
  aiHint: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.muted2,
    textAlign: 'center',
  },
});
