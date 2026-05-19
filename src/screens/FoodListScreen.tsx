/**
 * FoodListScreen — tab 'foods'
 * Bibliothèque d'aliments personnelle avec recherche debounce.
 * Accès aux sources (CIQUAL, Open Food Facts, scanner, IA, photo).
 * Ajout rapide d'un aliment à un plat sauvegardé via bottom sheet.
 */
import React, { useState } from 'react';
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
import { Colors, Fonts } from '../theme/tokens';
import { Food } from '../types';
import { UserProfile } from '../data/user';
import { SavedPlate } from '../data/saved';
import { useDebounce } from '../hooks/useDebounce';
import { computeCompatibilityScore } from '../data/compatibilityScore';
import { CompatBadge } from '../components/CompatibilityBadge';
import { OnboardingTip } from '../components/OnboardingTip';
import { TIPS } from '../data/onboarding';

// ── Plate picker bottom sheet ─────────────────────────────────

function PlatePickerSheet({
  food,
  plates,
  onSelect,
  onClose,
}: {
  food: Food;
  plates: SavedPlate[];
  onSelect: (plateId: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={sheet.overlay}>
      <TouchableOpacity style={sheet.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={[sheet.panel, { paddingBottom: insets.bottom + 16 }]}>
        <View style={sheet.handle} />
        <Text style={sheet.title}>Ajouter à un plat</Text>
        <Text style={sheet.sub} numberOfLines={1}>{food.name}</Text>

        {plates.length === 0 ? (
          <View style={sheet.emptyWrap}>
            <Text style={sheet.empty}>
              Aucun plat enregistré pour l'instant.{'\n'}
              Crée un plat depuis l'onglet Plats.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={sheet.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {plates.map((plate) => (
              <TouchableOpacity
                key={plate.id}
                style={sheet.row}
                onPress={() => onSelect(plate.id)}
                activeOpacity={0.7}
              >
                <View style={sheet.rowLeft}>
                  <Text style={sheet.rowName}>{plate.name}</Text>
                  <Text style={sheet.rowMeta}>
                    {plate.items} ingrédient{plate.items !== 1 ? 's' : ''} · {plate.kcal} kcal
                  </Text>
                </View>
                <View style={sheet.rowAction}>
                  <Icon name="plus" size={14} color={Colors.ok} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity style={sheet.cancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={sheet.cancelText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const sheet = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 80,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,12,8,0.45)',
  },
  panel: {
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '75%',
    shadowColor: '#0f0c08',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.hairline,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.ink,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    marginBottom: 16,
  },
  list: { maxHeight: 320 },
  emptyWrap: { paddingVertical: 24 },
  empty: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  rowLeft: { flex: 1, gap: 2 },
  rowName: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.ink },
  rowMeta: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.8, color: Colors.muted },
  rowAction: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(63,90,58,0.3)',
    backgroundColor: 'rgba(63,90,58,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  cancelText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.muted,
  },
});

// ── Food row ──────────────────────────────────────────────────

function FoodRow({
  food,
  profile,
  onPress,
  onAddToPlate,
  onDelete,
}: {
  food: Food;
  profile: UserProfile;
  onPress: () => void;
  onAddToPlate: () => void;
  onDelete: () => void;
}) {
  const kcal = Math.round((food.per100.kcal * food.defaultPortion) / 100);
  const compat = computeCompatibilityScore(food, profile);

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.rowBody} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.thumb}>
          <Text style={styles.thumbGlyph}>{food.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.bodyContent}>
          <Text style={styles.bodyName} numberOfLines={1}>{food.name}</Text>
          {food.brand ? (
            <Text style={styles.bodyBrand}>{food.brand.toUpperCase()}</Text>
          ) : null}
          <CompatBadge result={compat} />
        </View>
        <Text style={styles.kcal}>
          {kcal}<Text style={styles.kcalUnit}> kcal</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.plateBtn} onPress={onAddToPlate} activeOpacity={0.7}>
        <Icon name="book" size={15} color={Colors.ok} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.7}>
        <Icon name="trash" size={14} color={Colors.warn} />
      </TouchableOpacity>
    </View>
  );
}

// ── Section label ─────────────────────────────────────────────

