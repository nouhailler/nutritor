import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import { Icon } from '../components/Icon';
import { FILTERS, SavedPlate, FilterId, applyFilter } from '../data/saved';
import { Colors, Fonts } from '../theme/tokens';

function StripedThumb({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.thumb}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id="diag"
            x="0" y="0"
            width="9" height="9"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45 0 0)"
          >
            <Rect x="0" y="0" width="8" height="9" fill={Colors.paper2} />
            <Line x1="8" y1="0" x2="8" y2="9" stroke={Colors.hairline2} strokeWidth="1" />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#diag)" />
      </Svg>
      {children}
    </View>
  );
}

function SavedCard({ plate, onPress, onEdit }: { plate: SavedPlate; onPress: () => void; onEdit: () => void }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.75} onPress={onPress}>
      <StripedThumb>
        <Text style={styles.kcalBadge}>
          {plate.kcal}<Text style={styles.kcalUnit}> kcal</Text>
        </Text>
        <TouchableOpacity style={styles.editBadge} onPress={onEdit} activeOpacity={0.7}>
          <Icon name="edit" size={11} color={Colors.muted} />
        </TouchableOpacity>
      </StripedThumb>
      <Text style={styles.cardName}>{plate.name}</Text>
      <View style={styles.tags}>
        {plate.tags.map((t) => (
          <View key={t} style={styles.tagPill}>
            <Text style={styles.tagText}>{t}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.lastText}>{plate.items} aliments · {plate.last}</Text>
    </TouchableOpacity>
  );
}

interface SavedScreenProps {
  plates: SavedPlate[];
  onOpenPlate: (plate: SavedPlate) => void;
  onCreatePlate: () => void;
  onEditPlate: (plate: SavedPlate) => void;
}

export function SavedScreen({ plates, onOpenPlate, onCreatePlate, onEditPlate }: SavedScreenProps) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterId>('all');

  const filtered = applyFilter(plates, filter);

  const pairs: SavedPlate[][] = [];
  for (let i = 0; i < filtered.length; i += 2) {
    pairs.push(filtered.slice(i, i + 2));
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topbar}>
        <View>
          <Text style={styles.eyebrow}>Bibliothèque</Text>
          <Text style={styles.title}>Plats sauvegardés</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={onCreatePlate}>
          <Icon name="plus" size={20} color={Colors.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterStrip}
        >
          {FILTERS.map((f) => {
            const active = f.id === filter;
            const label = f.id === 'all' ? `${f.label} · ${plates.length}` : f.label;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.grid}>
          {pairs.map((pair, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {pair.map((p) => (
                <SavedCard
                  key={p.id}
                  plate={p}
                  onPress={() => onOpenPlate(p)}
                  onEdit={() => onEditPlate(p)}
                />
              ))}
              {pair.length === 1 && <View style={styles.cardSpacer} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const H_PAD = 20;
const CARD_GAP = 14;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  scroll: { paddingBottom: 24 },

  topbar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingTop: 16,
    paddingBottom: 4,
  },
  eyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: -0.5,
    color: Colors.ink,
    marginTop: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  filterStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: H_PAD,
    paddingTop: 18,
    paddingBottom: 16,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  chipText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink2,
  },
  chipTextActive: {
    color: Colors.paper2,
  },

  grid: {
    paddingHorizontal: H_PAD,
    gap: CARD_GAP,
  },
  row: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  cardSpacer: { flex: 1 },

  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },

  thumb: {
    aspectRatio: 4 / 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 8,
  },
  kcalBadge: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    letterSpacing: -0.2,
    color: Colors.ink,
    backgroundColor: Colors.paper,
    paddingVertical: 1,
    paddingHorizontal: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    overflow: 'hidden',
  },
  kcalUnit: {
    fontFamily: Fonts.sans,
    fontSize: 9,
    color: Colors.muted,
  },
  editBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  cardName: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    lineHeight: 18,
    letterSpacing: -0.15,
    color: Colors.ink,
  },

  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tagPill: {
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  tagText: {
    fontFamily: Fonts.mono,
    fontSize: 8.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.muted,
  },

  lastText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.6,
    color: Colors.muted2,
  },
});
