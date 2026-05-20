/**
 * ManualFoodScreen — saisie libre d'un aliment sans IA
 * Sections 01-06 (infos + macros + détails optionnels),
 * 10 (sensoriel), 11 (allergènes), 12 (composition).
 * La compatibilité est calculée en temps réel avant validation.
 */
import React, { useMemo, useState } from 'react';
import {
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
import { Colors, Fonts } from '../theme/tokens';
import { Allergen, CompatItem, Food } from '../types';

// ── Constants ──────────────────────────────────────────────────

const ALLERGEN_NAMES = [
  'Gluten', 'Lactose', 'Œufs', 'Arachides',
  'Fruits à coque', 'Soja', 'Poisson', 'Crustacés',
  'Sésame', 'Moutarde', 'Céleri', 'Sulfites',
  'Mollusques', 'Lupin',
] as const;

type AllergenStatus = 'absent' | 'trace' | 'contains';
const STATUS_CYCLE: AllergenStatus[] = ['absent', 'contains', 'trace'];

const STATUS_STYLE: Record<AllergenStatus, { bg: string; border: string; text: string }> = {
  absent:   { bg: Colors.card,               border: Colors.hairline2, text: Colors.muted2 },
  contains: { bg: 'rgba(139,58,46,0.10)',    border: Colors.warn,      text: Colors.warn   },
  trace:    { bg: 'rgba(107,90,46,0.10)',    border: Colors.signal,    text: Colors.signal },
};
const STATUS_LABEL: Record<AllergenStatus, string> = { absent: '—', contains: '●', trace: '~' };

const TASTE_OPTIONS    = ['Sucré', 'Salé', 'Amer', 'Acide', 'Umami', 'Neutre'];
const TEXTURE_OPTIONS  = ['Croquant', 'Moelleux', 'Fondant', 'Ferme', 'Crémeux', 'Croustillant'];
const AROMA_OPTIONS    = ['Fruité', 'Fumé', 'Herbacé', 'Floral', 'Terreux', 'Épicé'];

// ── Compat builder ─────────────────────────────────────────────

function buildManualCompat(
  per100: { kcal: number; fat: number; fatSat: number; carbs: number; sugars: number; fiber: number; protein: number; salt: number },
  allergenMap: Record<string, AllergenStatus>,
): CompatItem[] {
  const hasData = per100.kcal > 0 || per100.protein > 0 || per100.carbs > 0 || per100.fat > 0;
  if (!hasData) return [{ label: 'Données manquantes', kind: 'warn' }];

  const compat: CompatItem[] = [];
  if (per100.salt < 0.3)    compat.push({ label: 'Pauvre en sel',      kind: 'ok'   });
  if (per100.sugars < 5)    compat.push({ label: 'Pauvre en sucres',   kind: 'ok'   });
  if (per100.fat < 3)       compat.push({ label: 'Pauvre en graisses', kind: 'ok'   });
  if (per100.fiber > 5)     compat.push({ label: 'Riche en fibres',    kind: 'ok'   });
  if (per100.protein > 15)  compat.push({ label: 'Riche en protéines', kind: 'ok'   });
  if (per100.salt > 1.5)    compat.push({ label: 'Riche en sel',       kind: 'warn' });
  if (per100.sugars > 15)   compat.push({ label: 'Riche en sucres',    kind: 'warn' });

  if (allergenMap['Gluten'] === 'absent')    compat.push({ label: 'Sans gluten',      kind: 'ok'   });
  if (allergenMap['Gluten'] === 'contains')  compat.push({ label: 'Contient gluten',  kind: 'warn' });
  if (allergenMap['Lactose'] === 'absent')   compat.push({ label: 'Sans lactose',     kind: 'ok'   });
  if (allergenMap['Lactose'] === 'contains') compat.push({ label: 'Contient lactose', kind: 'warn' });

  const animalKeys = ['Œufs', 'Lactose', 'Poisson', 'Crustacés', 'Mollusques'];
  if (animalKeys.every((k) => allergenMap[k] === 'absent')) compat.push({ label: 'Vegan', kind: 'ok' });

  for (const n of ALLERGEN_NAMES) {
    if (allergenMap[n] === 'trace') compat.push({ label: `Traces ${n.toLowerCase()}`, kind: 'warn' });
  }

  return compat;
}

// ── Small reusable UI pieces ───────────────────────────────────

function SectionHead({ num, title, right, collapsible = false, expanded = false, onToggle }: {
  num: string; title: string; right?: string;
  collapsible?: boolean; expanded?: boolean; onToggle?: () => void;
}) {
  return (
    <TouchableOpacity
      style={sh.row}
      onPress={collapsible ? onToggle : undefined}
      activeOpacity={collapsible ? 0.7 : 1}
    >
      <Text style={sh.num}>{num}</Text>
      <Text style={sh.title}>{title}</Text>
      {right && <Text style={sh.right}>{right}</Text>}
      {collapsible && <Text style={sh.chevron}>{expanded ? '−' : '+'}</Text>}
    </TouchableOpacity>
  );
}
const sh = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 14 },
  num:     { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, color: Colors.muted, width: 22 },
  title:   { flex: 1, fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink },
  right:   { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1, color: Colors.muted },
  chevron: { fontFamily: Fonts.mono, fontSize: 16, color: Colors.muted2, width: 18, textAlign: 'center' },
});

