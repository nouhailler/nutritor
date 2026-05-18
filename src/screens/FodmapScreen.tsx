/**
 * FodmapScreen — stack 'fodmap'
 * Protocole FODMAP personnel : sélection de la phase (élimination / réintroduction /
 * maintenance), journal des aliments réintroduits et suivi des réactions.
 */
import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { Colors, Fonts, Spacing } from '../theme/tokens';
import {
  FodmapPhase,
  FodmapProtocol,
  FodmapTypeEntry,
  FODMAP_TYPES,
  PHASE_CONFIG,
  ReactionEntry,
  RESULT_CONFIG,
  SYMPTOM_OPTIONS,
  TestedFood,
  TestResult,
  buildToleranceMap,
  daysSince,
  formatDate,
} from '../data/fodmapProtocol';

// ── Helpers ───────────────────────────────────────────────────

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const PHASES: FodmapPhase[] = ['elimination', 'reintroduction', 'stabilization'];

// ── Phase Stepper ─────────────────────────────────────────────

function PhaseStepper({ phase }: { phase: FodmapPhase }) {
  const current = PHASES.indexOf(phase);
  return (
    <View style={stepStyles.row}>
      {PHASES.map((p, i) => {
        const cfg  = PHASE_CONFIG[p];
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={p}>
            <View style={stepStyles.step}>
              <View style={[
                stepStyles.circle,
                done   && { backgroundColor: Colors.ok, borderColor: Colors.ok },
                active && { backgroundColor: cfg.color, borderColor: cfg.color },
              ]}>
                <Text style={[stepStyles.circleText, (done || active) && { color: '#fff' }]}>
                  {done ? '✓' : String(i + 1)}
                </Text>
              </View>
              <Text style={[stepStyles.label, active && { color: cfg.color, fontFamily: Fonts.sansMedium }]}>
                {cfg.label}
              </Text>
            </View>
            {i < PHASES.length - 1 && (
              <View style={[stepStyles.line, done && { backgroundColor: Colors.ok }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 24, marginBottom: 20 },
  step:   { alignItems: 'center', gap: 6, width: 80 },
  circle: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.hairline,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  circleText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.muted },
  label:  { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', color: Colors.muted, textAlign: 'center' },
  line:   { flex: 1, height: 1.5, backgroundColor: Colors.hairline, marginTop: 16 },
});

// ── Timer Card ────────────────────────────────────────────────

function TimerCard({ protocol, onAdvance }: { protocol: FodmapProtocol; onAdvance: () => void }) {
  const cfg          = PHASE_CONFIG[protocol.phase];
  const daysInPhase  = daysSince(protocol.phaseStartDate);
  const daysTotal    = daysSince(protocol.startDate);
  const duration     = cfg.durationDays;
  const pct          = duration ? Math.min(1, daysInPhase / duration) : null;
  const remaining    = duration ? Math.max(0, duration - daysInPhase) : null;
  const isLast       = protocol.phase === 'stabilization';

  return (
    <View style={[timerStyles.card, { borderColor: cfg.color + '40', backgroundColor: cfg.bgColor }]}>
      {/* Phase label + global days */}
      <View style={timerStyles.head}>
        <View style={{ gap: 2 }}>
          <Text style={[timerStyles.phaseLabel, { color: cfg.color }]}>{cfg.emoji} {cfg.label}</Text>
          <Text style={timerStyles.globalDays}>Jour {daysTotal} du protocole global</Text>
        </View>
        {!isLast && (
          <TouchableOpacity style={[timerStyles.advanceBtn, { borderColor: cfg.color + '50' }]} onPress={onAdvance} activeOpacity={0.8}>
            <Text style={[timerStyles.advanceBtnText, { color: cfg.color }]}>Avancer →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Days in phase */}
      <View style={timerStyles.daysRow}>
        <View style={timerStyles.daysStat}>
          <Text style={[timerStyles.daysNum, { color: cfg.color }]}>{daysInPhase}</Text>
          <Text style={timerStyles.daysSub}>jours écoulés</Text>
        </View>
        {remaining !== null && (
          <View style={timerStyles.daysStat}>
            <Text style={[timerStyles.daysNum, { color: cfg.color }]}>{remaining}</Text>
            <Text style={timerStyles.daysSub}>jours restants</Text>
          </View>
        )}
        <View style={timerStyles.daysStat}>
          <Text style={timerStyles.startDate}>{formatDate(protocol.phaseStartDate)}</Text>
          <Text style={timerStyles.daysSub}>début de phase</Text>
        </View>
      </View>

      {/* Progress bar */}
      {pct !== null && (
        <View style={timerStyles.barWrap}>
          <View style={[timerStyles.barTrack, { backgroundColor: cfg.color + '20' }]}>
            <View style={[timerStyles.barFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: cfg.color }]} />
          </View>
          <Text style={[timerStyles.pct, { color: cfg.color }]}>{Math.round(pct * 100)} %</Text>
        </View>
      )}
    </View>
  );
}

const timerStyles = StyleSheet.create({
  card: { marginHorizontal: 20, borderRadius: Spacing.cardRadius, borderWidth: 1, padding: Spacing.cardPad, gap: 14, marginBottom: 16 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  phaseLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 16, letterSpacing: -0.2 },
  globalDays: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 0.3 },
  advanceBtn: { borderWidth: 1, borderRadius: 100, paddingVertical: 6, paddingHorizontal: 12 },
  advanceBtnText: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 0.8 },
  daysRow: { flexDirection: 'row', gap: 20 },
  daysStat: { gap: 2 },
  daysNum: { fontFamily: Fonts.serif, fontSize: 28, lineHeight: 30, letterSpacing: -0.5 },
  startDate: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink2 },
  daysSub: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.5 },
  barWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  pct: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 0.5, width: 38, textAlign: 'right' },
});

// ── Phase Info Banner ─────────────────────────────────────────

function PhaseBanner({ phase }: { phase: FodmapPhase }) {
  const cfg = PHASE_CONFIG[phase];
  return (
    <View style={[bannerStyles.card, { backgroundColor: cfg.bgColor, borderColor: cfg.color + '30' }]}>
      <Icon name="info" size={14} color={cfg.color} />
      <View style={{ flex: 1 }}>
        <Text style={[bannerStyles.rule, { color: cfg.color }]}>{cfg.rule}</Text>
        <Text style={bannerStyles.tip}>{cfg.tip}</Text>
      </View>
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  card: { marginHorizontal: 20, borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 20 },
  rule: { fontFamily: Fonts.sansMedium, fontSize: 12, lineHeight: 16, marginBottom: 4 },
  tip:  { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 0.2, lineHeight: 14 },
});

// ── Section Header ────────────────────────────────────────────

function SectionHeader({ title, count, onAdd }: { title: string; count: number; onAdd: () => void }) {
  return (
    <View style={shStyles.row}>
      <Text style={shStyles.title}>{title}</Text>
      {count > 0 && <Text style={shStyles.count}>{count}</Text>}
      <View style={{ flex: 1 }} />
      <TouchableOpacity style={shStyles.btn} onPress={onAdd} activeOpacity={0.8}>
        <Icon name="plus" size={12} color={Colors.paper2} />
        <Text style={shStyles.btnText}>Ajouter</Text>
      </TouchableOpacity>
    </View>
  );
}

const shStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10, gap: 8 },
  title: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: Colors.muted },
  count: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted2 },
  btn:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.ink, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 100 },
  btnText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.8, color: Colors.paper2 },
});