function SectionLabel({ left, right }: { left: string; right?: string }) {
  return (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionLabelText}>{left}</Text>
      {right ? <Text style={styles.sectionCount}>{right}</Text> : null}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────

interface Props {
  foodList: Food[];
  savedPlates: SavedPlate[];
  profile: UserProfile;
  onPickFood: (food: Food) => void;
  onAddToPlate: (food: Food, plateId: string) => void;
  onDeleteFood: (foodId: string) => void;
  onOpenMenu: () => void;
  onAddWithAI: (query: string) => void;
  onOpenFoodFacts: (query: string) => void;
  onOpenCIQUAL: (query: string) => void;
  onOpenScanner: () => void;
  onOpenPhotoAI: () => void;
}

export function FoodListScreen({
  foodList,
  savedPlates,
  profile,
  onPickFood,
  onAddToPlate,
  onDeleteFood,
  onOpenMenu,
  onAddWithAI,
  onOpenFoodFacts,
  onOpenCIQUAL,
  onOpenScanner,
  onOpenPhotoAI,
}: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [platePickerFood, setPlatePickerFood] = useState<Food | null>(null);

  const filtered = debouncedQuery
    ? foodList.filter((f) =>
        f.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        f.brand.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : foodList;

  const confirmDelete = (food: Food) => {
    const doDelete = () => onDeleteFood(food.id);
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`Supprimer « ${food.name} » de ta bibliothèque ?`)) doDelete();
      return;
    }
    Alert.alert(
      'Supprimer cet aliment ?',
      `« ${food.name} » sera retiré de ta bibliothèque.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: doDelete },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <OnboardingTip
        tipKey={TIPS.foods.key}
        title={TIPS.foods.title}
        message={TIPS.foods.message}
        delay={1000}
      />
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onOpenMenu} activeOpacity={0.7}>
          <Icon name="menu" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Ma bibliothèque</Text>
          <Text style={styles.title}>Aliments</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{foodList.length}</Text>
        </View>
      </View>

      {/* Search input */}
      <View style={styles.searchWrap}>
        <Icon name="search" size={18} color={Colors.muted2} />
        <TextInput
          style={styles.input}
          placeholder="Rechercher un aliment…"
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

      {/* Discover strip */}
      <View style={styles.discoverStrip}>
        <TouchableOpacity style={styles.discoverChip} onPress={() => onOpenCIQUAL(query)} activeOpacity={0.8}>
          <Icon name="database" size={12} color={Colors.signal} />
          <Text style={[styles.discoverChipText, { color: Colors.signal }]}>CIQUAL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.discoverChip} onPress={() => onOpenFoodFacts(query)} activeOpacity={0.8}>
          <Icon name="search" size={12} color={Colors.ok} />
          <Text style={[styles.discoverChipText, { color: Colors.ok }]}>Open Food Facts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.discoverChip} onPress={() => onOpenScanner()} activeOpacity={0.8}>
          <Icon name="scan" size={12} color={Colors.ink} />
          <Text style={styles.discoverChipText}>Scanner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.discoverChip, styles.discoverChipAI]} onPress={() => onAddWithAI(query)} activeOpacity={0.8}>
          <Icon name="sparkle" size={12} color={Colors.paper2} />
          <Text style={[styles.discoverChipText, styles.discoverChipAIText]}>IA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.discoverChip, styles.discoverChipPhoto]} onPress={onOpenPhotoAI} activeOpacity={0.8}>
          <Icon name="camera" size={12} color={Colors.paper2} />
          <Text style={[styles.discoverChipText, styles.discoverChipPhotoText]}>Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Food list */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <SectionLabel
          left={debouncedQuery ? 'Résultats' : 'Tous les aliments'}
          right={`${filtered.length} aliment${filtered.length !== 1 ? 's' : ''}`}
        />

        {filtered.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptyDesc}>
              Essaie un autre terme ou ajoute un aliment via CIQUAL, Open Food Facts ou l'IA.
            </Text>
          </View>
        )}

        {filtered.map((food) => (
          <FoodRow
            key={food.id}
            food={food}
            profile={profile}
            onPress={() => onPickFood(food)}
            onAddToPlate={() => setPlatePickerFood(food)}
            onDelete={() => confirmDelete(food)}
          />
        ))}

        {/* Hint row at the bottom */}
        {filtered.length > 0 && !debouncedQuery && (
          <View style={styles.hintRow}>
            <Icon name="info" size={13} color={Colors.muted2} />
            <Text style={styles.hintText}>
              Touchez un aliment pour l'ajouter au journal.{'\n'}
              Touchez <Icon name="book" size={11} color={Colors.muted2} /> pour l'ajouter à un plat.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Plate picker bottom sheet */}
      {platePickerFood && (
        <PlatePickerSheet
          food={platePickerFood}
          plates={savedPlates}
          onSelect={(plateId) => {
            onAddToPlate(platePickerFood, plateId);
            setPlatePickerFood(null);
          }}
          onClose={() => setPlatePickerFood(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  iconBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  title: { fontFamily: Fonts.serif, fontSize: 24, color: Colors.ink, letterSpacing: -0.4 },
  countBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
  },
  countBadgeText: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.5,
    color: Colors.muted,
  },

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
  input: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.ink,
    paddingVertical: 0,
  },
  clearBtn: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.muted,
    textTransform: 'uppercase',
  },

  discoverStrip: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  discoverChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
  },
  discoverChipText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    color: Colors.ink,
  },
  discoverChipAI: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  discoverChipAIText: { color: Colors.paper2 },
  discoverChipPhoto: {
    backgroundColor: Colors.ok,
    borderColor: Colors.ok,
  },
  discoverChipPhotoText: { color: Colors.paper2 },

  list: { flex: 1 },

  sectionLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingTop: 4,
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
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    paddingLeft: 20,
    paddingRight: 8,
  },
  thumb: {
    width: 48, height: 48,
    borderRadius: 12,
    backgroundColor: Colors.paper2,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  thumbGlyph: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.ink,
  },
  bodyContent: { flex: 1, minWidth: 0, gap: 2 },
  bodyName: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.ink,
    letterSpacing: -0.1,
    lineHeight: 18,
  },
  bodyBrand: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    color: Colors.muted2,
  },
  kcal: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    letterSpacing: -0.2,
    color: Colors.ink,
    paddingRight: 10,
  },
  kcalUnit: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    color: Colors.muted,
  },
  plateBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(63,90,58,0.3)',
    backgroundColor: 'rgba(63,90,58,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(139,58,46,0.25)',
    backgroundColor: 'rgba(139,58,46,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.ink },
  emptyDesc: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  hintRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
    marginTop: 4,
  },
  hintText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.muted2,
    lineHeight: 17,
  },
});
