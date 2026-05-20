import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { Colors, Fonts } from '../theme/tokens';
import { DayTip, TipLevel } from '../types/tips';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// ── Border color per level ──────────────────────────────────────

const LEVEL_COLORS: Record<TipLevel, string> = {
  info:     Colors.signal,
  caution:  Colors.warn,
  positive: Colors.ok,
};

// ── Single tip card ─────────────────────────────────────────────

function TipCard({
  tip,
  onDismiss,
}: {
  tip: DayTip;
  onDismiss: () => void;
}) {
  const borderColor = LEVEL_COLORS[tip.level];

  return (
    <View style={[styles.card, { borderLeftColor: borderColor }]}>
      <Text style={styles.emoji}>{tip.emoji}</Text>
      <Text style={styles.message}>{tip.message}</Text>
      <TouchableOpacity
        style={styles.dismissBtn}
        onPress={onDismiss}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Section wrapper ─────────────────────────────────────────────

interface TipsSectionProps {
  tips: DayTip[];
  dismissedIds: string[];
  onDismiss: (id: string) => void;
}

export function TipsSection({ tips, dismissedIds, onDismiss }: TipsSectionProps) {
  const visible = tips.filter((t) => !dismissedIds.includes(t.id));
  if (visible.length === 0) return null;

  const handleDismiss = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onDismiss(id);
  };

  return (
    <View style={styles.section}>
      {visible.map((t) => (
        <TipCard key={t.id} tip={t} onDismiss={() => handleDismiss(t.id)} />
      ))}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderLeftWidth: 3,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 10,
    gap: 10,
  },
  emoji: {
    fontSize: 15,
    lineHeight: 20,
    marginTop: 1,
  },
  message: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink2,
    lineHeight: 19,
  },
  dismissBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    marginLeft: 2,
  },
  dismissText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted2,
  },
});
