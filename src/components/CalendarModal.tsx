import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { Colors, Fonts } from '../theme/tokens';

// ── Types ─────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  selectedDate: string | null;   // 'YYYY-MM-DD' or null (= today)
  markedDates: string[];          // dates that have data
  todayStr: string;               // 'YYYY-MM-DD'
  onSelect: (date: string) => void;
  onClose: () => void;
}

// ── Constants ─────────────────────────────────────────────────

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_HEADERS_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DAY_HEADERS_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// ── Calendar Modal ────────────────────────────────────────────

export function CalendarModal({ visible, selectedDate, markedDates, todayStr, onSelect, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [monthOffset, setMonthOffset] = useState(0);

  // Reset to current month each time the modal opens
  useEffect(() => {
    if (visible) setMonthOffset(0);
  }, [visible]);

  // Derive displayed month/year
  const now = new Date(todayStr + 'T12:00:00');
  const base = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = base.getFullYear();
  const month = base.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Monday-based first weekday offset (0=Mon … 6=Sun)
  const rawFirstDay = new Date(year, month, 1).getDay();
  const startOffset = rawFirstDay === 0 ? 6 : rawFirstDay - 1;

  // Build flat cells array: null = empty padding, number = day
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const toDateStr = (day: number): string =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.sheet, { paddingTop: Math.max(insets.top, 16) }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Month navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => setMonthOffset((o) => o - 1)} activeOpacity={0.7}>
            <Icon name="back" size={18} color={Colors.ink} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{(i18n.language === 'en' ? MONTHS_EN : MONTHS_FR)[month]} {year}</Text>
          <TouchableOpacity style={styles.navBtn} onPress={() => setMonthOffset((o) => o + 1)} activeOpacity={0.7}>
            <Icon name="chevron-right" size={18} color={Colors.ink} />
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={styles.dayHeaders}>
          {(i18n.language === 'en' ? DAY_HEADERS_EN : DAY_HEADERS_FR).map((d, i) => (
            <Text key={i} style={styles.dayHeader}>{d}</Text>
          ))}
        </View>

        {/* Separator */}
        <View style={styles.sep} />

        {/* Day grid */}
        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (day === null) {
              return <View key={i} style={styles.cell} />;
            }
            const dateStr = toDateStr(day);
            const isToday    = dateStr === todayStr;
            const isSelected = dateStr === (selectedDate ?? todayStr);
            const hasData    = markedDates.includes(dateStr);
            const isFuture   = dateStr > todayStr;

            return (
              <TouchableOpacity
                key={i}
                style={styles.cell}
                onPress={() => { onSelect(dateStr); onClose(); }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isToday && styles.dayCircleToday,
                    isSelected && !isToday && styles.dayCircleSel,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      isToday && styles.dayNumToday,
                      isSelected && !isToday && styles.dayNumSel,
                      isFuture && !isSelected && !isToday && styles.dayNumFuture,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                {/* Data dot */}
                {hasData && (
                  <View style={[styles.dot, isToday && styles.dotToday]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity
            style={styles.todayBtn}
            onPress={() => { onSelect(todayStr); onClose(); }}
            activeOpacity={0.8}
          >
            <Icon name="home" size={14} color={Colors.ink} />
            <Text style={styles.todayBtnText}>{t('calendar.today')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>{t('calendar.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────

const CELL_SIZE = 42;

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: Colors.paper,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.hairline,
    alignSelf: 'center',
    marginBottom: 20,
  },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    letterSpacing: -0.4,
    color: Colors.ink,
  },

  dayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  sep: {
    height: 1,
    backgroundColor: Colors.hairline2,
    marginBottom: 8,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 2,
  },
  cell: {
    width: `${100 / 7}%`,
    height: CELL_SIZE + 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    gap: 3,
  },
  dayCircle: {
    width: CELL_SIZE - 6,
    height: CELL_SIZE - 6,
    borderRadius: (CELL_SIZE - 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    backgroundColor: Colors.ink,
  },
  dayCircleSel: {
    borderWidth: 1.5,
    borderColor: Colors.ink,
  },
  dayNum: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink,
  },
  dayNumToday: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.paper2,
  },
  dayNumSel: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.ink,
  },
  dayNumFuture: {
    color: Colors.muted2,
  },

  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.signal,
  },
  dotToday: {
    backgroundColor: Colors.paper2,
  },

  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 16,
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  todayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 100,
  },
  todayBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.ink,
  },
  closeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: Colors.ink,
    borderRadius: 100,
  },
  closeBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.paper2,
  },
});
