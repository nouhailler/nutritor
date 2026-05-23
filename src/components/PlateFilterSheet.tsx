import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { SavedPlate, PlateCategory, PLATE_CATEGORIES } from '../data/saved';
import {
  PlateFilterState,
  DEFAULT_FILTER,
  SortBy,
  MetabolicKey,
  MetabolicLevel,
  SORT_OPTIONS,
  TIME_PRESETS,
  ALL_PLATE_TAGS,
  ALLERGEN_OPTIONS,
  MINERAL_OPTIONS,
  VITAMIN_OPTIONS,
  TRACE_OPTIONS,
  BIOACTIVE_OPTIONS,
  METABOLIC_CATEGORIES,
  countActiveFilters,
} from '../data/plateFilters';
import { Colors, Fonts } from '../theme/tokens';

// ── Section header ─────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return <Text style={styles.sectionTitle}>{label}</Text>;
}

// ── Toggle chip ────────────────────────────────────────────────

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {active && <Icon name="check" size={10} color={Colors.paper2} />}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Number input ───────────────────────────────────────────────

function NumInput({
  label,
  value,
  onChange,
  unit,
  placeholder,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  unit: string;
  placeholder: string;
}) {
  return (
    <View style={styles.numInputWrap}>
      <Text style={styles.numInputLabel}>{label}</Text>
      <View style={styles.numInputRow}>
        <TextInput
          style={styles.numInput}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={Colors.muted2}
          value={value !== null ? String(value) : ''}
          onChangeText={(t) => {
            const v = parseFloat(t.replace(',', '.'));
            onChange(isNaN(v) ? null : v);
          }}
        />
        <Text style={styles.numInputUnit}>{unit}</Text>
      </View>
    </View>
  );
}

// ── Pairing autocomplete ───────────────────────────────────────

