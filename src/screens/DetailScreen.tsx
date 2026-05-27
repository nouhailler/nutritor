/**
 * DetailScreen — stack 'detail'
 * Fiche complète d'un aliment : macros, acides aminés, acides gras, vitamines,
 * minéraux, FODMAP, composés bioactifs, profil sensoriel.
 * Permet l'ajout au repas du journal du jour.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { HelpButton, HelpModal } from '../components/HelpModal';
import { HELP } from '../data/helpContent';
import { INITIAL_MEALS } from '../data/food';
import { UserProfile } from '../data/user';
import { computeCompatibilityScore } from '../data/compatibilityScore';
import { CompatCard } from '../components/CompatibilityBadge';
import { calculateNutriScorePerso } from '../utils/nutriScorePerso';
import { NutriScoreBadge } from '../components/NutriScoreBadge';
import { useMode } from '../contexts/ModeContext';
import { OnboardingTip } from '../components/OnboardingTip';
import { TIPS } from '../data/onboarding';
import { Colors, FA_COLORS, Fonts } from '../theme/tokens';
import {
  Allergen,
  Bioactive,
  CarbDetail,
  CompatItem,
  Fodmap,
  Food,
  LipidDetail,
  Meal,
  MetabolicItem,
  NutriItem,
  ProteinDetail,
  Sensory,
} from '../types';

// ── Helpers ──────────────────────────────────────────────────

function round1(v: number) {
  return Math.round(v * 10) / 10;
}

// ── Section header ─────────────────────────────────────────

function SectionHead({
  num,
  title,
  right,
}: {
  num: string;
  title: string;
  right?: string;
}) {
  return (
    <View style={styles.sectionHeadRow}>
      <View style={styles.sectionHeadLeft}>
        <Text style={styles.sectionNum}>{num}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {right ? <Text style={styles.sectionRight}>{right}</Text> : null}
    </View>
  );
}

// ── Compat pill ─────────────────────────────────────────────

function CompatPill({ item }: { item: CompatItem }) {
  const isOk = item.kind === 'ok';
  return (
    <View style={[styles.compatPill, isOk ? styles.compatOk : styles.compatWarn]}>
      <Icon
        name={isOk ? 'check' : 'alert'}
        size={13}
        color={isOk ? Colors.ok : Colors.warn}
      />
      <Text style={[styles.compatText, isOk ? styles.compatTextOk : styles.compatTextWarn]}>
        {item.label}
      </Text>
    </View>
  );
}

// ── Three-column nutrient row ──────────────────────────────

function NutriRow({
  name,
  sub,
  qty,
  anr,
  role,
}: {
  name: string;
  sub?: string;
  qty: string;
  anr?: string;
  role: string;
}) {
  return (
    <View style={styles.nutri3Row}>
      <View style={styles.nutri3Name}>
        <Text style={styles.nutri3NameText}>{name}</Text>
        {sub ? <Text style={styles.nutri3Sub}>{sub}</Text> : null}
      </View>
      <View style={styles.nutri3Qty}>
        <Text style={styles.nutri3QtyText}>{String(qty ?? '')}</Text>
        {anr ? <Text style={styles.nutri3AnrText}>{String(anr)} ANR</Text> : null}
      </View>
      <Text style={styles.nutri3Role}>{String(role ?? '')}</Text>
    </View>
  );
}

// ── Edit kcal modal ──────────────────────────────────────────

function EditKcalModal({
  visible,
  currentKcal,
  onSave,
  onCancel,
}: {
  visible: boolean;
  currentKcal: number;
  onSave: (kcal: number) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState(currentKcal === 0 ? '' : String(currentKcal));
  useEffect(() => {
    if (visible) setValue(currentKcal === 0 ? '' : String(currentKcal));
  }, [visible, currentKcal]);

  const handleSave = () => {
    const num = parseFloat(value.replace(',', '.'));
    if (!isNaN(num) && num >= 0) onSave(num);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={kcalModalStyles.overlay}>
        <View style={kcalModalStyles.card}>
          <Text style={kcalModalStyles.title}>{t('detail.editEnergyTitle')}</Text>
          <View style={kcalModalStyles.inputRow}>
            <TextInput
              style={kcalModalStyles.input}
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              placeholder={t('detail.editEnergyPlaceholder')}
              placeholderTextColor={Colors.muted2}
              autoFocus
              selectTextOnFocus
            />
            <Text style={kcalModalStyles.unit}>{t('detail.editEnergyUnit')}</Text>
          </View>
          <View style={kcalModalStyles.btnRow}>
            <TouchableOpacity style={kcalModalStyles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={kcalModalStyles.cancelText}>{t('detail.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={kcalModalStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={kcalModalStyles.saveText}>{t('detail.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const kcalModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.paper2,
    borderRadius: 20,
    padding: 24,
    gap: 20,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.ink,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.paper,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontSize: 28,
    color: Colors.ink,
    textAlign: 'center',
  },
  unit: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: Colors.muted,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.muted },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 100,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.paper2 },
});

// ── Section 01 · Apports ───────────────────────────────────

function ApportsSection({
  food,
  portion,
  onEditKcal,
}: {
  food: Food;
  portion: number;
  onEditKcal?: () => void;
}) {
  const { t } = useTranslation();
  const f = portion / 100;
  const sc = (v: number) => round1(v * f);
  const kcalIsZero = food.per100.kcal === 0;

  return (
    <View style={styles.section}>
      <SectionHead num="01" title={t('detail.section01')} right={t('detail.forPortion', { portion, unit: food.unit })} />
      <View style={styles.nutriTable}>
        <TouchableOpacity
          style={[styles.nutriRow, styles.nutriRowBorderless]}
          onPress={kcalIsZero && onEditKcal ? onEditKcal : undefined}
          activeOpacity={kcalIsZero && onEditKcal ? 0.6 : 1}
          disabled={!kcalIsZero || !onEditKcal}
        >
          <Text style={styles.nutriNameLarge}>{t('detail.energy')}</Text>
          <View style={styles.kcalValueRow}>
            <Text style={[styles.nutriValLarge, kcalIsZero && styles.nutriValZero]}>
              {Math.round(food.per100.kcal * f)} kcal
            </Text>
            {kcalIsZero && onEditKcal && (
              <Icon name="edit" size={13} color={Colors.signal} />
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.nutriRow}>
          <Text style={styles.nutriName}>{t('detail.nutriProtein')}</Text>
          <View style={styles.nutriValRow}>
            <Text style={styles.nutriVal}>{sc(food.per100.protein)} g</Text>
            <Text style={styles.nutriPct}>
              {Math.round((food.per100.protein * f) / 130) * 100}%
            </Text>
          </View>
        </View>
        <View style={styles.nutriRow}>
          <Text style={styles.nutriName}>{t('detail.nutriCarbs')}</Text>
          <View style={styles.nutriValRow}>
            <Text style={styles.nutriVal}>{sc(food.per100.carbs)} g</Text>
            <Text style={styles.nutriPct}>
              {Math.round((food.per100.carbs * f) / 220) * 100}%
            </Text>
          </View>
        </View>
        <View style={styles.nutriRow}>
          <Text style={styles.nutriName}>{t('detail.nutriFat')}</Text>
          <View style={styles.nutriValRow}>
            <Text style={styles.nutriVal}>{sc(food.per100.fat)} g</Text>
            <Text style={styles.nutriPct}>
              {Math.round((food.per100.fat * f) / 70) * 100}%
            </Text>
          </View>
        </View>
        <View style={styles.nutriRow}>
          <Text style={styles.nutriName}>{t('detail.nutriSalt')}</Text>
          <Text style={styles.nutriVal}>{(food.per100.salt * f).toFixed(2)} g</Text>
        </View>
      </View>
    </View>
  );
}

// ── Section 02 · Protéines ─────────────────────────────────

function ProteinSection({ p }: { p: ProteinDetail }) {
  const { t } = useTranslation();
  const amino = Array.isArray(p.amino) ? p.amino : [];
  return (
    <View style={styles.section}>
      <SectionHead
        num="02"
        title={t('detail.section02')}
        right={`${p.totalG ?? 0} g · PDCAAS ${p.pdcaas ?? 0}`}
      />
      <Text style={styles.lede}>
        {p.complete ? t('detail.complete') : t('detail.incomplete')} — {t('detail.bcaa')}{' '}
        <Text style={styles.ledeBold}>{p.bcaaG ?? 0} g</Text>, {t('detail.anabolicSignal')}
      </Text>
      <View style={styles.nutri3}>
        {amino.map((a, i) => (
          <NutriRow
            key={a.name ?? i}
            name={a.name ?? ''}
            sub={a.essential ? t('detail.essential') : t('detail.nonEssential')}
            qty={a.qty ?? ''}
            role={a.role ?? ''}
          />
        ))}
      </View>
    </View>
  );
}

// ── Section 03 · Glucides ──────────────────────────────────

function CarbSection({ c }: { c: CarbDetail }) {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <SectionHead
        num="03"
        title={t('detail.section03')}
        right={`IG ${c.glycemicIndex} · CG ${c.glycemicLoad}`}
      />
      <View style={styles.nutriTable}>
        <View style={[styles.nutriRow, styles.nutriRowBorderless]}>
          <Text style={styles.nutriNameLarge}>{t('detail.totalCarbs')}</Text>
          <Text style={styles.nutriValLarge}>{c.totalG} g</Text>
        </View>
        <View style={[styles.nutriRow, styles.nutriRowIndent]}>
          <Text style={styles.nutriNameMuted}>{t('detail.complexStarches')}</Text>
          <Text style={styles.nutriVal}>{c.starchG} g</Text>
        </View>
        <View style={[styles.nutriRow, styles.nutriRowIndent]}>
          <Text style={styles.nutriNameMuted}>{t('detail.simpleSugars')}</Text>
          <Text style={styles.nutriVal}>{c.sugarsG} g</Text>
        </View>
        <View style={styles.nutriRow}>
          <Text style={styles.nutriNameLarge}>{t('detail.dietaryFiber')}</Text>
          <Text style={styles.nutriValLarge}>{c.fiberG} g</Text>
        </View>
        <View style={[styles.nutriRow, styles.nutriRowIndent]}>
          <Text style={styles.nutriNameMuted}>{t('detail.solubleFiber')}</Text>
          <Text style={styles.nutriVal}>{c.fiberSolubleG} g</Text>
        </View>
        <View style={[styles.nutriRow, styles.nutriRowIndent]}>
          <Text style={styles.nutriNameMuted}>{t('detail.insolubleFiber')}</Text>
          <Text style={styles.nutriVal}>{c.fiberInsolubleG} g</Text>
        </View>
      </View>
      <Text style={styles.noteText}>{c.notes}</Text>
    </View>
  );
}

// ── Section 04 · Lipides ───────────────────────────────────

function LipidSection({ l }: { l: LipidDetail }) {
  const { t } = useTranslation();
  const parsed = (Array.isArray(l.fa) ? l.fa : []).map((fa, i) => {
    const m = String(fa.pct ?? '').match(/(\d+(?:\.\d+)?)/);
    return { ...fa, pct: String(fa.pct ?? ''), qty: String(fa.qty ?? ''), num: m ? parseFloat(m[1]) : 0, color: FA_COLORS[i % FA_COLORS.length] };
  });
  const sum = parsed.reduce((s, f) => s + f.num, 0) || 100;

  return (
    <View style={styles.section}>
      <SectionHead num="04" title={t('detail.section04')} right={`${l.totalG} g · ${l.ratioOmega}`} />

      {/* Stacked bar */}
      <View style={styles.faBar}>
        {parsed.map((fa) => (
          <View
            key={fa.name}
            style={{ flex: fa.num / sum, backgroundColor: fa.color, height: 8 }}
          />
        ))}
      </View>

      {/* Legend */}
      <View style={styles.faLegend}>
        {parsed.map((fa) => (
          <View key={fa.name} style={styles.faLegendItem}>
            <View style={[styles.faSwatch, { backgroundColor: fa.color }]} />
            <Text style={styles.faLegendText}>{fa.name}</Text>
          </View>
        ))}
      </View>

      <View style={styles.nutri3}>
        {parsed.map((fa) => (
          <NutriRow
            key={fa.name}
            name={fa.name}
            sub={t('detail.percentTotal', { pct: fa.pct })}
            qty={fa.qty}
            role={fa.role}
          />
        ))}
      </View>
    </View>
  );
}

