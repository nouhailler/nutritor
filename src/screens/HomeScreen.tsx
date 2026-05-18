/**
 * HomeScreen — tab 'home'
 * Journal nutritionnel du jour : anneau kcal SVG, 5 repas, résumé macros,
 * micronutriments, widget symptômes et calendrier de navigation historique.
 */
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Circle, Svg } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { CalendarModal } from '../components/CalendarModal';
import { HelpButton, HelpModal } from '../components/HelpModal';
import { SymptomWidget } from '../components/SymptomWidget';
import { HELP } from '../data/helpContent';
import { UserProfile, Vitamin } from '../data/user';
import { Colors, Fonts } from '../theme/tokens';
import { Meal } from '../types';
import { SymptomEntry, SymptomScores } from '../types/symptoms';
import { OnboardingTip } from '../components/OnboardingTip';
import { TIPS } from '../data/onboarding';

// ── Date helpers ──────────────────────────────────────────────

const DAYS_FR   = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string, todayStr: string): { headline: string; sub: string; isPast: boolean; isFuture: boolean } {
  const diff = Math.round((new Date(dateStr + 'T12:00:00').getTime() - new Date(todayStr + 'T12:00:00').getTime()) / 86400000);
  const d = new Date(dateStr + 'T12:00:00');
  const sub = `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
  if (diff === 0)  return { headline: "Aujourd'hui", sub, isPast: false, isFuture: false };
  if (diff === -1) return { headline: 'Hier',         sub, isPast: true,  isFuture: false };
  if (diff === -2) return { headline: 'Avant-hier',   sub, isPast: true,  isFuture: false };
  if (diff === 1)  return { headline: 'Demain',        sub, isPast: false, isFuture: true };
  if (diff < 0)    return { headline: `Il y a ${Math.abs(diff)} jours`, sub, isPast: true,  isFuture: false };
  return             { headline: `Dans ${diff} jours`, sub, isPast: false, isFuture: true };
}

// ── Kcal ring ────────────────────────────────────────────────

function KcalRing({ pct }: { pct: number }) {
  const r = 54;
  const size = 124;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(1, pct));

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={Colors.hairline}
        strokeWidth={6}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={Colors.ink}
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
      />
    </Svg>
  );
}

// ── Macro bar ────────────────────────────────────────────────

function MacroBar({
  name,
  value,
  target,
}: {
  name: string;
  value: number;
  target: number;
}) {
  const pct = Math.min(1, value / target);
  return (
    <View style={styles.macro}>
      <Text style={styles.macroName}>{name}</Text>
      <Text style={styles.macroValue}>
        {Math.round(value)}
        <Text style={styles.macroUnit}>/{target}g</Text>
      </Text>
      <View style={styles.macroBar}>
        <View style={[styles.macroFill, { width: `${pct * 100}%` }]} />
      </View>
    </View>
  );
}

// ── Vitamin row ──────────────────────────────────────────────

function VitaminRow({ v }: { v: Vitamin }) {
  const pct = v.today / v.rda;
  const cls = pct < 0.25 ? 'low' : pct >= 1 ? 'high' : 'mid';
  const fmt = (n: number) =>
    n < 1 ? n.toFixed(2) : n < 10 ? n.toFixed(1) : String(Math.round(n));

  return (
    <View style={styles.vitRow}>
      <Text style={styles.vitName}>Vit. {v.short}</Text>
      <Text style={styles.vitVal}>
        <Text style={styles.vitValBold}>{fmt(v.today)}</Text> / {v.rda} {v.unit}
      </Text>
      <View style={styles.vitBar}>
        <View
          style={[
            styles.vitFill,
            { width: `${Math.min(100, pct * 100)}%` },
            cls === 'low' && styles.vitFillLow,
            cls === 'high' && styles.vitFillHigh,
          ]}
        />
      </View>
      <Text
        style={[
          styles.vitPct,
          cls === 'low' && styles.vitPctLow,
          cls === 'high' && styles.vitPctHigh,
        ]}
      >
        {Math.round(pct * 100)}%
      </Text>
    </View>
  );
}

// ── Vitamin panel ────────────────────────────────────────────

const VIT_ROW_HEIGHT = 39; // paddingVertical(18) + border(1) + content(~20)

function VitaminPanel({ vitamins }: { vitamins: Vitamin[] }) {
  const onTarget = vitamins.filter((v) => v.today / v.rda >= 1).length;
  return (
    <View style={styles.vitsCard}>
      <View style={styles.vitsHead}>
        <View>
          <Text style={styles.vitsTtl}>Vitamines</Text>
          <Text style={styles.vitsTtlSub}>{vitamins.length} essentielles · % ANR</Text>
        </View>
        <View style={styles.vitsMeta}>
          <Text style={styles.vitsMetaBig}>
            {onTarget}
            <Text style={styles.vitsMetaOf}>/{vitamins.length}</Text>
          </Text>
          <Text style={styles.vitsMetaLabel}>atteintes</Text>
        </View>
      </View>
      <ScrollView
        style={{ maxHeight: VIT_ROW_HEIGHT * 3 }}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {vitamins.map((v) => (
          <VitaminRow key={v.name} v={v} />
        ))}
      </ScrollView>
      <View style={styles.vitsFoot}>
        <Text style={styles.vitsFootLabel}>ANR · adulte 31-50</Text>
        <View style={styles.vitsLegend}>
          <View style={styles.vitsLegendItem}>
            <View style={[styles.vitsSwatch, { backgroundColor: Colors.warn }]} />
            <Text style={styles.vitsLegendText}>&lt; 25%</Text>
          </View>
          <View style={styles.vitsLegendItem}>
            <View style={[styles.vitsSwatch, { backgroundColor: Colors.ok }]} />
            <Text style={styles.vitsLegendText}>≥ 100%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Meal card ────────────────────────────────────────────────

function MealCard({
  meal,
  onAdd,
  onRemoveItem,
}: {
  meal: Meal;
  onAdd: (mealId: string) => void;
  onRemoveItem: (mealId: string, itemIdx: number) => void;
}) {
  const total = meal.items.reduce((s, i) => s + i.kcal, 0);
  return (
    <View style={styles.mealCard}>
      <View style={styles.mealHead}>
        <View style={styles.mealHeadLeft}>
          <Text style={styles.mealName}>{meal.name}</Text>
          <Text style={styles.mealTime}>{meal.time}</Text>
        </View>
        {meal.items.length > 0 && (
          <Text style={styles.mealKcal}>
            {total}
            <Text style={styles.mealKcalUnit}> kcal</Text>
          </Text>
        )}
      </View>
      {meal.items.map((item, i) => (
        <View key={i} style={styles.foodRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.foodName}>{item.name}</Text>
            <Text style={styles.foodQty}>{item.qty}</Text>
          </View>
          <Text style={styles.foodKcal}>{item.kcal} kcal</Text>
          <TouchableOpacity
            style={styles.removeItemBtn}
            onPress={() => onRemoveItem(meal.id, i)}
            activeOpacity={0.7}
          >
            <Icon name="close" size={11} color={Colors.muted2} />
          </TouchableOpacity>
        </View>
      ))}
      {meal.items.length === 0 ? (
        <View style={styles.mealEmpty}>
          <Text style={styles.mealEmptyText}>Aucun aliment enregistré</Text>
          <TouchableOpacity
            style={styles.mealEmptyBtn}
            onPress={() => onAdd(meal.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.mealEmptyBtnText}>Ajouter</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addMoreBtn}
          onPress={() => onAdd(meal.id)}
          activeOpacity={0.7}
        >
          <Icon name="plus" size={12} color={Colors.muted} />
          <Text style={styles.addMoreText}>Ajouter un aliment</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Home Screen ──────────────────────────────────────────────

interface HomeScreenProps {
  meals: Meal[];
  profile: UserProfile;
  viewingDate: string | null;
  journalDates: string[];
  symptomEntry: SymptomEntry | null;
  onDateChange: (date: string | null) => void;
  onRemoveItem: (mealId: string, itemIdx: number) => void;
  onSaveSymptom: (date: string, scores: SymptomScores) => void;
  onOpenMenu: () => void;
  onOpenSearch: () => void;
}

export function HomeScreen({
  meals,
  profile,
  viewingDate,
  journalDates,
  symptomEntry,
  onDateChange,
  onRemoveItem,
  onSaveSymptom,
  onOpenMenu,
  onOpenSearch,
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [helpVisible, setHelpVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);

  const todayStr = todayDateStr();
  const effectiveDate = viewingDate ?? todayStr;
  const { headline, sub: dateSub, isPast, isFuture } = formatDateLabel(effectiveDate, todayStr);
  const isToday = !isPast && !isFuture;

  const totals = useMemo(() => {
    const t = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    meals.forEach((m) =>
      m.items.forEach((it) => {
        t.kcal += it.kcal;
        t.protein += it.macros?.protein ?? 0;
        t.carbs += it.macros?.carbs ?? 0;
        t.fat += it.macros?.fat ?? 0;
      })
    );
    return t;
  }, [meals]);

  const kcalPct    = Math.min(1, totals.kcal / profile.kcalTarget);
  const remaining  = Math.max(0, Math.round(profile.kcalTarget - totals.kcal));
  const emptyMeals = meals.filter((m) => m.items.length === 0).length;
  const totalItems = meals.reduce((n, m) => n + m.items.length, 0);

  const goToPrev = () => onDateChange(addDays(effectiveDate, -1) === todayStr ? null : addDays(effectiveDate, -1));
  const goToNext = () => {
    const next = addDays(effectiveDate, 1);
    onDateChange(next === todayStr ? null : next);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <OnboardingTip
        tipKey={TIPS.journal.key}
        title={TIPS.journal.title}
        message={TIPS.journal.message}
        delay={1200}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Topbar */}
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.iconBtn} onPress={onOpenMenu} activeOpacity={0.7}>
            <Icon name="menu" size={22} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setCalendarVisible(true)} activeOpacity={0.7}>
            <Icon name="calendar" size={18} color={!isToday ? Colors.signal : Colors.ink} />
          </TouchableOpacity>
          <HelpButton onPress={() => setHelpVisible(true)} />
        </View>
        <HelpModal visible={helpVisible} content={HELP.home} onClose={() => setHelpVisible(false)} />
        <CalendarModal
          visible={calendarVisible}
          selectedDate={viewingDate}
          markedDates={journalDates}
          todayStr={todayStr}
          onSelect={(d) => onDateChange(d === todayStr ? null : d)}
          onClose={() => setCalendarVisible(false)}
        />

        {/* Date navigation bar */}
        <View style={styles.dateBar}>
          <TouchableOpacity style={styles.dateNavBtn} onPress={goToPrev} activeOpacity={0.7}>
            <Icon name="back" size={16} color={Colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateCenterBtn}
            onPress={() => setCalendarVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.dateHeadline, !isToday && isPast && styles.dateHeadlinePast, isFuture && styles.dateHeadlineFuture]}>
              {headline}
            </Text>
            <Text style={styles.dateSub}>{dateSub}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateNavBtn} onPress={goToNext} activeOpacity={0.7}>
            <Icon name="chevron-right" size={16} color={Colors.ink} />
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>
            {isFuture ? 'Planification' : isPast ? 'Historique' : 'Journal du jour'}
          </Text>
          <Text style={styles.heroTitle}>{headline}</Text>

          {/* Calorie card */}
          <View style={styles.calorieCard}>
            <View style={styles.calorieRow}>
              {/* Ring */}
              <View style={styles.ringWrap}>
                <KcalRing pct={kcalPct} />
                <View style={styles.ringCenter}>
                  <Text style={styles.ringNum}>{remaining}</Text>
                  <Text style={styles.ringLabel}>restant</Text>
                </View>
              </View>

              {/* Meta */}
              <View style={styles.kcalMeta}>
                <Text style={styles.kcalMetaLabel}>Apport · Kcal</Text>
                <Text style={styles.kcalMetaBig}>
                  {Math.round(totals.kcal)}
                  <Text style={styles.kcalMetaOf}>/ {profile.kcalTarget}</Text>
                </Text>
                <Text style={styles.kcalMetaSub}>
                  {totals.kcal === 0
                    ? isFuture
                      ? 'Aucun repas planifié pour ce jour.'
                      : 'Aucun repas enregistré.'
                    : `${Math.round(kcalPct * 100)}% de l'objectif · ${emptyMeals} créneau${emptyMeals > 1 ? 'x' : ''} vide${emptyMeals > 1 ? 's' : ''}.`
                  }
                </Text>
              </View>
            </View>

            {/* Macros */}
            <View style={styles.macros}>
              <MacroBar name="Protéines" value={totals.protein} target={profile.macroTargets.protein} />
              <MacroBar name="Glucides"  value={totals.carbs}   target={profile.macroTargets.carbs} />
              <MacroBar name="Lipides"   value={totals.fat}     target={profile.macroTargets.fat} />
            </View>
          </View>
        </View>

        {/* Journal */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{isFuture ? 'Planification' : 'Repas'}</Text>
          <Text style={styles.sectionMeta}>{totalItems} aliment{totalItems > 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.mealBlock}>
          {meals.map((m) => (
            <MealCard
              key={m.id}
              meal={m}
              onAdd={onOpenSearch}
              onRemoveItem={onRemoveItem}
            />
          ))}
        </View>

        {/* Micronutriments — today only */}
        {isToday && (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Micronutriments</Text>
              <Text style={styles.sectionMeta}>apport du jour</Text>
            </View>
            <View style={styles.vitsWrap}>
              <VitaminPanel vitamins={profile.vitamins} />
            </View>
          </>
        )}

        {/* Bien-être — toujours visible (éditable aujourd'hui, lecture seule pour le passé) */}
        {!isFuture && (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Bien-être</Text>
              <Text style={styles.sectionMeta}>{isToday ? 'comment tu te sens' : 'ressenti du jour'}</Text>
            </View>
            <SymptomWidget
              entry={symptomEntry}
              date={effectiveDate}
              readOnly={!isToday}
              onSave={(scores) => onSaveSymptom(effectiveDate, scores)}
            />
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 90 }]}
        onPress={onOpenSearch}
        activeOpacity={0.85}
      >
        <Icon name="plus" size={20} color={Colors.paper2} />
        <Text style={styles.fabText}>{isFuture ? 'Planifier un repas' : 'Ajouter un aliment'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 160 },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
  },
  iconBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Date nav bar
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
    marginBottom: 4,
    gap: 8,
  },
  dateNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenterBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  dateHeadline: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  dateHeadlinePast: {
    color: Colors.muted,
  },
  dateHeadlineFuture: {
    color: Colors.signal,
  },
  dateSub: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    color: Colors.muted2,
  },

  // Hero
  hero: { paddingHorizontal: 20, paddingBottom: 20 },
  heroEyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: Fonts.serif,
    fontSize: 36,
    color: Colors.ink,
    letterSpacing: -0.7,
    marginBottom: 18,
  },

  // Calorie card
  calorieCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    borderRadius: 24,
    padding: 22,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  ringWrap: {
    width: 124, height: 124,
    position: 'relative',
    flexShrink: 0,
  },
  ringCenter: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringNum: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    lineHeight: 36,
    color: Colors.ink,
    letterSpacing: -0.7,
  },
  ringLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginTop: 4,
  },
  kcalMeta: { flex: 1 },
  kcalMetaLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 8,
  },
  kcalMetaBig: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    lineHeight: 30,
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  kcalMetaOf: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.muted,
    fontWeight: '400',
  },
  kcalMetaSub: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    marginTop: 6,
    lineHeight: 18,
  },

  // Macros
  macros: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  macro: { flex: 1, gap: 5 },
  macroName: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  macroValue: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.ink,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  macroUnit: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.muted,
    fontWeight: '400',
  },
  macroBar: {
    height: 3,
    backgroundColor: Colors.hairline,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  macroFill: {
    height: '100%',
    backgroundColor: Colors.ink,
    borderRadius: 2,
  },

  // Section head
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  sectionMeta: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
  },

  // Vitamin panel
  vitsWrap: { paddingHorizontal: 20, marginBottom: 4 },
  vitsCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    borderRadius: 20,
    padding: 18,
    paddingBottom: 6,
  },
  vitsHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vitsTtl: {
    fontFamily: Fonts.serif,
    fontSize: 19,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  vitsTtlSub: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginTop: 3,
  },
  vitsMeta: { alignItems: 'flex-end' },
  vitsMetaBig: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.ink,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  vitsMetaOf: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.muted,
    fontWeight: '400',
  },
  vitsMetaLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 0.4,
    marginTop: 2,
  },

  vitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
    gap: 8,
  },
  vitName: {
    fontFamily: Fonts.serif,
    fontSize: 14,
    color: Colors.ink,
    width: 60,
    letterSpacing: -0.1,
  },
  vitVal: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 0.2,
    width: 88,
  },
  vitValBold: { color: Colors.ink, fontWeight: '500' },
  vitBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.hairline,
    borderRadius: 2,
    overflow: 'hidden',
  },
  vitFill: {
    height: '100%',
    backgroundColor: Colors.ink,
    borderRadius: 2,
  },
  vitFillLow: { backgroundColor: Colors.warn },
  vitFillHigh: { backgroundColor: Colors.ok },
  vitPct: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted,
    width: 38,
    textAlign: 'right',
  },
  vitPctLow: { color: Colors.warn },
  vitPctHigh: { color: Colors.ok },

  vitsFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  vitsFootLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  vitsLegend: { flexDirection: 'row', gap: 14 },
  vitsLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  vitsSwatch: { width: 8, height: 8, borderRadius: 2 },
  vitsLegendText: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.8 },

  // Meals
  mealBlock: { paddingHorizontal: 20, gap: 12 },
  mealCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    borderRadius: 20,
    padding: 16,
    marginBottom: 0,
  },
  mealHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealHeadLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  mealName: {
    fontFamily: Fonts.serif,
    fontSize: 19,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  mealTime: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  mealKcal: {
    fontFamily: Fonts.serif,
    fontSize: 19,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  mealKcalUnit: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.muted,
    fontWeight: '400',
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
    marginTop: 8,
  },
  foodName: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.ink2 },
  foodQty: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted,
    marginTop: 1,
    letterSpacing: 0.3,
  },
  foodKcal: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.ink, marginLeft: 8 },
  removeItemBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  addMoreText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.muted,
  },
  mealEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    borderStyle: 'dashed',
  },
  mealEmptyText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted },
  mealEmptyBtn: {
    borderWidth: 1,
    borderColor: Colors.ink,
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  mealEmptyBtnText: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.ink },

  // FAB
  fab: {
    position: 'absolute',
    right: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 56,
    paddingHorizontal: 22,
    borderRadius: 100,
    backgroundColor: Colors.ink,
    shadowColor: '#0f0c08',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 12,
    zIndex: 10,
  },
  fabText: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.paper2,
    letterSpacing: 0.1,
  },
});
