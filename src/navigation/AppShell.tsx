import React, { useRef, useState } from 'react';
import {
  Animated,
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
import { SearchScreen } from '../screens/SearchScreen';
import { Colors, Fonts } from '../theme/tokens';
import { Food, Meal } from '../types';
import { SavedPlate } from '../data/saved';

type Tab = 'home' | 'saved' | 'stats' | 'profile';
type StackScreen = 'search' | 'detail' | 'savedDetail' | 'editProfile' | null;

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
  const [tab, setTab] = useState<Tab>('home');
  const [stack, setStack] = useState<StackScreen>(null);
  const [selectedFood, setSelectedFood] = useState<Food>(DETAIL_FOOD);
  const [meals, setMeals] = useState<Meal[]>(INITIAL_MEALS);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [toast, setToast] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const showTab = (t: Tab) => {
    setStack(null);
    setTab(t);
  };

  const [detailOrigin, setDetailOrigin] = useState<'search' | null>(null);
  const [selectedPlate, setSelectedPlate] = useState<SavedPlate | null>(null);

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
    const mealName = meals.find((m) => m.id === mealId)?.name;
    setMeals((ms) =>
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
    setToast(`${plate.name} ajouté à ${mealName}`);
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
    const mealName = meals.find((m) => m.id === mealId)?.name;
    setMeals((ms) =>
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
    setToast(`Ajouté à ${mealName}`);
    setTimeout(() => setToast(null), 2600);
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

  const showTabs = stack === null;

  // ── Active screen ────────────────────────────────────────

  let screen: React.ReactNode;

  if (stack === 'search') {
    screen = (
      <SearchScreen
        onBack={() => setStack(null)}
        onPickItem={() => openDetail(DETAIL_FOOD, 'search')}
      />
    );
  } else if (stack === 'detail') {
    screen = (
      <DetailScreen
        food={selectedFood}
        meals={meals}
        onBack={() => setStack(detailOrigin ?? null)}
        onAdd={handleAdd}
      />
    );
  } else if (stack === 'savedDetail' && selectedPlate) {
    screen = (
      <SavedDetailScreen
        plate={selectedPlate}
        meals={meals}
        onBack={() => setStack(null)}
        onAdd={handleAddPlate}
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
  } else {
    switch (tab) {
      case 'home':
        screen = (
          <HomeScreen
            meals={meals}
            profile={profile}
            onOpenMenu={() => setDrawerOpen(true)}
            onOpenSearch={openSearch}
            onOpenProfile={() => showTab('profile')}
          />
        );
        break;
      case 'saved':
        screen = <SavedScreen onOpenPlate={openSavedDetail} />;
        break;
      case 'stats':
        screen = <StatsScreen />;
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

  return (
    <View style={styles.container}>
      <View style={styles.screenWrap}>{screen}</View>
      {showTabs && <Tabbar activeTab={tab} onSelect={showTab} />}
      <Toast message={toast} />
      <DrawerMenu
        visible={drawerOpen}
        activeTab={tab}
        profile={drawerProfile}
        onNavigate={(t) => showTab(t)}
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
