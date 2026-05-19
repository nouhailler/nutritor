import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_DONE_KEY = 'nutritor:onboarding_done';

export const TIPS = {
  journal: {
    key: 'nutritor:tip:journal',
    title: 'Ton journal',
    message: 'Appuie sur un repas (Petit-déjeuner, Déjeuner…) pour y ajouter des aliments depuis ta bibliothèque. Navigue entre les jours avec les flèches en haut.',
  },
  timeline: {
    key: 'nutritor:tip:timeline',
    title: 'Timeline physiologique',
    message: 'Après avoir loggé tes repas, une timeline apparaît dans le journal. Elle prédit les effets sur ta digestion, ta glycémie et ton énergie au fil de la journée.',
  },
  foods: {
    key: 'nutritor:tip:foods',
    title: 'Ta bibliothèque',
    message: 'Les aliments sont organisés en 4 sections : récemment ajoutés, récemment utilisés, récemment consultés, puis tout le reste. Le bouton 🏠 sur chaque ligne ajoute directement au journal.',
  },
  addFood: {
    key: 'nutritor:tip:add_food',
    title: 'Ajouter un aliment',
    message: 'Plusieurs sources : scanner code-barres, CIQUAL (3 167 aliments officiels français), Open Food Facts (produits de marque), ou IA — elle génère une fiche nutritionnelle complète depuis un simple nom.',
  },
  editFood: {
    key: 'nutritor:tip:edit_food',
    title: 'Modifier un aliment',
    message: 'Sur la fiche détail d\'un aliment, appuie sur l\'icône crayon en haut à droite pour corriger le nom, la marque, la catégorie ou les valeurs nutritionnelles.',
  },
  aiEnrich: {
    key: 'nutritor:tip:ai_enrich',
    title: 'Enrichissement IA',
    message: 'Quand tu importes depuis CIQUAL ou Open Food Facts, l\'IA enrichit la fiche en arrière-plan (FODMAP, vitamines, acides aminés…). Tu peux annuler en cours avec le bouton "Annuler" sur le bandeau.',
  },
  scanner: {
    key: 'nutritor:tip:scanner',
    title: 'Scanner',
    message: 'Pointe l\'appareil vers un code-barres EAN-13 — les infos nutritionnelles s\'importent automatiquement. C\'est la façon la plus fiable d\'ajouter un produit de marque.',
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
