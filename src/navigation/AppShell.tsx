import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { DrawerMenu } from '../components/DrawerMenu';
import { AIQueueBanner } from '../components/AIQueueBanner';
import { OnboardingFlow } from '../components/OnboardingFlow';
import { resetOnboarding } from '../data/onboarding';
import { aiQueue, AIJobSnapshot } from '../services/aiQueue';
import { DETAIL_FOOD, INITIAL_MEALS } from '../data/food';
import { DEFAULT_PROFILE, UserProfile, computeDietLabel } from '../data/user';
import { HomeScreen } from '../screens/HomeScreen';
import { DetailScreen } from '../screens/DetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { SavedScreen } from '../screens/SavedScreen';
import { SavedDetailScreen } from '../screens/SavedDetailScreen';
import { EditSavedPlateScreen } from '../screens/EditSavedPlateScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { FoodListScreen } from '../screens/FoodListScreen';
import { Colors, Fonts } from '../theme/tokens';
import { Food, Meal } from '../types';
import { SAVED_PLATES, SavedPlate, SavedPlateItem } from '../data/saved';
import { usePersistedState } from '../storage/usePersistedState';
import { KEYS, load, save } from '../storage/store';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AddFoodScreen } from '../screens/AddFoodScreen';
import { ManualFoodScreen } from '../screens/ManualFoodScreen';
import { EditFoodScreen } from '../screens/EditFoodScreen';
import { OpenFoodFactsScreen } from '../screens/OpenFoodFactsScreen';
import { CIQUALScreen } from '../screens/CIQUALScreen';
import { BarcodeScannerScreen } from '../screens/BarcodeScannerScreen';
import { FoodPhotoScreen } from '../screens/FoodPhotoScreen';
import { FodmapScreen } from '../screens/FodmapScreen';
import { MealGeneratorScreen } from '../screens/MealGeneratorScreen';
import { KnowledgeScreen } from '../screens/KnowledgeScreen';
import { ShoppingAssistantScreen } from '../screens/ShoppingAssistantScreen';
import { ShoppingScannerScreen } from '../screens/ShoppingScannerScreen';
import { ScanHistoryEntry, ShoppingListItem } from '../types/shopping';
import { getOFFByBarcode, offProductToFood } from '../services/openFoodFacts';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';
import { FodmapProtocol, DEFAULT_FODMAP_PROTOCOL } from '../data/fodmapProtocol';
import { refreshCiqualAllergens } from '../services/ciqual';
import { generateMeals, updateDigestiveMemory, DigestiveDayData, generateLabScores } from '../services/aiService';
import { LabScores } from '../types/labScores';
import { UserTimelineEvent } from '../types/timeline';
import { GeneratedMeal, MealGeneratorResult } from '../types/mealGenerator';
import { JournalEntry, EMPTY_DAY_MEALS, computeDayLog } from '../data/weeklyStats';
import { SymptomEntry, SymptomScores } from '../types/symptoms';
import { computeDayTips } from '../services/tipsEngine';
import { DayTip } from '../types/tips';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

type Tab = 'home' | 'foods' | 'saved' | 'stats' | 'profile' | 'shopping';
type StackScreen = 'search' | 'detail' | 'savedDetail' | 'editProfile' | 'settings' | 'addFood' | 'manualFood' | 'editFood' | 'openFoodFacts' | 'ciqual' | 'scanner' | 'editSavedPlate' | 'foodPhoto' | 'fodmap' | 'mealGenerator' | 'knowledge' | 'shoppingScanner' | null;

const TABS: { id: Tab; label: string; icon: 'home' | 'leaf' | 'book' | 'chart' | 'user' | 'shopping-cart' }[] = [
  { id: 'home',     label: 'Journal',  icon: 'home' },
  { id: 'foods',    label: 'Aliments', icon: 'leaf' },
  { id: 'saved',    label: 'Plats',    icon: 'book' },
  { id: 'stats',    label: 'Stats',    icon: 'chart' },
  { id: 'profile',  label: 'Profil',   icon: 'user' },
  { id: 'shopping', label: 'Courses',  icon: 'shopping-cart' },
];

// ── Toast ─────────────────────────────────────────────────────

