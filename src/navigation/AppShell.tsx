import React, { useEffect, useRef, useState } from 'react';
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
import { Colors, Fonts } from '../theme/tokens';
import { Food, Meal } from '../types';
import { SAVED_PLATES, SavedPlate } from '../data/saved';
import { usePersistedState } from '../storage/usePersistedState';
import { KEYS, load, save } from '../storage/store';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AddFoodScreen } from '../screens/AddFoodScreen';
import { OpenFoodFactsScreen } from '../screens/OpenFoodFactsScreen';
import { CIQUALScreen } from '../screens/CIQUALScreen';
import { BarcodeScannerScreen } from '../screens/BarcodeScannerScreen';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';
import { refreshCiqualAllergens } from '../services/ciqual';
import { JournalEntry, EMPTY_DAY_MEALS, computeDayLog } from '../data/weeklyStats';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

type Tab = 'home' | 'saved' | 'stats' | 'profile';
type StackScreen = 'search' | 'detail' | 'savedDetail' | 'editProfile' | 'settings' | 'addFood' | 'openFoodFacts' | 'ciqual' | 'scanner' | 'editSavedPlate' | null;

const TABS: { id: Tab; label: string; icon: 'home' | 'book' | 'chart' | 'user' }[] = [
  { id: 'home',    label: 'Journal', icon: 'home' },
  { id: 'saved',   label: 'Plats',   icon: 'book' },
  { id: 'stats',   label: 'Stats',   icon: 'chart' },
  { id: 'profile', label: 'Profil',  icon: 'user' },
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

// ── App Shell ─────────────────────────────────────────────────

export function AppShell() {
  console.log('[AppShell] render start');

  // ── All hooks must be declared before any conditional return ──
  const [tab, setTab] = useState<Tab>('home');
  const [stack, setStack] = useState<StackScreen>(null);
  const [selectedFood, setSelectedFood] = useState<Food>(DETAIL_FOOD);
  const [toast, setToast] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailOrigin, setDetailOrigin] = useState<'search' | null>(null);
  const [selectedPlate, setSelectedPlate] = useState<SavedPlate | null>(null);
  const [plateForEdit, setPlateForEdit] = useState<SavedPlate | null>(null);
  const [pendingQuery, setPendingQuery] = useState('');

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
  const [viewingDate, setViewingDate] = useState<string | null>(null); // null = today

  console.log(`[AppShell] loading — profile:${profileLoading} foods:${foodsLoading} meals:${mealsLoading}`);

  // Reset meals daily — saves previous day to journal before clearing
  useEffect(() => {
    if (mealsLoading || journalLoading) return;
    console.log('[AppShell] checking daily reset…');
    load<string>(KEYS.mealsDate).then((storedDate) => {
      const today = todayStr();
      console.log(`[AppShell] mealsDate stored="${storedDate}" today="${today}"`);
      if (storedDate !== today) {
        // Archive yesterday's meals before reset
        if (storedDate) {
          setJournal((prev) => {
            const without = prev.filter((e) => e.date !== storedDate);
            return [...without, { date: storedDate, meals }].slice(-365); // keep 1 year
          });
          console.log(`[AppShell] journal: archived ${storedDate}`);
        }
        console.log('[AppShell] resetting meals for new day');
        setMeals(INITIAL_MEALS);
        save(KEYS.mealsDate, today);
      }
    });
  }, [mealsLoading, journalLoading]);

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

  // ── Viewed date helpers ──────────────────────────────────────

  const today = todayStr();

  // Meals for the currently viewed date
  const viewedMeals = (() => {
    if (!viewingDate || viewingDate === today) return meals;
    const entry = journal.find((e) => e.date === viewingDate);
    return (entry && Array.isArray(entry.meals)) ? entry.meals : EMPTY_DAY_MEALS;
  })();

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
                },
              ],
            }
          : m
      )
    );
    setStack(null);
    setTab('home');
    setToast(`Ajouté à ${mealName ?? 'un repas'}`);
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

  const showTabs = stack === null;

  // ── Active screen ────────────────────────────────────────

  let screen: React.ReactNode;

  if (stack === 'search') {
    screen = (
      <SearchScreen
        foodList={foodList}
        onBack={() => setStack(null)}
        onPickItem={(food) => openDetail(food, 'search')}
        onDeleteFood={(foodId) => {
          setFoodList((prev) => prev.filter((f) => f.id !== foodId));
          setToast('Aliment supprimé');
          setTimeout(() => setToast(null), 2600);
        }}
        onAddWithAI={(q) => { setPendingQuery(q); setStack('addFood'); }}
        onOpenFoodFacts={(q) => { setPendingQuery(q); setStack('openFoodFacts'); }}
        onOpenCIQUAL={(q) => { setPendingQuery(q); setStack('ciqual'); }}
        onOpenScanner={() => setStack('scanner')}
      />
    );
  } else if (stack === 'detail') {
    screen = (
      <DetailScreen
        food={selectedFood}
        meals={viewedMeals}
        onBack={() => setStack(detailOrigin ?? null)}
        onAdd={handleAdd}
      />
    );
  } else if (stack === 'savedDetail' && selectedPlate) {
    screen = (
      <SavedDetailScreen
        plate={selectedPlate}
        meals={viewedMeals}
        onBack={() => setStack(null)}
        onAdd={handleAddPlate}
        onDelete={() => handleDeletePlate(selectedPlate)}
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
          setToast(`« ${food.name} » ajouté à ta liste`);
          setTimeout(() => setToast(null), 2600);
        }}
        onBack={() => setStack('search')}
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
          setToast(`« ${food.name} » ajouté à ta liste`);
          setTimeout(() => setToast(null), 2600);
        }}
        onBack={() => setStack('search')}
      />
    );
  } else if (stack === 'openFoodFacts') {
    screen = (
      <OpenFoodFactsScreen
        existingIds={new Set(foodList.map((f) => f.id))}
        initialQuery={pendingQuery}
        settings={settings}
        onImport={(food) => {
          setFoodList((prev) => [...prev, food]);
          setToast(`« ${food.name} » ajouté à ta liste`);
          setTimeout(() => setToast(null), 2600);
        }}
        onBack={() => setStack('search')}
      />
    );
  } else if (stack === 'addFood') {
    screen = (
      <AddFoodScreen
        initialQuery={pendingQuery}
        settings={settings}
        onAdd={(food) => {
          setFoodList((prev) => [...prev, food]);
          setStack('search');
          setToast(`« ${food.name} » ajouté à ta liste`);
          setTimeout(() => setToast(null), 2600);
        }}
        onBack={() => setStack('search')}
      />
    );
  } else if (stack === 'editSavedPlate') {
    screen = (
      <EditSavedPlateScreen
        plate={plateForEdit}
        allPlates={savedPlates}
        onSave={handleSavePlate}
        onBack={() => setStack(null)}
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
            viewingDate={viewingDate}
            journalDates={journalDates}
            onDateChange={setViewingDate}
            onRemoveItem={handleRemoveItem}
            onOpenMenu={() => setDrawerOpen(true)}
            onOpenSearch={openSearch}
            onOpenProfile={() => showTab('profile')}
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
          />
        );
        break;
      case 'stats':
        screen = (
          <StatsScreen
            journal={journal}
            todayMeals={meals}
            profile={profile}
          />
        );
        break;
      case 'profile':
        screen = (
          <ProfileScreen
            profile={profile}
            onEdit={() => setStack('editProfile')}
            onToggleDiet={handleToggleDiet}
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
      <DrawerMenu
        visible={drawerOpen}
        activeTab={tab}
        profile={drawerProfile}
        onNavigate={(t) => showTab(t)}
        onOpenSettings={() => setStack('settings')}
        onClose={() => setDrawerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  screenWrap: { flex: 1 },

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
