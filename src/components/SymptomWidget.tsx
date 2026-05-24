import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from './Icon';
import { Colors, Fonts } from '../theme/tokens';
import {
  SYMPTOM_KEYS,
  SYMPTOM_CONFIG,
  UNSET_SCORES,
  SymptomKey,
  SymptomScores,
  SymptomEntry,
  symptomScoreColor,
  aggregateDayScore,
} from '../types/symptoms';

// ── Helpers ───────────────────────────────────────────────────

const TONE_COLORS = {
  ok:      Colors.ok,
  mid:     Colors.signal,
  warn:    Colors.warn,
  neutral: Colors.muted2,
};

// ── Single symptom row ────────────────────────────────────────

function SymptomRow({
  symptomKey,
  score,
  readOnly,
  onChange,
}: {
  symptomKey: SymptomKey;
  score: number;
  readOnly: boolean;
  onChange: (s: number) => void;
}) {
  const cfg = SYMPTOM_CONFIG[symptomKey];

  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{cfg.label}</Text>
      <View style={styles.dots}>
        {[0, 1, 2, 3, 4].map((i) => {
          const isSelected = score === i;
          const tone = isSelected ? symptomScoreColor(symptomKey, i) : 'neutral';
          const dotColor = TONE_COLORS[tone];
          return (
            <TouchableOpacity
              key={i}
              onPress={() => !readOnly && onChange(score === i ? -1 : i)}
              activeOpacity={readOnly ? 1 : 0.7}
              style={styles.dotTouch}
            >
              <View
                style={[
                  styles.dot,
                  isSelected
                    ? { backgroundColor: dotColor, borderColor: dotColor }
                    : { backgroundColor: 'transparent', borderColor: Colors.hairline },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.rowHint} numberOfLines={1}>
        {score < 0 ? '—' : score === 0 ? cfg.lowLabel : score === 4 ? cfg.highLabel : ''}
      </Text>
    </View>
  );
}

// ── Summary chip (collapsed state) ───────────────────────────

function SummaryChip({ scores }: { scores: SymptomScores }) {
  const { t } = useTranslation();
  const aggregate = aggregateDayScore(scores);
  if (aggregate === null) return <Text style={styles.summaryEmpty}>{t('symptom.notLogged')}</Text>;

  const tone = aggregate >= 70 ? 'ok' : aggregate >= 45 ? 'mid' : 'warn';
  const color = TONE_COLORS[tone];
  const label = t('symptom.score', { score: aggregate });

  return (
    <View style={[styles.summaryChip, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <View style={[styles.summaryDot, { backgroundColor: color }]} />
      <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ── Widget ────────────────────────────────────────────────────

interface Props {
  entry: SymptomEntry | null;
  date: string;
  readOnly?: boolean;
  onSave: (scores: SymptomScores) => void;
}

export function SymptomWidget({ entry, date, readOnly = false, onSave }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [scores, setScores] = useState<SymptomScores>(
    entry?.scores ?? UNSET_SCORES,
  );

  // Sync if entry changes (e.g. navigating between days)
  React.useEffect(() => {
    setScores(entry?.scores ?? UNSET_SCORES);
    setExpanded(false);
  }, [date]);

  function handleChange(key: SymptomKey, score: number) {
    const next = { ...scores, [key]: score };
    setScores(next);
    onSave(next);
  }

  const filledCount = SYMPTOM_KEYS.filter((k) => scores[k] >= 0).length;

  return (
    <View style={styles.wrapper}>
      {/* Header — always visible */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.75}
      >
        <View style={styles.headerLeft}>
          <Icon name="alert" size={14} color={Colors.muted} />
          <Text style={styles.headerTitle}>{readOnly ? t('symptom.readOnly') : t('symptom.title')}</Text>
          {filledCount > 0 && (
            <Text style={styles.headerCount}>{filledCount}/6</Text>
          )}
        </View>
        <Icon
          name={expanded ? 'close' : 'chevron-right'}
          size={14}
          color={Colors.muted}
        />
      </TouchableOpacity>

      {/* Summary (collapsed) */}
      {!expanded && filledCount > 0 && (
        <View style={styles.summaryRow}>
          <SummaryChip scores={scores} />
        </View>
      )}

      {/* Rows (expanded) */}
      {expanded && (
        <View style={styles.body}>
          {!readOnly && (
            <Text style={styles.instruction}>
              Appuyez sur un point pour noter chaque symptôme (0 = aucun, 4 = intense). Appuyez à nouveau pour effacer.
            </Text>
          )}
          {SYMPTOM_KEYS.map((k) => (
            <SymptomRow
              key={k}
              symptomKey={k}
              score={scores[k]}
              readOnly={readOnly}
              onChange={(s) => handleChange(k, s)}
            />
          ))}
          {readOnly && filledCount === 0 && (
            <Text style={styles.emptyHint}>Aucun symptôme enregistré ce jour.</Text>
          )}
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    backgroundColor: Colors.card,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  headerCount: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 0.5,
    backgroundColor: Colors.hairline2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  summaryRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  summaryDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  summaryLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  summaryEmpty: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted2,
    letterSpacing: 0.3,
  },

  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
    gap: 6,
  },
  instruction: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted2,
    letterSpacing: 0.3,
    lineHeight: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
    gap: 10,
  },
  rowLabel: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.ink2,
    width: 100,
    flexShrink: 0,
  },
  dots: {
    flexDirection: 'row',
    gap: 7,
  },
  dotTouch: {
    padding: 3,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  rowHint: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted2,
    letterSpacing: 0.3,
    textAlign: 'right',
  },

  emptyHint: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted2,
    letterSpacing: 0.3,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
