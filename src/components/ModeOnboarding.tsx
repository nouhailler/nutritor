import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppMode } from '../contexts/ModeContext';
import { Colors, Fonts } from '../theme/tokens';

interface ModeOnboardingProps {
  visible: boolean;
  onSelect: (mode: AppMode) => void;
}

export function ModeOnboarding({ visible, onSelect }: ModeOnboardingProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>
        <Text style={styles.title}>{t('mode.onboardingTitle')}</Text>
        <Text style={styles.subtitle}>{t('mode.onboardingSubtitle')}</Text>

        <View style={styles.cards}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => onSelect('beginner')}
            activeOpacity={0.8}
          >
            <Text style={styles.cardTitle}>{t('mode.beginnerCardTitle')}</Text>
            <Text style={styles.cardDesc}>{t('mode.beginnerCardDesc')}</Text>
            <View style={[styles.cardBadge, { backgroundColor: Colors.signal + '18', borderColor: Colors.signal + '40' }]}>
              <Text style={[styles.cardBadgeText, { color: Colors.signal }]}>{t('mode.beginner')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => onSelect('expert')}
            activeOpacity={0.8}
          >
            <Text style={styles.cardTitle}>{t('mode.expertCardTitle')}</Text>
            <Text style={styles.cardDesc}>{t('mode.expertCardDesc')}</Text>
            <View style={[styles.cardBadge, { backgroundColor: Colors.ok + '18', borderColor: Colors.ok + '40' }]}>
              <Text style={[styles.cardBadgeText, { color: Colors.ok }]}>{t('mode.expert')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: Colors.paper,
    zIndex: 100,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    color: Colors.ink,
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 36,
  },
  cards: {
    gap: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.hairline,
    padding: 22,
    gap: 10,
  },
  cardTitle: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  cardDesc: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.muted,
    lineHeight: 20,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  cardBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