// ── Tested Food Row ───────────────────────────────────────────

function TestedFoodRow({ item, onDelete }: { item: TestedFood; onDelete: () => void }) {
  const rc = RESULT_CONFIG[item.result];
  return (
    <View style={rowStyles.row}>
      <View style={[rowStyles.icon, { backgroundColor: rc.bg }]}>
        <Text style={[rowStyles.iconText, { color: rc.color }]}>{rc.icon}</Text>
      </View>
      <View style={rowStyles.body}>
        <Text style={rowStyles.name} numberOfLines={1}>{item.foodName}</Text>
        <View style={rowStyles.meta}>
          {item.fodmapType && <Text style={rowStyles.tag}>{item.fodmapType}</Text>}
          {item.portionTested && <Text style={rowStyles.portion}>· {item.portionTested}</Text>}
          <Text style={rowStyles.date}>· {formatDate(item.testedAt)}</Text>
        </View>
        {item.notes ? <Text style={rowStyles.notes} numberOfLines={1}>{item.notes}</Text> : null}
      </View>
      <View style={[rowStyles.badge, { borderColor: rc.color + '40', backgroundColor: rc.bg }]}>
        <Text style={[rowStyles.badgeText, { color: rc.color }]}>{rc.label}</Text>
      </View>
      <TouchableOpacity onPress={onDelete} style={rowStyles.del} activeOpacity={0.7}>
        <Icon name="trash" size={13} color={Colors.muted2} />
      </TouchableOpacity>
    </View>
  );
}

