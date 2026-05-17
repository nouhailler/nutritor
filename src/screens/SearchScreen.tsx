import React, { useRef, useState } from 'react';
import {
  Alert,
  Platform,
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
import {
  RECENT,
  SEARCH_FILTERS,
  SearchFilter,
  SearchFilterId,
  SearchResult,
  TagKind,
} from '../data/search';
import { useDebounce } from '../hooks/useDebounce';
import { Colors, Fonts } from '../theme/tokens';
import { Food } from '../types';
import { UserProfile } from '../data/user';
import { computeCompatibilityScore, CompatibilityResult } from '../data/compatibilityScore';
import { CompatBadge } from '../components/CompatibilityBadge';

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
  name, brand, portion, kcal, glyph, tags, compat, onPress, onDelete,
}: {
  name: string;
  brand: string;
  portion: string;
  kcal: number;
  glyph: string;
  tags: SearchResult['tags'];
  compat?: CompatibilityResult;
  onPress: () => void;
  onDelete?: () => void;
}) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.rowPressable} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.thumb}>
          <Text style={styles.thumbGlyph}>{glyph}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.bodyName} numberOfLines={1}>{name}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaBrand}>{brand.toUpperCase()}</Text>
            <Text style={styles.metaPortion}>· {portion}</Text>
          </View>
          {compat ? (
            <CompatBadge result={compat} />
          ) : (
            <View style={styles.tags}>
              {tags.map((t, i) => <TagPill key={i} label={t.label} kind={t.kind} />)}
            </View>
          )}
        </View>
        <Text style={styles.kcalRight}>
          {kcal}<Text style={styles.kcalUnit}> kcal</Text>
        </Text>
      </TouchableOpacity>
      {onDelete && (
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.7}>
          <Icon name="trash" size={15} color={Colors.warn} />
        </TouchableOpacity>
      )}
    </View>
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
  profile: UserProfile;
  onBack: () => void;
  onPickItem: (food: Food) => void;
  onDeleteFood: (foodId: string) => void;
  onAddWithAI: (query: string) => void;
  onOpenFoodFacts: (query: string) => void;
  onOpenCIQUAL: (query: string) => void;
  onOpenScanner: () => void;
}

export function SearchScreen({ foodList, profile, onBack, onPickItem, onDeleteFood, onAddWithAI, onOpenFoodFacts, onOpenCIQUAL, onOpenScanner }: Props) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [filters, setFilters] = useState<SearchFilter[]>(SEARCH_FILTERS);
  const [helpVisible, setHelpVisible] = useState(false);

  const toggle = (id: string) =>
    setFilters((fs) => fs.map((f) => (f.id === id ? { ...f, active: !f.active } : f)));

  const activeFilters = filters.filter((f) => f.active);

  function passesFilter(food: Food, id: SearchFilterId): boolean {
    const am = Object.fromEntries(food.allergens.map((a) => [a.name, a.status]));
    const portionKcal = Math.round((food.per100.kcal * food.defaultPortion) / 100);
    switch (id) {
      case 'gf':  return am['Gluten'] !== 'contains';
      case 'lf':  return am['Lactose'] !== 'contains';
      case 'vg':  return am['Poisson'] !== 'contains' && am['Crustacés'] !== 'contains' && am['Mollusques'] !== 'contains';
      case 'vgn': return am['Œufs'] !== 'contains' && am['Lactose'] !== 'contains' && am['Poisson'] !== 'contains' && am['Crustacés'] !== 'contains' && am['Mollusques'] !== 'contains';
      case 'nf':  return am['Fruits à coque'] !== 'contains';
      case 'low': return portionKcal < 200;
      default:    return true;
    }
  }

  function isCompatible(food: Food): boolean {
    return activeFilters.every((f) => passesFilter(food, f.id));
  }

  const textFiltered = foodList.filter(
    (food) => !debouncedQuery || food.name.toLowerCase().includes(debouncedQuery.toLowerCase())
  );
  const compatible   = textFiltered.filter((f) => isCompatible(f));
  const incompatible = textFiltered.filter((f) => !isCompatible(f));

  const confirmDelete = (food: Food) => {
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`Supprimer « ${food.name} » de ta liste ?`)) {
        onDeleteFood(food.id);
      }
      return;
    }
    Alert.alert(
      'Supprimer cet aliment ?',
      `« ${food.name} » sera retiré de ta liste.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => onDeleteFood(food.id) },
      ]
    );
  };

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
        <HelpButton onPress={() => setHelpVisible(true)} />
      </View>
      <HelpModal visible={helpVisible} content={HELP.search} onClose={() => setHelpVisible(false)} />

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

      {/* Add source strip */}
      <View style={styles.addStrip}>
        <TouchableOpacity style={styles.addChip} onPress={() => onOpenCIQUAL(query)} activeOpacity={0.8}>
          <Icon name="database" size={12} color={Colors.signal} />
          <Text style={[styles.addChipText, { color: Colors.signal }]}>CIQUAL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addChip} onPress={() => onOpenFoodFacts(query)} activeOpacity={0.8}>
          <Icon name="search" size={12} color={Colors.ok} />
          <Text style={[styles.addChipText, { color: Colors.ok }]}>Open Food Facts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.addChip, styles.addChipAI]} onPress={() => onAddWithAI(query)} activeOpacity={0.8}>
          <Icon name="sparkle" size={12} color={Colors.paper2} />
          <Text style={[styles.addChipText, styles.addChipAIText]}>IA</Text>
        </TouchableOpacity>
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
        style={styles.resultsList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Compatible */}
        <SectionLabel
          left={activeFilters.length ? 'Compatible avec tes filtres' : 'Tous les aliments'}
          right={`${compatible.length} aliment${compatible.length !== 1 ? 's' : ''}`}
        />
        {compatible.map((food) => {
          const sr = foodToSearchResult(food);
          const compat = computeCompatibilityScore(food, profile);
          return (
            <ResultRow
              key={food.id}
              name={sr.name}
              brand={sr.brand}
              portion={sr.portion}
              kcal={sr.kcal}
              glyph={sr.glyph}
              tags={sr.tags}
              compat={compat}
              onPress={() => onPickItem(food)}
              onDelete={() => confirmDelete(food)}
            />
          );
        })}

        {/* Incompatible */}
        {incompatible.length > 0 && (
          <>
            <SectionLabel left="Filtré · ne correspond pas aux critères actifs" />
            <View style={{ opacity: 0.5 }}>
              {incompatible.map((food) => {
                const sr = foodToSearchResult(food);
                const compat = computeCompatibilityScore(food, profile);
                return (
                  <ResultRow
                    key={food.id}
                    name={sr.name}
                    brand={sr.brand}
                    portion={sr.portion}
                    kcal={sr.kcal}
                    glyph={sr.glyph}
                    tags={sr.tags}
                    compat={compat}
                    onPress={() => onPickItem(food)}
                    onDelete={() => confirmDelete(food)}
                  />
                );
              })}
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

  resultsList: { flex: 1 },

  filterStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
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
    backgroundColor: Colors.paper2,
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
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
    paddingRight: 12,
  },
  rowPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingLeft: 20,
    paddingRight: 8,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139,58,46,0.25)',
    backgroundColor: 'rgba(139,58,46,0.06)',
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

  addStrip: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
  },
  addChipText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  addChipAI: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  addChipAIText: {
    color: Colors.paper2,
  },
});
