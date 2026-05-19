/**
 * EditFoodScreen — stack 'editFood'
 * Modification des informations de base d'un aliment personnel.
 */
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { Colors, Fonts } from '../theme/tokens';
import { Food } from '../types';

interface Props {
  food: Food;
  onSave: (updated: Food) => void;
  onBack: () => void;
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  required,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  required?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>
        {label}{required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.muted2}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={keyboardType === 'numeric' || keyboardType === 'decimal-pad' ? 'none' : 'sentences'}
        returnKeyType="next"
      />
    </View>
  );
}

function NumField({
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
    <View style={styles.numWrap}>
      <Text style={styles.numLabel}>{label}</Text>
      <View style={styles.numRow}>
        <TextInput
          style={styles.numInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholderTextColor={Colors.muted2}
          returnKeyType="next"
        />
        <Text style={styles.numUnit}>{unit}</Text>
      </View>
    </View>
  );
}

export function EditFoodScreen({ food, onSave, onBack }: Props) {
  const insets = useSafeAreaInsets();

  const [name, setName]           = useState(food.name);
  const [brand, setBrand]         = useState(food.brand ?? '');
  const [category, setCategory]   = useState(food.category ?? '');
  const [subtitle, setSubtitle]   = useState(food.subtitle ?? '');
  const [portion, setPortion]     = useState(String(food.defaultPortion));
  const [unit, setUnit]           = useState(food.unit ?? 'g');

  const [kcal, setKcal]     = useState(String(food.per100.kcal));
  const [protein, setProtein] = useState(String(food.per100.protein));
  const [carbs, setCarbs]   = useState(String(food.per100.carbs));
  const [fat, setFat]       = useState(String(food.per100.fat));
  const [fiber, setFiber]   = useState(String(food.per100.fiber));
  const [salt, setSalt]     = useState(String(food.per100.salt));

  const n = (s: string, fallback: number) => {
    const v = parseFloat(s.replace(',', '.'));
    return isNaN(v) ? fallback : v;
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Nom requis', 'Le nom de l\'aliment ne peut pas être vide.');
      return;
    }
    const updated: Food = {
      ...food,
      name: name.trim(),
      brand: brand.trim() || 'Générique',
      category: category.trim() || food.category,
      subtitle: subtitle.trim(),
      defaultPortion: n(portion, food.defaultPortion),
      unit: unit.trim() || 'g',
      per100: {
        kcal:    n(kcal, food.per100.kcal),
        protein: n(protein, food.per100.protein),
        carbs:   n(carbs, food.per100.carbs),
        fat:     n(fat, food.per100.fat),
        fatSat:  food.per100.fatSat,
        sugars:  food.per100.sugars,
        fiber:   n(fiber, food.per100.fiber),
        salt:    n(salt, food.per100.salt),
      },
    };
    onSave(updated);
    onBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Topbar */}
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
            <Icon name="back" size={20} color={Colors.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Modifier</Text>
            <Text style={styles.title} numberOfLines={1}>{food.name}</Text>
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        >
          {/* Identité */}
          <Text style={styles.sectionTitle}>Identité</Text>
          <View style={styles.card}>
            <Field label="Nom" value={name} onChangeText={setName} required />
            <View style={styles.divider} />
            <Field label="Marque" value={brand} onChangeText={setBrand} placeholder="Générique" />
            <View style={styles.divider} />
            <Field label="Catégorie" value={category} onChangeText={setCategory} />
            <View style={styles.divider} />
            <Field label="Description courte" value={subtitle} onChangeText={setSubtitle} placeholder="Optionnel" />
          </View>

          {/* Portion */}
          <Text style={styles.sectionTitle}>Portion par défaut</Text>
          <View style={styles.card}>
            <View style={styles.portionRow}>
              <View style={{ flex: 1 }}>
                <Field label="Quantité" value={portion} onChangeText={setPortion} keyboardType="numeric" />
              </View>
              <View style={styles.portionSep} />
              <View style={{ flex: 1 }}>
                <Field label="Unité" value={unit} onChangeText={setUnit} placeholder="g" />
              </View>
            </View>
          </View>

          {/* Macros */}
          <Text style={styles.sectionTitle}>Valeurs nutritionnelles (pour 100 g)</Text>
          <View style={styles.card}>
            <View style={styles.numGrid}>
              <NumField label="Kcal"      value={kcal}    onChangeText={setKcal}    unit="kcal" />
              <NumField label="Protéines" value={protein} onChangeText={setProtein} unit="g" />
              <NumField label="Glucides"  value={carbs}   onChangeText={setCarbs}   unit="g" />
              <NumField label="Lipides"   value={fat}     onChangeText={setFat}     unit="g" />
              <NumField label="Fibres"    value={fiber}   onChangeText={setFiber}   unit="g" />
              <NumField label="Sel"       value={salt}    onChangeText={setSalt}    unit="g" />
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: Colors.muted },
  title: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.ink, letterSpacing: -0.3 },
  saveBtn: {
    backgroundColor: Colors.ink,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
  saveBtnText: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.paper2 },

  content: { paddingHorizontal: 16, gap: 8, paddingTop: 8 },

  sectionTitle: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginTop: 16,
    marginBottom: 4,
  },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    paddingVertical: 4,
    paddingHorizontal: 16,
  },

  fieldWrap: { paddingVertical: 10 },
  fieldLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 4,
  },
  required: { color: Colors.warn },
  fieldInput: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.ink,
    paddingVertical: 0,
  },
  divider: { height: 1, backgroundColor: Colors.hairline2 },

  portionRow: { flexDirection: 'row', alignItems: 'flex-start' },
  portionSep: { width: 1, backgroundColor: Colors.hairline2, alignSelf: 'stretch', marginVertical: 8 },

  numGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
    paddingVertical: 4,
  },
  numWrap: { width: '33.33%', paddingVertical: 10, paddingHorizontal: 4 },
  numLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 4,
  },
  numRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  numInput: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.ink,
    minWidth: 44,
    paddingVertical: 0,
  },
  numUnit: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 1 },
});