// ── Reaction Row ──────────────────────────────────────────────

const SEV_COLOR = ['', '#3F5A3A', '#6B5A2E', '#8B3A2E'];
const SEV_LABEL = ['', 'Léger', 'Modéré', 'Sévère'];

function ReactionRow({ item, onDelete }: { item: ReactionEntry; onDelete: () => void }) {
  const color = SEV_COLOR[item.severity];
  return (
    <View style={rowStyles.row}>
      <View style={[rowStyles.icon, { backgroundColor: color + '15' }]}>
        <Text style={[rowStyles.iconText, { color, fontSize: 16 }]}>{'●'}</Text>
      </View>
      <View style={rowStyles.body}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Text style={[rowStyles.name, { color }]}>{SEV_LABEL[item.severity]}</Text>
          <Text style={rowStyles.date}>{formatDate(item.date)}</Text>
        </View>
        {item.foodName && <Text style={rowStyles.portion}>Lié à : {item.foodName}</Text>}
        {item.symptoms.length > 0 && (
          <Text style={rowStyles.notes} numberOfLines={2}>{item.symptoms.join(' · ')}</Text>
        )}
      </View>
      <TouchableOpacity onPress={onDelete} style={rowStyles.del} activeOpacity={0.7}>
        <Icon name="trash" size={13} color={Colors.muted2} />
      </TouchableOpacity>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: Colors.hairline2 },
  icon:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconText:  { fontFamily: Fonts.sansMedium, fontSize: 13 },
  body:      { flex: 1, gap: 2 },
  name:      { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink },
  meta:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tag:       { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.5, color: Colors.muted, textTransform: 'uppercase' },
  portion:   { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted2 },
  date:      { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted2 },
  notes:     { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 0.2 },
  badge:     { borderWidth: 1, borderRadius: 100, paddingVertical: 3, paddingHorizontal: 8, flexShrink: 0 },
  badgeText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.5 },
  del:       { padding: 6 },
});

// ── Tolerance Map ─────────────────────────────────────────────

function ToleranceMap({ testedFoods }: { testedFoods: TestedFood[] }) {
  const map = buildToleranceMap(testedFoods);
  return (
    <View style={tolStyles.grid}>
      {FODMAP_TYPES.map((ft: FodmapTypeEntry) => {
        const result = map[ft.name];
        const rc     = result ? RESULT_CONFIG[result] : null;
        return (
          <View key={ft.name} style={[tolStyles.cell, rc && { borderColor: rc.color + '35', backgroundColor: rc.bg }]}>
            <View style={tolStyles.cellTop}>
              <Text style={[tolStyles.abbr, rc && { color: rc.color }]}>{ft.abbr}</Text>
              {rc ? (
                <Text style={[tolStyles.resultIcon, { color: rc.color }]}>{rc.icon}</Text>
              ) : (
                <Text style={tolStyles.unknown}>?</Text>
              )}
            </View>
            <Text style={[tolStyles.typeName, rc && { color: rc.color }]} numberOfLines={1}>{ft.name}</Text>
            <Text style={tolStyles.examples} numberOfLines={2}>{ft.examples}</Text>
            {rc && <Text style={[tolStyles.resultLabel, { color: rc.color }]}>{rc.label}</Text>}
          </View>
        );
      })}
    </View>
  );
}

