import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Food } from '../types';
import { UserProfile } from '../data/user';
import { calculateNutriScorePerso, GRADE_COLORS } from '../utils/nutriScorePerso';
import { NutriScoreBadge } from '../components/NutriScoreBadge';
import { Icon } from '../components/Icon';
import { Colors, Fonts } from '../theme/tokens';

// ── Types ─────────────────────────────────────────────────────

interface Props {
  food1: Food;
  food2: Food;
  profile: UserProfile;
  onBack: () => void;
  onAddToJournal?: (food: Food) => void;
}

// ── Helpers ───────────────────────────────────────────────────

type Win = 'left' | 'right' | 'tie' | 'na';

function macroWinner(v1: number, v2: number, higherIsBetter: boolean): Win {
  if (v1 === v2) return 'tie';
  const better = higherIsBetter ? v1 > v2 : v1 < v2;
  return better ? 'left' : 'right';
}

function winColor(side: 'left' | 'right', winner: Win): string {
  if (winner === 'tie' || winner === 'na') return Colors.ink2;
  return winner === side ? Colors.ok : Colors.warn;
}

function winBg(side: 'left' | 'right', winner: Win): string {
  if (winner === 'tie' || winner === 'na') return 'transparent';
  return winner === side ? 'rgba(63,90,58,0.07)' : 'rgba(139,58,46,0.05)';
}

// ── Sub-components ────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

function CompareRow({
  label,
  left,
  right,
  winner,
}: {
  label: string;
  left: string;
  right: string;
  winner: Win;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.cell, { backgroundColor: winBg('left', winner) }]}>
        <Text style={[styles.cellValue, { color: winColor('left', winner) }]}>{left}</Text>
        {winner === 'left' && <Icon name="chevron-up" size={12} color={Colors.ok} />}
      </View>
      <View style={styles.rowLabel}>
        <Text style={styles.rowLabelText}>{label}</Text>
      </View>
      <View style={[styles.cell, styles.cellRight, { backgroundColor: winBg('right', winner) }]}>
        {winner === 'right' && <Icon name="chevron-up" size={12} color={Colors.ok} />}
        <Text style={[styles.cellValue, { color: winColor('right', winner) }]}>{right}</Text>
      </View>
    </View>
  );
}

function AllergenRow({ label, left, right }: { label: string; left: string; right: string }) {
  const leftBad = left === 'Contient';
  const rightBad = right === 'Contient';
  return (
    <View style={styles.row}>
      <View style={styles.cell}>
        <Text style={[styles.cellValue, leftBad && { color: Colors.warn }]}>{left}</Text>
      </View>
      <View style={styles.rowLabel}>
        <Text style={styles.rowLabelText}>{label}</Text>
      </View>
      <View style={[styles.cell, styles.cellRight]}>
        <Text style={[styles.cellValue, rightBad && { color: Colors.warn }]}>{right}</Text>
      </View>
    </View>
  );
}

