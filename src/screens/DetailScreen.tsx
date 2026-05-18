/**
 * DetailScreen — stack 'detail'
 * Fiche complète d'un aliment : macros, acides aminés, acides gras, vitamines,
 * minéraux, FODMAP, composés bioactifs, profil sensoriel.
 * Permet l'ajout au repas du journal du jour.
 */
import React, { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { HelpButton, HelpModal } from '../components/HelpModal';
import { HELP } from '../data/helpContent';
import { INITIAL_MEALS } from '../data/food';
import { UserProfile } from '../data/user';
import { computeCompatibilityScore } from '../data/compatibilityScore';
import { CompatCard } from '../components/CompatibilityBadge';
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
        <Text style={styles.nutri3QtyText}>{qty}</Text>
        {anr ? <Text style={styles.nutri3AnrText}>{anr} ANR</Text> : null}
      </View>
      <Text style={styles.nutri3Role}>{role}</Text>
    </View>
  );
}

// ── Section 01 · Apports ───────────────────────────────────

function ApportsSection({
  food,
  portion,
}: {
  food: Food;
  portion: number;
}) {
  const f = portion / 100;
  const sc = (v: number) => round1(v * f);

  return (
    <View style={styles.section}>
      <SectionHead num="01" title="Apports" right={`pour ${portion} ${food.unit}`} />
      <View style={styles.nutriTable}>
        <View style={[styles.nutriRow, styles.nutriRowBorderless]}>
          <Text style={styles.nutriNameLarge}>Énergie</Text>
          <Text style={styles.nutriValLarge}>{Math.round(food.per100.kcal * f)} kcal</Text>
        </View>
        <View style={styles.nutriRow}>
          <Text style={styles.nutriName}>Protéines</Text>
          <View style={styles.nutriValRow}>
            <Text style={styles.nutriVal}>{sc(food.per100.protein)} g</Text>
            <Text style={styles.nutriPct}>
              {Math.round((food.per100.protein * f) / 130) * 100}%
            </Text>
          </View>
        </View>
        <View style={styles.nutriRow}>
          <Text style={styles.nutriName}>Glucides</Text>
          <View style={styles.nutriValRow}>
            <Text style={styles.nutriVal}>{sc(food.per100.carbs)} g</Text>
            <Text style={styles.nutriPct}>
              {Math.round((food.per100.carbs * f) / 220) * 100}%
            </Text>
          </View>
        </View>
        <View style={styles.nutriRow}>
          <Text style={styles.nutriName}>Lipides</Text>
          <View style={styles.nutriValRow}>
            <Text style={styles.nutriVal}>{sc(food.per100.fat)} g</Text>
            <Text style={styles.nutriPct}>
              {Math.round((food.per100.fat * f) / 70) * 100}%
            </Text>
          </View>
        </View>
        <View style={styles.nutriRow}>
          <Text style={styles.nutriName}>Sel</Text>
          <Text style={styles.nutriVal}>{(food.per100.salt * f).toFixed(2)} g</Text>
        </View>
      </View>
    </View>
  );
}

// ── Section 02 · Protéines ─────────────────────────────────

function ProteinSection({ p }: { p: ProteinDetail }) {
  return (
    <View style={styles.section}>
      <SectionHead
        num="02"
        title="Protéines & acides aminés"
        right={`${p.totalG} g · PDCAAS ${p.pdcaas}`}
      />
      <Text style={styles.lede}>
        Protéine {p.complete ? 'complète' : 'incomplète'} — les 9 acides aminés essentiels sont
        présents. BCAA cumulés :{' '}
        <Text style={styles.ledeBold}>{p.bcaaG} g</Text>, signal anabolique modéré.
      </Text>
      <View style={styles.nutri3}>
        {p.amino.map((a) => (
          <NutriRow
            key={a.name}
            name={a.name}
            sub={a.essential ? 'Essentiel' : 'Non-essentiel'}
            qty={a.qty}
            role={a.role}
          />
        ))}
      </View>
    </View>
  );
}

// ── Section 03 · Glucides ──────────────────────────────────