const tolStyles = StyleSheet.create({
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 32 },
  cell:        { width: '47%', borderWidth: 1, borderColor: Colors.hairline, borderRadius: 14, padding: 12, backgroundColor: Colors.card, gap: 3 },
  cellTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  abbr:        { fontFamily: Fonts.mono, fontSize: 11, letterSpacing: 0.5, color: Colors.muted, textTransform: 'uppercase' },
  resultIcon:  { fontFamily: Fonts.sans, fontSize: 14 },
  unknown:     { fontFamily: Fonts.mono, fontSize: 14, color: Colors.muted2 },
  typeName:    { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.ink2 },
  examples:    { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.2, lineHeight: 13 },
  resultLabel: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4 },
});

// ── Add Test Sheet ────────────────────────────────────────────

function AddTestSheet({
  phase, onSave, onCancel,
}: { phase: FodmapPhase; onSave: (t: TestedFood) => void; onCancel: () => void }) {
  const [name, setName]       = useState('');
  const [type, setType]       = useState<string | undefined>(undefined);
  const [portion, setPortion] = useState('');
  const [result, setResult]   = useState<TestResult>('pending');
  const [notes, setNotes]     = useState('');

  const valid = name.trim().length > 0;

  function handleSave() {
    if (!valid) return;
    onSave({
      id: uuid(), foodName: name.trim(), fodmapType: type,
      portionTested: portion.trim() || undefined,
      result, notes: notes.trim() || undefined,
      testedAt: todayISO(), phase,
    });
  }

  return (
    <View style={sheetStyles.overlay}>
      <TouchableOpacity style={sheetStyles.backdrop} onPress={onCancel} activeOpacity={1} />
      <View style={sheetStyles.sheet}>
        <View style={sheetStyles.handle} />
        <Text style={sheetStyles.sheetTitle}>Ajouter un test</Text>

        <Text style={sheetStyles.fieldLabel}>Aliment testé *</Text>
        <TextInput style={sheetStyles.input} value={name} onChangeText={setName} placeholder="ex. Riz basmati" placeholderTextColor={Colors.muted2} autoFocus />

        <Text style={sheetStyles.fieldLabel}>Groupe FODMAP</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sheetStyles.chips}>
          {FODMAP_TYPES.map((ft) => (
            <TouchableOpacity
              key={ft.name}
              style={[sheetStyles.chip, type === ft.name && sheetStyles.chipActive]}
              onPress={() => setType(type === ft.name ? undefined : ft.name)}
              activeOpacity={0.8}
            >
              <Text style={[sheetStyles.chipText, type === ft.name && sheetStyles.chipTextActive]}>{ft.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={sheetStyles.fieldLabel}>Portion testée</Text>
        <TextInput style={sheetStyles.input} value={portion} onChangeText={setPortion} placeholder="ex. 80 g" placeholderTextColor={Colors.muted2} />

        <Text style={sheetStyles.fieldLabel}>Résultat</Text>
        <View style={sheetStyles.chips}>
          {(['ok', 'moderate', 'severe', 'pending'] as TestResult[]).map((r) => {
            const rc = RESULT_CONFIG[r];
            const active = result === r;
            return (
              <TouchableOpacity
                key={r}
                style={[sheetStyles.chip, active && { backgroundColor: rc.color, borderColor: rc.color }]}
                onPress={() => setResult(r)} activeOpacity={0.8}
              >
                <Text style={[sheetStyles.chipText, active && { color: '#fff' }]}>{rc.icon} {rc.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={sheetStyles.fieldLabel}>Notes</Text>
        <TextInput style={[sheetStyles.input, sheetStyles.inputMulti]} value={notes} onChangeText={setNotes} placeholder="Observations, contexte…" placeholderTextColor={Colors.muted2} multiline />

        <TouchableOpacity style={[sheetStyles.saveBtn, !valid && { opacity: 0.4 }]} onPress={handleSave} activeOpacity={0.8} disabled={!valid}>
          <Text style={sheetStyles.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Add Reaction Sheet ────────────────────────────────────────

function AddReactionSheet({
  phase, onSave, onCancel,
}: { phase: FodmapPhase; onSave: (r: ReactionEntry) => void; onCancel: () => void }) {
  const [severity, setSeverity]   = useState<1 | 2 | 3>(1);
  const [symptoms, setSymptoms]   = useState<string[]>([]);
  const [foodName, setFoodName]   = useState('');
  const [notes, setNotes]         = useState('');

  function toggleSymptom(s: string) {
    setSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  function handleSave() {
    onSave({
      id: uuid(), date: todayISO(), severity, symptoms,
      foodName: foodName.trim() || undefined,
      notes: notes.trim() || undefined, phase,
    });
  }

  return (
    <View style={sheetStyles.overlay}>
      <TouchableOpacity style={sheetStyles.backdrop} onPress={onCancel} activeOpacity={1} />
      <View style={sheetStyles.sheet}>
        <View style={sheetStyles.handle} />
        <Text style={sheetStyles.sheetTitle}>Enregistrer une réaction</Text>

        <Text style={sheetStyles.fieldLabel}>Sévérité</Text>
        <View style={sheetStyles.chips}>
          {([1, 2, 3] as const).map((s) => {
            const color = SEV_COLOR[s];
            const active = severity === s;
            return (
              <TouchableOpacity
                key={s}
                style={[sheetStyles.chip, active && { backgroundColor: color, borderColor: color }]}
                onPress={() => setSeverity(s)} activeOpacity={0.8}
              >
                <Text style={[sheetStyles.chipText, active && { color: '#fff' }]}>{SEV_LABEL[s]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={sheetStyles.fieldLabel}>Symptômes</Text>
        <View style={sheetStyles.chips}>
          {SYMPTOM_OPTIONS.map((s) => {
            const active = symptoms.includes(s);
            return (
              <TouchableOpacity
                key={s}
                style={[sheetStyles.chip, active && sheetStyles.chipActive]}
                onPress={() => toggleSymptom(s)} activeOpacity={0.8}
              >
                <Text style={[sheetStyles.chipText, active && sheetStyles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={sheetStyles.fieldLabel}>Aliment associé (optionnel)</Text>
        <TextInput style={sheetStyles.input} value={foodName} onChangeText={setFoodName} placeholder="Quel aliment a précédé la réaction ?" placeholderTextColor={Colors.muted2} />

        <Text style={sheetStyles.fieldLabel}>Notes</Text>
        <TextInput style={[sheetStyles.input, sheetStyles.inputMulti]} value={notes} onChangeText={setNotes} placeholder="Contexte, heure, observations…" placeholderTextColor={Colors.muted2} multiline />

        <TouchableOpacity style={sheetStyles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={sheetStyles.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const sheetStyles = StyleSheet.create({
  overlay:   { ...StyleSheet.absoluteFillObject, zIndex: 100, justifyContent: 'flex-end' },
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26,24,20,0.55)' },
  sheet:     {
    backgroundColor: Colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 36 : 24, gap: 10,
    maxHeight: '90%',
  },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.hairline, alignSelf: 'center', marginBottom: 6 },
  sheetTitle:  { fontFamily: Fonts.serif, fontSize: 22, letterSpacing: -0.3, color: Colors.ink, marginBottom: 4 },
  fieldLabel:  { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: Colors.muted },
  input:       {
    borderWidth: 1, borderColor: Colors.hairline, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14,
    fontFamily: Fonts.sans, fontSize: 14, color: Colors.ink,
    backgroundColor: Colors.card,
  },
  inputMulti:  { minHeight: 60, textAlignVertical: 'top' },
  chips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:        { borderWidth: 1, borderColor: Colors.hairline, borderRadius: 100, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: Colors.card },
  chipActive:  { backgroundColor: Colors.ink, borderColor: Colors.ink },
  chipText:    { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 0.3, color: Colors.ink2 },
  chipTextActive: { color: Colors.paper2 },
  saveBtn:     { backgroundColor: Colors.ink, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  saveBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.paper2, letterSpacing: 0.2 },
});

// ── Advance Phase Confirm ─────────────────────────────────────

function AdvancePhaseConfirm({
  current, onConfirm, onCancel,
}: { current: FodmapPhase; onConfirm: () => void; onCancel: () => void }) {
  const nextIndex = PHASES.indexOf(current) + 1;
  const next      = PHASES[nextIndex];
  const nextCfg   = PHASE_CONFIG[next];

  return (
    <View style={sheetStyles.overlay}>
      <TouchableOpacity style={sheetStyles.backdrop} onPress={onCancel} activeOpacity={1} />
      <View style={[sheetStyles.sheet, { gap: 16 }]}>
        <View style={sheetStyles.handle} />
        <Text style={sheetStyles.sheetTitle}>Passer en {nextCfg.label} ?</Text>
        <Text style={{ fontFamily: Fonts.sans, fontSize: 14, color: Colors.ink2, lineHeight: 20 }}>
          {nextCfg.rule}
        </Text>
        <Text style={{ fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 0.2 }}>
          {nextCfg.tip}
        </Text>
        <TouchableOpacity
          style={[sheetStyles.saveBtn, { backgroundColor: nextCfg.color }]}
          onPress={onConfirm} activeOpacity={0.8}
        >
          <Text style={sheetStyles.saveBtnText}>{nextCfg.emoji} Commencer la {nextCfg.label}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel} style={{ alignItems: 'center', paddingBottom: 4 }} activeOpacity={0.7}>
          <Text style={{ fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 0.5 }}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Stats bar ─────────────────────────────────────────────────

function ProtocolStats({ protocol }: { protocol: FodmapProtocol }) {
  const total      = protocol.testedFoods.length;
  const tolerated  = protocol.testedFoods.filter((f) => f.result === 'ok').length;
  const avoided    = protocol.testedFoods.filter((f) => f.result === 'severe').length;
  const reactions  = protocol.reactions.length;

  return (
    <View style={statStyles.row}>
      {[
        { num: total,     sub: 'aliments testés',  color: Colors.ink },
        { num: tolerated, sub: 'tolérés',           color: PHASE_CONFIG.stabilization.color },
        { num: avoided,   sub: 'à éviter',          color: PHASE_CONFIG.elimination.color },
        { num: reactions, sub: 'réactions',         color: PHASE_CONFIG.reintroduction.color },
      ].map((s, i) => (
        <View key={i} style={statStyles.cell}>
          <Text style={[statStyles.num, { color: s.color }]}>{s.num}</Text>
          <Text style={statStyles.sub}>{s.sub}</Text>
        </View>
      ))}
    </View>
  );
}

const statStyles = StyleSheet.create({
  row:  { flexDirection: 'row', paddingHorizontal: 20, gap: 0, marginBottom: 24 },
  cell: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: Colors.hairline2 },
  num:  { fontFamily: Fonts.serif, fontSize: 24, letterSpacing: -0.5 },
  sub:  { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 0.5, color: Colors.muted, textTransform: 'uppercase', textAlign: 'center' },
});

// ── FodmapScreen ──────────────────────────────────────────────

interface FodmapScreenProps {
  protocol: FodmapProtocol;
  onUpdate: (p: FodmapProtocol) => void;
  onBack: () => void;
}

export function FodmapScreen({ protocol, onUpdate, onBack }: FodmapScreenProps) {
  const insets = useSafeAreaInsets();
  const [showAddTest, setShowAddTest]           = useState(false);
  const [showAddReaction, setShowAddReaction]   = useState(false);
  const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false);

  // Sorted: most recent first
  const sortedTests     = [...protocol.testedFoods].sort((a, b) => b.testedAt.localeCompare(a.testedAt));
  const sortedReactions = [...protocol.reactions].sort((a, b) => b.date.localeCompare(a.date));

  function handleAddTest(t: TestedFood) {
    onUpdate({ ...protocol, testedFoods: [t, ...protocol.testedFoods] });
    setShowAddTest(false);
  }

  function handleAddReaction(r: ReactionEntry) {
    onUpdate({ ...protocol, reactions: [r, ...protocol.reactions] });
    setShowAddReaction(false);
  }

  function handleDeleteTest(id: string) {
    onUpdate({ ...protocol, testedFoods: protocol.testedFoods.filter((f) => f.id !== id) });
  }

  function handleDeleteReaction(id: string) {
    onUpdate({ ...protocol, reactions: protocol.reactions.filter((r) => r.id !== id) });
  }

  function handleAdvancePhase() {
    const next = PHASES[PHASES.indexOf(protocol.phase) + 1] as FodmapPhase;
    onUpdate({ ...protocol, phase: next, phaseStartDate: todayISO() });
    setShowAdvanceConfirm(false);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Topbar */}
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
            <Icon name="back" size={20} color={Colors.ink} />
          </TouchableOpacity>
          <View>
            <Text style={styles.eyebrow}>Protocole</Text>
            <Text style={styles.title}>Mode Low FODMAP</Text>
          </View>
          <View style={{ flex: 1 }} />
          <View style={[styles.badge, { backgroundColor: PHASE_CONFIG[protocol.phase].bgColor, borderColor: PHASE_CONFIG[protocol.phase].color + '40' }]}>
            <Text style={[styles.badgeText, { color: PHASE_CONFIG[protocol.phase].color }]}>
              {PHASE_CONFIG[protocol.phase].emoji} {PHASE_CONFIG[protocol.phase].label}
            </Text>
          </View>
        </View>

        {/* Phase stepper */}
        <PhaseStepper phase={protocol.phase} />

        {/* Timer */}
        <TimerCard protocol={protocol} onAdvance={() => setShowAdvanceConfirm(true)} />

        {/* Stats */}
        <ProtocolStats protocol={protocol} />

        {/* Phase rules */}
        <PhaseBanner phase={protocol.phase} />

        {/* Aliments testés */}
        <SectionHeader
          title="Aliments testés"
          count={sortedTests.length}
          onAdd={() => setShowAddTest(true)}
        />
        {sortedTests.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun aliment testé pour l'instant.</Text>
            <Text style={styles.emptyHint}>Ajouter un test après chaque challenge FODMAP.</Text>
          </View>
        ) : (
          sortedTests.map((t) => (
            <TestedFoodRow key={t.id} item={t} onDelete={() => handleDeleteTest(t.id)} />
          ))
        )}

        {/* Réactions */}
        <View style={{ marginTop: 24 }}>
          <SectionHeader
            title="Réactions récentes"
            count={sortedReactions.length}
            onAdd={() => setShowAddReaction(true)}
          />
          {sortedReactions.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucune réaction enregistrée.</Text>
              <Text style={styles.emptyHint}>Loguer une réaction dès qu'elle survient.</Text>
            </View>
          ) : (
            sortedReactions.slice(0, 8).map((r) => (
              <ReactionRow key={r.id} item={r} onDelete={() => handleDeleteReaction(r.id)} />
            ))
          )}
        </View>

        {/* Carte de tolérance */}
        <View style={{ marginTop: 24 }}>
          <View style={shStyles.row}>
            <Text style={shStyles.title}>Carte de tolérance</Text>
          </View>
          <Text style={styles.toleranceHint}>Dérivée de vos tests — tapez + pour enrichir</Text>
          <View style={{ marginTop: 12 }}>
            <ToleranceMap testedFoods={protocol.testedFoods} />
          </View>
        </View>
      </ScrollView>

      {/* Sheets */}
      {showAddTest && (
        <AddTestSheet
          phase={protocol.phase}
          onSave={handleAddTest}
          onCancel={() => setShowAddTest(false)}
        />
      )}
      {showAddReaction && (
        <AddReactionSheet
          phase={protocol.phase}
          onSave={handleAddReaction}
          onCancel={() => setShowAddReaction(false)}
        />
      )}
      {showAdvanceConfirm && (
        <AdvancePhaseConfirm
          current={protocol.phase}
          onConfirm={handleAdvancePhase}
          onCancel={() => setShowAdvanceConfirm(false)}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  scroll:    { flex: 1 },

  topbar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.hairline,
    alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 2.2,
    textTransform: 'uppercase', color: Colors.muted,
  },
  title: {
    fontFamily: Fonts.serif, fontSize: 22, lineHeight: 24,
    letterSpacing: -0.4, color: Colors.ink, marginTop: 2,
  },
  badge: {
    borderWidth: 1, borderRadius: 100,
    paddingVertical: 5, paddingHorizontal: 12,
  },
  badgeText: {
    fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 0.5,
  },
  empty:     { paddingHorizontal: 20, paddingVertical: 16 },
  emptyText: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.muted, marginBottom: 4 },
  emptyHint: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted2, letterSpacing: 0.2 },
  toleranceHint: {
    fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted,
    paddingHorizontal: 20, marginBottom: 4, letterSpacing: 0.2,
  },
});
