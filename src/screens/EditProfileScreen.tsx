/**
 * EditProfileScreen — stack 'editProfile'
 * Formulaire d'édition du profil : nom, objectif calorique, macros cibles,
 * 14 allergènes avec niveaux de sévérité, 6 régimes actifs.
 */
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import {
  AllergenEntry,
  AllergenLevel,
  Diet,
  UserProfile,
  computeInitial,
  getDigestiveSensitivities,
  getDigestiveTolerances,
} from '../data/user';
import { Colors, Fonts } from '../theme/tokens';
import {
  DigestiveSensitivity,
  DigestiveTolerances,
  SensitivityLevel,
  DigestiveTolerance,
  SENSITIVITY_DEFINITIONS,
  OBJECTIVE_DEFINITIONS,
  TOLERANCE_DEFINITIONS,
  PATHOLOGY_DEFINITIONS,
} from '../types/shopping';

// ── Severity cycle ────────────────────────────────────────────

const SEVERITY_CYCLE: AllergenLevel[] = ['aucun', 'trace', 'modéré', 'sévère'];

function nextLevel(current: AllergenLevel): AllergenLevel {
  const i = SEVERITY_CYCLE.indexOf(current);
  return SEVERITY_CYCLE[(i + 1) % SEVERITY_CYCLE.length];
}

const LEVEL_CONFIG: Record<AllergenLevel, { bg: string; color: string; border: string; label: string }> = {
  aucun:  { bg: Colors.card,   color: Colors.muted2,  border: Colors.hairline,              label: 'Aucun' },
  trace:  { bg: 'transparent', color: Colors.signal,  border: 'rgba(107,90,46,0.3)',         label: 'Trace' },
  modéré: { bg: 'transparent', color: Colors.warn,    border: 'rgba(139,58,46,0.3)',         label: 'Modéré' },
  sévère: { bg: Colors.warn,   color: '#fff',         border: Colors.warn,                  label: 'Sévère' },
};

// ── Shared components ─────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function TextField({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  placeholder?: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={Colors.muted2}
      />
    </View>
  );
}

function NumericField({
  label,
  value,
  onChangeText,
  unit,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  unit: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <FieldLabel>{label}</FieldLabel>
      <View style={styles.inputWithUnit}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholderTextColor={Colors.muted2}
        />
        <Text style={styles.inputUnit}>{unit}</Text>
      </View>
    </View>
  );
}

// ── Allergen edit row ─────────────────────────────────────────

