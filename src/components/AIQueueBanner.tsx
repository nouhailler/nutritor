import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AIJobSnapshot } from '../services/aiQueue';
import { Colors, Fonts } from '../theme/tokens';

const SNOOZE_MS = 10_000;

interface Props {
  jobs: AIJobSnapshot[];
  hasTabBar: boolean;
  onDismiss: () => void;
  onCancelRunning: () => void;
  onViewResult?: () => void;
  doneSubText?: string;
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

export function AIQueueBanner({ jobs, hasTabBar, onDismiss, onCancelRunning, onViewResult, doneSubText }: Props) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(200)).current;
  const [snoozed, setSnoozed] = useState(false);
  const snoozeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const hasJobs = jobs.length > 0;
  const effectiveVisible = hasJobs && !snoozed;

  // Elapsed-seconds counter — resets whenever the running job changes
  const runningJobId = jobs.find((j) => j.status === 'running')?.id ?? null;
  useEffect(() => {
    setElapsedSeconds(0);
    if (!runningJobId) return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [runningJobId]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: effectiveVisible ? 0 : 200,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [effectiveVisible]);

  // Clear snooze when jobs are gone
  useEffect(() => {
    if (!hasJobs) {
      if (snoozeTimer.current) {
        clearTimeout(snoozeTimer.current);
        snoozeTimer.current = null;
      }
      setSnoozed(false);
    }
  }, [hasJobs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (snoozeTimer.current) clearTimeout(snoozeTimer.current);
    };
  }, []);

  if (!hasJobs) return null;

  const handleTap = () => {
    if (allFinished) {
      onDismiss();
      return;
    }
    if (snoozeTimer.current) clearTimeout(snoozeTimer.current);
    setSnoozed(true);
    snoozeTimer.current = setTimeout(() => {
      setSnoozed(false);
      snoozeTimer.current = null;
    }, SNOOZE_MS);
  };

  const running = jobs.find((j) => j.status === 'running');
  const pending = jobs.filter((j) => j.status === 'pending');
  const errors  = jobs.filter((j) => j.status === 'error');
  const done    = jobs.filter((j) => j.status === 'done');
  const allFinished = jobs.every((j) => j.status === 'done' || j.status === 'error');

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
    subText = `IA en cours  ·  ${elapsedSeconds}s${extra}`;
  } else if (errors.length > 0 && done.length === 0) {
    icon = '!';
    mainText = errors[0].label;
    subText = errors[0].error ?? 'Erreur';
    isError = true;
  } else if (allFinished) {
    icon = '✓';
    const n = done.length;
    mainText = n === 1 ? done[0].label : `${n} tâches terminées`;
    subText = doneSubText
      ?? (errors.length > 0 ? `${errors.length} erreur${errors.length > 1 ? 's' : ''}` : '');
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
      {/* Main content — tap to snooze 10 s */}
      <TouchableOpacity style={styles.left} onPress={handleTap} activeOpacity={0.75}>
        {running ? <PulseDot /> : (
          <Text style={[styles.iconText, isError && styles.iconError, allFinished && !isError && styles.iconDone]}>
            {icon}
          </Text>
        )}
        <View style={styles.texts}>
          <Text style={styles.mainText} numberOfLines={1}>{mainText}</Text>
          {subText ? (
            <Text style={styles.subText} numberOfLines={1}>{subText}</Text>
          ) : null}
        </View>
      </TouchableOpacity>

      {/* Cancel button while running */}
      {!allFinished && running && (
        <TouchableOpacity onPress={onCancelRunning} style={styles.cancelBtn} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
      )}

      {/* Actions when all done */}
      {allFinished && (
        <View style={styles.actions}>
          {onViewResult && (
            <TouchableOpacity
              onPress={() => { onViewResult(); onDismiss(); }}
              style={styles.viewBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.viewBtnText}>Voir</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn} activeOpacity={0.7}>
            <Text style={styles.dismissText}>Fermer</Text>
          </TouchableOpacity>
        </View>
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
  bannerError: { backgroundColor: '#8B3A2E' },
  bannerDone:  { backgroundColor: '#3F5A3A' },

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
  iconDone:  { color: '#D6EDD3' },

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

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  viewBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: 'rgba(247,242,231,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(247,242,231,0.55)',
  },
  viewBtnText: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.paper2,
  },
  dismissBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(247,242,231,0.25)',
    flexShrink: 0,
  },
  dismissText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: 'rgba(247,242,231,0.5)',
  },
  cancelBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(247,242,231,0.4)',
    flexShrink: 0,
  },
  cancelText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: 'rgba(247,242,231,0.7)',
  },
});
