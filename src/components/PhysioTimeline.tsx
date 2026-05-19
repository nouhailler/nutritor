import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from './Icon';
import { Colors, Fonts } from '../theme/tokens';
import { AutoTimelineEvent, UserTimelineEvent, TimelineEvent, QUICK_SYMPTOMS, QuickSymptomKey } from '../types/timeline';

// ── Helpers ────────────────────────────────────────────────────

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function nowHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// ── Severity dots ──────────────────────────────────────────────

function SeverityDots({ value, onPress }: { value: number; onPress?: (v: number) => void }) {
  return (
    <View style={s.severityRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          style={[s.severityDot, n <= value && s.severityDotFilled]}
          onPress={onPress ? () => onPress(n) : undefined}
          activeOpacity={onPress ? 0.7 : 1}
          disabled={!onPress}
        />
      ))}
    </View>
  );
}

// ── Quick-add modal ────────────────────────────────────────────

const SYMPTOM_KEYS = Object.keys(QUICK_SYMPTOMS) as QuickSymptomKey[];

function QuickAddModal({
  visible,
  date,
  onAdd,
  onClose,
}: {
  visible: boolean;
  date: string;
  onAdd: (event: Omit<UserTimelineEvent, 'id' | 'kind'>) => void;
  onClose: () => void;
}) {
  const [time, setTime] = useState(nowHHMM);
  const [symptom, setSymptom] = useState<QuickSymptomKey>('bloating');
  const [severity, setSeverity] = useState(3);
  const [note, setNote] = useState('');

  const handleOpen = () => {
    setTime(nowHHMM());
    setNote('');
    setSeverity(3);
  };

  const handleAdd = () => {
    const t = time.trim().match(/^\d{1,2}:\d{2}$/) ? time.trim() : nowHHMM();
    onAdd({ date, time: t, symptom, severity, note: note.trim() || undefined });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onShow={handleOpen}
      onRequestClose={onClose}
    >
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Ajouter un ressenti</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Icon name="close" size={18} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Time input */}
          <Text style={s.modalLabel}>Heure</Text>
          <TextInput
            style={s.timeInput}
            value={time}
            onChangeText={setTime}
            placeholder="HH:MM"
            placeholderTextColor={Colors.muted2}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />

          {/* Symptom chips */}
          <Text style={s.modalLabel}>Type</Text>
          <View style={s.chipGrid}>
            {SYMPTOM_KEYS.map((key) => {
              const sym = QUICK_SYMPTOMS[key];
              const active = symptom === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() => setSymptom(key)}
                  activeOpacity={0.7}
                >
                  <Text style={s.chipEmoji}>{sym.emoji}</Text>
                  <Text style={[s.chipLabel, active && s.chipLabelActive]}>{sym.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Severity */}
          <Text style={s.modalLabel}>Intensité</Text>
          <View style={s.severityPicker}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                style={[s.severityBtn, n === severity && s.severityBtnActive]}
                onPress={() => setSeverity(n)}
                activeOpacity={0.7}
              >
                <Text style={[s.severityBtnText, n === severity && s.severityBtnTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Note */}
          <TextInput
            style={s.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Note courte (optionnel)…"
            placeholderTextColor={Colors.muted2}
            maxLength={120}
          />

          {/* Actions */}
          <View style={s.modalActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={s.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.addBtn} onPress={handleAdd} activeOpacity={0.8}>
              <Text style={s.addBtnText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Timeline row ───────────────────────────────────────────────

function AutoRow({ event }: { event: AutoTimelineEvent }) {
  const isMeal = event.type === 'meal';
  return (
    <View style={s.row}>
      <View style={s.timeCol}>
        <Text style={s.timeText}>{event.time}</Text>
      </View>
      <View style={s.lineCol}>
        <View style={[s.dot, isMeal ? s.dotMeal : s.dotAuto]} />
      </View>
      <View style={s.labelCol}>
        <Text style={s.autoEmoji}>{event.emoji}</Text>
        <Text style={[s.autoLabel, isMeal && s.autoLabelMeal]}>{event.label}</Text>
      </View>
    </View>
  );
}

function UserRow({
  event,
  onDelete,
}: {
  event: UserTimelineEvent;
  onDelete?: () => void;
}) {
  const sym = QUICK_SYMPTOMS[event.symptom];
  return (
    <View style={s.row}>
      <View style={s.timeCol}>
        <Text style={[s.timeText, s.timeTextUser]}>{event.time}</Text>
      </View>
      <View style={s.lineCol}>
        <View style={s.dotUser} />
      </View>
      <View style={[s.labelCol, s.userLabelCol]}>
        <View style={s.userBadge}>
          <Text style={s.userBadgeEmoji}>{sym.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.userLabelText}>{sym.label}</Text>
            {event.note ? <Text style={s.userNote}>{event.note}</Text> : null}
          </View>
          <SeverityDots value={event.severity} />
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={s.deleteBtn} activeOpacity={0.7}>
              <Icon name="close" size={10} color={Colors.muted2} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

function NowMarker() {
  return (
    <View style={s.nowRow}>
      <View style={s.timeCol}>
        <Text style={s.nowTimeText}>{nowHHMM()}</Text>
      </View>
      <View style={s.lineCol}>
        <View style={s.nowDot} />
      </View>
      <View style={s.labelCol}>
        <View style={s.nowLine} />
        <Text style={s.nowLabel}>Maintenant</Text>
      </View>
    </View>
  );
}

// ── Connecting line between rows ───────────────────────────────

function ConnectorLine() {
  return (
    <View style={s.connectorRow}>
      <View style={s.timeCol} />
      <View style={s.lineCol}>
        <View style={s.connector} />
      </View>
      <View style={s.labelCol} />
    </View>
  );
}

// ── Main component ─────────────────────────────────────────────

interface PhysioTimelineProps {
  autoEvents: AutoTimelineEvent[];
  userEvents: UserTimelineEvent[];
  date: string;
  isToday: boolean;
  onAddEvent: (event: Omit<UserTimelineEvent, 'id' | 'kind'>) => void;
  onDeleteEvent: (id: string) => void;
}

export function PhysioTimeline({
  autoEvents,
  userEvents,
  date,
  isToday,
  onAddEvent,
  onDeleteEvent,
}: PhysioTimelineProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const nowMinutes = useMemo(() => {
    if (!isToday) return -1;
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, [isToday]);

  const combined: Array<AutoTimelineEvent | UserTimelineEvent | { kind: 'now'; time: string }> =
    useMemo(() => {
      const all: Array<AutoTimelineEvent | UserTimelineEvent | { kind: 'now'; time: string }> = [
        ...autoEvents,
        ...userEvents,
      ];
      if (isToday) {
        all.push({ kind: 'now', time: nowHHMM() });
      }
      all.sort((a, b) => parseTime(a.time) - parseTime(b.time));
      return all;
    }, [autoEvents, userEvents, isToday]);

  if (combined.length === 0 && !isToday) return null;

  return (
    <View style={s.container}>
      {combined.map((event, idx) => {
        const isLast = idx === combined.length - 1;
        let row: React.ReactNode;
        if (event.kind === 'now') {
          row = <NowMarker key="now" />;
        } else if (event.kind === 'auto') {
          row = <AutoRow key={`auto-${event.time}-${event.type}`} event={event as AutoTimelineEvent} />;
        } else {
          const ue = event as UserTimelineEvent;
          row = (
            <UserRow
              key={ue.id}
              event={ue}
              onDelete={isToday ? () => onDeleteEvent(ue.id) : undefined}
            />
          );
        }

        return (
          <React.Fragment key={idx}>
            {row}
            {!isLast && <ConnectorLine />}
          </React.Fragment>
        );
      })}

      {/* Empty state for today with no auto events */}
      {combined.length === 0 && isToday && (
        <View style={s.emptyState}>
          <Text style={s.emptyText}>Ajoutez des aliments pour voir la timeline physiologique</Text>
        </View>
      )}

      {/* Add button (today only) */}
      {isToday && (
        <TouchableOpacity
          style={s.addEventBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={12} color={Colors.ink} />
          <Text style={s.addEventBtnText}>Ajouter un ressenti</Text>
        </TouchableOpacity>
      )}

      <QuickAddModal
        visible={modalVisible}
        date={date}
        onAdd={onAddEvent}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const DOT_SIZE = 10;
const LINE_COLOR = Colors.hairline;
const TIME_COL_W = 48;
const LINE_COL_W = 22;

const s = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 4 },

  // Row layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
  },
  connectorRow: {
    flexDirection: 'row',
    height: 16,
  },
  timeCol: {
    width: TIME_COL_W,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  lineCol: {
    width: LINE_COL_W,
    alignItems: 'center',
  },
  labelCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },

  // Connector line
  connector: {
    width: 1.5,
    flex: 1,
    backgroundColor: LINE_COLOR,
  },

  // Time text
  timeText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted2,
    letterSpacing: 0.3,
  },
  timeTextUser: {
    color: Colors.muted,
    fontFamily: Fonts.monoMedium,
  },

  // Auto dots
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  dotMeal: {
    backgroundColor: Colors.ink,
  },
  dotAuto: {
    backgroundColor: Colors.hairline,
    borderWidth: 1.5,
    borderColor: Colors.muted2,
  },

  // Auto labels
  autoEmoji: {
    fontSize: 13,
  },
  autoLabel: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    letterSpacing: -0.1,
    flex: 1,
  },
  autoLabelMeal: {
    color: Colors.ink,
    fontFamily: Fonts.sansMedium,
  },

  // User event
  dotUser: {
    width: DOT_SIZE + 2,
    height: DOT_SIZE + 2,
    borderRadius: (DOT_SIZE + 2) / 2,
    backgroundColor: Colors.ok,
  },
  userLabelCol: {
    paddingVertical: 2,
  },
  userBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  userBadgeEmoji: {
    fontSize: 15,
  },
  userLabelText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.ink,
    letterSpacing: -0.1,
  },
  userNote: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.muted,
    marginTop: 1,
  },
  deleteBtn: {
    padding: 4,
  },

  // Severity dots (display)
  severityRow: {
    flexDirection: 'row',
    gap: 3,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.hairline,
    borderWidth: 1,
    borderColor: Colors.muted2,
  },
  severityDotFilled: {
    backgroundColor: Colors.ok,
    borderColor: Colors.ok,
  },

  // Now marker
  nowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 20,
  },
  nowTimeText: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    color: Colors.signal,
    letterSpacing: 0.3,
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.signal,
  },
  nowLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.signal,
    opacity: 0.4,
  },
  nowLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.signal,
    position: 'absolute',
    right: 0,
  },

  // Empty state
  emptyState: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted2,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Add event button
  addEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
    marginLeft: TIME_COL_W + LINE_COL_W,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
  },
  addEventBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.ink,
    letterSpacing: -0.1,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  modalLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: -6,
  },

  // Time input
  timeInput: {
    fontFamily: Fonts.monoMedium,
    fontSize: 20,
    color: Colors.ink,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.hairline,
    paddingVertical: 4,
    letterSpacing: 2,
    width: 80,
  },

  // Symptom chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
  },
  chipActive: {
    borderColor: Colors.ink,
    backgroundColor: Colors.ink,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.muted,
  },
  chipLabelActive: {
    color: Colors.paper,
  },

  // Severity picker
  severityPicker: {
    flexDirection: 'row',
    gap: 10,
  },
  severityBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
  },
  severityBtnActive: {
    borderColor: Colors.ink,
    backgroundColor: Colors.ink,
  },
  severityBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.muted,
  },
  severityBtnTextActive: {
    color: Colors.paper,
  },

  // Note input
  noteInput: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.card,
  },

  // Modal actions
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  cancelBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.muted,
  },
  addBtn: {
    flex: 2,
    height: 46,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.ink,
  },
  addBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.paper,
  },
});