function FieldLabel({ label }: { label: string }) {
  return <Text style={fl.label}>{label}</Text>;
}
const fl = StyleSheet.create({
  label: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: Colors.muted, marginBottom: 5 },
});

function NumInput({ label, value, onChange, placeholder = '0', flex = 1 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; flex?: number;
}) {
  return (
    <View style={{ flex }}>
      <FieldLabel label={label} />
      <TextInput
        style={ni.input}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={Colors.muted2}
      />
    </View>
  );
}
const ni = StyleSheet.create({
  input: {
    fontFamily: Fonts.sans, fontSize: 15, color: Colors.ink,
    borderBottomWidth: 1, borderBottomColor: Colors.hairline2, paddingVertical: 4,
  },
});

function TwoCol({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 16 }}>{children}</View>;
}

function ChipGroup({ label, options, selected, onToggle }: {
  label: string; options: string[]; selected: string[]; onToggle: (v: string) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <FieldLabel label={label} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <TouchableOpacity
              key={opt}
              style={[cg.chip, active && cg.active]}
              onPress={() => onToggle(opt)}
              activeOpacity={0.7}
            >
              <Text style={[cg.text, active && cg.textActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
const cg = StyleSheet.create({
  chip:       { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 100, borderWidth: 1, borderColor: Colors.hairline, backgroundColor: Colors.card },
  active:     { backgroundColor: Colors.ink, borderColor: Colors.ink },
  text:       { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.6, color: Colors.muted },
  textActive: { color: Colors.paper2 },
});

// ── Main screen ────────────────────────────────────────────────

interface Props {
  initialName?: string;
  onAdd: (food: Food) => void;
  onBack: () => void;
  onOpenMenu: () => void;
}

export function ManualFoodScreen({ initialName = '', onAdd, onBack, onOpenMenu }: Props) {
  const insets = useSafeAreaInsets();

  // Section 01
  const [name, setName]           = useState(initialName);
  const [category, setCategory]   = useState('');
  const [brand, setBrand]         = useState('');
  const [subtitle, setSubtitle]   = useState('');
  const [portionStr, setPortion]  = useState('100');
  const [unit, setUnit]           = useState<'g' | 'ml'>('g');

  // Section 02 — per 100 g/ml
  const [kcalStr, setKcal]     = useState('');
  const [protStr, setProt]     = useState('');
  const [carbStr, setCarb]     = useState('');
  const [fatStr, setFat]       = useState('');
  const [fiberStr, setFiber]   = useState('');
  const [saltStr, setSalt]     = useState('');
  const [fatSatStr, setFatSat] = useState('');
  const [sugStr, setSug]       = useState('');

  // Optional sections visibility
  const [showS03, setShowS03] = useState(false);
  const [showS04, setShowS04] = useState(false);
  const [showS05, setShowS05] = useState(false);
  const [showS06, setShowS06] = useState(false);

  // Section 03
  const [protComplete, setProtComplete] = useState(false);
  const [bcaaStr, setBcaa]             = useState('');

  // Section 04
  const [giStr, setGI] = useState('');
  const [glStr, setGL] = useState('');

  // Section 05
  const [ratioOmega, setRatioOmega] = useState('');

  // Section 06 — dynamic micronutrient rows
  const [microItems, setMicroItems] = useState<{ name: string; qty: string; anr: string }[]>([]);

  // Section 10
  const [tastes, setTastes]       = useState<string[]>([]);
  const [textures, setTextures]   = useState<string[]>([]);
  const [aromas, setAromas]       = useState<string[]>([]);
  const [pairings, setPairings]   = useState('');

  // Section 11
  const [allergenMap, setAllergenMap] = useState<Record<string, AllergenStatus>>(
    Object.fromEntries(ALLERGEN_NAMES.map((n) => [n, 'absent' as AllergenStatus])),
  );

  // Section 12
  const [ingredients, setIngredients] = useState('');

  // ── Live per100 & compat ────────────────────────────────────

  const per100 = useMemo(() => ({
    kcal:   parseFloat(kcalStr)   || 0,
    protein: parseFloat(protStr)  || 0,
    carbs:  parseFloat(carbStr)   || 0,
    fat:    parseFloat(fatStr)    || 0,
    fiber:  parseFloat(fiberStr)  || 0,
    salt:   parseFloat(saltStr)   || 0,
    fatSat: parseFloat(fatSatStr) || 0,
    sugars: parseFloat(sugStr)    || 0,
  }), [kcalStr, protStr, carbStr, fatStr, fiberStr, saltStr, fatSatStr, sugStr]);

  const compat = useMemo(() => buildManualCompat(per100, allergenMap), [per100, allergenMap]);

  // ── Helpers ──────────────────────────────────────────────────

  const toggleChip = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) =>
    setter((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);

  const cycleAllergen = (n: string) =>
    setAllergenMap((prev) => {
      const idx = STATUS_CYCLE.indexOf(prev[n] ?? 'absent');
      return { ...prev, [n]: STATUS_CYCLE[(idx + 1) % 3] };
    });

  const addMicro = () => setMicroItems((p) => [...p, { name: '', qty: '', anr: '' }]);
  const updateMicro = (idx: number, field: 'name' | 'qty' | 'anr', val: string) =>
    setMicroItems((p) => p.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  const removeMicro = (idx: number) =>
    setMicroItems((p) => p.filter((_, i) => i !== idx));

  const handleSave = () => {
    if (!name.trim()) return;

    const allergenList: Allergen[] = ALLERGEN_NAMES.map((n) => ({ name: n, status: allergenMap[n] }));
    const filledMicro = microItems.filter((i) => i.name.trim());

    const food: Food = {
      id: `manual-${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20)}-${Date.now().toString(36)}`,
      name:           name.trim(),
      category:       category.trim()  || 'Aliment',
      brand:          brand.trim()     || 'Générique',
      subtitle:       subtitle.trim(),
      defaultPortion: parseFloat(portionStr) || 100,
      unit,
      per100,
      proteinDetail: showS03 ? {
        totalG:   per100.protein,
        complete: protComplete,
        bcaaG:    parseFloat(bcaaStr) || 0,
        pdcaas:   0,
        amino:    [],
      } : undefined,
      carbDetail: showS04 ? {
        totalG:          per100.carbs,
        starchG:         0,
        sugarsG:         per100.sugars,
        fiberG:          per100.fiber,
        fiberSolubleG:   0,
        fiberInsolubleG: 0,
        glycemicIndex:   parseFloat(giStr) || 0,
        glycemicLoad:    parseFloat(glStr) || 0,
        notes:           '',
      } : undefined,
      lipidDetail: (showS05 && ratioOmega.trim()) ? {
        totalG:     per100.fat,
        fa:         [],
        ratioOmega: ratioOmega.trim(),
      } : undefined,
      minerals: (showS06 && filledMicro.length > 0)
        ? filledMicro.map((i) => ({ name: i.name, qty: i.qty, anr: i.anr || undefined, role: '' }))
        : undefined,
      sensory: (tastes.length || textures.length || aromas.length || pairings.trim()) ? {
        taste:    tastes,
        texture:  textures,
        aroma:    aromas,
        pairings: pairings.split(',').map((s) => s.trim()).filter(Boolean),
      } : undefined,
      allergens:  allergenList,
      compat,
      ingredients: ingredients.trim(),
    };

    onAdd(food);
    onBack();
  };

  // ── Render ───────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* Topbar */}
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
            <Icon name="back" size={20} color={Colors.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Saisie libre</Text>
            <Text style={styles.screenTitle}>Nouvel aliment</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={onOpenMenu} activeOpacity={0.7}>
            <Icon name="menu" size={22} color={Colors.ink} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        >

          {/* ── 01 — Informations générales ────────────── */}
          <View style={styles.card}>
            <SectionHead num="01" title="Informations générales" />
            <View style={styles.field}>
              <FieldLabel label="Nom de l'aliment *" />
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="ex. Purée de cacahuète"
                placeholderTextColor={Colors.muted2}
                autoFocus
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.field}>
              <FieldLabel label="Catégorie" />
              <TextInput style={styles.textInput} value={category} onChangeText={setCategory}
                placeholder="ex. Noix & oléagineux" placeholderTextColor={Colors.muted2} />
            </View>
            <View style={styles.divider} />
            <View style={styles.field}>
              <FieldLabel label="Marque" />
              <TextInput style={styles.textInput} value={brand} onChangeText={setBrand}
                placeholder="ex. Jardin Bio" placeholderTextColor={Colors.muted2} />
            </View>
            <View style={styles.divider} />
            <View style={styles.field}>
              <FieldLabel label="Description courte" />
              <TextInput style={styles.textInput} value={subtitle} onChangeText={setSubtitle}
                placeholder="ex. Riche en acides gras essentiels…" placeholderTextColor={Colors.muted2} />
            </View>
            <View style={styles.divider} />
            <View style={[styles.field, { flexDirection: 'row', alignItems: 'flex-end', gap: 12 }]}>
              <View style={{ flex: 1 }}>
                <FieldLabel label="Portion par défaut" />
                <TextInput style={styles.textInput} value={portionStr} onChangeText={setPortion}
                  keyboardType="decimal-pad" placeholder="100" placeholderTextColor={Colors.muted2} />
              </View>
              <View style={styles.unitToggle}>
                {(['g', 'ml'] as const).map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
                    onPress={() => setUnit(u)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* ── 02 — Apports nutritionnels ─────────────── */}
          <View style={styles.card}>
            <SectionHead num="02" title="Apports nutritionnels" right="pour 100 g / ml" />
            <TwoCol>
              <NumInput label="Énergie (kcal)" value={kcalStr} onChange={setKcal} placeholder="ex. 589" />
              <NumInput label="Protéines (g)" value={protStr} onChange={setProt} />
            </TwoCol>
            <View style={{ height: 16 }} />
            <TwoCol>
              <NumInput label="Glucides (g)" value={carbStr} onChange={setCarb} />
              <NumInput label="dont Sucres (g)" value={sugStr} onChange={setSug} />
            </TwoCol>
            <View style={{ height: 16 }} />
            <TwoCol>
              <NumInput label="Lipides (g)" value={fatStr} onChange={setFat} />
              <NumInput label="dont Saturés (g)" value={fatSatStr} onChange={setFatSat} />
            </TwoCol>
            <View style={{ height: 16 }} />
            <TwoCol>
              <NumInput label="Fibres (g)" value={fiberStr} onChange={setFiber} />
              <NumInput label="Sel (g)" value={saltStr} onChange={setSalt} />
            </TwoCol>
          </View>

          {/* ── 03 — Protéines (optionnel) ─────────────── */}
          <View style={styles.card}>
            <SectionHead num="03" title="Protéines" right="optionnel"
              collapsible expanded={showS03} onToggle={() => setShowS03((v) => !v)} />
            {showS03 && (
              <View style={{ gap: 14 }}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Protéines complètes</Text>
                  <Switch value={protComplete} onValueChange={setProtComplete}
                    trackColor={{ true: Colors.ok }} thumbColor={Colors.paper2} />
                </View>
                <NumInput label="BCAA (g)" value={bcaaStr} onChange={setBcaa} placeholder="ex. 5.2" />
              </View>
            )}
          </View>

          {/* ── 04 — Glucides (optionnel) ──────────────── */}
          <View style={styles.card}>
            <SectionHead num="04" title="Glucides" right="optionnel"
              collapsible expanded={showS04} onToggle={() => setShowS04((v) => !v)} />
            {showS04 && (
              <TwoCol>
                <NumInput label="Index glycémique (0-100)" value={giStr} onChange={setGI} placeholder="ex. 40" />
                <NumInput label="Charge glycémique" value={glStr} onChange={setGL} placeholder="ex. 12" />
              </TwoCol>
            )}
          </View>

          {/* ── 05 — Lipides (optionnel) ───────────────── */}
          <View style={styles.card}>
            <SectionHead num="05" title="Lipides" right="optionnel"
              collapsible expanded={showS05} onToggle={() => setShowS05((v) => !v)} />
            {showS05 && (
              <NumInput label="Ratio Oméga ω6/ω3 (ex : 5:1)" value={ratioOmega} onChange={setRatioOmega} placeholder="5:1" />
            )}
          </View>

          {/* ── 06 — Minéraux & Vitamines (optionnel) ───── */}
          <View style={styles.card}>
            <SectionHead num="06" title="Minéraux & Vitamines" right="optionnel"
              collapsible expanded={showS06} onToggle={() => setShowS06((v) => !v)} />
            {showS06 && (
              <View style={{ gap: 10 }}>
                <View style={styles.microHeader}>
                  <Text style={[styles.microCol, { flex: 2 }]}>Nutriment</Text>
                  <Text style={[styles.microCol, { flex: 1.5 }]}>Quantité</Text>
                  <Text style={[styles.microCol, { flex: 1 }]}>ANR %</Text>
                  <View style={{ width: 28 }} />
                </View>
                {microItems.map((item, idx) => (
                  <View key={idx} style={styles.microRow}>
                    <TextInput
                      style={[styles.microInput, { flex: 2 }]}
                      value={item.name} onChangeText={(v) => updateMicro(idx, 'name', v)}
                      placeholder="Magnésium" placeholderTextColor={Colors.muted2}
                    />
                    <TextInput
                      style={[styles.microInput, { flex: 1.5 }]}
                      value={item.qty} onChangeText={(v) => updateMicro(idx, 'qty', v)}
                      placeholder="197 mg" placeholderTextColor={Colors.muted2}
                    />
                    <TextInput
                      style={[styles.microInput, { flex: 1 }]}
                      value={item.anr} onChangeText={(v) => updateMicro(idx, 'anr', v)}
                      placeholder="52 %" placeholderTextColor={Colors.muted2}
                      keyboardType="decimal-pad"
                    />
                    <TouchableOpacity onPress={() => removeMicro(idx)} activeOpacity={0.7}>
                      <Text style={styles.microRemove}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addRowBtn} onPress={addMicro} activeOpacity={0.7}>
                  <Text style={styles.addRowText}>+ Ajouter un nutriment</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── 10 — Profil sensoriel ─────────────────── */}
          <View style={styles.card}>
            <SectionHead num="10" title="Profil sensoriel" />
            <View style={{ gap: 16 }}>
              <ChipGroup label="Goûts" options={TASTE_OPTIONS} selected={tastes}
                onToggle={(v) => toggleChip(setTastes, v)} />
              <ChipGroup label="Textures" options={TEXTURE_OPTIONS} selected={textures}
                onToggle={(v) => toggleChip(setTextures, v)} />
              <ChipGroup label="Arômes" options={AROMA_OPTIONS} selected={aromas}
                onToggle={(v) => toggleChip(setAromas, v)} />
              <View>
                <FieldLabel label="Pairings (séparés par virgule)" />
                <TextInput
                  style={styles.textInput}
                  value={pairings} onChangeText={setPairings}
                  placeholder="ex. Yaourt, Pomme, Pain complet"
                  placeholderTextColor={Colors.muted2}
                />
              </View>
            </View>
          </View>

          {/* ── 11 — Allergènes ──────────────────────── */}
          <View style={styles.card}>
            <SectionHead num="11" title="Allergènes" right="14 prioritaires" />
            <View style={styles.allergenGrid}>
              {ALLERGEN_NAMES.map((aName) => {
                const status = allergenMap[aName];
                const col = STATUS_STYLE[status];
                return (
                  <TouchableOpacity
                    key={aName}
                    style={[styles.allergenBtn, { backgroundColor: col.bg, borderColor: col.border }]}
                    onPress={() => cycleAllergen(aName)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.allergenName, { color: col.text }]} numberOfLines={2}>{aName}</Text>
                    <Text style={[styles.allergenMark, { color: col.text }]}>{STATUS_LABEL[status]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.allergenHint}>Appuyer pour cycler : absent — présent — traces</Text>
          </View>

          {/* ── 12 — Composition ─────────────────────── */}
          <View style={styles.card}>
            <SectionHead num="12" title="Composition" />
            <FieldLabel label="Liste d'ingrédients" />
            <TextInput
              style={[styles.textInput, styles.multiline]}
              value={ingredients}
              onChangeText={setIngredients}
              placeholder="ex. Cacahuètes 100 %."
              placeholderTextColor={Colors.muted2}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* ── Compatibilité personnalisée ────────────── */}
          <View style={styles.compatCard}>
            <Text style={styles.compatTitle}>Compatibilité personnalisée</Text>
            <View style={styles.compatTags}>
              {compat.map((c, i) => (
                <View key={i} style={[styles.tag, c.kind === 'ok' ? styles.tagOk : styles.tagWarn]}>
                  <Text style={[styles.tagText, c.kind === 'ok' ? styles.tagTextOk : styles.tagTextWarn]}>
                    {c.label}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.compatHint}>
              Calculée en temps réel — renseignez les macros (§02) et les allergènes (§11) pour affiner.
            </Text>
          </View>

          {/* ── Bouton Valider ────────────────────────── */}
          <TouchableOpacity
            style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={!name.trim()}
          >
            <Icon name="check" size={18} color={Colors.paper2} />
            <Text style={styles.saveBtnText}>Valider l'aliment</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },

  topbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 10,
  },
  iconBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  eyebrow:     { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: Colors.muted },
  screenTitle: { fontFamily: Fonts.serif, fontSize: 24, color: Colors.ink, letterSpacing: -0.4 },

  content: { paddingHorizontal: 16, gap: 10, paddingTop: 4 },

  card: {
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.hairline2,
    padding: 16, gap: 0,
  },

  field:   { paddingVertical: 10 },
  divider: { height: 1, backgroundColor: Colors.hairline2, marginHorizontal: -16 },

  textInput: { fontFamily: Fonts.sans, fontSize: 15, color: Colors.ink, paddingVertical: 2 },
  multiline: { minHeight: 72 },

  unitToggle: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, borderColor: Colors.hairline, overflow: 'hidden' },
  unitBtn:       { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: Colors.card },
  unitBtnActive: { backgroundColor: Colors.ink },
  unitText:      { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 0.8, color: Colors.muted },
  unitTextActive:{ color: Colors.paper2 },

  switchRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.ink },

  // Micronutrient list
  microHeader: { flexDirection: 'row', gap: 6 },
  microCol:    { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.muted2 },
  microRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  microInput:  { fontFamily: Fonts.sans, fontSize: 13, color: Colors.ink, borderBottomWidth: 1, borderBottomColor: Colors.hairline2, paddingVertical: 3 },
  microRemove: { fontFamily: Fonts.sans, fontSize: 20, color: Colors.muted2, width: 28, textAlign: 'center', paddingBottom: 2 },
  addRowBtn:   { paddingVertical: 8, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: Colors.hairline, borderStyle: 'dashed' },
  addRowText:  { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.2, color: Colors.muted },

  // Allergen grid
  allergenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  allergenBtn:  {
    width: '22%', paddingVertical: 8, paddingHorizontal: 6,
    borderRadius: 10, borderWidth: 1.5,
    alignItems: 'center', gap: 4,
  },
  allergenName: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 0.5, textAlign: 'center' },
  allergenMark: { fontFamily: Fonts.sansMedium, fontSize: 11 },
  allergenHint: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 0.8, color: Colors.muted2, textAlign: 'center' },

  // Compat
  compatCard: {
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.hairline2,
    padding: 16, gap: 10,
  },
  compatTitle: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink },
  compatTags:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:         { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 100, borderWidth: 1 },
  tagOk:       { backgroundColor: 'rgba(63,90,58,0.08)',   borderColor: 'rgba(63,90,58,0.25)' },
  tagWarn:     { backgroundColor: 'rgba(139,58,46,0.08)',  borderColor: 'rgba(139,58,46,0.25)' },
  tagText:     { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.8 },
  tagTextOk:   { color: Colors.ok },
  tagTextWarn: { color: Colors.warn },
  compatHint:  { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted, lineHeight: 16 },

  // Save
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.ink, borderRadius: 100,
    paddingVertical: 16, paddingHorizontal: 28,
  },
  saveBtnDisabled: { opacity: 0.35 },
  saveBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.paper2, letterSpacing: 0.2 },
});
