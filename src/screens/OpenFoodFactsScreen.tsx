/**
 * OpenFoodFactsScreen — stack 'openFoodFacts'
 * Recherche dans Open Food Facts (+3 M produits, API REST fr/fr).
 * Chips de catégories, compatibilité allergènes en temps réel, enrichissement IA optionnel.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { HelpButton, HelpModal } from '../components/HelpModal';
import { HELP } from '../data/helpContent';
import { Colors, Fonts } from '../theme/tokens';
import { Food } from '../types';
import { AppSettings } from '../types/settings';
import { UserProfile } from '../data/user';
import { OFFProduct, offProductToFood, searchOFF, searchOFFByCategory } from '../services/openFoodFacts';
import { enrichFoodWithAI, isAIReady } from '../services/aiService';
import { aiQueue } from '../services/aiQueue';
import { LabelAnalysis, TextSegment, analyzeLabel } from '../data/labelAnalysis';

// ── Highlighted ingredients ────────────────────────────────────

const FLAG_COLOR: Record<'high' | 'medium' | 'low', { text: string; bg: string }> = {
  high:   { text: '#8B3A2E', bg: 'rgba(139,58,46,0.13)' },
  medium: { text: '#6B5A2E', bg: 'rgba(107,90,46,0.11)' },
  low:    { text: '#8A8270', bg: 'rgba(138,130,112,0.10)' },
};

function HighlightedIngredients({ segments }: { segments: TextSegment[] }) {
  return (
    <Text style={styles.ingredientsText}>
      {segments.map((seg, i) => {
        if (!seg.flag) return <Text key={i}>{seg.text}</Text>;
        const fc = FLAG_COLOR[seg.flag.level];
        return (
          <Text key={i} style={{ color: fc.text, backgroundColor: fc.bg, fontFamily: Fonts.sansMedium }}>
            {seg.text}
          </Text>
        );
      })}
    </Text>
  );
}

// ── Score gauge ────────────────────────────────────────────────

const SCORE_CONFIG = {
  good:    { color: '#3F5A3A', bg: 'rgba(63,90,58,0.09)',   border: 'rgba(63,90,58,0.3)',   label: 'Digestion facile' },
  caution: { color: '#6B5A2E', bg: 'rgba(107,90,46,0.09)', border: 'rgba(107,90,46,0.3)',  label: 'Attention à la portion' },
  bad:     { color: '#8B3A2E', bg: 'rgba(139,58,46,0.09)', border: 'rgba(139,58,46,0.3)',  label: 'Déconseillé Low FODMAP' },
};

// ── Result card ────────────────────────────────────────────────

function ResultCard({
  product,
  imported,
  profile,
  onImport,
}: {
  product: OFFProduct;
  imported: boolean;
  profile: UserProfile;
  onImport: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const n     = product.nutriments ?? {};
  const kcal  = Math.round(n['energy-kcal_100g'] ?? (n['energy_100g'] ?? 0) / 4.184);
  const name  = (product.product_name_fr || product.product_name || '—').trim();
  const brand = (product.brands ?? '').split(',')[0].trim();
  const glyph = name.charAt(0).toUpperCase();

  const analysis = analyzeLabel(product, profile);
  const sc       = SCORE_CONFIG[analysis.digestiveLevel];
  const topFlags = analysis.flags.slice(0, 2);
  const hasAnalysis = analysis.flags.length > 0 || analysis.positives.length > 0;
  const hasIngredients = analysis.segments.some((s) => s.text.trim().length > 0);

  return (
    <View style={styles.card}>
      {/* Header: glyph + name + macros */}
      <View style={styles.cardBody}>
        <View style={styles.glyph}>
          <Text style={styles.glyphText}>{glyph}</Text>
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardName} numberOfLines={2}>{name}</Text>
          {brand ? <Text style={styles.cardBrand}>{brand}</Text> : null}
          <View style={styles.cardMeta}>
            {kcal > 0 && (
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>{kcal} kcal</Text>
              </View>
            )}
            {(n.proteins_100g ?? 0) > 0 && (
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>{Math.round(n.proteins_100g!)}g prot.</Text>
              </View>
            )}
            {(n.carbohydrates_100g ?? 0) > 0 && (
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>{Math.round(n.carbohydrates_100g!)}g gluc.</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── Compact label analysis bar ── */}
      <TouchableOpacity
        style={[styles.analysisBar, { backgroundColor: sc.bg, borderColor: sc.border }]}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.8}
      >
        {/* Score pill */}
        <View style={[styles.scorePill, { borderColor: sc.border }]}>
          <Text style={[styles.scoreNum, { color: sc.color }]}>{analysis.digestiveScore}</Text>
          <Text style={[styles.scoreSlash, { color: sc.color }]}>/100</Text>
        </View>

        {/* Top flags preview */}
        <View style={styles.flagsPreview}>
          {topFlags.length > 0
            ? topFlags.map((f, i) => (
                <View key={i} style={[styles.flagChip, { backgroundColor: FLAG_COLOR[f.level].bg, borderColor: FLAG_COLOR[f.level].text + '35' }]}>
                  <Text style={[styles.flagChipIcon, { color: FLAG_COLOR[f.level].text }]}>
                    {f.level === 'low' ? '💡' : '⚠'}
                  </Text>
                  <Text style={[styles.flagChipText, { color: FLAG_COLOR[f.level].text }]} numberOfLines={1}>
                    {f.matchedText}
                  </Text>
                </View>
              ))
            : <Text style={[styles.allClearText, { color: sc.color }]}>{sc.label}</Text>
          }
        </View>

        {/* Expand chevron */}
        {hasAnalysis && (
          <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={sc.color} />
        )}
      </TouchableOpacity>

      {/* ── Expanded analysis ── */}
      {expanded && (
        <View style={styles.analysisExpanded}>
          {/* Score header */}
          <View style={styles.scoreHeader}>
            <View style={{ gap: 2 }}>
              <Text style={styles.analysisEyebrow}>Score digestif personnalisé</Text>
              <View style={styles.scoreRow}>
                <Text style={[styles.scoreBig, { color: sc.color }]}>{analysis.digestiveScore}</Text>
                <Text style={styles.scoreOf}>/100</Text>
                <View style={[styles.levelPill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                  <Text style={[styles.levelPillText, { color: sc.color }]}>{sc.label}</Text>
                </View>
              </View>
            </View>
            {/* Score bar */}
            <View style={styles.scorebar}>
              <View style={[styles.scorebarFill, { width: `${analysis.digestiveScore}%`, backgroundColor: sc.color }]} />
            </View>
          </View>

          {/* Flags */}
          {analysis.flags.length > 0 && (
            <View style={styles.flagsBlock}>
              <Text style={styles.blockTitle}>Alertes ingrédients</Text>
              {analysis.flags.map((f, i) => {
                const fc = FLAG_COLOR[f.level];
                return (
                  <View key={i} style={[styles.flagRow, { borderBottomColor: Colors.hairline2 }]}>
                    <Text style={[styles.flagIcon, { color: fc.text }]}>
                      {f.level === 'high' ? '⚠' : f.level === 'medium' ? '▲' : '💡'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <View style={styles.flagHead}>
                        <Text style={[styles.flagMatch, { color: fc.text }]}>{f.matchedText}</Text>
                        <View style={[styles.flagConcernBadge, { backgroundColor: fc.bg, borderColor: fc.text + '35' }]}>
                          <Text style={[styles.flagConcernText, { color: fc.text }]}>
                            {f.category === 'fodmap' ? 'FODMAP' : 'Additif'} · {f.concern}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.flagDetail}>{f.detail}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Positives */}
          {analysis.positives.length > 0 && (
            <View style={styles.positivesBlock}>
              <Text style={styles.blockTitle}>Points positifs</Text>
              <View style={styles.positivesRow}>
                {analysis.positives.map((p, i) => (
                  <View key={i} style={styles.positivePill}>
                    <Text style={styles.positiveIcon}>✅</Text>
                    <Text style={styles.positiveText}>{p}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Highlighted ingredients */}
          {hasIngredients && (
            <View style={styles.ingredientsBlock}>
              <Text style={styles.blockTitle}>Ingrédients</Text>
              <HighlightedIngredients segments={analysis.segments} />
            </View>
          )}
        </View>
      )}

      {/* Import button */}
      <TouchableOpacity
        style={[styles.importBtn, imported && styles.importBtnDone]}
        onPress={onImport}
        activeOpacity={0.7}
        disabled={imported}
      >
        {imported ? (
          <>
            <Icon name="check" size={14} color={Colors.ok} />
            <Text style={styles.importBtnDoneText}>Ajouté</Text>
          </>
        ) : (
          <>
            <Icon name="plus" size={14} color={Colors.ink} />
            <Text style={styles.importBtnText}>Importer</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ── Category chips ─────────────────────────────────────────────

const GROUPS: { label: string; icon: string; tag: string }[] = [
  { label: 'Céréales',          icon: '🌾', tag: 'en:cereals-and-their-products' },
  { label: 'Légumineuses',      icon: '🌱', tag: 'en:legumes' },
  { label: 'Viandes',           icon: '🥩', tag: 'en:meats' },
  { label: 'Poissons',          icon: '🐟', tag: 'en:seafood' },
  { label: 'Fruits',            icon: '🍎', tag: 'en:fruits' },
  { label: 'Légumes',           icon: '🥦', tag: 'en:vegetables' },
  { label: 'Produits laitiers', icon: '🥛', tag: 'en:dairy-products' },
  { label: 'Corps gras',        icon: '🧈', tag: 'en:fats' },
  { label: 'Boissons',          icon: '🥤', tag: 'en:beverages' },
];

function GroupChip({ label, icon, active, onPress }: { label: string; icon: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.groupChip, active && styles.groupChipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.groupChipIcon}>{icon}</Text>
      <Text style={[styles.groupChipText, active && styles.groupChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────

interface Props {
  existingIds: Set<string>;
  profile: UserProfile;
  onImport: (food: Food) => void;
  onUpdateFood: (food: Food) => void;
  onBack: () => void;
  settings?: AppSettings;
  initialQuery?: string;
}

export function OpenFoodFactsScreen({ existingIds, profile, onImport, onUpdateFood, onBack, settings, initialQuery = '' }: Props) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState(initialQuery);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [products, setProducts] = useState<OFFProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [helpVisible, setHelpVisible] = useState(false);

  useEffect(() => {
    if (initialQuery.trim()) runSearch({ text: initialQuery.trim() });
  }, []);

  const runSearch = async (opts: { text?: string; categoryTag?: string }) => {
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const result = opts.categoryTag
        ? await searchOFFByCategory(opts.categoryTag)
        : await searchOFF(opts.text ?? '');
      const valid = result.products.filter(
        (p) => (p.product_name_fr || p.product_name) && (p.nutriments?.['energy-kcal_100g'] ?? 0) > 0
      );
      setProducts(valid);
    } catch (e: unknown) {
      setError((e as Error).message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;
    setActiveGroup(null);
    void runSearch({ text: q });
  };

  const handleGroupPress = (group: typeof GROUPS[0]) => {
    if (activeGroup === group.label) {
      setActiveGroup(null);
      setProducts([]);
      setSearched(false);
      return;
    }
    setActiveGroup(group.label);
    setQuery('');
    void runSearch({ categoryTag: group.tag });
  };

  const handleImport = (product: OFFProduct) => {
    const pid = product.code || product.id;
    if (importedIds.has(pid)) return;

    const baseFood = offProductToFood(product);
    if (existingIds.has(baseFood.id)) {
      setImportedIds((prev) => new Set([...prev, pid]));
      return;
    }

    onImport(baseFood);
    setImportedIds((prev) => new Set([...prev, pid]));

    if (settings && isAIReady(settings)) {
      const capturedUpdate = onUpdateFood;
      aiQueue.add(`Enrichissement · ${baseFood.name}`, async () => {
        const enriched = await enrichFoodWithAI(baseFood, settings!);
        capturedUpdate(enriched);
      });
    }
  };

  const isImported = (p: OFFProduct) => {
    const pid = p.code || p.id;
    return importedIds.has(pid) || existingIds.has(`off-${pid}-001`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
          <Icon name="back" size={20} color={Colors.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Base de données mondiale</Text>
          <Text style={styles.title}>Open Food Facts</Text>
        </View>
        <HelpButton onPress={() => setHelpVisible(true)} />
      </View>
      <HelpModal visible={helpVisible} content={HELP.openFoodFacts} onClose={() => setHelpVisible(false)} />

      {/* Search input */}
      <View style={styles.searchWrap}>
        <View style={styles.searchInput}>
          <Icon name="search" size={18} color={Colors.muted2} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Rechercher un produit, une marque…"
            placeholderTextColor={Colors.muted2}
            value={query}
            onChangeText={(t) => { setQuery(t); if (t) setActiveGroup(null); }}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setActiveGroup(null); setProducts([]); setSearched(false); }} activeOpacity={0.7}>
              <Text style={styles.clearBtn}>Effacer</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.searchBtn, !query.trim() && styles.searchBtnDisabled]}
          onPress={handleSearch}
          activeOpacity={0.8}
          disabled={!query.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.paper2} />
          ) : (
            <Icon name="search" size={18} color={Colors.paper2} />
          )}
        </TouchableOpacity>
      </View>

      {/* Category strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.groupStrip}
      >
        {GROUPS.map((g) => (
          <GroupChip
            key={g.label}
            label={g.label}
            icon={g.icon}
            active={activeGroup === g.label}
            onPress={() => handleGroupPress(g)}
          />
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
      >
        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Icon name="alert" size={16} color={Colors.warn} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Empty */}
        {searched && !loading && products.length === 0 && !error && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptyDesc}>
              Essaie un autre terme ou vérifie l'orthographe.{'\n'}
              Open Food Facts contient 3 millions de produits.
            </Text>
          </View>
        )}

        {/* Intro (before first search) */}
        {!searched && (
          <View style={styles.intro}>
            <Icon name="database" size={28} color={Colors.muted2} />
            <Text style={styles.introTitle}>3 millions de produits</Text>
            <Text style={styles.introDesc}>
              Recherche par nom ou parcours par catégorie.
              Les données nutritionnelles sont importées directement
              dans ta liste locale.
            </Text>
          </View>
        )}

        {/* Results */}
        {products.length > 0 && (
          <>
            <View style={styles.resultHeader}>
              <Text style={styles.resultCount}>{products.length} résultats</Text>
              <Text style={styles.resultSource}>Open Food Facts · France</Text>
            </View>
            {products.map((p) => (
              <ResultCard
                key={p.code || p.id}
                product={p}
                imported={isImported(p)}
                profile={profile}
                onImport={() => handleImport(p)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  eyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  title: { fontFamily: Fonts.serif, fontSize: 24, color: Colors.ink, letterSpacing: -0.4 },
  offBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.ok,
  },
  offBadgeText: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1,
    color: Colors.paper2,
  },

  searchWrap: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.ink,
    paddingVertical: 0,
  },
  clearBtn: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.muted,
    textTransform: 'uppercase',
  },
  searchBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnDisabled: { opacity: 0.4 },

  groupStrip: { paddingHorizontal: 16, paddingBottom: 10, gap: 6, flexDirection: 'row' },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.paper2,
  },
  groupChipActive: { backgroundColor: Colors.ok, borderColor: Colors.ok },
  groupChipIcon: { fontSize: 12 },
  groupChipText: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 0.8, color: Colors.muted },
  groupChipTextActive: { color: Colors.paper2 },

  list: { paddingHorizontal: 16, gap: 10 },

  errorBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(139,58,46,0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139,58,46,0.2)',
    padding: 14,
    alignItems: 'flex-start',
  },
  errorText: { flex: 1, fontFamily: Fonts.sans, fontSize: 13, color: Colors.warn, lineHeight: 18 },

  emptyBox: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.ink },
  emptyDesc: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  intro: { alignItems: 'center', paddingVertical: 48, gap: 14 },
  introTitle: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.ink, letterSpacing: -0.3 },
  introDesc: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },

  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  resultCount: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.ink,
  },
  resultSource: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.muted2,
  },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    padding: 14,
    gap: 12,
  },
  cardBody: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  glyph: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  glyphText: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.paper2 },
  cardText: { flex: 1, gap: 3 },
  cardName: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.ink, lineHeight: 19 },
  cardBrand: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 4 },
  metaPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 100,
    backgroundColor: Colors.paper2,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  metaPillText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.5, color: Colors.muted },

  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.paper2,
  },
  importBtnDone: {
    borderColor: 'rgba(63,90,58,0.3)',
    backgroundColor: 'rgba(63,90,58,0.06)',
  },
  importBtnText: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink },
  importBtnDoneText: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ok },

  // ── Label analysis ───────────────────────────────────────────
  analysisBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 6,
    flexShrink: 0,
  },
  scoreNum: { fontFamily: Fonts.serif, fontSize: 16, lineHeight: 18, letterSpacing: -0.3 },
  scoreSlash: { fontFamily: Fonts.mono, fontSize: 9 },
  flagsPreview: { flex: 1, flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  flagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  flagChipIcon: { fontSize: 10 },
  flagChipText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.3 },
  allClearText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.5, flex: 1 },

  // Expanded analysis
  analysisExpanded: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
    paddingTop: 14,
    gap: 14,
  },
  scoreHeader: { gap: 8 },
  analysisEyebrow: {
    fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.8,
    textTransform: 'uppercase', color: Colors.muted,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  scoreBig: { fontFamily: Fonts.serif, fontSize: 32, lineHeight: 34, letterSpacing: -0.8 },
  scoreOf: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.muted, marginRight: 4 },
  levelPill: {
    borderWidth: 1, borderRadius: 100,
    paddingVertical: 4, paddingHorizontal: 10,
  },
  levelPillText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.5 },
  scorebar: {
    height: 5, backgroundColor: Colors.hairline, borderRadius: 3, overflow: 'hidden',
  },
  scorebarFill: { height: '100%', borderRadius: 3 },

  // Block titles
  blockTitle: {
    fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.8,
    textTransform: 'uppercase', color: Colors.muted, marginBottom: 8,
  },

  // Flags
  flagsBlock: { borderTopWidth: 1, borderTopColor: Colors.hairline2, paddingTop: 12 },
  flagRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  flagIcon: { fontSize: 13, width: 16, textAlign: 'center', marginTop: 1 },
  flagHead: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 },
  flagMatch: { fontFamily: Fonts.sansMedium, fontSize: 13 },
  flagConcernBadge: {
    borderWidth: 1, borderRadius: 100,
    paddingVertical: 2, paddingHorizontal: 7,
  },
  flagConcernText: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 0.5 },
  flagDetail: {
    fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted,
    letterSpacing: 0.2, lineHeight: 14,
  },

  // Positives
  positivesBlock: { borderTopWidth: 1, borderTopColor: Colors.hairline2, paddingTop: 12 },
  positivesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  positivePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: 'rgba(63,90,58,0.3)',
    borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10,
    backgroundColor: 'rgba(63,90,58,0.06)',
  },
  positiveIcon: { fontSize: 10 },
  positiveText: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 0.3, color: Colors.ok },

  // Ingredients
  ingredientsBlock: { borderTopWidth: 1, borderTopColor: Colors.hairline2, paddingTop: 12 },
  ingredientsText: {
    fontFamily: Fonts.sans, fontSize: 12,
    color: Colors.ink2, lineHeight: 20,
  },
});