function FodmapRow({ label, left, right }: { label: string; left: string; right: string }) {
  const levelColor = (v: string) => {
    const l = v.toLowerCase();
    if (l === 'élevé' || l === 'high') return Colors.warn;
    if (l === 'modéré' || l === 'moderate') return Colors.signal;
    if (l === 'faible' || l === 'low') return Colors.ok;
    return Colors.ink2;
  };
  return (
    <View style={styles.row}>
      <View style={styles.cell}>
        <Text style={[styles.cellValue, { color: levelColor(left) }]}>{left}</Text>
      </View>
      <View style={styles.rowLabel}>
        <Text style={styles.rowLabelText}>{label}</Text>
      </View>
      <View style={[styles.cell, styles.cellRight]}>
        <Text style={[styles.cellValue, { color: levelColor(right) }]}>{right}</Text>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────

export function ComparateurScreen({ food1, food2, profile, onBack, onAddToJournal }: Props) {
  const insets = useSafeAreaInsets();

  const score1 = calculateNutriScorePerso(food1, profile);
  const score2 = calculateNutriScorePerso(food2, profile);

  const p1 = food1.per100;
  const p2 = food2.per100;

  const allergenNames = Array.from(
    new Set([
      ...food1.allergens.filter((a) => a.status !== 'absent').map((a) => a.name),
      ...food2.allergens.filter((a) => a.status !== 'absent').map((a) => a.name),
    ]),
  );

  const fodmap1 = food1.fodmap?.overall;
  const fodmap2 = food2.fodmap?.overall;

  const fmLabel = (v: string | undefined) => {
    if (!v) return '—';
    if (v === 'low') return 'Faible';
    if (v === 'moderate') return 'Modéré';
    if (v === 'high') return 'Élevé';
    return v;
  };

  const allergenStatus = (food: Food, name: string) => {
    const a = food.allergens.find((x) => x.name === name);
    if (!a || a.status === 'absent') return '—';
    if (a.status === 'contains') return 'Contient';
    return 'Traces';
  };

  const scoreWinner: Win = score1.score > score2.score ? 'left' : score1.score < score2.score ? 'right' : 'tie';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Icon name="arrow-left" size={20} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Comparateur</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Product headers */}
      <View style={styles.productHeaders}>
        <View style={styles.productCol}>
          <Text style={styles.productName} numberOfLines={2}>{food1.name}</Text>
          {food1.brand ? <Text style={styles.productBrand}>{food1.brand}</Text> : null}
        </View>
        <View style={styles.vsCol}>
          <Text style={styles.vsText}>VS</Text>
        </View>
        <View style={[styles.productCol, styles.productColRight]}>
          <Text style={[styles.productName, styles.textRight]} numberOfLines={2}>{food2.name}</Text>
          {food2.brand ? <Text style={[styles.productBrand, styles.textRight]}>{food2.brand}</Text> : null}
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Score Nutri Perso */}
        <SectionTitle label="Score Nutri Perso" />
        <View style={[styles.row, styles.scoreRow]}>
          <View style={[styles.cell, { backgroundColor: winBg('left', scoreWinner) }]}>
            <NutriScoreBadge result={score1} size="md" />
          </View>
          <View style={styles.rowLabel}>
            <Text style={styles.rowLabelText}>Score</Text>
          </View>
          <View style={[styles.cell, styles.cellRight, { backgroundColor: winBg('right', scoreWinner) }]}>
            <NutriScoreBadge result={score2} size="md" />
          </View>
        </View>

        {/* Macros */}
        <SectionTitle label="Macronutriments (pour 100 g)" />
        <CompareRow
          label="Kcal"
          left={`${Math.round(p1.kcal)} kcal`}
          right={`${Math.round(p2.kcal)} kcal`}
          winner={macroWinner(p1.kcal, p2.kcal, false)}
        />
        <CompareRow
          label="Protéines"
          left={`${p1.protein.toFixed(1)} g`}
          right={`${p2.protein.toFixed(1)} g`}
          winner={macroWinner(p1.protein, p2.protein, true)}
        />
        <CompareRow
          label="Glucides"
          left={`${p1.carbs.toFixed(1)} g`}
          right={`${p2.carbs.toFixed(1)} g`}
          winner={macroWinner(p1.carbs, p2.carbs, false)}
        />
        <CompareRow
          label="Dont sucres"
          left={`${p1.sugars.toFixed(1)} g`}
          right={`${p2.sugars.toFixed(1)} g`}
          winner={macroWinner(p1.sugars, p2.sugars, false)}
        />
        <CompareRow
          label="Lipides"
          left={`${p1.fat.toFixed(1)} g`}
          right={`${p2.fat.toFixed(1)} g`}
          winner={macroWinner(p1.fat, p2.fat, false)}
        />
        <CompareRow
          label="Fibres"
          left={`${(p1.fiber ?? 0).toFixed(1)} g`}
          right={`${(p2.fiber ?? 0).toFixed(1)} g`}
          winner={macroWinner(p1.fiber ?? 0, p2.fiber ?? 0, true)}
        />

        {/* FODMAP */}
        {(fodmap1 || fodmap2) && (
          <>
            <SectionTitle label="FODMAP" />
            <FodmapRow
              label="Niveau global"
              left={fmLabel(fodmap1)}
              right={fmLabel(fodmap2)}
            />
          </>
        )}

        {/* Allergènes */}
        {allergenNames.length > 0 && (
          <>
            <SectionTitle label="Allergènes" />
            {allergenNames.map((name) => (
              <AllergenRow
                key={name}
                label={name}
                left={allergenStatus(food1, name)}
                right={allergenStatus(food2, name)}
              />
            ))}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Footer — add to journal */}
      {onAddToJournal && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity
            style={[styles.footerBtn, { backgroundColor: scoreWinner === 'left' ? Colors.ok : Colors.card }]}
            onPress={() => onAddToJournal(food1)}
            activeOpacity={0.8}
          >
            <Text style={[styles.footerBtnText, scoreWinner === 'left' && { color: Colors.paper }]} numberOfLines={1}>
              Ajouter {food1.name}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerBtn, { backgroundColor: scoreWinner === 'right' ? Colors.ok : Colors.card }]}
            onPress={() => onAddToJournal(food2)}
            activeOpacity={0.8}
          >
            <Text style={[styles.footerBtnText, scoreWinner === 'right' && { color: Colors.paper }]} numberOfLines={1}>
              Ajouter {food2.name}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 17,
    color: Colors.ink,
    textAlign: 'center',
  },

  productHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
    backgroundColor: Colors.paper2,
  },
  productCol: {
    flex: 1,
  },
  productColRight: {
    alignItems: 'flex-end',
  },
  vsCol: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.muted,
  },
  productName: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.ink,
    lineHeight: 18,
  },
  productBrand: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  textRight: {
    textAlign: 'right',
  },

  scroll: {
    flex: 1,
  },

  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
    minHeight: 42,
  },
  scoreRow: {
    minHeight: 60,
    paddingVertical: 8,
  },
  cell: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cellRight: {
    justifyContent: 'flex-end',
  },
  cellValue: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.ink2,
  },
  rowLabel: {
    width: 80,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  rowLabelText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.muted,
    textAlign: 'center',
  },

  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
    backgroundColor: Colors.paper,
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  footerBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.ink,
  },
});
