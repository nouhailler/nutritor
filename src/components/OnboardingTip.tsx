import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts } from '../theme/tokens';
import { Icon } from './Icon';

// ── Hook ─────────────────────────────────────────────────────

export function useOnboardingTip(key: string) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key).then((val) => {
      if (!val) setVisible(true);
    });
  }, [key]);

  const dismiss = () => {
    setVisible(false);
    AsyncStorage.setItem(key, '1').catch(() => null);
  };

  return { visible, dismiss };
}

// ── Component ─────────────────────────────────────────────────

interface OnboardingTipProps {
  tipKey: string;
  title: string;
  message: string;
  /** Délai avant affichage en ms (défaut 800) */
  delay?: number;
}

export function OnboardingTip({ tipKey, title, message, delay = 800 }: OnboardingTipProps) {
  const { visible, dismiss } = useOnboardingTip(tipKey);
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 60,
            friction: 10,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
        ]).start();
      }, delay);
      return () => clearTimeout(timer);
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -120,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setRendered(false));
    }
  }, [visible]);

  if (!rendered) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.card}>
        <View style={styles.accent} />
        <View style={styles.body}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Icon name="info" size={13} color={Colors.ok} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={dismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close" size={16} color={Colors.muted2} />
            </TouchableOpacity>
          </View>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity onPress={dismiss} activeOpacity={0.7}>
            <Text style={styles.gotIt}>Compris ✓</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.paper,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.ok + '40',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  accent: {
    width: 4,
    backgroundColor: Colors.ok,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  body: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.ok + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.ink,
    letterSpacing: -0.1,
  },
  message: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.muted,
    lineHeight: 18,
  },
  gotIt: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.5,
    color: Colors.ok,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
