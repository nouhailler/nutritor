import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AIJobSnapshot } from '../services/aiQueue';
import { Colors, Fonts } from '../theme/tokens';

interface Props {
  jobs: AIJobSnapshot[];
  hasTabBar: boolean;
  onDismiss: () => void;
}

function PulseDot() {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.dot, { opacity: anim }]} />;
}

export function AIQueueBanner({ jobs, hasTabBar, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(80)).current;
  const visible = jobs.length > 0;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : 80,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (jobs.length === 0) return null;

  const running = jobs.find((j) => j.status === 'running');
  const pending = jobs.filter((j) => j.status === 'pending');
  const errors  = jobs.filter((j) => j.status === 'error');
  const done    = jobs.filter((j) => j.status === 'done');
  const allFinished = jobs.every((j) => j.status === 'done' || j.status === 'error');

  // Bottom offset: above tab bar when visible, otherwise just above safe area
  const TAB_H = 62;
  const bottomOffset = hasTabBar ? insets.bottom + TAB_H : insets.bottom + 12;

  let icon = '✦';
  let mainText = '';
  let subText = '';
  let isError = false;

  if (running) {
    icon = '✦';
    mainText = running.label;
    const extra = pending.length > 0 ? `  ·  ${pending.length} en attente` : '';
    subText = `IA en cours${extra}`;
  } else if (errors.length > 0 && done.length === 0) {
    icon = '!';
    mainText = errors[0].label;
    subText = errors[0].error ?? 'Erreur';
    isError = true;
  } else if (allFinished) {
    icon = '✓';
    const n = done.length;
    mainText = n === 1 ? `« ${done[0].label} » ajouté` : `${n} aliments ajoutés`;
    subText = errors.length > 0 ? `${errors.length} erreur${errors.length > 1 ? 's' : ''}` : '';
  }

  return (
    <Animated.View
      style={[
        styles.banner,
        { bottom: bottomOffset, transform: [{ translateY: slideAnim }] },
        isError && styles.bannerError,
        allFinished && !isError && styles.bannerDone,
      ]}
    >
      <View style={styles.left}>
        {running ? <PulseDot /> : (
          <Text style={[styles.iconText, isError && styles.iconError, allFinished && !isError && styles.iconDone]}>
            {icon}
          </Text>
        )}
        <View style={styles.texts}>
          <Text style={styles.mainText} numberOfLines={1}>{mainText}</Text>
          {subText ? <Text style={styles.subText} numberOfLines={1}>{subText}</Text> : null}
        </View>
      </View>

      {allFinished && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn} activeOpacity={0.7}>
          <Text style={styles.dismissText}>Fermer</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.ink,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#0f0c08',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 60,
  },
  bannerError: {
    backgroundColor: '#8B3A2E',
  },
  bannerDone: {
    backgroundColor: '#3F5A3A',
  },

  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.signal,
    flexShrink: 0,
  },
  iconText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.paper2,
    width: 16,
    textAlign: 'center',
  },
  iconError: { color: '#FDDDD9' },
  iconDone: { color: '#D6EDD3' },

  texts: { flex: 1, minWidth: 0 },
  mainText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.paper2,
    lineHeight: 16,
  },
  subText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.6,
    color: 'rgba(247,242,231,0.55)',
    marginTop: 2,
  },

  dismissBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(247,242,231,0.3)',
    flexShrink: 0,
  },
  dismissText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: 'rgba(247,242,231,0.7)',
  },
});
