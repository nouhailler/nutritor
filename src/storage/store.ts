import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  foods:        'nutritor:foods',
  meals:        'nutritor:meals',
  mealsDate:    'nutritor:meals_date',
  profile:      'nutritor:profile',
  settings:     'nutritor:settings',
  savedPlates:  'nutritor:saved_plates',
  journal:      'nutritor:journal',
  symptoms:     'nutritor:symptoms',
  migrationV1:  'nutritor:migration_v1',
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