function PairingInput({
  plates,
  value,
  onChange,
}: {
  plates: SavedPlate[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const selectedPlate = plates.find((p) => p.id === value);
  const suggestions = query.length >= 2
    ? plates.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : [];

  if (value && selectedPlate) {
    return (
      <TouchableOpacity
        style={styles.pairingSelected}
        onPress={() => { onChange(null); setQuery(''); }}
        activeOpacity={0.8}
      >
        <Text style={styles.pairingSelectedText} numberOfLines={1}>{selectedPlate.name}</Text>
        <Icon name="close" size={13} color={Colors.muted} />
      </TouchableOpacity>
    );
  }

  return (
    <View>
      <TextInput
        style={styles.pairingInput}
        placeholder="Taper 2 caractères pour chercher…"
        placeholderTextColor={Colors.muted2}
        value={query}
        onChangeText={(t) => { setQuery(t); setOpen(t.length >= 2); }}
        onFocus={() => { if (query.length >= 2) setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoCorrect={false}
      />
      {open && suggestions.length > 0 && (
        <View style={styles.pairingSuggestions}>
          {suggestions.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.pairingSuggestionRow}
              onPress={() => { onChange(p.id); setQuery(''); setOpen(false); }}
              activeOpacity={0.7}
            >
              <Text style={styles.pairingSuggestionText}>{p.name}</Text>
              <Text style={styles.pairingSuggestionMeta}>{p.kcal} kcal</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {open && suggestions.length === 0 && query.length >= 2 && (
        <View style={styles.pairingSuggestions}>
          <Text style={styles.pairingEmpty}>Aucun plat trouvé</Text>
        </View>
      )}
    </View>
  );
}

// ── Main component ─────────────────────────────────────────────

interface Props {
  visible: boolean;
  filter: PlateFilterState;
  plates: SavedPlate[];
  onApply: (f: PlateFilterState) => void;
  onClose: () => void;
}

export function PlateFilterSheet({ visible, filter, plates, onApply, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<PlateFilterState>(filter);

  const set = <K extends keyof PlateFilterState>(key: K, val: PlateFilterState[K]) =>
    setDraft((d) => ({ ...d, [key]: val }));

  const toggleArr = <K extends 'requireTags' | 'excludeAllergens' | 'requireMinerals' | 'requireVitamins' | 'requireTrace' | 'requireBioactives' | 'categories'>(
    key: K,
    item: string
  ) => {
    setDraft((d) => {
      const arr = d[key] as string[];
      return {
        ...d,
        [key]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item],
      };
    });
  };

  const toggleMetabolic = (mKey: MetabolicKey, level: MetabolicLevel) => {
    setDraft((d) => {
      const current = d.metabolic[mKey] ?? [];
      const updated = current.includes(level)
        ? current.filter((l) => l !== level)
        : [...current, level];
      const newMeta = { ...d.metabolic };
      if (updated.length === 0) delete newMeta[mKey];
      else newMeta[mKey] = updated;
      return { ...d, metabolic: newMeta };
    });
  };

  const handleReset = () => setDraft({ ...DEFAULT_FILTER });

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const activeCount = countActiveFilters(draft);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { paddingTop: insets.top > 0 ? insets.top : 16 }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Filtres & tri</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
              <Icon name="close" size={18} color={Colors.ink} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        >
          {/* ── Tri ─────────────────────────────────────────── */}
          <SectionTitle label="Tri" />
          <View style={styles.chips}>
            {SORT_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                active={draft.sortBy === opt.value}
                onPress={() => set('sortBy', opt.value as SortBy)}
              />
            ))}
          </View>

          {/* ── Catégories ──────────────────────────────────── */}
          <SectionTitle label="Catégorie" />
          <View style={styles.chips}>
            {PLATE_CATEGORIES.map((cat) => (
              <Chip
                key={cat.id}
                label={`${cat.emoji} ${cat.label}`}
                active={(draft.categories ?? []).includes(cat.id as PlateCategory)}
                onPress={() => toggleArr('categories', cat.id)}
              />
            ))}
          </View>

          {/* ── Temps ───────────────────────────────────────── */}
          <SectionTitle label="Temps de préparation" />
          <View style={styles.chips}>
            {TIME_PRESETS.map((p) => (
              <Chip
                key={String(p.value)}
                label={p.label}
                active={draft.maxTimeMin === p.value}
                onPress={() => set('maxTimeMin', p.value)}
              />
            ))}
          </View>

          {/* ── Macros ──────────────────────────────────────── */}
          <SectionTitle label="Macronutriments (totaux du plat)" />
          <View style={styles.macroGrid}>
            <NumInput
              label="Protéines min"
              value={draft.minProtein}
              onChange={(v) => set('minProtein', v)}
              unit="g"
              placeholder="—"
            />
            <NumInput
              label="Glucides max"
              value={draft.maxCarbs}
              onChange={(v) => set('maxCarbs', v)}
              unit="g"
              placeholder="—"
            />
            <NumInput
              label="Lipides max"
              value={draft.maxFat}
              onChange={(v) => set('maxFat', v)}
              unit="g"
              placeholder="—"
            />
          </View>
          <View style={styles.kcalRow}>
            <NumInput
              label="Kcal min"
              value={draft.minKcal}
              onChange={(v) => set('minKcal', v)}
              unit="kcal"
              placeholder="—"
            />
            <NumInput
              label="Kcal max"
              value={draft.maxKcal}
              onChange={(v) => set('maxKcal', v)}
              unit="kcal"
              placeholder="—"
            />
          </View>

          {/* ── Étiquettes ──────────────────────────────────── */}
          <SectionTitle label="Étiquettes (le plat doit toutes les avoir)" />
          <View style={styles.chips}>
            {ALL_PLATE_TAGS.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                active={draft.requireTags.includes(tag)}
                onPress={() => toggleArr('requireTags', tag)}
              />
            ))}
          </View>

          {/* ── Allergènes ──────────────────────────────────── */}
          <SectionTitle label="Exclure les allergènes" />
          <View style={styles.chips}>
            {ALLERGEN_OPTIONS.map((a) => (
              <Chip
                key={a.name}
                label={a.name}
                active={draft.excludeAllergens.includes(a.name)}
                onPress={() => toggleArr('excludeAllergens', a.name)}
              />
            ))}
          </View>

          {/* ── Minéraux ────────────────────────────────────── */}
          <SectionTitle label="Minéraux (si données disponibles)" />
          <View style={styles.chips}>
            {MINERAL_OPTIONS.map((m) => (
              <Chip
                key={m}
                label={m}
                active={draft.requireMinerals.includes(m)}
                onPress={() => toggleArr('requireMinerals', m)}
              />
            ))}
          </View>

          {/* ── Vitamines ───────────────────────────────────── */}
          <SectionTitle label="Vitamines (si données disponibles)" />
          <View style={styles.chips}>
            {VITAMIN_OPTIONS.map((v) => (
              <Chip
                key={v}
                label={v}
                active={draft.requireVitamins.includes(v)}
                onPress={() => toggleArr('requireVitamins', v)}
              />
            ))}
          </View>

          {/* ── Oligo-éléments ──────────────────────────────── */}
          <SectionTitle label="Oligo-éléments (si données disponibles)" />
          <View style={styles.chips}>
            {TRACE_OPTIONS.map((t) => (
              <Chip
                key={t}
                label={t}
                active={draft.requireTrace.includes(t)}
                onPress={() => toggleArr('requireTrace', t)}
              />
            ))}
          </View>

          {/* ── Bioactifs ───────────────────────────────────── */}
          <SectionTitle label="Molécules bioactives (si données disponibles)" />
          <View style={styles.chips}>
            {BIOACTIVE_OPTIONS.map((b) => (
              <Chip
                key={b}
                label={b}
                active={draft.requireBioactives.includes(b)}
                onPress={() => toggleArr('requireBioactives', b)}
              />
            ))}
          </View>

          {/* ── Effets métaboliques ─────────────────────────── */}
          <SectionTitle label="Effets métaboliques (si données disponibles)" />
          {METABOLIC_CATEGORIES.map((cat) => (
            <View key={cat.key} style={styles.metabolicCat}>
              <Text style={styles.metabolicCatLabel}>{cat.label}</Text>
              <View style={styles.chips}>
                {cat.levels.map((lv) => {
                  const active = (draft.metabolic[cat.key] ?? []).includes(lv.value);
                  return (
                    <Chip
                      key={lv.value}
                      label={lv.label}
                      active={active}
                      onPress={() => toggleMetabolic(cat.key, lv.value)}
                    />
                  );
                })}
              </View>
            </View>
          ))}

          {/* ── Pairing ─────────────────────────────────────── */}
          <SectionTitle label="Pairing avec un autre plat" />
          <PairingInput
            plates={plates}
            value={draft.pairedWithId}
            onChange={(id) => set('pairedWithId', id)}
          />
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.7}>
            <Text style={styles.resetText}>Réinitialiser</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.8}>
            <Text style={styles.applyText}>
              Appliquer{activeCount > 0 ? ` · ${activeCount}` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: Colors.paper,
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.hairline,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    letterSpacing: -0.4,
    color: Colors.ink,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 0,
  },

  sectionTitle: {
    fontFamily: Fonts.mono,
    fontSize: 9.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 10,
    marginTop: 20,
  },

  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
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

  macroGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  kcalRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  numInputWrap: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  numInputLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  numInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  numInput: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    letterSpacing: -0.3,
    color: Colors.ink,
    flex: 1,
    padding: 0,
  },
  numInputUnit: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 1,
  },

  metabolicCat: {
    marginBottom: 12,
  },
  metabolicCatLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.ink2,
    marginBottom: 8,
  },

  pairingInput: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.ink,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.card,
  },
  pairingSuggestions: {
    marginTop: 4,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pairingSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  pairingSuggestionText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink,
    flex: 1,
  },
  pairingSuggestionMeta: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted2,
    letterSpacing: 0.5,
  },
  pairingEmpty: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    padding: 14,
    textAlign: 'center',
  },
  pairingSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.ink,
    borderRadius: 12,
  },
  pairingSelectedText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.paper2,
    flex: 1,
  },

  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
    backgroundColor: Colors.paper,
  },
  resetBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 100,
  },
  resetText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink2,
  },
  applyBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: Colors.ink,
    borderRadius: 100,
  },
  applyText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.paper2,
  },
});
