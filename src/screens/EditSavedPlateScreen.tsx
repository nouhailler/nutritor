import React, { useState } from 'react';
import {
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
import { SavedPlate, SavedPlateItem } from '../data/saved';
import { Colors, Fonts } from '../theme/tokens';

const AVAILABLE_TAGS = [
  'Sans gluten',
  'Vegan',
  'Végétarien',
  'Sans lactose',
  'Low FODMAP',
  'Riche en protéines',
];

interface DraftItem {
  id: string;
  name: string;
  qty: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
}

function emptyDraft(): DraftItem {
  return { id: Date.now().toString(), name: '', qty: '', kcal: '', protein: '', carbs: '', fat: '' };
}

function n(s: string): number {
  const v = parseFloat(s.replace(',', '.'));
  return isNaN(v) ? 0 : v;
}

// ── Item row ──────────────────────────────────────────────────

function ItemRow({ item, onDelete }: { item: DraftItem; onDelete: () => void }) {
  const kcal = n(item.kcal);
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name || '—'}</Text>
        <Text style={styles.itemMeta}>
          {item.qty || '—'}  ·  {kcal} kcal  ·  P {n(item.protein)}g G {n(item.carbs)}g L {n(item.fat)}g
        </Text>
      </View>
      <TouchableOpacity onPress={onDelete} activeOpacity={0.7} style={styles.deleteBtn}>
        <Icon name="trash" size={15} color={Colors.warn} />
      </TouchableOpacity>
    </View>
  );
}

// ── Add ingredient form ───────────────────────────────────────

function AddItemForm({ onAdd }: { onAdd: (item: DraftItem) => void }) {
  const [draft, setDraft] = useState<DraftItem>(emptyDraft);
  const [open, setOpen] = useState(false);

  const set = (field: keyof DraftItem) => (val: string) =>
    setDraft((d) => ({ ...d, [field]: val }));

  const handleAdd = () => {
    if (!draft.name.trim()) return;
    onAdd({ ...draft, id: Date.now().toString() });
    setDraft(emptyDraft());
    setOpen(false);
  };

  if (!open) {
    return (
      <TouchableOpacity style={styles.addIngredientBtn} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Icon name="plus" size={16} color={Colors.ink} />
        <Text style={styles.addIngredientText}>Ajouter un ingrédient</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.addForm}>
      <Text style={styles.addFormTitle}>Nouvel ingrédient</Text>

      <TextInput
        style={styles.fieldInput}
        placeholder="Nom de l'ingrédient"
        placeholderTextColor={Colors.muted2}
        value={draft.name}
        onChangeText={set('name')}
        autoCorrect={false}
      />
      <TextInput
        style={styles.fieldInput}
        placeholder="Quantité (ex: 100 g)"
        placeholderTextColor={Colors.muted2}
        value={draft.qty}
        onChangeText={set('qty')}
        autoCorrect={false}
      />

      <View style={styles.macroRow}>
        <View style={styles.macroField}>
          <Text style={styles.macroFieldLabel}>Kcal</Text>
          <TextInput
            style={styles.macroFieldInput}
            placeholder="0"
            placeholderTextColor={Colors.muted2}
            value={draft.kcal}
            onChangeText={set('kcal')}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.macroField}>
          <Text style={styles.macroFieldLabel}>Protéines g</Text>
          <TextInput
            style={styles.macroFieldInput}
            placeholder="0"
            placeholderTextColor={Colors.muted2}
            value={draft.protein}
            onChangeText={set('protein')}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.macroField}>
          <Text style={styles.macroFieldLabel}>Glucides g</Text>
          <TextInput
            style={styles.macroFieldInput}
            placeholder="0"
            placeholderTextColor={Colors.muted2}
            value={draft.carbs}
            onChangeText={set('carbs')}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.macroField}>
          <Text style={styles.macroFieldLabel}>Lipides g</Text>
          <TextInput
            style={styles.macroFieldInput}
            placeholder="0"
            placeholderTextColor={Colors.muted2}
            value={draft.fat}
            onChangeText={set('fat')}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.addFormActions}>
        <TouchableOpacity style={styles.cancelFormBtn} onPress={() => setOpen(false)} activeOpacity={0.7}>
          <Text style={styles.cancelFormText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmFormBtn} onPress={handleAdd} activeOpacity={0.8}>
          <Icon name="check" size={14} color={Colors.paper2} />
          <Text style={styles.confirmFormText}>Ajouter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────

interface Props {
  plate: SavedPlate | null;
  onSave: (plate: SavedPlate) => void;
  onBack: () => void;
}

