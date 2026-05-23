/**
 * SavedScreen — tab 'saved'
 * Bibliothèque de plats sauvegardés : grille 2 colonnes avec photo,
 * filtres (tag, tri, texte), création et édition depuis ce même écran.
 */
import React, { useState } from 'react';
import {
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
import { HelpButton, HelpModal } from '../components/HelpModal';
import { PlateFilterSheet } from '../components/PlateFilterSheet';
import { HELP } from '../data/helpContent';
import { SavedPlate, PLATE_CATEGORIES } from '../data/saved';
import {
  PlateFilterState,
  DEFAULT_FILTER,
  SORT_OPTIONS,
  applyPlateFilters,
  countActiveFilters,
} from '../data/plateFilters';
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
      {plate.photo ? (
        <View style={styles.photoThumb}>
          <Image source={{ uri: plate.photo }} style={styles.photoThumbImg} resizeMode="cover" />
          <View style={styles.photoKcalBadge}>
            <Text style={styles.kcalBadgeOnPhoto}>
              {plate.kcal}<Text style={styles.kcalUnitOnPhoto}> kcal</Text>
            </Text>
          </View>
          <TouchableOpacity style={styles.editBadgeOnPhoto} onPress={onEdit} activeOpacity={0.7}>
            <Icon name="edit" size={11} color={Colors.paper2} />
          </TouchableOpacity>
        </View>
      ) : (
        <StripedThumb>
          <Text style={styles.kcalBadge}>
            {plate.kcal}<Text style={styles.kcalUnit}> kcal</Text>
          </Text>
          <TouchableOpacity style={styles.editBadge} onPress={onEdit} activeOpacity={0.7}>
            <Icon name="edit" size={11} color={Colors.muted} />
          </TouchableOpacity>
        </StripedThumb>
      )}
      <Text style={styles.cardName}>{plate.name}</Text>
      {plate.category && (() => {
        const meta = PLATE_CATEGORIES.find((c) => c.id === plate.category);
        return meta ? (
          <View style={styles.catPill}>
            <Text style={styles.catPillText}>{meta.emoji} {meta.label}</Text>
          </View>
        ) : null;
      })()}
      <View style={styles.tags}>
        {plate.tags.map((t) => (
          <View key={t} style={styles.tagPill}>
            <Text style={styles.tagText}>{t}</Text>
          </View>
        ))}
      </View>
      {/* Macro bar P/G/L */}
      {(plate.macros.protein > 0 || plate.macros.carbs > 0 || plate.macros.fat > 0) && (() => {
        const total = plate.macros.protein + plate.macros.carbs + plate.macros.fat || 1;
        return (
          <View style={styles.cardMacros}>
            <View style={styles.cardMacroBar}>
              <View style={[styles.cardMacroSegP, { flex: plate.macros.protein / total }]} />
              <View style={[styles.cardMacroSegC, { flex: plate.macros.carbs / total }]} />
              <View style={[styles.cardMacroSegF, { flex: plate.macros.fat / total }]} />
            </View>
            <Text style={styles.cardMacroText}>
              P {plate.macros.protein}g · G {plate.macros.carbs}g · L {plate.macros.fat}g
            </Text>
          </View>
        );
      })()}
      <Text style={styles.lastText}>{plate.items} aliments · {plate.last}</Text>
    </TouchableOpacity>
  );
}

interface SavedScreenProps {
  plates: SavedPlate[];
  onOpenPlate: (plate: SavedPlate) => void;
  onCreatePlate: () => void;
  onEditPlate: (plate: SavedPlate) => void;
  onOpenMenu: () => void;
  onStartDemo?: () => void;
}

