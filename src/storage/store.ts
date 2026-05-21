import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  foods:           'nutritor:foods',
  meals:           'nutritor:meals',
  mealsDate:       'nutritor:meals_date',
  profile:         'nutritor:profile',
  settings:        'nutritor:settings',
  savedPlates:     'nutritor:saved_plates',
  journal:         'nutritor:journal',
  symptoms:        'nutritor:symptoms',
  fodmapProtocol:  'nutritor:fodmap_protocol',
  migrationV1:     'nutritor:migration_v1',
  onboardingDone:  'nutritor:onboarding_done',
  comments:               'nutritor:comments',
  aiAdvice:               'nutritor:ai_advice',
  digestiveMemory:        'nutritor:digestive_memory',
  digestiveMemoryDate:    'nutritor:digestive_memory_date',
  labScores:              'nutritor:lab_scores',
  labScoresDate:          'nutritor:lab_scores_date',
  timelineEvents:         'nutritor:timeline_events',
  recentFoodUses:         'nutritor:recent_food_uses',
  recentFoodViews:        'nutritor:recent_food_views',
  dismissedTips:          'nutritor:dismissed_tips',
  scanHistory:            'nutritor:scan_history',
  shoppingList:           'nutritor:shopping_list',
};

export async function load<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (err) {
    console.error(`[store] load error key="${key}":`, err);
    return null;
  }
}

export async function save<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[store] save error key="${key}":`, err);
  }
}

export async function remove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}
