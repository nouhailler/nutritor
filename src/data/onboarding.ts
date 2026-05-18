import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_DONE_KEY = 'nutritor:onboarding_done';

export const TIPS = {
  journal: {
    key: 'nutritor:tip:journal',
    title: 'Ton journal',
    message: 'Appuie sur un repas (Petit-déjeuner, Déjeuner…) pour y ajouter des aliments depuis ta bibliothèque.',
  },
  foods: {
    key: 'nutritor:tip:foods',
    title: 'Ta bibliothèque',
    message: 'Scanne un code-barres, recherche dans CIQUAL ou laisse l\'IA générer une fiche complète depuis un nom.',
  },
  scanner: {
    key: 'nutritor:tip:scanner',
    title: 'Scanner',
    message: 'Pointe l\'appareil vers un code-barres EAN-13 — les infos nutritionnelles s\'importent automatiquement.',
  },
  savedDetail: {
    key: 'nutritor:tip:saved_detail',
    title: 'Ajouter au journal',
    message: 'Appuie sur "Ajouter au journal" puis sélectionne le repas de ton choix pour loguer ce plat.',
  },
} as const;

export const ALL_TIP_KEYS = Object.values(TIPS).map((t) => t.key);

export async function resetOnboarding() {
  await AsyncStorage.multiRemove([ONBOARDING_DONE_KEY, ...ALL_TIP_KEYS]);
}