export function SavedScreen({ plates, onOpenPlate, onCreatePlate, onEditPlate, onOpenMenu, onStartDemo }: SavedScreenProps) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<PlateFilterState>(DEFAULT_FILTER);
  const [filterVisible, setFilterVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  const filtered = applyPlateFilters(plates, filter);
  const activeCount = countActiveFilters(filter);
  const sortLabel = SORT_OPTIONS.find((o) => o.value === filter.sortBy)?.label ?? '';

  const pairs: SavedPlate[][] = [];
  for (let i = 0; i < filtered.length; i += 2) {
    pairs.push(filtered.slice(i, i + 2));
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.menuBtn} onPress={onOpenMenu} activeOpacity={0.7}>
          <Icon name="menu" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Bibliothèque</Text>
          <Text style={styles.title}>Plats sauvegardés</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={onCreatePlate}>
          <Icon name="plus" size={20} color={Colors.ink} />
        </TouchableOpacity>
        {onStartDemo && (
          <TouchableOpacity style={styles.iconBtn} onPress={onStartDemo} activeOpacity={0.7}>
            <Icon name="activity" size={18} color={Colors.signal} />
          </TouchableOpacity>
        )}
        <HelpButton onPress={() => setHelpVisible(true)} />
      </View>
      <HelpModal visible={helpVisible} content={HELP.saved} onClose={() => setHelpVisible(false)} />
      <PlateFilterSheet
        visible={filterVisible}
        filter={filter}
        plates={plates}
        onApply={setFilter}
        onClose={() => setFilterVisible(false)}
      />

      {/* Filter bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterBtn, activeCount > 0 && styles.filterBtnActive]}
          onPress={() => setFilterVisible(true)}
          activeOpacity={0.7}
        >
          <Icon name="sliders" size={14} color={activeCount > 0 ? Colors.paper2 : Colors.ink} />
          <Text style={[styles.filterBtnText, activeCount > 0 && styles.filterBtnTextActive]}>
            Filtres{activeCount > 0 ? ` · ${activeCount}` : ''}
          </Text>
        </TouchableOpacity>
        <Text style={styles.filterInfo}>
          {filtered.length}/{plates.length} · {sortLabel}
        </Text>
        {activeCount > 0 && (
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => setFilter(DEFAULT_FILTER)}
            activeOpacity={0.7}
          >
            <Icon name="close" size={12} color={Colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aucun plat trouvé</Text>
            <Text style={styles.emptyHint}>Modifie les filtres pour voir plus de résultats.</Text>
          </View>
        ) : (
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
        )}
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
    gap: 4,
    paddingHorizontal: H_PAD,
    paddingTop: 16,
    paddingBottom: 4,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    marginBottom: 4,
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

  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: H_PAD,
    paddingTop: 14,
    paddingBottom: 12,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: 'transparent',
  },
  filterBtnActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  filterBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.ink,
  },
  filterBtnTextActive: {
    color: Colors.paper2,
  },
  filterInfo: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.5,
    color: Colors.muted2,
    textAlign: 'right',
  },
  resetBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.ink,
  },
  emptyHint: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    paddingHorizontal: 32,
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

  photoThumb: {
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoThumbImg: {
    width: '100%',
    height: '100%',
  },
  photoKcalBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
  kcalBadgeOnPhoto: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    letterSpacing: -0.2,
    color: Colors.paper2,
    backgroundColor: 'rgba(15,12,8,0.55)',
    paddingVertical: 1,
    paddingHorizontal: 8,
    borderRadius: 100,
    overflow: 'hidden',
  },
  kcalUnitOnPhoto: {
    fontFamily: Fonts.sans,
    fontSize: 9,
    color: Colors.paper2,
  },
  editBadgeOnPhoto: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15,12,8,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardName: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    lineHeight: 18,
    letterSpacing: -0.15,
    color: Colors.ink,
  },

  catPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 7,
    backgroundColor: Colors.paper2,
  },
  catPillText: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    color: Colors.muted,
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

  cardMacros: { gap: 4 },
  cardMacroBar: {
    height: 3,
    flexDirection: 'row',
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: Colors.hairline2,
  },
  cardMacroSegP: { backgroundColor: Colors.ok },
  cardMacroSegC: { backgroundColor: Colors.signal },
  cardMacroSegF: { backgroundColor: Colors.ink2 },
  cardMacroText: {
    fontFamily: Fonts.mono,
    fontSize: 8.5,
    letterSpacing: 0.3,
    color: Colors.muted2,
  },

  lastText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.6,
    color: Colors.muted2,
  },
});