function CarbSection({ c }: { c: CarbDetail }) {
  return (
    <View style={styles.section}>
      <SectionHead
        num="03"
        title="Glucides"
        right={`IG ${c.glycemicIndex} · CG ${c.glycemicLoad}`}
      />
      <View style={styles.nutriTable}>
        <View style={[styles.nutriRow, styles.nutriRowBorderless]}>
          <Text style={styles.nutriNameLarge}>Glucides totaux</Text>
          <Text style={styles.nutriValLarge}>{c.totalG} g</Text>
        </View>
        <View style={[styles.nutriRow, styles.nutriRowIndent]}>
          <Text style={styles.nutriNameMuted}>Amidons complexes</Text>
          <Text style={styles.nutriVal}>{c.starchG} g</Text>
        </View>
        <View style={[styles.nutriRow, styles.nutriRowIndent]}>
          <Text style={styles.nutriNameMuted}>Sucres simples</Text>
          <Text style={styles.nutriVal}>{c.sugarsG} g</Text>
        </View>
        <View style={styles.nutriRow}>
          <Text style={styles.nutriNameLarge}>Fibres alimentaires</Text>
          <Text style={styles.nutriValLarge}>{c.fiberG} g</Text>
        </View>
        <View style={[styles.nutriRow, styles.nutriRowIndent]}>
          <Text style={styles.nutriNameMuted}>Solubles (prébiotiques)</Text>
          <Text style={styles.nutriVal}>{c.fiberSolubleG} g</Text>
        </View>
        <View style={[styles.nutriRow, styles.nutriRowIndent]}>
          <Text style={styles.nutriNameMuted}>Insolubles (transit)</Text>
          <Text style={styles.nutriVal}>{c.fiberInsolubleG} g</Text>
        </View>
      </View>
      <Text style={styles.noteText}>{c.notes}</Text>
    </View>
  );
}

// ── Section 04 · Lipides ───────────────────────────────────

