import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Fonts } from '../theme/tokens';
import {
  NutriScoreResult,
  NutriGrade,
  GRADE_COLORS,
  GRADE_BG,
} from '../utils/nutriScorePerso';
import { Icon } from './Icon';

// ── Badge compact ─────────────────────────────────────────────

interface BadgeProps {
  result: NutriScoreResult;
  size?: 'sm' | 'md';
}

export function NutriScoreBadge({ result, size = 'md' }: BadgeProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const color = GRADE_COLORS[result.grade];
  const bg = GRADE_BG[result.grade];
  const dim = size === 'sm' ? 34 : 44;
  const fontSize = size === 'sm' ? 11 : 14;
  const gradeFontSize = size === 'sm' ? 14 : 18;

  return (
    <>
      <TouchableOpacity
        style={[styles.badge, { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: bg, borderColor: color }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.75}
      >
        <Text style={[styles.score, { fontSize, color }]}>{result.score}</Text>
        <Text style={[styles.grade, { fontSize: gradeFontSize, color }]}>{result.grade}</Text>
      </TouchableOpacity>
      <NutriScoreModal visible={modalVisible} result={result} onClose={() => setModalVisible(false)} />
    </>
  );
}

// ── Modal explicatif ──────────────────────────────────────────

interface ModalProps {
  visible: boolean;
  result: NutriScoreResult;
  onClose: () => void;
}

function NutriScoreModal({ visible, result, onClose }: ModalProps) {
  const color = GRADE_COLORS[result.grade];
  const bg = GRADE_BG[result.grade];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={[styles.gradeBig, { backgroundColor: bg, borderColor: color }]}>
              <Text style={[styles.gradeBigText, { color }]}>{result.grade}</Text>
              <Text style={[styles.scoreBig, { color }]}>{result.score}/100</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.sheetTitle}>Score Nutri Perso</Text>
              <Text style={styles.sheetExplanation}>{result.explanation}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Icon name="x" size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Blockers */}
            {result.blockers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Points de vigilance</Text>
                {result.blockers.map((b, i) => (
                  <View key={i} style={styles.listRow}>
                    <Icon name="alert-circle" size={14} color={Colors.warn} />
                    <Text style={styles.listText}>{b}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Positives */}
            {result.positives.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Points positifs</Text>
                {result.positives.map((p, i) => (
                  <View key={i} style={styles.listRow}>
                    <Icon name="check-circle" size={14} color={Colors.ok} />
                    <Text style={styles.listText}>{p}</Text>
                  </View>
                ))}
              </View>
            )}

            {result.blockers.length === 0 && result.positives.length === 0 && (
              <Text style={styles.emptyText}>Aucune donnée de profil disponible pour affiner le score.</Text>
            )}

            <Text style={styles.disclaimer}>Score calculé selon votre profil — distinct du Nutri-Score officiel.</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Grade label mapping ───────────────────────────────────────

export const GRADE_LABELS: Record<NutriGrade, string> = {
  A: 'Excellent',
  B: 'Bon',
  C: 'Modéré',
  D: 'À limiter',
  E: 'Déconseillé',
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontFamily: Fonts.sansMedium,
    lineHeight: 13,
  },
  grade: {
    fontFamily: Fonts.sansMedium,
    lineHeight: 18,
    marginTop: -2,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 20,
    maxHeight: '75%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 20,
  },
  gradeBig: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeBigText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 28,
    lineHeight: 30,
  },
  scoreBig: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 13,
  },
  headerText: {
    flex: 1,
    paddingTop: 4,
  },
  sheetTitle: {
    fontFamily: Fonts.sansMedium,
    fontSize: 16,
    color: Colors.ink,
  },
  sheetExplanation: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink2,
    marginTop: 4,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  listText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink,
    flex: 1,
  },
  emptyText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    marginVertical: 16,
  },
  disclaimer: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.muted2,
    textAlign: 'center',
    marginTop: 12,
  },
});