export function EditSavedPlateScreen({ plate, onSave, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const isNew = plate === null;

  const [name, setName] = useState(plate?.name ?? '');
  const [timeMin, setTimeMin] = useState(plate ? String(plate.timeMin) : '');
  const [tags, setTags] = useState<string[]>(plate?.tags ?? []);
  const [items, setItems] = useState<DraftItem[]>(
    plate?.recipe.map((r, i) => ({
      id: String(i),
      name: r.name,
      qty: r.qty,
      kcal: String(r.kcal),
      protein: String(r.macros.protein),
      carbs: String(r.macros.carbs),
      fat: String(r.macros.fat),
    })) ?? []
  );
  const [error, setError] = useState('');

  const toggleTag = (tag: string) =>
    setTags((ts) => ts.includes(tag) ? ts.filter((t) => t !== tag) : [...ts, tag]);

  const totalKcal = items.reduce((acc, it) => acc + n(it.kcal), 0);
  const totalProtein = items.reduce((acc, it) => acc + n(it.protein), 0);
  const totalCarbs = items.reduce((acc, it) => acc + n(it.carbs), 0);
  const totalFat = items.reduce((acc, it) => acc + n(it.fat), 0);

  const handleSave = () => {
    if (!name.trim()) { setError('Le nom du plat est requis.'); return; }
    if (items.length === 0) { setError('Ajoute au moins un ingrédient.'); return; }
    setError('');

    const recipe: SavedPlateItem[] = items.map((it) => ({
      name: it.name,
      qty: it.qty,
      kcal: Math.round(n(it.kcal)),
      macros: {
        protein: Math.round(n(it.protein) * 10) / 10,
        carbs: Math.round(n(it.carbs) * 10) / 10,
        fat: Math.round(n(it.fat) * 10) / 10,
      },
    }));

    const tm = n(timeMin) || 0;
    const saved: SavedPlate = {
      id: plate?.id ?? `sv-${Date.now()}`,
      name: name.trim(),
      kcal: Math.round(totalKcal),
      time: tm > 0 ? `${tm} min` : '—',
      timeMin: tm,
      tags,
      items: recipe.length,
      last: "Aujourd'hui",
      macros: {
        protein: Math.round(totalProtein * 10) / 10,
        carbs: Math.round(totalCarbs * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
      },
      recipe,
    };

    onSave(saved);
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
            <Icon name="back" size={20} color={Colors.ink} />
          </TouchableOpacity>
          <View style={styles.topbarCenter}>
            <Text style={styles.eyebrow}>{isNew ? 'Nouveau plat' : 'Modifier le plat'}</Text>
            <Text style={styles.title} numberOfLines={1}>{name || 'Sans titre'}</Text>
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Icon name="alert" size={14} color={Colors.warn} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Name */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Nom du plat</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Ex : Bowl quinoa & saumon"
              placeholderTextColor={Colors.muted2}
              value={name}
              onChangeText={setName}
              autoCorrect={false}
            />
          </View>

          {/* Time */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Temps de préparation</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={styles.timeInput}
                placeholder="15"
                placeholderTextColor={Colors.muted2}
                value={timeMin}
                onChangeText={setTimeMin}
                keyboardType="numeric"
              />
              <Text style={styles.timeUnit}>min</Text>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Étiquettes</Text>
            <View style={styles.tagsWrap}>
              {AVAILABLE_TAGS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagPill, active && styles.tagPillActive]}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.7}
                  >
                    {active && <Icon name="check" size={11} color={Colors.paper2} />}
                    <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Totals */}
          <View style={styles.totalsRow}>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{Math.round(totalKcal)}</Text>
              <Text style={styles.totalLabel}>kcal</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{Math.round(totalProtein * 10) / 10}g</Text>
              <Text style={styles.totalLabel}>protéines</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{Math.round(totalCarbs * 10) / 10}g</Text>
              <Text style={styles.totalLabel}>glucides</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{Math.round(totalFat * 10) / 10}g</Text>
              <Text style={styles.totalLabel}>lipides</Text>
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Ingrédients</Text>
              <Text style={styles.sectionCount}>{items.length}</Text>
            </View>

            {items.length === 0 && (
              <Text style={styles.emptyHint}>Aucun ingrédient pour l'instant.</Text>
            )}

            {items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onDelete={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
              />
            ))}

            <AddItemForm onAdd={(item) => setItems((prev) => [...prev, item])} />
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
    paddingTop: 12,
    paddingBottom: 10,
    gap: 12,
  },
  topbarCenter: { flex: 1 },
  iconBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: -0.4,
    color: Colors.ink,
    marginTop: 1,
  },
  saveBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 100,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  saveBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.paper2,
  },

  scroll: { paddingHorizontal: 20, gap: 0 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(139,58,46,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139,58,46,0.25)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.warn,
    flex: 1,
  },

  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 10,
  },
  sectionCount: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted2,
  },

  nameInput: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    letterSpacing: -0.4,
    color: Colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },

  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeInput: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    letterSpacing: -0.5,
    color: Colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
    paddingVertical: 4,
    minWidth: 60,
    textAlign: 'center',
  },
  timeUnit: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
  },

  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 100,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  tagPillActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  tagText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink2,
  },
  tagTextActive: { color: Colors.paper2 },

  totalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 24,
  },
  totalItem: { flex: 1, alignItems: 'center', gap: 3 },
  totalValue: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    letterSpacing: -0.4,
    color: Colors.ink,
  },
  totalLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  totalDivider: { width: 1, height: 30, backgroundColor: Colors.hairline2 },

  emptyHint: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    paddingVertical: 8,
    marginBottom: 8,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
    gap: 10,
  },
  itemInfo: { flex: 1 },
  itemName: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink,
    letterSpacing: -0.1,
  },
  itemMeta: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted2,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  deleteBtn: {
    width: 34, height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(139,58,46,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addIngredientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 100,
    paddingVertical: 13,
    marginTop: 8,
  },
  addIngredientText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.ink,
  },

  addForm: {
    marginTop: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  addFormTitle: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 2,
  },
  fieldInput: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
    paddingVertical: 8,
  },
  macroRow: { flexDirection: 'row', gap: 8 },
  macroField: { flex: 1, gap: 4 },
  macroFieldLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  macroFieldInput: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    letterSpacing: -0.3,
    color: Colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
    paddingVertical: 4,
    textAlign: 'center',
  },
  addFormActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  cancelFormBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 100,
  },
  cancelFormText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink2,
  },
  confirmFormBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.ink,
    borderRadius: 100,
    paddingVertical: 12,
  },
  confirmFormText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.paper2,
  },
});
