import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../theme/tokens';
import { UserProfile, AllergenLevel } from '../data/user';
import { Icon } from './Icon';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Données ────────────────────────────────────────────────────

const ALLERGEN_CHIPS = [
  { name: 'Gluten',          emoji: '🌾' },
  { name: 'Lactose',         emoji: '🥛' },
  { name: 'Œufs',            emoji: '🥚' },
  { name: 'Arachides',       emoji: '🥜' },
  { name: 'Fruits à coque',  emoji: '🌰' },
  { name: 'Soja',            emoji: '🫘' },
  { name: 'Poisson',         emoji: '🐟' },
  { name: 'Crustacés',       emoji: '🦐' },
  { name: 'Sésame',          emoji: '🌿' },
  { name: 'Moutarde',        emoji: '🟡' },
  { name: 'Céleri',          emoji: '🥬' },
  { name: 'Sulfites',        emoji: '🍷' },
];

const DIET_CHIPS = [
  { id: 'low', label: 'Low FODMAP',   emoji: '🌿' },
  { id: 'gf',  label: 'Sans gluten',  emoji: '🌾' },
  { id: 'lf',  label: 'Sans lactose', emoji: '🥛' },
  { id: 'veg', label: 'Végétarien',   emoji: '🥕' },
  { id: 'vgn', label: 'Vegan',        emoji: '🌱' },
  { id: 'kt',  label: 'Cétogène',     emoji: '🥑' },
];

// ── Sous-composants ────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[dotStyles.dot, i === current && dotStyles.dotActive]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.hairline,
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.ink,
  },
});

function Chip({
  label,
  emoji,
  selected,
  onPress,
}: {
  label: string;
  emoji: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={styles.chipEmoji}>{emoji}</Text>
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
      {selected && <Icon name="check" size={12} color={Colors.ok} />}
    </TouchableOpacity>
  );
}

// ── Écrans individuels ─────────────────────────────────────────

