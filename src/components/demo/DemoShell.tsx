import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Colors, Fonts } from '../../theme/tokens';
import { DemoEngine, FINGER, FH } from './useDemoEngine';

interface Props {
  visible:      boolean;
  onClose:      () => void;
  engine:       DemoEngine;
  phases:       readonly string[];
  currentPhase: string;
  caption?:     string;
  children:     React.ReactNode;
}

export function DemoShell({ visible, onClose, engine, phases, currentPhase, caption, children }: Props) {
  const { overlayA, fingerX, fingerY, fOpacity, fScale, ripS, ripO, isRunning, clearAll } = engine;

  const captionA       = useRef(new Animated.Value(0)).current;
  const prevCaptionRef = useRef('');

  useEffect(() => {
    if (!caption) {
      Animated.timing(captionA, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      prevCaptionRef.current = '';
    } else {
      const wasEmpty = !prevCaptionRef.current;
      prevCaptionRef.current = caption;
      if (wasEmpty) {
        Animated.timing(captionA, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      } else {
        Animated.sequence([
          Animated.timing(captionA, { toValue: 0, duration: 100, useNativeDriver: true }),
          Animated.timing(captionA, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start();
      }
    }
  }, [caption]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    isRunning.current = false;
    clearAll();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View style={[s.root, { opacity: overlayA }]}>

          {children}

          {/* Curseur doigt */}
          <Animated.View
            style={[s.finger, {
              opacity: fOpacity,
              transform: [{ translateX: fingerX }, { translateY: fingerY }, { scale: fScale }],
            }]}
            pointerEvents="none"
          >
            <Animated.View style={[s.ripple, { transform: [{ scale: ripS }], opacity: ripO }]} />
            <View style={s.dot} />
          </Animated.View>

          {/* Légende */}
          <Animated.View style={[s.caption, { opacity: captionA }]} pointerEvents="none">
            <Text style={s.captionTxt}>{caption ?? ''}</Text>
          </Animated.View>

          {/* Étapes */}
          <View style={s.steps} pointerEvents="none">
            {phases.map(p => (
              <View key={p} style={[s.step, currentPhase === p && s.stepOn]} />
            ))}
          </View>

          {/* Indication fermeture */}
          <View style={s.closeHint} pointerEvents="none">
            <Text style={s.closeHintTxt}>Toucher l'écran pour fermer</Text>
          </View>

        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.paper,
  },

  finger: {
    position: 'absolute',
    top: 0, left: 0,
    width: FINGER, height: FINGER,
    justifyContent: 'center', alignItems: 'center',
  },
  ripple: {
    position: 'absolute',
    width: FINGER, height: FINGER,
    borderRadius: FH,
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
  dot: {
    width: FINGER, height: FINGER,
    borderRadius: FH,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },

  caption: {
    position: 'absolute',
    bottom: 76,
    left: 28,
    right: 28,
    backgroundColor: 'rgba(15,12,8,0.76)',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  captionTxt: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.paper2,
    textAlign: 'center',
    lineHeight: 17,
  },

  steps: {
    position: 'absolute',
    bottom: 44,
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  step:   { width: 6,  height: 6, borderRadius: 3, backgroundColor: Colors.hairline },
  stepOn: { width: 20, height: 6, borderRadius: 3, backgroundColor: Colors.ink },

  closeHint: {
    position: 'absolute',
    bottom: 18,
    left: 0, right: 0,
    alignItems: 'center',
  },
  closeHintTxt: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted2 },
});
