import { useCallback, useRef } from 'react';
import { Animated, Dimensions, Easing } from 'react-native';

export const { width: SW, height: SH } = Dimensions.get('window');
export const FINGER = 52;
export const FH = FINGER / 2;

export interface DemoEngine {
  overlayA:  Animated.Value;
  fingerX:   Animated.Value;
  fingerY:   Animated.Value;
  fOpacity:  Animated.Value;
  fScale:    Animated.Value;
  ripS:      Animated.Value;
  ripO:      Animated.Value;
  isRunning: React.MutableRefObject<boolean>;
  timersRef: React.MutableRefObject<ReturnType<typeof setTimeout>[]>;
  cursorRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  at:        (t: number, fn: () => void) => void;
  clearAll:  () => void;
  move:      (cx: number, cy: number, dur?: number) => void;
  tap:       () => void;
  showFinger:(cx: number, cy: number) => void;
  hideFinger:(dur?: number) => void;
  fadeIn:    () => void;
}

export function useDemoEngine(): DemoEngine {
  const overlayA = useRef(new Animated.Value(0)).current;
  const fingerX  = useRef(new Animated.Value(SW * 0.85 - FH)).current;
  const fingerY  = useRef(new Animated.Value(SH * 0.75 - FH)).current;
  const fOpacity = useRef(new Animated.Value(0)).current;
  const fScale   = useRef(new Animated.Value(1)).current;
  const ripS     = useRef(new Animated.Value(0)).current;
  const ripO     = useRef(new Animated.Value(0)).current;

  const isRunning = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cursorRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAll = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (cursorRef.current) { clearInterval(cursorRef.current); cursorRef.current = null; }
  }, []);

  const at = useCallback((t: number, fn: () => void) => {
    timersRef.current.push(setTimeout(fn, t));
  }, []);

  const move = useCallback((cx: number, cy: number, dur = 500) => {
    Animated.parallel([
      Animated.timing(fingerX, { toValue: cx - FH, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(fingerY, { toValue: cy - FH, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [fingerX, fingerY]);

  const tap = useCallback(() => {
    ripS.setValue(0);
    ripO.setValue(0.5);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(fScale, { toValue: 0.76, duration: 90,  useNativeDriver: true }),
        Animated.timing(fScale, { toValue: 1.1,  duration: 120, useNativeDriver: true }),
        Animated.timing(fScale, { toValue: 1.0,  duration: 90,  useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(ripS, { toValue: 2.4, duration: 420, useNativeDriver: true }),
        Animated.timing(ripO, { toValue: 0,   duration: 200, useNativeDriver: true }),
      ]),
    ]).start();
  }, [fScale, ripS, ripO]);

  const showFinger = useCallback((cx: number, cy: number) => {
    fingerX.setValue(cx - FH);
    fingerY.setValue(cy - FH);
    fOpacity.setValue(1);
  }, [fingerX, fingerY, fOpacity]);

  const hideFinger = useCallback((dur = 350) => {
    Animated.timing(fOpacity, { toValue: 0, duration: dur, useNativeDriver: true }).start();
  }, [fOpacity]);

  const fadeIn = useCallback(() => {
    Animated.timing(overlayA, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [overlayA]);

  return {
    overlayA, fingerX, fingerY, fOpacity, fScale, ripS, ripO,
    isRunning, timersRef, cursorRef,
    at, clearAll, move, tap, showFinger, hideFinger, fadeIn,
  };
}
