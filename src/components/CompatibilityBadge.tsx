import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  CompatibilityResult,
  CompatLevel,
  CompatReason,
  COMPAT_BG,
  COMPAT_BORDER,
  COMPAT_COLORS,
  COMPAT_LABELS,
} from '../data/compatibilityScore';
import { Colors, Fonts } from '../theme/tokens';

// ── Severity helpers ──────────────────────────────────────────

function severityIcon(severity: CompatReason['severity']): string {
  if (severity === 'critical') return '✕';
  if (severity === 'high') return '⚠';
  if (severity === 'medium') return '▲';
  return '·';
}

function severityColor(severity: CompatReason['severity']): string {
  if (severity === 'critical') return '#8B3A2E';
  if (severity === 'high') return '#8B3A2E';
  if (severity === 'medium') return '#6B5A2E';
  return Colors.muted;
}

// ── Compact badge (search list) — expandable ─────────────────

export function CompatBadge({ result }: { result: CompatibilityResult }) {
  const [expanded, setExpanded] = useState(false);
  const color = COMPAT_COLORS[result.level];
  const bg = COMPAT_BG[result.level];
  const border = COMPAT_BORDER[result.level];
  const label = COMPAT_LABELS[result.level];

  const showPositives = result.level === 'compatible' && result.positives.length > 0;
  const showReasons   = result.level !== 'compatible' && result.reasons.length > 0;
  const hasDetails    = showPositives || showReasons || result.positives.length > 0;

  return (
    <View style={styles.badgeWrap}>
      <TouchableOpacity
        onPress={() => hasDetails && setExpanded((e) => !e)}
        activeOpacity={hasDetails ? 0.7 : 1}
      >
        <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.badgeLabel, { color }]} numberOfLines={1}>{label} · {result.score}%</Text>
          {!expanded && result.level !== 'compatible' && result.reasons.length > 0 && (
            <Text style={[styles.badgeHint, { color }]} numberOfLines={1}>
              · {result.reasons[0].label}
            </Text>
          )}
          {hasDetails && (
            <Text style={[styles.badgeChevron, { color }]}>{expanded ? '▲' : '▼'}</Text>
          )}
        </View>
      </TouchableOpacity>

      {expanded && hasDetails && (
        <View style={[styles.expandPanel, { borderColor: border }]}>
          {/* "Pourquoi compatible?" — positives */}
          {result.positives.map((p, i) => (
            <View key={`p-${i}`} style={styles.expandRow}>
              <Text style={[styles.expandIcon, { color: COMPAT_COLORS.compatible }]}>✓</Text>
              <View style={styles.expandText}>
                <Text style={[styles.expandLabel, { color: COMPAT_COLORS.compatible }]}>{p.label}</Text>
                {p.detail ? <Text style={styles.expandDetail}>{p.detail}</Text> : null}
              </View>
            </View>
          ))}
          {/* Risk reasons for non-compatible */}
          {result.level !== 'compatible' && result.reasons.map((r, i) => (
            <View key={`r-${i}`} style={styles.expandRow}>
              <Text style={[styles.expandIcon, { color: severityColor(r.severity) }]}>
                {severityIcon(r.severity)}
              </Text>
              <View style={styles.expandText}>
                <Text style={[styles.expandLabel, { color: severityColor(r.severity) }]}>{r.label}</Text>
                {r.detail ? <Text style={styles.expandDetail}>{r.detail}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Full card (detail screen) ─────────────────────────────────

export function CompatCard({ result }: { result: CompatibilityResult }) {
  const { t } = useTranslation();
  const color = COMPAT_COLORS[result.level];
  const label = COMPAT_LABELS[result.level];
  const pct = result.score;

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={styles.scoreBlock}>
          <Text style={styles.cardEyebrow}>{t('compat.personalizedCompatibility')}</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreNum, { color }]}>{pct}</Text>
            <Text style={styles.scoreOf}>/100</Text>
          </View>
          <View style={[styles.levelPill, { backgroundColor: COMPAT_BG[result.level], borderColor: COMPAT_BORDER[result.level] }]}>
            <View style={[styles.levelDot, { backgroundColor: color }]} />
            <Text style={[styles.levelLabel, { color }]}>{label}</Text>
          </View>
        </View>

        {/* Gauge */}
        <View style={styles.gaugeWrap}>
          <View style={styles.gaugeTrack}>
            <View style={[styles.gaugeFill, { width: `${pct}%`, backgroundColor: color }]} />
          </View>
          {/* Tick marks */}
          <View style={styles.gaugeTicks}>
            {[0, 50, 80, 100].map((t) => (
              <View
                key={t}
                style={[
                  styles.gaugeTick,
                  { left: `${t}%` as any },
                  t === pct && styles.gaugeTickActive,
                ]}
              />
            ))}
          </View>
          <View style={styles.gaugeLabels}>
            <Text style={styles.gaugeMin}>0</Text>
            <Text style={[styles.gaugeMid, { color: COMPAT_COLORS.avoid }]}>50</Text>
            <Text style={[styles.gaugeMid, { color: COMPAT_COLORS.moderate, marginLeft: 'auto' as any }]}>80</Text>
            <Text style={styles.gaugeMax}>100</Text>
          </View>
        </View>
      </View>

      {/* Reasons */}
      {result.reasons.length > 0 && (
        <View style={styles.reasonsBlock}>
          <Text style={styles.blockTitle}>{t('compat.riskFactors')}</Text>
          {result.reasons.map((r, i) => {
            const rColor = severityColor(r.severity);
            const icon = severityIcon(r.severity);
            return (
              <View key={i} style={styles.reasonRow}>
                <Text style={[styles.reasonIcon, { color: rColor }]}>{icon}</Text>
                <View style={styles.reasonText}>
                  <Text style={[styles.reasonLabel, { color: rColor }]}>{r.label}</Text>
                  <Text style={styles.reasonDetail}>{r.detail}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Positives */}
      {result.positives.length > 0 && (
        <View style={styles.posBlock}>
          <Text style={styles.blockTitle}>{t('compat.positivePoints')}</Text>
          {result.positives.map((p, i) => (
            <View key={i} style={styles.posRow}>
              <Text style={styles.posIcon}>✓</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.posLabel}>{p.label}</Text>
                {p.detail ? <Text style={styles.posDetail}>{p.detail}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Footer disclaimer */}
      <Text style={styles.disclaimer}>{t('compat.disclaimer')}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Compact badge
  badgeWrap: { marginTop: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 10,
    flexShrink: 1,
    maxWidth: '100%',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  badgeLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  badgeHint: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  badgeChevron: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    flexShrink: 0,
  },
  expandPanel: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 0,
    backgroundColor: Colors.paper2,
  },
  expandRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  expandIcon: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    width: 14,
    textAlign: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  expandText: { flex: 1, gap: 1 },
  expandLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    lineHeight: 14,
  },
  expandDetail: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 0.2,
  },

  // Full card
  card: {
    marginHorizontal: 24,
    marginBottom: 4,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    borderRadius: 20,
    padding: 18,
    gap: 16,
  },
  cardHeader: {
    gap: 14,
  },
  scoreBlock: {
    gap: 4,
  },
  cardEyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  scoreNum: {
    fontFamily: Fonts.serif,
    fontSize: 42,
    lineHeight: 44,
    letterSpacing: -1,
  },
  scoreOf: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: Colors.muted,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 2,
  },
  levelDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  levelLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 0.1,
  },

  // Gauge
  gaugeWrap: { gap: 4 },
  gaugeTrack: {
    height: 8,
    backgroundColor: Colors.hairline,
    borderRadius: 4,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 4,
  },
  gaugeTicks: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    flexDirection: 'row',
  },
  gaugeTick: {
    position: 'absolute',
    width: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  gaugeTickActive: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  gaugeLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  gaugeMin: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted2,
  },
  gaugeMid: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    marginLeft: 'auto' as any,
  },
  gaugeMax: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted2,
    marginLeft: 'auto' as any,
  },

  // Separator
  sep: {
    height: 1,
    backgroundColor: Colors.hairline2,
  },

  // Block titles
  blockTitle: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 8,
  },

  // Reasons
  reasonsBlock: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
    paddingTop: 12,
    gap: 0,
  },
  reasonRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  reasonIcon: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    width: 16,
    textAlign: 'center',
    marginTop: 1,
  },
  reasonText: { flex: 1, gap: 2 },
  reasonLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 16,
  },
  reasonDetail: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.muted,
    lineHeight: 15,
  },

  // Positives
  posBlock: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
    paddingTop: 12,
  },
  posRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6,
  },
  posIcon: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: '#3F5A3A',
    width: 16,
    textAlign: 'center',
  },
  posLabel: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink2,
    flex: 1,
  },
  posDetail: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 0.2,
    marginTop: 1,
  },

  // Disclaimer
  disclaimer: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted2,
    letterSpacing: 0.3,
    lineHeight: 13,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
    paddingTop: 10,
  },
});
