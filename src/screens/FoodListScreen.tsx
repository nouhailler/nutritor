/**
 * FoodListScreen — tab 'foods'
 * Bibliothèque d'aliments personnelle avec recherche debounce.
 * Accès aux sources (CIQUAL, Open Food Facts, scanner, IA, photo).
 * Ajout rapide d'un aliment à un plat sauvegardé via bottom sheet.
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Meal } from '../types';
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

// ── Journal picker bottom sheet ───────────────────────────────

function JournalPickerSheet({
  food,
  meals,
  onSelect,
  onClose,
}: {
  food: Food;
  meals: Meal[];
  onSelect: (mealId: string, portion: number) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const defaultPortion = String(food.defaultPortion);
  const [portion, setPortion] = useState(defaultPortion);

  const parsedPortion = Math.max(1, Number(portion.replace(',', '.')) || food.defaultPortion);
  const kcal = Math.round((food.per100.kcal * parsedPortion) / 100);

  return (
    <View style={sheet.overlay}>
      <TouchableOpacity style={sheet.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={[sheet.panel, { paddingBottom: insets.bottom + 16 }]}>
        <View style={sheet.handle} />
        <Text style={sheet.title}>Ajouter au journal</Text>
        <Text style={sheet.sub} numberOfLines={1}>{food.name}</Text>

        {/* Portion input */}
        <View style={jsheet.portionRow}>
          <Text style={jsheet.portionLabel}>Portion</Text>
          <View style={jsheet.portionInput}>
            <TextInput
              style={jsheet.portionField}
              value={portion}
              onChangeText={setPortion}
              keyboardType="decimal-pad"
              selectTextOnFocus
              maxLength={6}
            />
            <Text style={jsheet.portionUnit}>{food.unit}</Text>
          </View>
          <Text style={jsheet.portionKcal}>{kcal} kcal</Text>
        </View>

        {/* Meal list */}
        <ScrollView
          style={sheet.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {meals.map((meal) => {
            const mealKcal = meal.items.reduce((s, i) => s + i.kcal, 0);
            return (
              <TouchableOpacity
                key={meal.id}
                style={sheet.row}
                onPress={() => onSelect(meal.id, parsedPortion)}
                activeOpacity={0.7}
              >
                <View style={sheet.rowLeft}>
                  <Text style={sheet.rowName}>{meal.name}</Text>
                  <Text style={sheet.rowMeta}>
                    {meal.time} · {meal.items.length} aliment{meal.items.length !== 1 ? 's' : ''}{mealKcal > 0 ? ` · ${mealKcal} kcal` : ''}
                  </Text>
                </View>
                <View style={[sheet.rowAction, jsheet.rowActionJournal]}>
                  <Icon name="plus" size={14} color={Colors.signal} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity style={sheet.cancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={sheet.cancelText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const jsheet = StyleSheet.create({
  portionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
    marginBottom: 4,
  },
  portionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
    width: 52,
  },
  portionInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  portionField: {
    fontFamily: Fonts.sansMedium,
    fontSize: 16,
    color: Colors.ink,
    minWidth: 40,
    paddingVertical: 0,
  },
  portionUnit: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  portionKcal: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    color: Colors.ink,
    letterSpacing: -0.2,
    minWidth: 64,
    textAlign: 'right',
  },
  rowActionJournal: {
    borderColor: 'rgba(107,90,46,0.3)',
    backgroundColor: 'rgba(107,90,46,0.07)',
  },
});

// ── Food row ──────────────────────────────────────────────────

function FoodRow({
  food,
  profile,
  onPress,
  onAddToJournal,
  onAddToPlate,
  onDelete,
}: {
  food: Food;
  profile: UserProfile;
  onPress: () => void;
  onAddToJournal: () => void;
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

      <TouchableOpacity style={styles.journalBtn} onPress={onAddToJournal} activeOpacity={0.7}>
        <Icon name="home" size={14} color={Colors.signal} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.plateBtn} onPress={onAddToPlate} activeOpacity={0.7}>
        <Icon name="book" size={14} color={Colors.ok} />
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
  meals: Meal[];
  profile: UserProfile;
  recentFoodUseIds: string[];
  recentFoodViewIds: string[];
  onPickFood: (food: Food) => void;
  onAddToPlate: (food: Food, plateId: string) => void;
  onAddToJournal: (food: Food, portion: number, mealId: string) => void;
  onDeleteFood: (foodId: string) => void;
  onOpenMenu: () => void;
  onAddWithAI: (query: string) => void;
  onOpenFoodFacts: (query: string) => void;
  onOpenCIQUAL: (query: string) => void;
  onOpenScanner: () => void;
  onOpenPhotoAI: () => void;
  onStartDemo:   () => void;
}

export function FoodListScreen({
  foodList,
  savedPlates,
  meals,
  profile,
  recentFoodUseIds,
  recentFoodViewIds,
  onPickFood,
  onAddToPlate,
  onAddToJournal,
  onDeleteFood,
  onOpenMenu,
  onAddWithAI,
  onOpenFoodFacts,
  onOpenCIQUAL,
  onOpenScanner,
  onOpenPhotoAI,
  onStartDemo,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [platePickerFood, setPlatePickerFood] = useState<Food | null>(null);
  const [journalPickerFood, setJournalPickerFood] = useState<Food | null>(null);

  const reversedList = useMemo(() => [...foodList].reverse(), [foodList]);

  // ── Section logic (no search query) ────────────────────────
  const sections = useMemo(() => {
    if (debouncedQuery) return null;

    const byId = new Map(foodList.map((f) => [f.id, f]));

    // 1. Récemment ajoutés — last 4 in the library
    const recentlyAdded = reversedList.slice(0, 4);
    const addedIds = new Set(recentlyAdded.map((f) => f.id));

    // 2. Récemment utilisés (journal / plats) — up to 10, not in section 1
    const recentlyUsed = recentFoodUseIds
      .map((id) => byId.get(id))
      .filter((f): f is Food => !!f && !addedIds.has(f.id))
      .slice(0, 10);
    const usedIds = new Set(recentlyUsed.map((f) => f.id));

    // 3. Récemment consultés — up to 5, not in sections 1 or 2
    const recentlyViewed = recentFoodViewIds
      .map((id) => byId.get(id))
      .filter((f): f is Food => !!f && !addedIds.has(f.id) && !usedIds.has(f.id))
      .slice(0, 5);
    const viewedIds = new Set(recentlyViewed.map((f) => f.id));

    // 4. Tous les aliments — everything else
    const topIds = new Set([...addedIds, ...usedIds, ...viewedIds]);
    const rest = reversedList.filter((f) => !topIds.has(f.id));

    return { recentlyAdded, recentlyUsed, recentlyViewed, rest };
  }, [foodList, reversedList, recentFoodUseIds, recentFoodViewIds, debouncedQuery]);

  // Flat list used only during search
  const filtered = useMemo(() =>
    debouncedQuery
      ? reversedList.filter((f) =>
          f.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          (f.brand ?? '').toLowerCase().includes(debouncedQuery.toLowerCase())
        )
      : reversedList,
    [reversedList, debouncedQuery],
  );

  const confirmDelete = (food: Food) => {
    const doDelete = () => onDeleteFood(food.id);
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(t('foodList.deleteFoodMsg', { name: food.name }))) doDelete();
      return;
    }
    Alert.alert(
      t('foodList.deleteFood'),
      t('foodList.deleteFoodMsg', { name: food.name }),
      [
        { text: t('foodList.deleteCancel'), style: 'cancel' },
        { text: t('foodList.deleteConfirm'), style: 'destructive', onPress: doDelete },
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
          <Text style={styles.eyebrow}>{t('foodList.eyebrow')}</Text>
          <Text style={styles.title}>{t('foodList.title')}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{foodList.length}</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={onStartDemo} activeOpacity={0.7}>
          <Icon name="activity" size={17} color={Colors.signal} />
        </TouchableOpacity>
      </View>

      {/* Search input */}
      <View style={styles.searchWrap}>
        <Icon name="search" size={18} color={Colors.muted2} />
        <TextInput
          style={styles.input}
          placeholder={t('foodList.searchPlaceholder')}
          placeholderTextColor={Colors.muted2}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
            <Text style={styles.clearBtn}>{t('common.clear')}</Text>
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
        {/* ── Search mode ── */}
        {debouncedQuery ? (
          <>
            <SectionLabel
              left={t('search.allFoods')}
              right={t('foodList.foodCount', { count: filtered.length, s: filtered.length > 1 ? 's' : '' })}
            />
            {filtered.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>{t('foodList.emptySearch')}</Text>
                <Text style={styles.emptyDesc}>
                  {t('foodList.empty')}
                </Text>
              </View>
            ) : (
              filtered.map((food) => (
                <FoodRow
                  key={food.id}
                  food={food}
                  profile={profile}
                  onPress={() => onPickFood(food)}
                  onAddToJournal={() => setJournalPickerFood(food)}
                  onAddToPlate={() => setPlatePickerFood(food)}
                  onDelete={() => confirmDelete(food)}
                />
              ))
            )}
          </>
        ) : sections ? (
          <>
            {/* Récemment ajoutés */}
            {sections.recentlyAdded.length > 0 && (
              <>
                <SectionLabel left={t('search.recentlyAdded')} right={`${sections.recentlyAdded.length}`} />
                {sections.recentlyAdded.map((food) => (
                  <FoodRow key={food.id} food={food} profile={profile}
                    onPress={() => onPickFood(food)}
                    onAddToJournal={() => setJournalPickerFood(food)}
                    onAddToPlate={() => setPlatePickerFood(food)}
                    onDelete={() => confirmDelete(food)} />
                ))}
              </>
            )}

            {/* Récemment utilisés */}
            {sections.recentlyUsed.length > 0 && (
              <>
                <SectionLabel left={t('search.recentlyAdded')} right={`${sections.recentlyUsed.length}`} />
                {sections.recentlyUsed.map((food) => (
                  <FoodRow key={food.id} food={food} profile={profile}
                    onPress={() => onPickFood(food)}
                    onAddToJournal={() => setJournalPickerFood(food)}
                    onAddToPlate={() => setPlatePickerFood(food)}
                    onDelete={() => confirmDelete(food)} />
                ))}
              </>
            )}

            {/* Récemment consultés */}
            {sections.recentlyViewed.length > 0 && (
              <>
                <SectionLabel left={t('search.recentlyAdded')} right={`${sections.recentlyViewed.length}`} />
                {sections.recentlyViewed.map((food) => (
                  <FoodRow key={food.id} food={food} profile={profile}
                    onPress={() => onPickFood(food)}
                    onAddToJournal={() => setJournalPickerFood(food)}
                    onAddToPlate={() => setPlatePickerFood(food)}
                    onDelete={() => confirmDelete(food)} />
                ))}
              </>
            )}

            {/* Tous les aliments */}
            {sections.rest.length > 0 && (
              <>
                <SectionLabel
                  left={t('search.allFoods')}
                  right={`${foodList.length}`}
                />
                {sections.rest.map((food) => (
                  <FoodRow key={food.id} food={food} profile={profile}
                    onPress={() => onPickFood(food)}
                    onAddToJournal={() => setJournalPickerFood(food)}
                    onAddToPlate={() => setPlatePickerFood(food)}
                    onDelete={() => confirmDelete(food)} />
                ))}
              </>
            )}

            {foodList.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>{t('foodList.title')}</Text>
                <Text style={styles.emptyDesc}>{t('foodList.empty')}</Text>
              </View>
            )}
          </>
        ) : null}

        {/* Hint row at the bottom */}
        {filtered.length > 0 && !debouncedQuery && (
          <View style={styles.hintRow}>
            <Icon name="info" size={13} color={Colors.muted2} />
            <Text style={styles.hintText}>
              Touchez un aliment pour voir sa fiche détail.{'\n'}
              <Icon name="home" size={11} color={Colors.muted2} /> Ajouter au journal  ·  <Icon name="book" size={11} color={Colors.muted2} /> Ajouter à un plat.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Journal picker bottom sheet */}
      {journalPickerFood && (
        <JournalPickerSheet
          food={journalPickerFood}
          meals={meals}
          onSelect={(mealId, portion) => {
            onAddToJournal(journalPickerFood, portion, mealId);
            setJournalPickerFood(null);
          }}
          onClose={() => setJournalPickerFood(null)}
        />
      )}

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
    minWidth: 64,
    textAlign: 'right',
  },
  kcalUnit: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    color: Colors.muted,
  },
  journalBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(107,90,46,0.3)',
    backgroundColor: 'rgba(107,90,46,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
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
    marginLeft: 6,
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