function LipidSection({ l }: { l: LipidDetail }) {
  const parsed = l.fa.map((fa, i) => {
    const m = fa.pct.match(/(\d+(?:\.\d+)?)/);
    return { ...fa, num: m ? parseFloat(m[1]) : 0, color: FA_COLORS[i % FA_COLORS.length] };
  });
  const sum = parsed.reduce((s, f) => s + f.num, 0) || 100;

  return (
    <View style={styles.section}>
      <SectionHead num="04" title="Lipides & acides gras" right={`${l.totalG} g · ${l.ratioOmega}`} />

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
            sub={`${fa.pct} du total`}
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
  const pct = (str: string) =>
    Math.min(100, (parseFloat(str) / FODMAP_MAX) * 100);

  const markers = [
    { pct: pct(f.elimination.portion), label: 'Élimination', sub: `${f.elimination.portion} g` },
    {
      pct: pct(f.reintroduction.portion),
      label: 'Réintroduction',
      sub: `${f.reintroduction.portion} g`,
    },
    { pct: pct(f.absoluteLimit.portion), label: 'Limite', sub: `${f.absoluteLimit.portion} g` },
  ];

  return (
    <View style={styles.section}>
      <SectionHead num="07" title="FODMAP" right={`profil ${f.overall.toUpperCase()}`} />
      <Text style={styles.lede}>
        Trois seuils calculés pour la phase d'élimination, de réintroduction et la dose maximale
        tolérée. Échelle de référence : 0 → 300 g cuit.
      </Text>

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
      <Text style={styles.sectionMicrolabel}>Types présents</Text>
      <View>
        {f.types.map((t, i) => {
          const isOk = t.present === 'non';
          const isWarn = t.present === 'oui';
          return (
            <View
              key={t.name}
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
                {t.present.toUpperCase()}
              </Text>
              <Text style={styles.fodmapTypeLevel}>{t.level}</Text>
            </View>
          );
        })}
      </View>

      {/* Alternatives */}
      <Text style={[styles.sectionMicrolabel, { marginTop: 22 }]}>Alternatives low FODMAP</Text>
      <View style={styles.altGrid}>
        {f.alternatives.map((a) => (
          <View key={a.name} style={styles.altCard}>
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
  return (
    <View style={styles.section}>
      <SectionHead num="08" title="Molécules bioactives" right="composés non-essentiels" />
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
  const toneLabel = (tone: MetabolicItem['tone']) => {
    if (tone === 'high') return '↑ favorable';
    if (tone === 'mid') return '~ modéré';
    return '↓ faible impact';
  };

  return (
    <View style={styles.section}>
      <SectionHead num="09" title="Action métabolique" />
      <View>
        {items.map((m, i) => (
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
  const axes: { label: string; words: string[] }[] = [
    { label: 'Goût', words: s.taste },
    { label: 'Texture', words: s.texture },
    { label: 'Arôme', words: s.aroma },
  ];

  return (
    <View style={styles.section}>
      <SectionHead num="10" title="Profil sensoriel" />
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
        <Text style={styles.sectionMicrolabel}>Pairings recommandés</Text>
        <View style={[styles.sensoryWords, { marginTop: 8 }]}>
          {s.pairings.map((p) => (
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

const STATUS_MAP: Record<Allergen['status'], { text: string; color: string }> = {
  contains: { text: 'CONTIENT', color: Colors.warn },
  trace: { text: 'TRACES', color: Colors.signal },
  absent: { text: 'ABSENT', color: Colors.ok },
};

function AllergenSection({ allergens }: { allergens: Allergen[] }) {
  const pairs: [Allergen, Allergen | undefined][] = [];
  for (let i = 0; i < allergens.length; i += 2) {
    pairs.push([allergens[i], allergens[i + 1]]);
  }

  return (
    <View style={styles.section}>
      <SectionHead num="11" title="Allergènes" right="14 prioritaires" />
      <View style={styles.allergenGrid}>
        {pairs.map(([left, right], i) => (
          <View key={i} style={styles.allergenGridRow}>
            <AllergenCell item={left} />
            <View style={styles.allergenDivider} />
            {right ? <AllergenCell item={right} /> : <View style={{ flex: 1 }} />}
          </View>
        ))}
      </View>
    </View>
  );
}

function AllergenCell({ item }: { item: Allergen }) {
  const s = STATUS_MAP[item.status];
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
  if (!highlights.length) {
    return (
      <View style={[styles.section, { paddingBottom: 30 }]}>
        <SectionHead num="12" title="Composition" />
        <Text style={styles.ingredientsText}>{text}</Text>
      </View>
    );
  }

  const re = new RegExp(`(${highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(re);

  return (
    <View style={[styles.section, { paddingBottom: 30 }]}>
      <SectionHead num="12" title="Composition" />
      <Text style={styles.ingredientsText}>
        {parts.map((part, i) => {
          const isHL = highlights.some((h) => part.toLowerCase() === h.toLowerCase());
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
        <Text style={styles.sheetTitle}>À quel repas ?</Text>
        <Text style={styles.sheetSub}>
          {kcal} kcal · {portion} {food.unit} de {food.name}
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
              {m.items.length} aliment{m.items.length !== 1 ? 's' : ''}
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
  onAdd,
}: DetailScreenProps) {
  const insets = useSafeAreaInsets();
  const [portion, setPortion] = useState(food.defaultPortion);
  const [showSheet, setShowSheet] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

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
            <HelpButton onPress={() => setHelpVisible(true)} />
          </View>
        </View>
        <HelpModal visible={helpVisible} content={HELP.detail} onClose={() => setHelpVisible(false)} />

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
          <CompatCard result={computeCompatibilityScore(food, profile)} />
        )}

        {/* Compat strip (static food properties) */}
        {food.compat.length > 0 && (
          <View style={styles.compatStrip}>
            {food.compat.map((c, i) => (
              <CompatPill key={i} item={c} />
            ))}
          </View>
        )}

        {/* Sections */}
        <ApportsSection food={food} portion={portion} />
        {food.proteinDetail && <ProteinSection p={food.proteinDetail} />}
        {food.carbDetail && <CarbSection c={food.carbDetail} />}
        {food.lipidDetail && <LipidSection l={food.lipidDetail} />}
        {food.minerals && (
          <NutriTableSection num="05" title="Minéraux" right="ANR adulte" items={food.minerals} />
        )}
        {food.vitamins && (
          <NutriTableSection num="06" title="Vitamines" right="ANR adulte" items={food.vitamins} />
        )}
        {food.trace && (
          <NutriTableSection
            num="06b"
            title="Oligo-éléments & nutriments"
            right="ANR adulte"
            items={food.trace}
          />
        )}
        {food.fodmap && <FodmapSection f={food.fodmap} />}
        {food.bioactives && <BioactiveSection items={food.bioactives} />}
        {food.metabolic && <MetabolicSection items={food.metabolic} />}
        {food.sensory && <SensorySection s={food.sensory} />}
        <AllergenSection allergens={food.allergens} />
        <CompositionSection
          text={food.ingredients}
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
            <Text style={styles.portionUnit}>{food.unit} · portion</Text>
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
          <Text style={styles.addBtnText}>Ajouter</Text>
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