function AllergenEditRow({
  allergen,
  onCycleLevel,
  onEditNote,
}: {
  allergen: AllergenEntry;
  onCycleLevel: () => void;
  onEditNote: (note: string) => void;
}) {
  const cfg = LEVEL_CONFIG[allergen.level];
  const [editingNote, setEditingNote] = useState(false);

  return (
    <View style={styles.allergenRow}>
      <View style={styles.allergenRowTop}>
        <Text style={styles.allergenName}>{allergen.name}</Text>
        <TouchableOpacity
          onPress={onCycleLevel}
          activeOpacity={0.75}
          style={[styles.levelPill, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
        >
          <Text style={[styles.levelPillText, { color: cfg.color }]}>{cfg.label}</Text>
          <Icon name="plus" size={10} color={cfg.color} />
        </TouchableOpacity>
      </View>

      {allergen.level !== 'aucun' && (
        <View style={styles.noteRow}>
          {editingNote ? (
            <TextInput
              style={styles.noteInput}
              value={allergen.note}
              onChangeText={onEditNote}
              onBlur={() => setEditingNote(false)}
              placeholder="Note personnelle…"
              placeholderTextColor={Colors.muted2}
              autoFocus
              multiline
            />
          ) : (
            <TouchableOpacity
              onPress={() => setEditingNote(true)}
              activeOpacity={0.7}
              style={styles.noteTouchable}
            >
              <Text style={styles.noteText}>
                {allergen.note || (
                  <Text style={styles.notePlaceholder}>Ajouter une note…</Text>
                )}
              </Text>
              <Icon name="menu" size={12} color={Colors.muted2} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ── Sensitivity row ───────────────────────────────────────────

const SENSITIVITY_LEVELS: { id: SensitivityLevel; label: string }[] = [
  { id: 'none',     label: 'Aucune' },
  { id: 'mild',     label: 'Légère' },
  { id: 'moderate', label: 'Modérée' },
  { id: 'strong',   label: 'Forte' },
];

const SENSITIVITY_COLORS: Record<SensitivityLevel, string> = {
  none:     Colors.muted2,
  mild:     '#c47d0a',
  moderate: '#e67e22',
  strong:   '#c0392b',
};

function SensitivityRow({
  sensitivity,
  onChange,
}: {
  sensitivity: DigestiveSensitivity;
  onChange: (level: SensitivityLevel) => void;
}) {
  const def = SENSITIVITY_DEFINITIONS.find((d) => d.id === sensitivity.id);
  if (!def) return null;
  return (
    <View style={epStyles.sensitivityRow}>
      <Text style={epStyles.sensitivityLabel}>{def.label}</Text>
      <View style={epStyles.sensitivityPills}>
        {SENSITIVITY_LEVELS.map(({ id, label }) => {
          const active = sensitivity.level === id;
          return (
            <TouchableOpacity
              key={id}
              style={[
                epStyles.sensePill,
                active && { backgroundColor: SENSITIVITY_COLORS[id], borderColor: SENSITIVITY_COLORS[id] },
              ]}
              onPress={() => onChange(id)}
              activeOpacity={0.7}
            >
              <Text style={[epStyles.sensePillText, active && { color: Colors.paper2 }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Tolerance row ─────────────────────────────────────────────

const TOLERANCE_LEVELS: { id: DigestiveTolerance; label: string }[] = [
  { id: 'low',    label: 'Faible' },
  { id: 'medium', label: 'Moyenne' },
  { id: 'good',   label: 'Bonne' },
];

const TOLERANCE_COLORS: Record<DigestiveTolerance, string> = {
  low:    '#c0392b',
  medium: '#c47d0a',
  good:   '#2d8a4e',
};

function ToleranceRow({
  id,
  label,
  value,
  onChange,
}: {
  id: keyof DigestiveTolerances;
  label: string;
  value: DigestiveTolerance;
  onChange: (v: DigestiveTolerance) => void;
}) {
  return (
    <View style={epStyles.sensitivityRow}>
      <Text style={epStyles.sensitivityLabel}>{label}</Text>
      <View style={epStyles.sensitivityPills}>
        {TOLERANCE_LEVELS.map(({ id: tid, label: tLabel }) => {
          const active = value === tid;
          return (
            <TouchableOpacity
              key={tid}
              style={[
                epStyles.sensePill,
                active && { backgroundColor: TOLERANCE_COLORS[tid], borderColor: TOLERANCE_COLORS[tid] },
              ]}
              onPress={() => onChange(tid)}
              activeOpacity={0.7}
            >
              <Text style={[epStyles.sensePillText, active && { color: Colors.paper2 }]}>{tLabel}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Edit Profile Screen ───────────────────────────────────────

interface EditProfileScreenProps {
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
  onBack: () => void;
}

export function EditProfileScreen({ profile, onSave, onBack }: EditProfileScreenProps) {
  const insets = useSafeAreaInsets();

  // Local draft state
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(String(profile.age));
  const [weight, setWeight] = useState(String(profile.weight));
  const [height, setHeight] = useState(String(profile.height));
  const [goal, setGoal] = useState(profile.goal);
  const [activity, setActivity] = useState(profile.activity);
  const [kcalTarget, setKcalTarget] = useState(String(profile.kcalTarget));
  const [protein, setProtein] = useState(String(profile.macroTargets.protein));
  const [carbs, setCarbs] = useState(String(profile.macroTargets.carbs));
  const [fat, setFat] = useState(String(profile.macroTargets.fat));
  const [diets, setDiets] = useState<Diet[]>(profile.diets);
  const [allergens, setAllergens] = useState<AllergenEntry[]>(profile.allergens);
  const [sensitivities, setSensitivities] = useState<DigestiveSensitivity[]>(getDigestiveSensitivities(profile));
  const [objectives, setObjectives] = useState<string[]>(profile.objectives ?? []);
  const [tolerances, setTolerances] = useState<DigestiveTolerances>(getDigestiveTolerances(profile));
  const [pathologies, setPathologies] = useState<string[]>(profile.pathologies ?? []);

  const cycleAllergen = (idx: number) => {
    setAllergens((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, level: nextLevel(a.level) } : a))
    );
  };

  const updateAllergenNote = (idx: number, note: string) => {
    setAllergens((prev) => prev.map((a, i) => (i === idx ? { ...a, note } : a)));
  };

  const toggleDiet = (id: string) => {
    setDiets((prev) => prev.map((d) => (d.id === id ? { ...d, on: !d.on } : d)));
  };

  const updateDietRule = (id: string, rule: string) => {
    setDiets((prev) => prev.map((d) => (d.id === id ? { ...d, rule } : d)));
  };

  const handleSave = () => {
    const n = parseInt(age, 10);
    const w = parseFloat(weight);
    const h = parseInt(height, 10);
    const k = parseInt(kcalTarget, 10);
    const pr = parseInt(protein, 10);
    const ca = parseInt(carbs, 10);
    const fa = parseInt(fat, 10);

    if (!name.trim()) {
      Alert.alert('Nom requis', 'Veuillez entrer votre prénom.');
      return;
    }
    if (isNaN(n) || n < 10 || n > 120) {
      Alert.alert('Âge invalide', 'Entrez un âge entre 10 et 120 ans.');
      return;
    }
    if (isNaN(k) || k < 500 || k > 6000) {
      Alert.alert('Objectif calorique invalide', 'Entrez une valeur entre 500 et 6000 kcal.');
      return;
    }

    const trimmedName = name.trim();
    onSave({
      ...profile,
      name: trimmedName,
      initial: computeInitial(trimmedName),
      age: n,
      weight: isNaN(w) ? profile.weight : w,
      height: isNaN(h) ? profile.height : h,
      goal: goal.trim() || profile.goal,
      activity: activity.trim() || profile.activity,
      kcalTarget: k,
      macroTargets: {
        protein: isNaN(pr) ? profile.macroTargets.protein : pr,
        carbs: isNaN(ca) ? profile.macroTargets.carbs : ca,
        fat: isNaN(fa) ? profile.macroTargets.fat : fa,
      },
      diets,
      allergens,
      digestiveSensitivities: sensitivities,
      objectives,
      digestiveTolerances: tolerances,
      pathologies,
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Topbar */}
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
            <Icon name="close" size={20} />
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Modifier le profil</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Identité ── */}
          <SectionLabel>Identité</SectionLabel>

          <TextField label="Prénom" value={name} onChangeText={setName} placeholder="Votre prénom" />

          <View style={styles.row3}>
            <View style={{ flex: 1 }}>
              <NumericField label="Âge" value={age} onChangeText={setAge} unit="ans" />
            </View>
            <View style={{ flex: 1 }}>
              <NumericField label="Poids" value={weight} onChangeText={setWeight} unit="kg" />
            </View>
            <View style={{ flex: 1 }}>
              <NumericField label="Taille" value={height} onChangeText={setHeight} unit="cm" />
            </View>
          </View>

          <TextField
            label="Objectif"
            value={goal}
            onChangeText={setGoal}
            placeholder="Ex. Maintien · digestion sereine"
          />
          <TextField
            label="Activité"
            value={activity}
            onChangeText={setActivity}
            placeholder="Ex. Modérée · 3 séances / semaine"
          />

          {/* ── Allergènes ── */}
          <SectionLabel>Allergènes & intolérances</SectionLabel>
          <Text style={styles.sectionDesc}>
            Appuyez sur le niveau pour le modifier : aucun → trace → modéré → sévère.
          </Text>
          <View style={styles.allergenList}>
            {allergens.map((a, i) => (
              <AllergenEditRow
                key={a.name}
                allergen={a}
                onCycleLevel={() => cycleAllergen(i)}
                onEditNote={(note) => updateAllergenNote(i, note)}
              />
            ))}
          </View>

          {/* ── Régimes ── */}
          <SectionLabel>Régimes alimentaires</SectionLabel>
          <View style={styles.dietList}>
            {diets.map((d) => (
              <View key={d.id} style={styles.dietRow}>
                <View style={styles.dietLeft}>
                  <Text style={styles.dietLabel}>{d.label}</Text>
                  {d.on && (
                    <TextInput
                      style={styles.dietRuleInput}
                      value={d.rule === '—' ? '' : d.rule}
                      onChangeText={(v) => updateDietRule(d.id, v || '—')}
                      placeholder="Phase / règle…"
                      placeholderTextColor={Colors.muted2}
                    />
                  )}
                  {!d.on && <Text style={styles.dietRuleOff}>Désactivé</Text>}
                </View>
                <Switch
                  value={d.on}
                  onValueChange={() => toggleDiet(d.id)}
                  trackColor={{ false: Colors.hairline, true: Colors.ink }}
                  thumbColor={Colors.paper}
                  ios_backgroundColor={Colors.hairline}
                />
              </View>
            ))}
          </View>

          {/* ── Sensibilités digestives ── */}
          <SectionLabel>Sensibilités digestives</SectionLabel>
          <Text style={styles.sectionDesc}>
            Indique l'intensité de chaque sensibilité. Utilisé pour personnaliser l'analyse des produits scannés.
          </Text>
          <View style={epStyles.sensitivityList}>
            {sensitivities.map((s) => (
              <SensitivityRow
                key={s.id}
                sensitivity={s}
                onChange={(level) =>
                  setSensitivities((prev) => prev.map((x) => x.id === s.id ? { ...x, level } : x))
                }
              />
            ))}
          </View>

          {/* ── Objectifs santé ── */}
          <SectionLabel>Objectifs santé</SectionLabel>
          <View style={epStyles.pillWrap}>
            {OBJECTIVE_DEFINITIONS.map((obj) => {
              const active = objectives.includes(obj.id);
              return (
                <TouchableOpacity
                  key={obj.id}
                  style={[epStyles.tagPill, active && epStyles.tagPillActive]}
                  onPress={() =>
                    setObjectives((prev) =>
                      active ? prev.filter((id) => id !== obj.id) : [...prev, obj.id]
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Text style={[epStyles.tagPillText, active && epStyles.tagPillTextActive]}>
                    {obj.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Tolérances digestives ── */}
          <SectionLabel>Tolérances digestives</SectionLabel>
          <Text style={styles.sectionDesc}>
            Ton niveau de tolérance habituel pour ces familles d'aliments.
          </Text>
          <View style={epStyles.sensitivityList}>
            {TOLERANCE_DEFINITIONS.map((tol) => (
              <ToleranceRow
                key={tol.id}
                id={tol.id}
                label={tol.label}
                value={tolerances[tol.id]}
                onChange={(v) => setTolerances((prev) => ({ ...prev, [tol.id]: v }))}
              />
            ))}
          </View>

          {/* ── Pathologies (optionnel) ── */}
          <SectionLabel>Pathologies (optionnel)</SectionLabel>
          <Text style={styles.sectionDesc}>Sélectionne uniquement si diagnostiqué.</Text>
          <View style={epStyles.pillWrap}>
            {PATHOLOGY_DEFINITIONS.map((p) => {
              const active = pathologies.includes(p.id);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[epStyles.tagPill, active && epStyles.tagPillActive]}
                  onPress={() =>
                    setPathologies((prev) =>
                      active ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Text style={[epStyles.tagPillText, active && epStyles.tagPillTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Objectifs caloriques ── */}
          <SectionLabel>Objectifs quotidiens</SectionLabel>
          <NumericField label="Énergie" value={kcalTarget} onChangeText={setKcalTarget} unit="kcal" />

          <View style={styles.row3}>
            <View style={{ flex: 1 }}>
              <NumericField label="Protéines" value={protein} onChangeText={setProtein} unit="g" />
            </View>
            <View style={{ flex: 1 }}>
              <NumericField label="Glucides" value={carbs} onChangeText={setCarbs} unit="g" />
            </View>
            <View style={{ flex: 1 }}>
              <NumericField label="Lipides" value={fat} onChangeText={setFat} unit="g" />
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8 },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  iconBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbarTitle: {
    flex: 1,
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.ink,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  saveBtnText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.paper2,
    fontWeight: '500',
  },

  // Section
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
    fontWeight: '500',
    marginTop: 28,
    marginBottom: 14,
  },
  sectionDesc: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 19,
    marginBottom: 14,
    marginTop: -8,
  },

  // Fields
  fieldGroup: { marginBottom: 12 },
  fieldLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.ink,
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputUnit: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted,
    paddingHorizontal: 12,
    letterSpacing: 0.5,
  },
  row3: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },

  // Allergens
  allergenList: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  allergenRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  allergenRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  allergenName: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.ink,
    letterSpacing: -0.2,
    flex: 1,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexShrink: 0,
  },
  levelPillText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Note
  noteRow: { marginTop: 8 },
  noteTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.muted,
    lineHeight: 18,
  },
  notePlaceholder: { color: Colors.muted2, fontStyle: 'italic' },
  noteInput: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 8,
    padding: 8,
    lineHeight: 18,
    backgroundColor: Colors.card,
  },

  // Diets
  dietList: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  dietRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  dietLeft: { flex: 1, marginRight: 14 },
  dietLabel: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  dietRuleInput: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 0.4,
    marginTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
    paddingBottom: 2,
  },
  dietRuleOff: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted2,
    letterSpacing: 0.4,
    marginTop: 3,
  },
});

// ── Sensitivity / tolerance styles (suffix to avoid conflicts) ─

const epStyles = StyleSheet.create({
  sensitivityList: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
    marginBottom: 8,
  },
  sensitivityRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
    gap: 6,
  },
  sensitivityLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.ink,
  },
  sensitivityPills: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  sensePill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
  },
  sensePillText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tagPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
  },
  tagPillActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  tagPillText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
  },
  tagPillTextActive: {
    color: Colors.paper2,
  },
});