function StepWelcome({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.step, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
        <Text style={styles.skipText}>Passer</Text>
      </TouchableOpacity>

      <View style={styles.welcomeContent}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>N</Text>
        </View>

        <Text style={styles.welcomeTitle}>Bienvenue dans{'\n'}Nutritor</Text>
        <Text style={styles.welcomeSub}>
          Comprends ce que tu manges.{'\n'}
          Gère tes allergies, intolérances et{'\n'}
          micronutriments sans effort.
        </Text>

        <View style={styles.featureList}>
          {[
            { icon: 'leaf' as const,      text: 'Compatibilité allergènes & régimes en temps réel' },
            { icon: 'activity' as const,  text: 'Timeline physiologique — digestion, glycémie, énergie' },
            { icon: 'sparkle' as const,   text: 'IA pour générer, enrichir et modifier tes aliments' },
          ].map(({ icon, text }) => (
            <View key={text} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Icon name={icon} size={14} color={Colors.ok} />
              </View>
              <Text style={styles.featureText}>{text}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Commencer</Text>
        <Icon name="arrow-right" size={18} color={Colors.paper} />
      </TouchableOpacity>
    </View>
  );
}

function StepSensitivities({
  selectedAllergens,
  selectedDiets,
  onToggleAllergen,
  onToggleDiet,
  onNext,
  onBack,
  onSkip,
}: {
  selectedAllergens: Set<string>;
  selectedDiets: Set<string>;
  onToggleAllergen: (name: string) => void;
  onToggleDiet: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.step, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      {/* Topbar */}
      <View style={styles.stepTopbar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Icon name="back" size={20} color={Colors.ink} />
        </TouchableOpacity>
        <StepDots total={3} current={1} />
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
      >
        <Text style={styles.stepTitle}>Tes contraintes{'\n'}alimentaires</Text>
        <Text style={styles.stepSub}>
          Nutritor calcule la compatibilité de chaque aliment en temps réel.
        </Text>

        <Text style={styles.sectionLabel}>Allergies & intolérances</Text>
        <View style={styles.chipGrid}>
          {ALLERGEN_CHIPS.map((a) => (
            <Chip
              key={a.name}
              label={a.name}
              emoji={a.emoji}
              selected={selectedAllergens.has(a.name)}
              onPress={() => onToggleAllergen(a.name)}
            />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Régimes actifs</Text>
        <View style={styles.chipGrid}>
          {DIET_CHIPS.map((d) => (
            <Chip
              key={d.id}
              label={d.label}
              emoji={d.emoji}
              selected={selectedDiets.has(d.id)}
              onPress={() => onToggleDiet(d.id)}
            />
          ))}
        </View>

        <Text style={styles.hint}>Tu pourras affiner le niveau de sévérité dans ton profil.</Text>
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Suivant</Text>
          <Icon name="arrow-right" size={18} color={Colors.paper} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StepGoal({
  kcal,
  onChange,
  onDone,
  onBack,
}: {
  kcal: string;
  onChange: (v: string) => void;
  onDone: () => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[styles.step, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Topbar */}
      <View style={styles.stepTopbar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Icon name="back" size={20} color={Colors.ink} />
        </TouchableOpacity>
        <StepDots total={3} current={2} />
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.goalContent}>
        <View style={styles.goalIconWrap}>
          <Icon name="activity" size={28} color={Colors.ok} />
        </View>
        <Text style={styles.stepTitle}>Ton objectif{'\n'}calorique</Text>
        <Text style={styles.stepSub}>
          Nutritor suit ta progression au quotidien.{'\n'}Tu pourras modifier ça à tout moment.
        </Text>

        <View style={styles.kcalInputWrap}>
          <TextInput
            style={styles.kcalInput}
            value={kcal}
            onChangeText={(v) => onChange(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={4}
            selectTextOnFocus
          />
          <Text style={styles.kcalUnit}>kcal / jour</Text>
        </View>

        <View style={styles.kcalPresets}>
          {['1600', '2000', '2500'].map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.preset, kcal === v && styles.presetActive]}
              onPress={() => onChange(v)}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetText, kcal === v && styles.presetTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.hint}>
          Indicatif : 2 000 kcal est la référence adulte standard.
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24 }}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onDone} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>C'est parti !</Text>
          <Icon name="check" size={18} color={Colors.paper} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Composant principal ────────────────────────────────────────

interface Props {
  visible: boolean;
  profile: UserProfile;
  onComplete: (updatedProfile: UserProfile) => void;
}

export function OnboardingFlow({ visible, profile, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [selectedAllergens, setSelectedAllergens] = useState<Set<string>>(new Set());
  const [selectedDiets, setSelectedDiets] = useState<Set<string>>(new Set());
  const [kcal, setKcal] = useState('2000');

  const animateTo = (nextStep: number) => {
    const dir = nextStep > step ? -1 : 1;
    slideAnim.setValue(dir * SCREEN_W);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
    setStep(nextStep);
  };

  const toggleAllergen = (name: string) => {
    setSelectedAllergens((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const toggleDiet = (id: string) => {
    setSelectedDiets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const buildUpdatedProfile = (): UserProfile => {
    const updatedAllergens = profile.allergens.map((a) => ({
      ...a,
      level: selectedAllergens.has(a.name)
        ? (a.level === 'aucun' ? 'modéré' : a.level) as AllergenLevel
        : a.level,
    }));

    const updatedDiets = profile.diets.map((d) => ({
      ...d,
      on: selectedDiets.has(d.id) ? true : d.on,
    }));

    const kcalNum = parseInt(kcal, 10) || 2000;
    return {
      ...profile,
      allergens: updatedAllergens,
      diets: updatedDiets,
      kcalTarget: kcalNum,
      goal: `${kcalNum} kcal · objectif personnalisé`,
    };
  };

  const handleSkip = () => onComplete(profile);
  const handleDone = () => onComplete(buildUpdatedProfile());

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <Animated.View
        style={[
          styles.container,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        {step === 0 && (
          <StepWelcome
            onNext={() => animateTo(1)}
            onSkip={handleSkip}
          />
        )}
        {step === 1 && (
          <StepSensitivities
            selectedAllergens={selectedAllergens}
            selectedDiets={selectedDiets}
            onToggleAllergen={toggleAllergen}
            onToggleDiet={toggleDiet}
            onNext={() => animateTo(2)}
            onBack={() => animateTo(0)}
            onSkip={handleSkip}
          />
        )}
        {step === 2 && (
          <StepGoal
            kcal={kcal}
            onChange={setKcal}
            onDone={handleDone}
            onBack={() => animateTo(1)}
          />
        )}
      </Animated.View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  step: {
    flex: 1,
  },

  // Topbar partagé steps 2-3
  stepTopbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Skip
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: Fonts.mono,
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: Colors.muted,
    textTransform: 'uppercase',
  },

  // Welcome
  welcomeContent: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    gap: 20,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoText: {
    fontFamily: Fonts.serif,
    fontSize: 40,
    color: Colors.paper,
    letterSpacing: -1,
    lineHeight: 48,
  },
  welcomeTitle: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    color: Colors.ink,
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  welcomeSub: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.muted,
    lineHeight: 22,
  },
  featureList: { gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: {
    width: 28, height: 28,
    borderRadius: 8,
    backgroundColor: Colors.ok + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    color: Colors.ink2,
    flex: 1,
  },

  // Step 2 content
  stepTitle: {
    fontFamily: Fonts.serif,
    fontSize: 30,
    color: Colors.ink,
    letterSpacing: -0.6,
    lineHeight: 36,
    marginBottom: 8,
    marginTop: 8,
  },
  stepSub: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    color: Colors.muted,
    lineHeight: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.muted2,
    marginBottom: 10,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
  },
  chipSelected: {
    borderColor: Colors.ok + '60',
    backgroundColor: Colors.ok + '14',
  },
  chipEmoji: { fontSize: 13 },
  chipLabel: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.ink,
  },
  chipLabelSelected: { color: Colors.ok },
  hint: {
    fontFamily: Fonts.mono,
    fontSize: 9.5,
    color: Colors.muted2,
    letterSpacing: 0.2,
    lineHeight: 14,
    marginTop: 12,
  },

  // Step 3 — objectif
  goalContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 16,
  },
  goalIconWrap: {
    width: 56, height: 56,
    borderRadius: 16,
    backgroundColor: Colors.ok + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  kcalInputWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 4,
  },
  kcalInput: {
    fontFamily: Fonts.serif,
    fontSize: 52,
    color: Colors.ink,
    letterSpacing: -2,
    lineHeight: 58,
    minWidth: 140,
  },
  kcalUnit: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  kcalPresets: {
    flexDirection: 'row',
    gap: 8,
  },
  preset: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
  },
  presetActive: {
    borderColor: Colors.ink,
    backgroundColor: Colors.ink,
  },
  presetText: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  presetTextActive: { color: Colors.paper },

  // Bouton principal (partagé)
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.ink,
    borderRadius: 16,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 8,
  },
  primaryBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: Colors.paper,
    letterSpacing: -0.2,
  },
});
