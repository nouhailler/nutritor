/**
 * SavedDetailScreen — stack 'savedDetail'
 * Détail d'un plat sauvegardé : recette par ingrédient, macros totales,
 * photo, ajout au repas du journal, suppression avec confirmation.
 */
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import { Icon } from '../components/Icon';
import { SavedPlate } from '../data/saved';
import { Meal } from '../types';
import { Colors, Fonts } from '../theme/tokens';
import { HelpButton, HelpModal } from '../components/HelpModal';
import { HELP } from '../data/helpContent';

// ── Striped hero ──────────────────────────────────────────────

function StripedHero() {
  return (
    <View style={styles.hero} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id="heroHatch"
            x="0" y="0" width="10" height="10"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45 0 0)"
          >
            <Rect x="0" y="0" width="9" height="10" fill={Colors.paper2} />
            <Line x1="9" y1="0" x2="9" y2="10" stroke={Colors.hairline2} strokeWidth="1" />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroHatch)" />
      </Svg>
    </View>
  );
}

// ── Macro bar ────────────────────────────────────────────────

function MacroBar({
  label, value, unit, color, pct,
}: {
  label: string; value: number; unit: string; color: string; pct: number;
}) {
  return (
    <View style={styles.macroItem}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>
        {value}<Text style={styles.macroUnit}>{unit}</Text>
      </Text>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ── Ingredient row ────────────────────────────────────────────

function IngredientRow({
  name, qty, kcal, macros,
}: {
  name: string; qty: string; kcal: number;
  macros: { protein: number; carbs: number; fat: number };
}) {
  const total = macros.protein + macros.carbs + macros.fat || 1;
  return (
    <View style={styles.ingredientRow}>
      <View style={styles.ingredientLeft}>
        <Text style={styles.ingredientName}>{name}</Text>
        <View style={styles.ingredientMeta}>
          <View style={styles.qtyPill}>
            <Text style={styles.qtyText}>{qty}</Text>
          </View>
          <Text style={styles.macroHint}>
            P {macros.protein}g · G {macros.carbs}g · L {macros.fat}g
          </Text>
        </View>
        <View style={styles.macroStrip}>
          <View style={[styles.macroStripP, { flex: macros.protein / total }]} />
          <View style={[styles.macroStripC, { flex: macros.carbs / total }]} />
          <View style={[styles.macroStripF, { flex: macros.fat / total }]} />
        </View>
      </View>
      <View style={styles.ingredientRight}>
        <Text style={styles.ingredientKcal}>{kcal}</Text>
        <Text style={styles.ingredientKcalUnit}>kcal</Text>
      </View>
    </View>
  );
}

// ── Meal picker sheet ─────────────────────────────────────────

function MealSheet({
  meals,
  visible,
  onClose,
  onSelect,
}: {
  meals: Meal[];
  visible: boolean;
  onClose: () => void;
  onSelect: (mealId: string) => void;
}) {
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(300)).current;
  const [mounted, setMounted] = useState(false);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 200 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(sheetAnim, { toValue: 300, duration: 180, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        style={[styles.overlay, { opacity: overlayAnim }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + 16, transform: [{ translateY: sheetAnim }] },
        ]}
      >
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Ajouter à un repas</Text>
        {meals.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={styles.mealRow}
            onPress={() => onSelect(m.id)}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.mealName}>{m.name}</Text>
              <Text style={styles.mealTime}>{m.time}</Text>
            </View>
            <Icon name="arrow-right" size={16} color={Colors.muted} />
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────

interface Props {
  plate: SavedPlate;
  meals: Meal[];
  onBack: () => void;
  onAdd: (mealId: string, plate: SavedPlate) => void;
  onDelete: () => void;
  onOpenMenu: () => void;
}

export function SavedDetailScreen({ plate, meals, onBack, onAdd, onDelete, onOpenMenu }: Props) {
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  const totalMacro = plate.macros.protein + plate.macros.carbs + plate.macros.fat || 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
          <Icon name="back" size={20} color={Colors.ink} />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.eyebrow}>Plat sauvegardé</Text>
          <Text style={styles.plateTitle} numberOfLines={1}>{plate.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.7}
          onPress={() =>
            Alert.alert(
              'Supprimer ce plat ?',
              `« ${plate.name} » sera supprimé définitivement.`,
              [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', style: 'destructive', onPress: onDelete },
              ]
            )
          }
        >
          <Icon name="trash" size={18} color={Colors.warn} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onOpenMenu} activeOpacity={0.7}>
          <Icon name="menu" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <HelpButton onPress={() => setHelpVisible(true)} />
      </View>
      <HelpModal visible={helpVisible} content={HELP.savedDetail} onClose={() => setHelpVisible(false)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Hero */}
        <View style={styles.heroWrap}>
          {plate.photo ? (
            <Image source={{ uri: plate.photo }} style={styles.heroPhoto} resizeMode="cover" />
          ) : (
            <StripedHero />
          )}
          {/* Badges over hero */}
          <View style={styles.heroBadges}>
            <View style={[styles.kcalBadge, plate.photo && styles.kcalBadgeOnPhoto]}>
              <Text style={[styles.kcalBadgeValue, plate.photo && styles.kcalBadgeValueOnPhoto]}>{plate.kcal}</Text>
              <Text style={[styles.kcalBadgeUnit, plate.photo && styles.kcalBadgeValueOnPhoto]}> kcal</Text>
            </View>
            <View style={[styles.timeBadge, plate.photo && styles.timeBadgeOnPhoto]}>
              <Icon name="clock" size={10} color={plate.photo ? Colors.paper2 : Colors.muted} />
              <Text style={[styles.timeBadgeText, plate.photo && styles.timeBadgeTextOnPhoto]}>{plate.time}</Text>
            </View>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.tagsRow}>
          {plate.tags.map((t) => (
            <View key={t} style={styles.tagPill}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
          <Text style={styles.lastUsed}>{plate.last}</Text>
        </View>

        <View style={styles.divider} />

        {/* Macros */}
        <View style={styles.macrosSection}>
          <MacroBar
            label="Protéines"
            value={plate.macros.protein}
            unit="g"
            color={Colors.ok}
            pct={(plate.macros.protein / totalMacro) * 100}
          />
          <MacroBar
            label="Glucides"
            value={plate.macros.carbs}
            unit="g"
            color={Colors.signal}
            pct={(plate.macros.carbs / totalMacro) * 100}
          />
          <MacroBar
            label="Lipides"
            value={plate.macros.fat}
            unit="g"
            color={Colors.ink}
            pct={(plate.macros.fat / totalMacro) * 100}
          />
        </View>

        <View style={styles.divider} />

        {/* Ingredients */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Ingrédients</Text>
          <Text style={styles.sectionCount}>{plate.recipe.length} aliments</Text>
        </View>
        {plate.recipe.map((item, i) => (
          <IngredientRow
            key={i}
            name={item.name}
            qty={item.qty}
            kcal={item.kcal}
            macros={item.macros}
          />
        ))}

        <View style={styles.divider} />

        {/* Note if any */}
        {plate.note && (
          <View style={styles.noteBlock}>
            <Text style={styles.noteLabel}>Note</Text>
            <Text style={styles.noteText}>{plate.note}</Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setSheetOpen(true)}
          activeOpacity={0.85}
        >
          <Icon name="plus" size={18} color={Colors.paper} />
          <Text style={styles.addBtnText}>Ajouter au journal</Text>
        </TouchableOpacity>
      </View>

      <MealSheet
        meals={meals}
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSelect={(mealId) => {
          setSheetOpen(false);
          onAdd(mealId, plate);
        }}
      />
    </View>
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
  plateTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: -0.4,
    color: Colors.ink,
    marginTop: 1,
  },

  scroll: { gap: 0 },

  heroWrap: {
    height: 200,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.hairline2,
    justifyContent: 'flex-end',
  },
  hero: { ...StyleSheet.absoluteFillObject },
  heroBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  kcalBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  kcalBadgeValue: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    letterSpacing: -0.5,
    color: Colors.ink,
  },
  kcalBadgeUnit: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    color: Colors.muted,
    marginLeft: 2,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  timeBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
  },

  heroPhoto: {
    ...StyleSheet.absoluteFillObject,
  },
  kcalBadgeOnPhoto: {
    backgroundColor: 'rgba(15,12,8,0.55)',
    borderColor: 'transparent',
  },
  kcalBadgeValueOnPhoto: {
    color: Colors.paper2,
  },
  timeBadgeOnPhoto: {
    backgroundColor: 'rgba(15,12,8,0.55)',
    borderColor: 'transparent',
  },
  timeBadgeTextOnPhoto: {
    color: Colors.paper2,
  },

  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  tagPill: {
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tagText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  lastUsed: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.5,
    color: Colors.muted2,
    marginLeft: 'auto',
  },

  divider: {
    height: 1,
    backgroundColor: Colors.hairline2,
    marginHorizontal: 20,
    marginVertical: 18,
  },

  macrosSection: {
    paddingHorizontal: 20,
    gap: 14,
  },
  macroItem: { gap: 4 },
  macroLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  macroValue: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    letterSpacing: -0.5,
    color: Colors.ink,
  },
  macroUnit: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.muted,
  },
  macroTrack: {
    height: 3,
    backgroundColor: Colors.hairline2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroFill: {
    height: 3,
    borderRadius: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  sectionCount: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted2,
  },

  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
    gap: 12,
  },
  ingredientLeft: { flex: 1, gap: 5 },
  ingredientName: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    letterSpacing: -0.1,
    color: Colors.ink,
  },
  ingredientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyPill: {
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  qtyText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    color: Colors.muted,
  },
  macroHint: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.3,
    color: Colors.muted2,
  },
  macroStrip: {
    height: 2,
    flexDirection: 'row',
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: Colors.hairline2,
  },
  macroStripP: { backgroundColor: Colors.ok },
  macroStripC: { backgroundColor: Colors.signal },
  macroStripF: { backgroundColor: Colors.ink },
  ingredientRight: { alignItems: 'flex-end', paddingTop: 2 },
  ingredientKcal: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    letterSpacing: -0.3,
    color: Colors.ink,
  },
  ingredientKcalUnit: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.muted,
    marginTop: 1,
  },

  noteBlock: { paddingHorizontal: 20, paddingBottom: 8 },
  noteLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 6,
  },
  noteText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.ink2,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'rgba(242,237,226,0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.ink,
    borderRadius: 100,
    paddingVertical: 16,
  },
  addBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    letterSpacing: 0.2,
    color: Colors.paper,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,24,20,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.paper2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    shadowColor: '#0f0c08',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  sheetHandle: {
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: Colors.hairline,
    alignSelf: 'center',
    marginBottom: 18,
  },
  sheetTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    letterSpacing: -0.3,
    color: Colors.ink,
    marginBottom: 14,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  mealName: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.ink,
  },
  mealTime: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.5,
    color: Colors.muted,
    marginTop: 2,
  },
});