function Toast({ message }: { message: string | null }) {
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (message) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [message]);

  if (!message) return null;
  return (
    <Animated.View style={[styles.toast, { opacity }]}>
      <Icon name="check" size={16} color={Colors.paper2} />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

// ── Duplicate-day banner ──────────────────────────────────────

function DuplicateBanner({ visible }: { visible: boolean }) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(60)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const bottomOffset = insets.bottom + 62 + 8;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0,  duration: 280, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        Animated.timing(opacity,    { toValue: 1,  duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 20, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 0,  duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      style={[styles.duplicateBanner, { bottom: bottomOffset, opacity, transform: [{ translateY }] }]}
      pointerEvents="none"
    >
      <Icon name="layers" size={14} color={Colors.paper2} />
      <Text style={styles.duplicateBannerText}>Journée d'hier copiée dans le journal</Text>
    </Animated.View>
  );
}

// ── Fade transition wrapper ───────────────────────────────────

function FadeScreen({ children, screenKey }: { children: React.ReactNode; screenKey: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [screenKey]);
  return <Animated.View style={{ flex: 1, opacity }}>{children}</Animated.View>;
}

// ── Tabbar ────────────────────────────────────────────────────

function Tabbar({
  activeTab,
  onSelect,
}: {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabbar, { paddingBottom: insets.bottom + 8 }]}>
      {TABS.map((t) => {
        const active = t.id === activeTab;
        return (
          <TouchableOpacity
            key={t.id}
            style={styles.tab}
            onPress={() => onSelect(t.id)}
            activeOpacity={0.7}
          >
            <Icon name={t.icon} size={20} color={active ? Colors.ink : Colors.muted} />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            <View style={[styles.tabDot, active && styles.tabDotActive]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Placeholder ───────────────────────────────────────────────

function PlaceholderScreen({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.placeholder, { paddingTop: insets.top }]}>
      <Text style={styles.placeholderText}>{title}</Text>
      <Text style={styles.placeholderSub}>À venir</Text>
    </View>
  );
}

// ── AI Generation icon (floating, top-right) ──────────────────

function AIGenIcon({
  running,
  done,
  top,
  onPress,
}: {
  running: boolean;
  done: boolean;
  top: number;
  onPress: () => void;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0)).current;

  // Appear on mount
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 200 }).start();
  }, []);

  // Blink while running
  useEffect(() => {
    if (running) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.25, duration: 500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,    duration: 500, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulse.setValue(1);
  }, [running]);

  const bgColor = done ? Colors.ok : Colors.ink;

  return (
    <Animated.View
      style={[
        styles.aiGenIconWrap,
        { top, transform: [{ scale }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.aiGenIconBtn, { backgroundColor: bgColor }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Animated.View style={{ opacity: pulse }}>
          <Icon name="sparkle" size={14} color={Colors.paper2} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── App Shell ─────────────────────────────────────────────────

export function AppShell() {
  console.log('[AppShell] render start');

  // ── All hooks must be declared before any conditional return ──
  const [tab, setTab] = useState<Tab>('home');
  const [stack, setStack] = useState<StackScreen>(null);
  const [selectedFood, setSelectedFood] = useState<Food>(DETAIL_FOOD);
  const [toast, setToast] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [queueJobs, setQueueJobs] = useState<AIJobSnapshot[]>([]);
  const [detailOrigin, setDetailOrigin] = useState<'search' | null>(null);
  const [selectedPlate, setSelectedPlate] = useState<SavedPlate | null>(null);
  const [plateForEdit, setPlateForEdit] = useState<SavedPlate | null>(null);
  const [pendingQuery, setPendingQuery] = useState('');
  const [mealResult, setMealResult] = useState<MealGeneratorResult | null>(null);
  const [mealJobId, setMealJobId] = useState<string | null>(null);
  const [lastAddedFoodId, setLastAddedFoodId] = useState<string | null>(null);
  // Tracks where CIQUAL/OFF/Scanner was opened from ('search' or null=foods tab)
  const [importScreenOrigin, setImportScreenOrigin] = useState<'search' | null>(null);
  // Last food imported in a CIQUAL/OFF/Scanner session (for quick-add on back)
  const [lastImportedFood, setLastImportedFood] = useState<Food | null>(null);
  const insets = useSafeAreaInsets();

  const [profile, setProfile, profileLoading] = usePersistedState<UserProfile>(
    KEYS.profile,
    DEFAULT_PROFILE,
  );
  const [foodList, setFoodList, foodsLoading] = usePersistedState<Food[]>(
    KEYS.foods,
    [DETAIL_FOOD],
  );
  const [settings, setSettings] = usePersistedState<AppSettings>(
    KEYS.settings,
    DEFAULT_SETTINGS,
  );
  const [meals, setMeals, mealsLoading] = usePersistedState<Meal[]>(
    KEYS.meals,
    INITIAL_MEALS,
  );
  const [savedPlates, setSavedPlates] = usePersistedState<SavedPlate[]>(
    KEYS.savedPlates,
    SAVED_PLATES,
  );
  const [journal, setJournal, journalLoading] = usePersistedState<JournalEntry[]>(
    KEYS.journal,
    [],
  );
  const [symptoms, setSymptoms] = usePersistedState<SymptomEntry[]>(
    KEYS.symptoms,
    [],
  );
  const [comments, setComments] = usePersistedState<Record<string, string>>(
    KEYS.comments,
    {},
  );
  const [aiAdvice, setAiAdvice] = usePersistedState<Record<string, string>>(
    KEYS.aiAdvice,
    {},
  );
  const [digestiveMemory, setDigestiveMemory] = usePersistedState<string>(
    KEYS.digestiveMemory,
    '',
  );
  const [digestiveMemoryDate, setDigestiveMemoryDate] = usePersistedState<string>(
    KEYS.digestiveMemoryDate,
    '',
  );
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [memoryError, setMemoryError] = useState<string | null>(null);
  const [labScores, setLabScores] = usePersistedState<LabScores | null>(
    KEYS.labScores,
    null,
  );
  const [labScoresDate, setLabScoresDate] = usePersistedState<string>(
    KEYS.labScoresDate,
    '',
  );
  const [labLoading, setLabLoading] = useState(false);
  const [labError, setLabError] = useState<string | null>(null);
  const [fodmapProtocol, setFodmapProtocol] = usePersistedState<FodmapProtocol>(
    KEYS.fodmapProtocol,
    DEFAULT_FODMAP_PROTOCOL,
  );
  const [onboardingDone, setOnboardingDone] = usePersistedState<boolean>(
    KEYS.onboardingDone,
    false,
  );
  const [timelineEvents, setTimelineEvents] = usePersistedState<Record<string, UserTimelineEvent[]>>(
    KEYS.timelineEvents,
    {},
  );
  const [recentFoodUseIds, setRecentFoodUseIds] = usePersistedState<string[]>(
    KEYS.recentFoodUses,
    [],
  );
  const [recentFoodViewIds, setRecentFoodViewIds] = usePersistedState<string[]>(
    KEYS.recentFoodViews,
    [],
  );
  const [dismissedTips, setDismissedTips] = usePersistedState<Record<string, string[]>>(
    KEYS.dismissedTips,
    {},
  );
  const [scanHistory, setScanHistory] = usePersistedState<ScanHistoryEntry[]>(
    KEYS.scanHistory,
    [],
  );
  const [shoppingList, setShoppingList] = usePersistedState<ShoppingListItem[]>(
    KEYS.shoppingList,
    [],
  );
  const [viewingDate, setViewingDate] = useState<string | null>(null); // null = today
  const [showDuplicateBanner, setShowDuplicateBanner] = useState(false);

  console.log(`[AppShell] loading — profile:${profileLoading} foods:${foodsLoading} meals:${mealsLoading}`);

  // Reset meals daily — saves previous day to journal before clearing
  useEffect(() => {
    if (mealsLoading || journalLoading) return;
    console.log('[AppShell] checking daily reset…');
    load<string>(KEYS.mealsDate).then((storedDate) => {
      const today = todayStr();
      console.log(`[AppShell] mealsDate stored="${storedDate}" today="${today}"`);
      if (storedDate !== today) {
        if (storedDate) {
          // Archive yesterday's meals before reset
          setJournal((prev) => {
            const without = prev.filter((e) => e.date !== storedDate);
            return [...without, { date: storedDate, meals }].slice(-365); // keep 1 year
          });
          console.log(`[AppShell] journal: archived ${storedDate}`);

          // Duplicate yesterday's meals if they had items, otherwise start fresh
          const hadItems = meals.some((m) => m.items.length > 0);
          if (hadItems) {
            setMeals(meals.map((m) => ({ ...m, items: m.items.map((i) => ({ ...i })) })));
            setShowDuplicateBanner(true);
            setTimeout(() => setShowDuplicateBanner(false), 3720);
            console.log('[AppShell] duplicated yesterday meals into new day');
          } else {
            console.log('[AppShell] resetting meals for new day (yesterday was empty)');
            setMeals(INITIAL_MEALS);
          }
        } else {
          console.log('[AppShell] first launch — using initial meals');
          setMeals(INITIAL_MEALS);
        }
        save(KEYS.mealsDate, today);
      }
    });
  }, [mealsLoading, journalLoading]);

  // Subscribe to AI queue for banner updates
  useEffect(() => {
    const unsub = aiQueue.subscribe(setQueueJobs);
    return unsub;
  }, []);

  // Meal generation — background job
  const mealJob    = mealJobId ? queueJobs.find((j) => j.id === mealJobId) : null;
  const mealRunning = mealJob?.status === 'pending' || mealJob?.status === 'running';
  const mealDone   = mealJob?.status === 'done';
  const showAIIcon = mealRunning || mealDone;

  const handleGenerateMeals = (query: string) => {
    setMealResult(null);
    const jobId = aiQueue.add(`Génération · ${query}`, async (signal) => {
      const fodmapPhase = fodmapProtocol.active ? fodmapProtocol.phase : undefined;
      const res = await generateMeals(query, profile, fodmapPhase, settings, signal);
      setMealResult(res);
    });
    setMealJobId(jobId);
    setStack(null); // back to main app immediately
  };

  // One-time migration: recompute CIQUAL allergens for stored foods
  useEffect(() => {
    if (foodsLoading) return;
    load<boolean>(KEYS.migrationV1).then((done) => {
      if (done) return;
      let changed = false;
      const migrated = foodList.map((food) => {
        if (!food.id.startsWith('ciqual-')) return food;
        const updated = refreshCiqualAllergens(food);
        changed = true;
        return updated;
      });
      if (changed) setFoodList(migrated);
      save(KEYS.migrationV1, true);
      console.log('[AppShell] migration v1: CIQUAL allergens refreshed');
    });
  }, [foodsLoading]);

  // ── Viewed date helpers (must be before any conditional return) ──

  const today = todayStr();

  const viewedMeals = (() => {
    if (!viewingDate || viewingDate === today) return meals;
    const entry = journal.find((e) => e.date === viewingDate);
    return (entry && Array.isArray(entry.meals)) ? entry.meals : EMPTY_DAY_MEALS;
  })();

  const effectiveDate = viewingDate ?? today;

  // useMemo must be called unconditionally — never place it after a conditional return
  const dayTips = useMemo((): DayTip[] => {
    try {
      const isFuture = effectiveDate > today;
      if (isFuture) return [];
      return computeDayTips({ meals: viewedMeals, journal, symptoms, profile, date: effectiveDate });
    } catch (e) {
      console.warn('[AppShell] computeDayTips error:', e);
      return [];
    }
  }, [viewedMeals, journal, symptoms, profile, effectiveDate, today]);

  const appLoading = profileLoading || foodsLoading || mealsLoading || journalLoading;

  if (appLoading) {
    console.log('[AppShell] still loading — showing spinner');
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={Colors.ink} />
      </View>
    );
  }

  console.log(`[AppShell] ready — tab:${tab} stack:${stack} foods:${foodList.length} plates:${savedPlates.length}`);

  // ── Symptom helpers ──────────────────────────────────────────

  const handleSaveSymptom = (date: string, scores: SymptomScores) => {
    setSymptoms((prev) => {
      const without = prev.filter((e) => e.date !== date);
      return [...without, { date, scores }].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const handleSaveComment = (date: string, text: string) => {
    setComments((prev) => {
      if (!text.trim()) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [date]: text };
    });
  };

  const handleGenerateLab = async () => {
    setLabLoading(true);
    setLabError(null);
    try {
      const scores = await generateLabScores(meals, profile, settings);
      setLabScores(scores);
      const dateLabel = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      setLabScoresDate(dateLabel);
    } catch (e: any) {
      setLabError(e?.message ?? 'Erreur lors de l\'analyse.');
    } finally {
      setLabLoading(false);
    }
  };

  const handleSaveAdvice = (date: string, text: string) => {
    setAiAdvice((prev) => {
      if (!text.trim()) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [date]: text };
    });
  };

  const handleAddTimelineEvent = (event: Omit<UserTimelineEvent, 'id' | 'kind'>) => {
    const newEvent: UserTimelineEvent = {
      kind: 'user',
      id: `ute-${Date.now()}`,
      ...event,
    };
    setTimelineEvents((prev) => ({
      ...prev,
      [event.date]: [...(prev[event.date] ?? []), newEvent],
    }));
  };

  const handleDeleteTimelineEvent = (id: string) => {
    const dateKey = effectiveDate;
    setTimelineEvents((prev) => {
      const existing = prev[dateKey] ?? [];
      const updated = existing.filter((e) => e.id !== id);
      if (updated.length === 0) {
        const { [dateKey]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [dateKey]: updated };
    });
  };

  const handleUpdateMemory = async () => {
    setMemoryLoading(true);
    setMemoryError(null);
    try {
      // Build last 21 days of data
      const todayDate = todayStr();
      const recentDays: DigestiveDayData[] = [];
      for (let i = 0; i < 21; i++) {
        const d = new Date(todayDate + 'T12:00:00');
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayMeals = dateStr === todayDate
          ? meals
          : (journal.find((e) => e.date === dateStr)?.meals ?? []);
        const symptom = symptoms.find((e) => e.date === dateStr) ?? null;
        recentDays.push({ date: dateStr, meals: dayMeals, symptom });
      }
      const updated = await updateDigestiveMemory(recentDays, profile, digestiveMemory, settings);
      setDigestiveMemory(updated);
      const dateLabel = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      setDigestiveMemoryDate(dateLabel);
    } catch (e: any) {
      setMemoryError(e?.message ?? 'Erreur lors de l\'analyse.');
    } finally {
      setMemoryLoading(false);
    }
  };

  // Symptom entry for the currently viewed date
  const symptomEntry = symptoms.find((e) => e.date === effectiveDate) ?? null;

  // Dates that have data (for calendar dots)
  const journalDates = (() => {
    const dates = journal
      .filter((e) => Array.isArray(e.meals) && e.meals.some((m) => m.items.length > 0))
      .map((e) => e.date);
    if (meals.some((m) => m.items.length > 0)) dates.push(today);
    return [...new Set(dates)];
  })();

  // Update meals for viewingDate (routes to meals or journal)
  const updateViewedMeals = (updater: (prev: Meal[]) => Meal[]) => {
    if (!viewingDate || viewingDate === today) {
      setMeals(updater);
    } else {
      setJournal((prev) => {
        const entry = prev.find((e) => e.date === viewingDate);
        const current = (entry && Array.isArray(entry.meals)) ? entry.meals : EMPTY_DAY_MEALS;
        const updated = updater(current);
        const without = prev.filter((e) => e.date !== viewingDate);
        return [...without, { date: viewingDate, meals: updated }].slice(-365);
      });
    }
  };

  const pushRecentUse  = (id: string) =>
    setRecentFoodUseIds((p) => [id, ...p.filter((x) => x !== id)].slice(0, 15));
  const pushRecentView = (id: string) =>
    setRecentFoodViewIds((p) => [id, ...p.filter((x) => x !== id)].slice(0, 10));

  const showTab = (t: Tab) => {
    console.log(`[AppShell] showTab → ${t}`);
    setStack(null);
    setTab(t);
  };

  const openSearch = () => setStack('search');

  const openDetail = (food: Food, from: 'search' | null = null) => {
    setSelectedFood(food);
    setDetailOrigin(from);
    setStack('detail');
    pushRecentView(food.id);
  };

  // Called by back button of CIQUAL/OFF/Scanner.
  // If a food was just imported and the flow started from Search, open its
  // detail so the user can add it to a meal without going to the Aliments tab.
  const handleImportScreenBack = () => {
    const food = lastImportedFood;
    setLastImportedFood(null);
    if (food && importScreenOrigin === 'search') {
      openDetail(food, 'search');
    } else if (importScreenOrigin === 'search') {
      setStack('search');
    } else {
      setStack(null); // back to foods tab
    }
  };

  const openSavedDetail = (plate: SavedPlate) => {
    setSelectedPlate(plate);
    setStack('savedDetail');
  };

  const handleAddPlate = (mealId: string, plate: SavedPlate) => {
    const mealName = viewedMeals.find((m) => m.id === mealId)?.name;
    updateViewedMeals((ms) =>
      ms.map((m) =>
        m.id === mealId
          ? {
              ...m,
              items: [
                ...m.items,
                ...plate.recipe.map((r) => ({
                  name: r.name,
                  qty: r.qty,
                  kcal: r.kcal,
                  macros: r.macros,
                })),
              ],
            }
          : m
      )
    );
    setStack(null);
    setTab('home');
    setToast(`${plate.name} ajouté à ${mealName ?? 'un repas'}`);
    setTimeout(() => setToast(null), 2600);
  };

  const handleAdd = ({
    food,
    portion,
    mealId,
    kcal,
  }: {
    food: Food;
    portion: number;
    mealId: string;
    kcal: number;
  }) => {
    const mealName = viewedMeals.find((m) => m.id === mealId)?.name;
    updateViewedMeals((ms) =>
      ms.map((m) =>
        m.id === mealId
          ? {
              ...m,
              items: [
                ...m.items,
                {
                  name: food.name,
                  qty: `${portion} ${food.unit}`,
                  kcal,
                  macros: {
                    protein: Math.round((food.per100.protein * portion) / 100 * 10) / 10,
                    carbs:   Math.round((food.per100.carbs   * portion) / 100 * 10) / 10,
                    fat:     Math.round((food.per100.fat     * portion) / 100 * 10) / 10,
                  },
                  foodId: food.id,
                  portionNum: portion,
                  unit: food.unit,
                },
              ],
            }
          : m
      )
    );
    pushRecentUse(food.id);
    setStack(null);
    setTab('home');
    setToast(`Ajouté à ${mealName ?? 'un repas'}`);
    setTimeout(() => setToast(null), 2600);
  };

  const handleUpdateFood = (food: Food) => {
    setFoodList((prev) => prev.map((f) => (f.id === food.id ? food : f)));
  };

  const handleAddFoodToJournal = (food: Food, portion: number, mealId: string) => {
    pushRecentUse(food.id);
    const kcal = Math.round((food.per100.kcal * portion) / 100);
    updateViewedMeals((ms) =>
      ms.map((m) =>
        m.id === mealId
          ? {
              ...m,
              items: [
                ...m.items,
                {
                  name: food.name,
                  qty: `${portion} ${food.unit}`,
                  kcal,
                  macros: {
                    protein: Math.round((food.per100.protein * portion) / 100 * 10) / 10,
                    carbs:   Math.round((food.per100.carbs   * portion) / 100 * 10) / 10,
                    fat:     Math.round((food.per100.fat     * portion) / 100 * 10) / 10,
                  },
                  foodId: food.id,
                  portionNum: portion,
                  unit: food.unit,
                },
              ],
            }
          : m
      )
    );
    const mealName = viewedMeals.find((m) => m.id === mealId)?.name ?? 'un repas';
    setToast(`${food.name} ajouté à ${mealName}`);
    setTimeout(() => setToast(null), 2600);
  };

  const handleAddFoodToPlate = (food: Food, plateId: string) => {
    pushRecentUse(food.id);
    const plate = savedPlates.find((p) => p.id === plateId);
    if (!plate) return;
    const portion = food.defaultPortion;
    const item: SavedPlateItem = {
      name: food.name,
      qty: `${portion} ${food.unit}`,
      kcal: Math.round((food.per100.kcal * portion) / 100),
      macros: {
        protein: Math.round((food.per100.protein * portion) / 100 * 10) / 10,
        carbs:   Math.round((food.per100.carbs   * portion) / 100 * 10) / 10,
        fat:     Math.round((food.per100.fat     * portion) / 100 * 10) / 10,
      },
    };
    setSavedPlates((prev) =>
      prev.map((p) => p.id !== plateId ? p : {
        ...p,
        recipe: [...p.recipe, item],
        items: p.items + 1,
        kcal: p.kcal + item.kcal,
        macros: {
          protein: Math.round((p.macros.protein + item.macros.protein) * 10) / 10,
          carbs:   Math.round((p.macros.carbs   + item.macros.carbs)   * 10) / 10,
          fat:     Math.round((p.macros.fat     + item.macros.fat)     * 10) / 10,
        },
      })
    );
    setToast(`« ${food.name} » ajouté à « ${plate.name} »`);
    setTimeout(() => setToast(null), 2600);
  };

  const handleRemoveItem = (mealId: string, itemIdx: number) => {
    updateViewedMeals((ms) =>
      ms.map((m) =>
        m.id === mealId
          ? { ...m, items: m.items.filter((_, i) => i !== itemIdx) }
          : m
      )
    );
  };

  const handleEditItem = (mealId: string, itemIdx: number, newPortion: number) => {
    updateViewedMeals((ms) =>
      ms.map((m) => {
        if (m.id !== mealId) return m;
        return {
          ...m,
          items: m.items.map((item, i) => {
            if (i !== itemIdx) return item;
            const food = foodList.find((f) => f.id === item.foodId);
            if (!food) return item;
            return {
              ...item,
              qty: `${newPortion} ${food.unit}`,
              kcal: Math.round((food.per100.kcal * newPortion) / 100),
              portionNum: newPortion,
              macros: {
                protein: Math.round((food.per100.protein * newPortion) / 100 * 10) / 10,
                carbs:   Math.round((food.per100.carbs   * newPortion) / 100 * 10) / 10,
                fat:     Math.round((food.per100.fat     * newPortion) / 100 * 10) / 10,
              },
            };
          }),
        };
      })
    );
  };

  const handleSaveProfile = (updated: UserProfile) => {
    setProfile(updated);
    setStack(null);
    setToast('Profil mis à jour');
    setTimeout(() => setToast(null), 2600);
  };

  const handleToggleDiet = (id: string) => {
    setProfile((p) => ({
      ...p,
      diets: p.diets.map((d) => (d.id === id ? { ...d, on: !d.on } : d)),
    }));
  };

  const handleDeletePlate = (plate: SavedPlate) => {
    setSavedPlates((prev) => prev.filter((p) => p.id !== plate.id));
    setStack(null);
    setTab('saved');
    setToast(`« ${plate.name} » supprimé`);
    setTimeout(() => setToast(null), 2600);
  };

  const handleSavePlate = (plate: SavedPlate) => {
    setSavedPlates((prev) => {
      const exists = prev.some((p) => p.id === plate.id);
      return exists ? prev.map((p) => (p.id === plate.id ? plate : p)) : [...prev, plate];
    });
    setStack(null);
    setTab('saved');
    setToast(plateForEdit ? `« ${plate.name} » mis à jour` : `« ${plate.name} » sauvegardé`);
    setTimeout(() => setToast(null), 2600);
  };

  const handleToggleShoppingList = (entry: ScanHistoryEntry) => {
    setShoppingList((prev) => {
      const exists = prev.some((i) => i.id === entry.id);
      if (exists) return prev.filter((i) => i.id !== entry.id);
      const item: ShoppingListItem = {
        id: entry.id,
        ts: entry.ts,
        productName: entry.productName,
        brand: entry.brand,
        barcode: entry.barcode,
        score: entry.score,
        verdict: entry.verdict,
        addedToNutritor: false,
      };
      return [item, ...prev];
    });
  };

  const handleAddToNutritor = async (item: ShoppingListItem) => {
    const product = await getOFFByBarcode(item.barcode);
    if (!product) return;
    const food = offProductToFood(product);
    setFoodList((prev) => {
      if (prev.some((f) => f.id === food.id)) return prev;
      return [...prev, food];
    });
    setShoppingList((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, addedToNutritor: true } : i)),
    );
  };

  const handleRemoveFromShoppingList = (itemId: string) => {
    setShoppingList((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleSaveGeneratedMeal = (meal: GeneratedMeal) => {
    const totalTime = (meal.prepTime ?? 0) + (meal.cookTime ?? 0);
    const plate: SavedPlate = {
      id: `gen-${Date.now()}`,
      name: `${meal.emoji} ${meal.name}`,
      kcal: meal.per_serving.kcal,
      time: totalTime > 0 ? `${totalTime} min` : '—',
      timeMin: totalTime,
      tags: meal.tags.slice(0, 4),
      items: meal.ingredients.length,
      last: todayStr(),
      macros: {
        protein: meal.per_serving.protein,
        carbs: meal.per_serving.carbs,
        fat: meal.per_serving.fat,
      },
      recipe: meal.ingredients.map((ing) => ({
        name: ing.name,
        qty: ing.amount,
        kcal: 0,
        macros: { protein: 0, carbs: 0, fat: 0 },
      })),
      note: meal.description,
    };
    setSavedPlates((prev) => [...prev, plate]);
    setToast(`« ${meal.name} » sauvegardé dans les plats`);
    setTimeout(() => setToast(null), 2600);
  };

  const showTabs = stack === null;

  // ── Active screen ────────────────────────────────────────

  let screen: React.ReactNode;

  const openMenu = () => setDrawerOpen(true);

  if (stack === 'search') {
    screen = (
      <SearchScreen
        foodList={foodList}
        profile={profile}
        recentFoodIds={[
          ...recentFoodViewIds,
          ...recentFoodUseIds.filter((id) => !recentFoodViewIds.includes(id)),
        ].slice(0, 10)}
        onBack={() => setStack(null)}
        onPickItem={(food) => openDetail(food, 'search')}
        onDeleteFood={(foodId) => {
          setFoodList((prev) => prev.filter((f) => f.id !== foodId));
          setToast('Aliment supprimé');
          setTimeout(() => setToast(null), 2600);
        }}
        onAddWithAI={(q) => { setPendingQuery(q); setStack('addFood'); }}
        onOpenFoodFacts={(q) => { setPendingQuery(q); setLastImportedFood(null); setImportScreenOrigin('search'); setStack('openFoodFacts'); }}
        onOpenCIQUAL={(q) => { setPendingQuery(q); setLastImportedFood(null); setImportScreenOrigin('search'); setStack('ciqual'); }}
        onOpenScanner={() => { setLastImportedFood(null); setImportScreenOrigin('search'); setStack('scanner'); }}
        onOpenMenu={openMenu}
      />
    );
  } else if (stack === 'detail') {
    screen = (
      <DetailScreen
        food={selectedFood}
        meals={viewedMeals}
        profile={profile}
        onBack={() => setStack(detailOrigin ?? null)}
        onAdd={handleAdd}
        onEdit={() => setStack('editFood')}
        onUpdateFood={(updated) => {
          setFoodList((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
          setSelectedFood(updated);
        }}
        onOpenMenu={openMenu}
      />
    );
  } else if (stack === 'editFood') {
    screen = (
      <EditFoodScreen
        food={selectedFood}
        onSave={(updated) => {
          setFoodList((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
          setSelectedFood(updated);
        }}
        onBack={() => setStack('detail')}
      />
    );
  } else if (stack === 'savedDetail' && selectedPlate) {
    screen = (
      <SavedDetailScreen
        plate={selectedPlate}
        meals={viewedMeals}
        settings={settings}
        onBack={() => setStack(null)}
        onAdd={handleAddPlate}
        onDelete={() => handleDeletePlate(selectedPlate)}
        onUpdatePlate={(plate) => {
          setSavedPlates((prev) => prev.map((p) => p.id === plate.id ? plate : p));
          setSelectedPlate(plate);
        }}
        onOpenMenu={openMenu}
      />
    );
  } else if (stack === 'editProfile') {
    screen = (
      <EditProfileScreen
        profile={profile}
        onSave={handleSaveProfile}
        onBack={() => setStack(null)}
      />
    );
  } else if (stack === 'scanner') {
    screen = (
      <BarcodeScannerScreen
        existingIds={new Set(foodList.map((f) => f.id))}
        onImport={(food) => {
          setFoodList((prev) => [...prev, food]);
          setLastImportedFood(food);
          setToast(`« ${food.name} » ajouté à ta liste`);
          setTimeout(() => setToast(null), 2600);
        }}
        onBack={handleImportScreenBack}
        onOpenMenu={openMenu}
      />
    );
  } else if (stack === 'ciqual') {
    screen = (
      <CIQUALScreen
        existingIds={new Set(foodList.map((f) => f.id))}
        initialQuery={pendingQuery}
        settings={settings}
        onImport={(food) => {
          setFoodList((prev) => [...prev, food]);
          setLastImportedFood(food);
        }}
        onUpdateFood={(food) => {
          setFoodList((prev) => prev.map((f) => (f.id === food.id ? food : f)));
          setLastAddedFoodId(food.id);
        }}
        onBack={handleImportScreenBack}
        onOpenMenu={openMenu}
      />
    );
  } else if (stack === 'openFoodFacts') {
    screen = (
      <OpenFoodFactsScreen
        existingIds={new Set(foodList.map((f) => f.id))}
        initialQuery={pendingQuery}
        profile={profile}
        settings={settings}
        onImport={(food) => {
          setFoodList((prev) => [...prev, food]);
          setLastImportedFood(food);
        }}
        onUpdateFood={(food) => {
          setFoodList((prev) => prev.map((f) => (f.id === food.id ? food : f)));
          setLastAddedFoodId(food.id);
        }}
        onBack={handleImportScreenBack}
        onOpenMenu={openMenu}
      />
    );
  } else if (stack === 'addFood') {
    screen = (
      <AddFoodScreen
        initialQuery={pendingQuery}
        settings={settings}
        onAdd={(food) => {
          setFoodList((prev) => [...prev, food]);
          setLastAddedFoodId(food.id);
        }}
        onBack={() => setStack('search')}
        onOpenMenu={openMenu}
        onManualEntry={(name) => { setPendingQuery(name); setStack('manualFood'); }}
      />
    );
  } else if (stack === 'manualFood') {
    screen = (
      <ManualFoodScreen
        initialName={pendingQuery}
        onAdd={(food) => {
          setFoodList((prev) => [...prev, food]);
          setLastAddedFoodId(food.id);
          setToast(`« ${food.name} » ajouté à ta liste`);
          setTimeout(() => setToast(null), 2600);
        }}
        onBack={() => setStack('search')}
        onOpenMenu={openMenu}
      />
    );
  } else if (stack === 'foodPhoto') {
    screen = (
      <FoodPhotoScreen
        existingIds={new Set(foodList.map((f) => f.id))}
        settings={settings}
        onImport={(food) => {
          setFoodList((prev) => [...prev, food]);
        }}
        onBack={() => setStack('search')}
        onOpenMenu={openMenu}
      />
    );
  } else if (stack === 'editSavedPlate') {
    screen = (
      <EditSavedPlateScreen
        plate={plateForEdit}
        allPlates={savedPlates}
        foodList={foodList}
        onSave={handleSavePlate}
        onBack={() => setStack(null)}
      />
    );
  } else if (stack === 'fodmap') {
    screen = (
      <FodmapScreen
        protocol={fodmapProtocol}
        onUpdate={setFodmapProtocol}
        onBack={() => setStack(null)}
        onOpenMenu={openMenu}
      />
    );
  } else if (stack === 'mealGenerator') {
    screen = (
      <MealGeneratorScreen
        profile={profile}
        fodmapProtocol={fodmapProtocol}
        settings={settings}
        externalResult={mealResult}
        onGenerateInBackground={handleGenerateMeals}
        onSaveMeal={handleSaveGeneratedMeal}
        onBack={() => {
          setStack(null);
          // Clear icon once user has seen the result
          if (mealDone) {
            setMealJobId(null);
            setMealResult(null);
          }
        }}
        onOpenMenu={openMenu}
      />
    );
  } else if (stack === 'knowledge') {
    screen = (
      <KnowledgeScreen onBack={() => setStack(null)} onOpenMenu={openMenu} />
    );
  } else if (stack === 'shoppingScanner') {
    screen = (
      <ShoppingScannerScreen
        profile={profile}
        onBack={() => setStack(null)}
        onScanComplete={(entry) => {
          setScanHistory((prev) => [entry, ...prev].slice(0, 50));
          setStack(null);
        }}
      />
    );
  } else if (stack === 'settings') {
    screen = (
      <SettingsScreen
        settings={settings}
        foodList={foodList}
        onSave={setSettings}
        onImportFoods={(foods) => {
          const existing = new Set(foodList.map((f) => f.id));
          const newFoods = foods.filter((f) => !existing.has(f.id));
          setFoodList([...foodList, ...newFoods]);
        }}
        onBack={() => setStack(null)}
        onOpenMenu={openMenu}
        onResetOnboarding={async () => {
          await resetOnboarding();
          setOnboardingDone(false);
          setStack(null);
        }}
        showToast={(msg) => {
          setToast(msg);
          setTimeout(() => setToast(null), 2600);
        }}
      />
    );
  } else {
    switch (tab) {
      case 'home':
        screen = (
          <HomeScreen
            meals={viewedMeals}
            profile={profile}
            settings={settings}
            viewingDate={viewingDate}
            journalDates={journalDates}
            symptomEntry={symptomEntry}
            comment={comments[effectiveDate] ?? ''}
            aiAdvice={aiAdvice[effectiveDate] ?? ''}
            userTimelineEvents={timelineEvents[effectiveDate] ?? []}
            onDateChange={setViewingDate}
            onRemoveItem={handleRemoveItem}
            onEditItem={handleEditItem}
            onOpenMenu={() => setDrawerOpen(true)}
            onOpenSearch={openSearch}
            onOpenFoods={() => showTab('foods')}
            dayTips={dayTips}
            dismissedTipIds={dismissedTips[effectiveDate] ?? []}
            onDismissTip={(id) =>
              setDismissedTips((prev) => ({
                ...prev,
                [effectiveDate]: [...(prev[effectiveDate] ?? []), id],
              }))
            }
            onSaveSymptom={handleSaveSymptom}
            onSaveComment={handleSaveComment}
            onSaveAdvice={handleSaveAdvice}
            onAddTimelineEvent={handleAddTimelineEvent}
            onDeleteTimelineEvent={handleDeleteTimelineEvent}
          />
        );
        break;
      case 'foods':
        screen = (
          <FoodListScreen
            foodList={foodList}
            savedPlates={savedPlates}
            meals={viewedMeals}
            profile={profile}
            recentFoodUseIds={recentFoodUseIds}
            recentFoodViewIds={recentFoodViewIds}
            onPickFood={(food) => openDetail(food, null)}
            onAddToPlate={handleAddFoodToPlate}
            onAddToJournal={handleAddFoodToJournal}
            onDeleteFood={(foodId) => setFoodList((prev) => prev.filter((f) => f.id !== foodId))}
            onOpenMenu={() => setDrawerOpen(true)}
            onAddWithAI={(q) => { setPendingQuery(q); setStack('addFood'); }}
            onOpenFoodFacts={(q) => { setPendingQuery(q); setLastImportedFood(null); setImportScreenOrigin(null); setStack('openFoodFacts'); }}
            onOpenCIQUAL={(q) => { setPendingQuery(q); setLastImportedFood(null); setImportScreenOrigin(null); setStack('ciqual'); }}
            onOpenScanner={() => { setLastImportedFood(null); setImportScreenOrigin(null); setStack('scanner'); }}
            onOpenPhotoAI={() => setStack('foodPhoto')}
          />
        );
        break;
      case 'saved':
        screen = (
          <SavedScreen
            plates={savedPlates}
            onOpenPlate={openSavedDetail}
            onCreatePlate={() => {
              setPlateForEdit(null);
              setStack('editSavedPlate');
            }}
            onEditPlate={(plate) => {
              setPlateForEdit(plate);
              setStack('editSavedPlate');
            }}
            onOpenMenu={() => setDrawerOpen(true)}
          />
        );
        break;
      case 'stats':
        screen = (
          <StatsScreen
            journal={journal}
            todayMeals={meals}
            profile={profile}
            symptoms={symptoms}
            foodList={foodList}
            onOpenMenu={() => setDrawerOpen(true)}
          />
        );
        break;
      case 'profile':
        screen = (
          <ProfileScreen
            profile={profile}
            digestiveMemory={digestiveMemory}
            digestiveMemoryDate={digestiveMemoryDate}
            memoryLoading={memoryLoading}
            memoryError={memoryError}
            labScores={labScores}
            labScoresDate={labScoresDate}
            labLoading={labLoading}
            labError={labError}
            onEdit={() => setStack('editProfile')}
            onToggleDiet={handleToggleDiet}
            onOpenMenu={() => setDrawerOpen(true)}
            onOpenFodmap={() => setStack('fodmap')}
            onUpdateMemory={handleUpdateMemory}
            onGenerateLab={handleGenerateLab}
          />
        );
        break;
      case 'shopping':
        screen = (
          <ShoppingAssistantScreen
            scanHistory={scanHistory}
            shoppingList={shoppingList}
            onOpenMenu={() => setDrawerOpen(true)}
            onOpenScanner={() => setStack('shoppingScanner')}
            onClearHistory={() => setScanHistory([])}
            onToggleShoppingList={handleToggleShoppingList}
            onAddToNutritor={handleAddToNutritor}
            onRemoveFromShoppingList={handleRemoveFromShoppingList}
          />
        );
        break;
    }
  }

  // ── Drawer profile data ──────────────────────────────────

  const drawerProfile = {
    initial: profile.initial,
    name: profile.name,
    diet: computeDietLabel(profile.diets),
    goal: profile.goal,
  };

  const screenKey = stack ?? tab;

  return (
    <View style={styles.container}>
      <FadeScreen screenKey={screenKey}>
        <View style={styles.screenWrap}>{screen}</View>
      </FadeScreen>
      {showTabs && <Tabbar activeTab={tab} onSelect={showTab} />}
      <Toast message={toast} />
      <DuplicateBanner visible={showDuplicateBanner} />
      <AIQueueBanner
        jobs={queueJobs}
        hasTabBar={showTabs}
        onDismiss={() => { aiQueue.dismissCompleted(); setLastAddedFoodId(null); }}
        onCancelRunning={() => aiQueue.cancelRunning()}
        onViewResult={
          mealDone
            ? () => setStack('mealGenerator')
            : lastAddedFoodId
              ? () => {
                  const f = foodList.find((x) => x.id === lastAddedFoodId);
                  if (f) openDetail(f, null);
                  else showTab('foods');
                  setLastAddedFoodId(null);
                }
              : queueJobs.some((j) => j.status === 'done')
                ? () => showTab('foods')
                : undefined
        }
        doneSubText={
          mealDone
            ? 'Disponible dans le Générateur de repas'
            : 'Ajouté dans les Aliments'
        }
      />
      {showAIIcon && (
        <AIGenIcon
          running={mealRunning}
          done={mealDone}
          top={insets.top + 8}
          onPress={() => setStack('mealGenerator')}
        />
      )}
      <DrawerMenu
        visible={drawerOpen}
        activeTab={tab}
        profile={drawerProfile}
        onNavigate={(t) => showTab(t)}
        onOpenSettings={() => setStack('settings')}
        onOpenMealGenerator={() => setStack('mealGenerator')}
        onOpenKnowledge={() => setStack('knowledge')}
        onClose={() => setDrawerOpen(false)}
      />
      <OnboardingFlow
        visible={!onboardingDone}
        profile={profile}
        onComplete={(updatedProfile) => {
          setProfile(updatedProfile);
          setOnboardingDone(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  screenWrap: { flex: 1 },

  aiGenIconWrap: {
    position: 'absolute',
    right: 16,
    zIndex: 200,
  },
  aiGenIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },

  tabbar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(242,237,226,0.92)',
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  tabLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  tabLabelActive: { color: Colors.ink },
  tabDot: {
    width: 4, height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginTop: 2,
  },
  tabDotActive: { backgroundColor: Colors.ink },

  toast: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    backgroundColor: Colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 100,
    shadowColor: '#0f0c08',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 16,
    zIndex: 100,
  },
  toastText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.paper2,
  },

  duplicateBanner: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: Colors.ink2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 100,
    shadowColor: '#0f0c08',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 90,
  },
  duplicateBannerText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.paper2,
  },

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.paper,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.paper,
  },
  placeholderText: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    color: Colors.ink,
    letterSpacing: -0.5,
  },
  placeholderSub: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginTop: 8,
  },
});