// ── Section 05-06-06b · Minéraux / Vitamines / Oligo ───────

function NutriTableSection({
  num,
  title,
  right,
  items,
}: {
  num: string;
  title: string;
  right?: string;
  items: NutriItem[];
}) {
  return (
    <View style={styles.section}>
      <SectionHead num={num} title={title} right={right} />
      <View style={styles.nutri3}>
        {items.map((item) => (
          <NutriRow
            key={item.name}
            name={item.name}
            qty={item.qty}
            anr={item.anr}
            role={item.role}
          />
        ))}
      </View>
    </View>
  );
}

// ── Section 07 · FODMAP ────────────────────────────────────

const FODMAP_MAX = 300;

function FodmapSection({ f }: { f: Fodmap }) {
  const { t } = useTranslation();
  const pct = (str: unknown) =>
    Math.min(100, (parseFloat(String(str ?? 0)) / FODMAP_MAX) * 100);

  const elim = f.elimination ?? { portion: '0', status: '', note: '' };
  const reintro = f.reintroduction ?? { portion: '0', status: '', note: '' };
  const absLimit = f.absoluteLimit ?? { portion: '0', status: '', note: '' };
  const types = Array.isArray(f.types) ? f.types : [];
  const alternatives = Array.isArray(f.alternatives) ? f.alternatives : [];

  const markers = [
    { pct: pct(elim.portion), label: t('detail.fodmapElimination'), sub: `${elim.portion} g` },
    { pct: pct(reintro.portion), label: t('detail.fodmapReintroduction'), sub: `${reintro.portion} g` },
    { pct: pct(absLimit.portion), label: t('detail.fodmapLimit'), sub: `${absLimit.portion} g` },
  ];

  return (
    <View style={styles.section}>
      <SectionHead num="07" title="FODMAP" right={t('detail.fodmapProfile', { level: String(f.overall ?? '').toUpperCase() })} />
      <Text style={styles.lede}>{t('detail.fodmapRulerLede')}</Text>

      {/* Ruler */}
      <View style={styles.fodmapRulerWrap}>
        <View style={styles.fodmapTrack}>
          <View style={[styles.fodmapTrackSegment, { flex: 38, backgroundColor: '#cfd9ce' }]} />
          <View style={[styles.fodmapTrackSegment, { flex: 34, backgroundColor: '#ddd2b1' }]} />
          <View style={[styles.fodmapTrackSegment, { flex: 28, backgroundColor: '#d9bfb7' }]} />
        </View>
        {markers.map((m) => (
          <View
            key={m.label}
            style={[styles.fodmapMarkerGroup, { left: `${m.pct}%` as unknown as number }]}
          >
            <View style={styles.fodmapMarker} />
            <Text style={styles.fodmapLabel}>{m.label}</Text>
            <Text style={styles.fodmapLabelSub}>{m.sub}</Text>
          </View>
        ))}
      </View>

      {/* Types */}
      <Text style={styles.sectionMicrolabel}>{t('detail.fodmapTypesPresent')}</Text>
      <View>
        {types.map((t, i) => {
          const present = String(t.present ?? '');
          const isOk = present === 'non';
          const isWarn = present === 'oui';
          return (
            <View
              key={t.name ?? i}
              style={[styles.fodmapTypeRow, i === 0 && styles.fodmapTypeRowFirst]}
            >
              <Text style={styles.fodmapTypeName}>{t.name}</Text>
              <Text
                style={[
                  styles.fodmapTypeVal,
                  isWarn && styles.fodmapTypeWarn,
                  isOk && styles.fodmapTypeOk,
                ]}
              >
                {present.toUpperCase()}
              </Text>
              <Text style={styles.fodmapTypeLevel}>{t.level}</Text>
            </View>
          );
        })}
      </View>

      {/* Alternatives */}
      <Text style={[styles.sectionMicrolabel, { marginTop: 22 }]}>{t('detail.fodmapAlternatives')}</Text>
      <View style={styles.altGrid}>
        {alternatives.map((a, i) => (
          <View key={a.name ?? i} style={styles.altCard}>
            <Text style={styles.altName}>{a.name}</Text>
            <Text style={styles.altWhy}>{a.why}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Section 08 · Bioactives ───────────────────────────────

function BioactiveSection({ items }: { items: Bioactive[] }) {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <SectionHead num="08" title={t('detail.section08')} right={t('detail.nonEssentialComposites')} />
      <View style={styles.nutri3}>
        {items.map((b) => (
          <NutriRow key={b.name} name={b.name} qty={b.qty} role={b.role} />
        ))}
      </View>
    </View>
  );
}

// ── Section 09 · Action métabolique ──────────────────────

function MetabolicSection({ items }: { items: MetabolicItem[] }) {
  const { t } = useTranslation();
  const safeItems = Array.isArray(items) ? items : [];
  const toneLabel = (tone: MetabolicItem['tone']) => {
    if (tone === 'high') return t('detail.metabolicHigh');
    if (tone === 'mid') return t('detail.metabolicMid');
    return t('detail.metabolicLow');
  };

  return (
    <View style={styles.section}>
      <SectionHead num="09" title={t('detail.section09')} />
      <View>
        {safeItems.map((m, i) => (
          <View key={m.axis} style={[styles.metabolicRow, i === 0 && styles.metabolicRowFirst]}>
            <Text style={styles.metabolicAxis}>{m.axis}</Text>
            <View
              style={[
                styles.metabolicTag,
                m.tone === 'high' && styles.metabolicTagHigh,
                m.tone === 'mid' && styles.metabolicTagMid,
              ]}
            >
              <Text
                style={[
                  styles.metabolicTagText,
                  m.tone === 'high' && styles.metabolicTagTextHigh,
                  m.tone === 'mid' && styles.metabolicTagTextMid,
                ]}
              >
                {toneLabel(m.tone)}
              </Text>
            </View>
            <Text style={styles.metabolicText}>{m.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Section 10 · Profil sensoriel ────────────────────────

function SensorySection({ s }: { s: Sensory }) {
  const { t } = useTranslation();
  const axes: { label: string; words: string[] }[] = [
    { label: t('detail.sensoryTaste'), words: Array.isArray(s.taste) ? s.taste : [] },
    { label: t('detail.sensoryTexture'), words: Array.isArray(s.texture) ? s.texture : [] },
    { label: t('detail.sensoryAroma'), words: Array.isArray(s.aroma) ? s.aroma : [] },
  ];

  return (
    <View style={styles.section}>
      <SectionHead num="10" title={t('detail.section10')} />
      {axes.map((ax) => (
        <View key={ax.label} style={styles.sensoryAxis}>
          <Text style={styles.sensoryLabel}>{ax.label}</Text>
          <View style={styles.sensoryWords}>
            {ax.words.map((w) => (
              <View key={w} style={styles.sensoryWordPill}>
                <Text style={styles.sensoryWordText}>{w}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
      <View style={styles.sensoryPairings}>
        <Text style={styles.sectionMicrolabel}>{t('detail.sensoryPairings')}</Text>
        <View style={[styles.sensoryWords, { marginTop: 8 }]}>
          {(Array.isArray(s.pairings) ? s.pairings : []).map((p) => (
            <View key={p} style={styles.sensoryWordPill}>
              <Text style={styles.sensoryWordText}>{p}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ── Section 11 · Allergènes ───────────────────────────────

function AllergenSection({ allergens }: { allergens: Allergen[] }) {
  const { t } = useTranslation();
  const safeAllergens = Array.isArray(allergens) ? allergens : [];
  const pairs: [Allergen, Allergen | undefined][] = [];
  for (let i = 0; i < safeAllergens.length; i += 2) {
    pairs.push([safeAllergens[i], safeAllergens[i + 1]]);
  }

  return (
    <View style={styles.section}>
      <SectionHead num="11" title={t('detail.section11')} right={t('detail.allergen14')} />
      <View style={styles.allergenGrid}>
        {pairs.map(([left, right], i) => left ? (
          <View key={i} style={styles.allergenGridRow}>
            <AllergenCell item={left} />
            <View style={styles.allergenDivider} />
            {right ? <AllergenCell item={right} /> : <View style={{ flex: 1 }} />}
          </View>
        ) : null)}
      </View>
    </View>
  );
}

function AllergenCell({ item }: { item: Allergen }) {
  const { t } = useTranslation();
  const STATUS_MAP: Record<Allergen['status'], { text: string; color: string }> = {
    contains: { text: t('detail.allergenContains'), color: Colors.warn },
    trace: { text: t('detail.allergenTrace'), color: Colors.signal },
    absent: { text: t('detail.allergenAbsent'), color: Colors.ok },
  };
  const s = STATUS_MAP[item.status] ?? { text: '?', color: Colors.muted };
  return (
    <View style={styles.allergenCell}>
      <Text style={styles.allergenName}>{item.name}</Text>
      <Text style={[styles.allergenStatus, { color: s.color }]}>{s.text}</Text>
    </View>
  );
}

// ── Section 12 · Composition ─────────────────────────────

function CompositionSection({
  text,
  highlights,
}: {
  text: string;
  highlights: string[];
}) {
  const { t } = useTranslation();
  const safeText = String(text ?? '');
  const safeHL = Array.isArray(highlights) ? highlights : [];

  if (!safeHL.length) {
    return (
      <View style={[styles.section, { paddingBottom: 30 }]}>
        <SectionHead num="12" title={t('detail.section12')} />
        <Text style={styles.ingredientsText}>{safeText}</Text>
      </View>
    );
  }

  const re = new RegExp(`(${safeHL.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = safeText.split(re);

  return (
    <View style={[styles.section, { paddingBottom: 30 }]}>
      <SectionHead num="12" title={t('detail.section12')} />
      <Text style={styles.ingredientsText}>
        {parts.map((part, i) => {
          const isHL = safeHL.some((h) => part.toLowerCase() === h.toLowerCase());
          return isHL ? (
            <Text key={i} style={styles.ingredientsHighlight}>
              {part}
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          );
        })}
      </Text>
    </View>
  );
}

// ── Bottom Sheet ─────────────────────────────────────────

function MealSheet({
  visible,
  food,
  portion,
  meals,
  onSelect,
  onDismiss,
}: {
  visible: boolean;
  food: Food;
  portion: number;
  meals: Meal[];
  onSelect: (mealId: string) => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(300)).current;
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(sheetAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(sheetAnim, { toValue: 300, duration: 250, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  const f = portion / 100;
  const kcal = Math.round(food.per100.kcal * f);

  return (
    <Animated.View style={[styles.sheetOverlay, { opacity: overlayAnim }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}
      >
        <View style={styles.sheetGrabber} />
        <Text style={styles.sheetTitle}>{t('detail.mealSheet')}</Text>
        <Text style={styles.sheetSub}>
          {t('detail.foodPortion', { kcal, portion, unit: food.unit, name: food.name })}
        </Text>
        {meals.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={styles.mealOption}
            onPress={() => onSelect(m.id)}
            activeOpacity={0.7}
          >
            <View style={styles.mealOptionLeft}>
              <Text style={styles.mealOptionName}>{m.name}</Text>
              <Text style={styles.mealOptionTime}>{m.time}</Text>
            </View>
            <Text style={styles.mealOptionCount}>
              {t('detail.mealItemCount', { count: m.items.length, s: m.items.length !== 1 ? 's' : '' })}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────

interface DetailScreenProps {
  food: Food;
  meals?: Meal[];
  profile?: UserProfile;
  onBack?: () => void;
  onOpenMenu?: () => void;
  onEdit?: () => void;
  onEnrichAI?: () => void;
  onUpdateFood?: (updated: Food) => void;
  onAdd?: (params: {
    food: Food;
    portion: number;
    mealId: string;
    kcal: number;
  }) => void;
}

export function DetailScreen({
  food,
  meals = INITIAL_MEALS,
  profile,
  onBack,
  onOpenMenu,
  onEdit,
  onEnrichAI,
  onUpdateFood,
  onAdd,
}: DetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { isExpert } = useMode();
  const [portion, setPortion] = useState(food.defaultPortion);
  const [showSheet, setShowSheet] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [kcalModalVisible, setKcalModalVisible] = useState(false);

  const factor = portion / 100;

  const handleAdd = (mealId: string) => {
    setShowSheet(false);
    onAdd?.({
      food,
      portion,
      mealId,
      kcal: Math.round(food.per100.kcal * factor),
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.paper} />

      {/* Scrollable content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Topbar */}
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
            <Icon name="back" size={22} />
          </TouchableOpacity>
          <View style={styles.topbarRight}>
            {onEnrichAI && (
              <TouchableOpacity style={styles.aiBtn} onPress={onEnrichAI} activeOpacity={0.7}>
                <Icon name="zap" size={18} color={Colors.signal} />
                <Text style={styles.aiBtnLabel}>IA</Text>
              </TouchableOpacity>
            )}
            {onEdit && (
              <TouchableOpacity style={styles.iconBtn} onPress={onEdit} activeOpacity={0.7}>
                <Icon name="edit" size={20} color={Colors.ink} />
              </TouchableOpacity>
            )}
            {onOpenMenu && (
              <TouchableOpacity style={styles.iconBtn} onPress={onOpenMenu} activeOpacity={0.7}>
                <Icon name="menu" size={22} />
              </TouchableOpacity>
            )}
            <HelpButton onPress={() => setHelpVisible(true)} />
          </View>
        </View>
        <HelpModal visible={helpVisible} content={HELP.detail} onClose={() => setHelpVisible(false)} />
        {onEdit && (
          <OnboardingTip
            tipKey={TIPS.editFood.key}
            title={TIPS.editFood.title}
            message={TIPS.editFood.message}
            delay={1200}
          />
        )}

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>
            {food.category} · {food.brand}
          </Text>
          <Text style={styles.heroTitle}>{food.name}</Text>
          <Text style={styles.heroSubtitle}>{food.subtitle}</Text>
        </View>

        {/* Personalized compatibility card */}
        {profile && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 4 }}>
            <NutriScoreBadge result={calculateNutriScorePerso(food, profile)} size="md" />
            <View style={{ flex: 1 }}>
              <CompatCard result={computeCompatibilityScore(food, profile)} />
            </View>
          </View>
        )}

        {/* Compat strip (static food properties) */}
        {Array.isArray(food.compat) && food.compat.length > 0 && (
          <View style={styles.compatStrip}>
            {food.compat.map((c, i) => (
              <CompatPill key={i} item={c} />
            ))}
          </View>
        )}

        {/* Sections */}
        <ApportsSection
          food={food}
          portion={portion}
          onEditKcal={onUpdateFood ? () => setKcalModalVisible(true) : undefined}
        />
        {isExpert && food.proteinDetail && <ProteinSection p={food.proteinDetail} />}
        {isExpert && food.carbDetail && <CarbSection c={food.carbDetail} />}
        {isExpert && food.lipidDetail && <LipidSection l={food.lipidDetail} />}
        {isExpert && food.minerals && (
          <NutriTableSection num="05" title={t('detail.section05')} right={t('detail.anrAdult')} items={food.minerals} />
        )}
        {isExpert && food.vitamins && (
          <NutriTableSection num="06" title={t('detail.section06')} right={t('detail.anrAdult')} items={food.vitamins} />
        )}
        {isExpert && food.trace && (
          <NutriTableSection
            num="06b"
            title={t('detail.section06b')}
            right={t('detail.anrAdult')}
            items={food.trace}
          />
        )}
        {food.fodmap && <FodmapSection f={food.fodmap} />}
        {isExpert && food.bioactives && <BioactiveSection items={food.bioactives} />}
        {isExpert && food.metabolic && <MetabolicSection items={food.metabolic} />}
        {isExpert && food.sensory && <SensorySection s={food.sensory} />}
        <AllergenSection allergens={food.allergens ?? []} />
        <CompositionSection
          text={food.ingredients ?? ''}
          highlights={food.ingredientsHighlights ?? []}
        />
      </ScrollView>

      {/* Sticky footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.portionPicker}>
          <TouchableOpacity
            style={styles.portionBtn}
            onPress={() => setPortion((p) => Math.max(10, p - 10))}
            activeOpacity={0.7}
          >
            <Icon name="minus" size={18} />
          </TouchableOpacity>
          <View style={styles.portionValue}>
            <Text style={styles.portionNum}>{portion}</Text>
            <Text style={styles.portionUnit}>{t('detail.portionLabel', { unit: food.unit })}</Text>
          </View>
          <TouchableOpacity
            style={styles.portionBtn}
            onPress={() => setPortion((p) => p + 10)}
            activeOpacity={0.7}
          >
            <Icon name="plus" size={18} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowSheet(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.addBtnText}>{t('detail.addBtn')}</Text>
          <Icon name="arrow-right" size={18} color={Colors.paper2} />
        </TouchableOpacity>
      </View>

      {/* Bottom sheet */}
      <MealSheet
        visible={showSheet}
        food={food}
        portion={portion}
        meals={meals}
        onSelect={handleAdd}
        onDismiss={() => setShowSheet(false)}
      />

      {/* Kcal quick-edit modal */}
      <EditKcalModal
        visible={kcalModalVisible}
        currentKcal={food.per100.kcal}
        onSave={(kcal) => {
          onUpdateFood?.({ ...food, per100: { ...food.per100, kcal } });
          setKcalModalVisible(false);
        }}
        onCancel={() => setKcalModalVisible(false)}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },

  // Topbar
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
  },
  topbarRight: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBtn: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  aiBtnLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.signal,
    letterSpacing: 0.5,
  },

  // Hero
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  heroEyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 10,
  },
  heroTitle: {
    fontFamily: Fonts.serif,
    fontSize: 42,
    lineHeight: 44,
    letterSpacing: -0.8,
    color: Colors.ink,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.muted,
    lineHeight: 21,
  },

  // Photo placeholder
  photoPlaceholder: {
    marginHorizontal: 24,
    aspectRatio: 16 / 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.paper2,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 14,
    overflow: 'hidden',
  },
  photoMeta: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.muted2,
  },

  // Compat strip
  compatStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 4,
    gap: 8,
  },
  compatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 100,
    borderWidth: 1,
  },
  compatOk: {
    borderColor: 'rgba(63,90,58,0.35)',
    backgroundColor: 'rgba(63,90,58,0.04)',
  },
  compatWarn: {
    borderColor: 'rgba(139,58,46,0.35)',
    backgroundColor: 'rgba(139,58,46,0.04)',
  },
  compatText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
  },
  compatTextOk: { color: Colors.ok },
  compatTextWarn: { color: Colors.warn },

  // Section wrapper
  section: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 6,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionHeadLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexShrink: 1,
  },
  sectionNum: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.muted2,
  },
  sectionTitle: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
    fontWeight: '500',
    flexShrink: 1,
  },
  sectionRight: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.muted2,
    textAlign: 'right',
    flexShrink: 0,
    marginLeft: 8,
  },
  sectionMicrolabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 6,
  },

  // Lede
  lede: {
    fontFamily: Fonts.serifItalic,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.ink2,
    marginBottom: 14,
  },
  ledeBold: {
    fontWeight: '700',
  },

  // Nutrient table
  nutriTable: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  nutriRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  nutriRowBorderless: {
    borderTopWidth: 0,
  },
  nutriRowIndent: {
    paddingLeft: 16,
  },
  nutriValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  nutriName: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink2,
  },
  nutriNameMuted: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
  },
  nutriNameLarge: {
    fontFamily: Fonts.serif,
    fontSize: 17,
    color: Colors.ink,
  },
  nutriVal: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.ink,
    letterSpacing: 0.3,
  },
  nutriValLarge: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.ink,
  },
  nutriValZero: {
    color: Colors.signal,
  },
  kcalValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nutriPct: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted2,
    minWidth: 38,
    textAlign: 'right',
  },

  // Three-column table
  nutri3: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  nutri3Row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
    gap: 12,
  },
  nutri3Name: {
    flex: 1.1,
  },
  nutri3NameText: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    color: Colors.ink,
    letterSpacing: -0.1,
  },
  nutri3Sub: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.muted2,
    marginTop: 2,
  },
  nutri3Qty: {
    flex: 0.55,
  },
  nutri3QtyText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.ink,
    letterSpacing: 0.2,
  },
  nutri3AnrText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted2,
    marginTop: 2,
  },
  nutri3Role: {
    flex: 1.6,
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 17,
  },

  // Note text
  noteText: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.muted,
    lineHeight: 19,
    marginTop: 14,
  },

  // Fatty acids bar
  faBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: Colors.hairline,
  },
  faLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    columnGap: 18,
    marginBottom: 6,
  },
  faLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    width: '45%',
  },
  faSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  faLegendText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.ink2,
    flexShrink: 1,
  },

  // FODMAP
  fodmapRulerWrap: {
    marginTop: 14,
    marginBottom: 50,
    position: 'relative',
  },
  fodmapTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fodmapTrackSegment: {
    height: 8,
  },
  fodmapMarkerGroup: {
    position: 'absolute',
    top: -4,
    alignItems: 'center',
    transform: [{ translateX: -10 }],
  },
  fodmapMarker: {
    width: 2,
    height: 16,
    backgroundColor: Colors.ink,
  },
  fodmapLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.ink2,
    marginTop: 4,
    textAlign: 'center',
  },
  fodmapLabelSub: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    color: Colors.muted2,
    marginTop: 1,
    textAlign: 'center',
  },
  fodmapTypeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  fodmapTypeRowFirst: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  fodmapTypeName: {
    flex: 1.6,
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink2,
  },
  fodmapTypeVal: {
    flex: 0.6,
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 0.4,
    color: Colors.muted,
  },
  fodmapTypeWarn: { color: Colors.warn },
  fodmapTypeOk: { color: Colors.ok },
  fodmapTypeLevel: {
    flex: 0.6,
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted,
    textAlign: 'right',
  },
  altGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  altCard: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
  },
  altName: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    letterSpacing: -0.2,
    color: Colors.ink,
    lineHeight: 19,
  },
  altWhy: {
    fontFamily: Fonts.sans,
    fontSize: 11.5,
    color: Colors.muted,
    lineHeight: 16,
    marginTop: 4,
  },

  // Metabolic
  metabolicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
    gap: 10,
  },
  metabolicRowFirst: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  metabolicAxis: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    letterSpacing: -0.2,
    color: Colors.ink,
    width: 110,
  },
  metabolicTag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  metabolicTagHigh: {
    borderColor: 'rgba(63,90,58,0.35)',
  },
  metabolicTagMid: {
    borderColor: 'rgba(107,90,46,0.3)',
  },
  metabolicTagText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    color: Colors.ink2,
  },
  metabolicTagTextHigh: { color: Colors.ok },
  metabolicTagTextMid: { color: Colors.signal },
  metabolicText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.muted,
    lineHeight: 18,
  },

  // Sensory
  sensoryAxis: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
    paddingVertical: 12,
    gap: 12,
  },
  sensoryLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.muted,
    width: 70,
    paddingTop: 4,
  },
  sensoryWords: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sensoryWordPill: {
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  sensoryWordText: {
    fontFamily: Fonts.serifItalic,
    fontSize: 15,
    color: Colors.ink,
  },
  sensoryPairings: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
    paddingTop: 14,
    paddingBottom: 4,
  },

  // Allergens
  allergenGrid: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  allergenGridRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  allergenCell: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  allergenDivider: {
    width: 1,
    backgroundColor: Colors.hairline2,
    marginHorizontal: 8,
  },
  allergenName: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink2,
    flex: 1,
  },
  allergenStatus: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.5,
  },

  // Ingredients
  ingredientsText: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    lineHeight: 21,
    color: Colors.ink2,
  },
  ingredientsHighlight: {
    backgroundColor: 'rgba(139,58,46,0.12)',
    color: Colors.warn,
    fontWeight: '500',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 16,
    backgroundColor: Colors.paper,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  portionPicker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 100,
    backgroundColor: Colors.card,
    height: 56,
    overflow: 'hidden',
  },
  portionBtn: {
    width: 48,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionValue: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionNum: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.ink,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  portionUnit: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginTop: 3,
  },
  addBtn: {
    height: 56,
    paddingHorizontal: 22,
    borderRadius: 100,
    backgroundColor: Colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtnText: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.paper2,
    letterSpacing: 0.1,
  },

  // Bottom sheet
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,12,8,0.4)',
    justifyContent: 'flex-end',
    zIndex: 50,
  },
  sheet: {
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingBottom: 34,
    paddingTop: 14,
  },
  sheetGrabber: {
    width: 38,
    height: 4,
    backgroundColor: Colors.hairline,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    color: Colors.ink,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  sheetSub: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    marginBottom: 18,
  },
  mealOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  mealOptionLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  mealOptionName: {
    fontFamily: Fonts.serif,
    fontSize: 19,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  mealOptionTime: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  mealOptionCount: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted,
  },
});
