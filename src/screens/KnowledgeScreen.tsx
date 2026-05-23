/**
 * KnowledgeScreen — stack 'knowledge'
 * Encyclopédie nutritionnelle statique 100 % hors-ligne : 80 entrées réparties en
 * vitamines, minéraux, acides aminés, composés bioactifs et concepts digestifs.
 * Navigation interne (KView) : accueil → catégorie → entrée → entrées liées.
 * Mode simple / expert toggleable sur chaque fiche.
 */
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { Colors, Fonts } from '../theme/tokens';
import {
  KnowledgeCategory,
  KnowledgeEntry,
  CATEGORY_META,
} from '../types/knowledge';
import {
  KNOWLEDGE_BASE,
  getCategoryCounts,
  getByCategory,
  getRelated,
  searchKnowledge,
} from '../data/knowledgeBase';

// ── Types de vue interne ──────────────────────────────────────

type KView =
  | { type: 'home' }
  | { type: 'list'; category: KnowledgeCategory | null; query: string }
  | { type: 'entry'; entry: KnowledgeEntry; from: KView };

// ── Petit composant : pill de mode Simple / Expert ────────────

function ModeToggle({
  mode,
  onChange,
}: {
  mode: 'simple' | 'expert';
  onChange: (m: 'simple' | 'expert') => void;
}) {
  return (
    <View style={styles.modeToggle}>
      <TouchableOpacity
        style={[styles.modeBtn, mode === 'simple' && styles.modeBtnActive]}
        onPress={() => onChange('simple')}
        activeOpacity={0.75}
      >
        <Text style={[styles.modeBtnText, mode === 'simple' && styles.modeBtnTextActive]}>
          Simple
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeBtn, mode === 'expert' && styles.modeBtnActive]}
        onPress={() => onChange('expert')}
        activeOpacity={0.75}
      >
        <Text style={[styles.modeBtnText, mode === 'expert' && styles.modeBtnTextActive]}>
          Expert
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Vue : Fiche détail ────────────────────────────────────────

function EntryView({
  entry,
  onBack,
  onOpenEntry,
  onOpenMenu,
}: {
  entry: KnowledgeEntry;
  onBack: () => void;
  onOpenEntry: (e: KnowledgeEntry) => void;
  onOpenMenu: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'simple' | 'expert'>('simple');
  const meta = CATEGORY_META[entry.category];
  const related = getRelated(entry);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
          <Icon name="back" size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.iconBtn} onPress={onOpenMenu} activeOpacity={0.7}>
          <Icon name="menu" size={22} />
        </TouchableOpacity>
        <ModeToggle mode={mode} onChange={setMode} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.entryHero}>
          <View style={[styles.entryEmojiWrap, { backgroundColor: meta.bg, borderColor: meta.color + '40' }]}>
            <Text style={styles.entryEmoji}>{entry.emoji}</Text>
          </View>
          <View style={[styles.entryCatPill, { backgroundColor: meta.bg, borderColor: meta.color + '50' }]}>
            <Text style={[styles.entryCatText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={styles.entryName}>{entry.name}</Text>
          {entry.aliases && entry.aliases.length > 0 && (
            <Text style={styles.entryAliases}>{entry.aliases.join(' · ')}</Text>
          )}
          <Text style={styles.entryTagline}>{entry.tagline}</Text>
        </View>

        <View style={styles.divider} />

        {/* Contenu selon mode */}
        {mode === 'simple' ? (
          <View style={styles.contentBlock}>
            <Section label="Qu'est-ce que c'est ?" text={entry.simple.what} />
            <Section label="Pourquoi c'est important" text={entry.simple.why} />
            {entry.simple.deficiency && (
              <Section
                label="Signes de carence"
                text={entry.simple.deficiency}
                accent={Colors.warn}
              />
            )}
            {entry.simple.sources.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Meilleures sources</Text>
                <View style={styles.sourcesGrid}>
                  {entry.simple.sources.map((s) => (
                    <View key={s} style={styles.sourceChip}>
                      <Text style={styles.sourceChipText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.contentBlock}>
            <Section label="Mécanisme" text={entry.expert.mechanism} />

            {entry.expert.interactions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Interactions & synergies</Text>
                {entry.expert.interactions.map((inter, i) => (
                  <View key={i} style={styles.interactionRow}>
                    <View style={styles.interactionDot} />
                    <Text style={styles.interactionText}>{inter}</Text>
                  </View>
                ))}
              </View>
            )}

            {entry.expert.dosage && (
              <View style={[styles.dosageBlock]}>
                <Text style={styles.dosageLabel}>Apport de référence (AJR)</Text>
                <Text style={styles.dosageVal}>
                  {entry.expert.dosage.rda}
                  <Text style={styles.dosageUnit}> {entry.expert.dosage.unit}</Text>
                </Text>
                {entry.expert.dosage.upper && (
                  <Text style={styles.dosageUpper}>
                    Limite supérieure : {entry.expert.dosage.upper} {entry.expert.dosage.unit}
                  </Text>
                )}
              </View>
            )}

            {entry.expert.clinicalNote && (
              <Section
                label="Note clinique"
                text={entry.expert.clinicalNote}
                accent="#2E5A8B"
              />
            )}

            {entry.expert.fodmapNote && (
              <View style={styles.fodmapNoteBlock}>
                <Icon name="activity" size={13} color={Colors.ok} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fodmapNoteLabel}>Note FODMAP</Text>
                  <Text style={styles.fodmapNoteText}>{entry.expert.fodmapNote}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Entrées liées */}
        {related.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedLabel}>Entrées liées</Text>
            <View style={styles.relatedGrid}>
              {related.map((r) => {
                const rm = CATEGORY_META[r.category];
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.relatedCard, { borderColor: rm.color + '30' }]}
                    onPress={() => onOpenEntry(r)}
                    activeOpacity={0.78}
                  >
                    <Text style={styles.relatedEmoji}>{r.emoji}</Text>
                    <Text style={styles.relatedName}>{r.name}</Text>
                    <Text style={styles.relatedTagline} numberOfLines={1}>{r.tagline}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Section({
  label,
  text,
  accent,
}: {
  label: string;
  text: string;
  accent?: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={[styles.sectionText, accent ? { color: accent } : null]}>{text}</Text>
    </View>
  );
}

// ── Vue : Liste d'entrées ─────────────────────────────────────

function ListView({
  entries,
  title,
  onBack,
  onPickEntry,
  onOpenMenu,
}: {
  entries: KnowledgeEntry[];
  title: string;
  onBack: () => void;
  onPickEntry: (e: KnowledgeEntry) => void;
  onOpenMenu: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
          <Icon name="back" size={22} />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>{title}</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={onOpenMenu} activeOpacity={0.7}>
          <Icon name="menu" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.listCount}>{entries.length} entrée{entries.length > 1 ? 's' : ''}</Text>
        {entries.map((e) => (
          <EntryRow key={e.id} entry={e} onPress={() => onPickEntry(e)} />
        ))}
      </ScrollView>
    </View>
  );
}

function EntryRow({
  entry,
  onPress,
}: {
  entry: KnowledgeEntry;
  onPress: () => void;
}) {
  const meta = CATEGORY_META[entry.category];
  return (
    <TouchableOpacity style={styles.entryRow} onPress={onPress} activeOpacity={0.78}>
      <View style={[styles.entryRowEmoji, { backgroundColor: meta.bg }]}>
        <Text style={styles.entryRowEmojiText}>{entry.emoji}</Text>
      </View>
      <View style={styles.entryRowText}>
        <Text style={styles.entryRowName}>{entry.name}</Text>
        <Text style={styles.entryRowTagline} numberOfLines={1}>{entry.tagline}</Text>
      </View>
      <Icon name="chevron-right" size={14} color={Colors.muted2} />
    </TouchableOpacity>
  );
}

// ── Vue : Accueil ─────────────────────────────────────────────

function HomeView({
  onOpenCategory,
  onOpenSearch,
  onBack,
  onOpenMenu,
  onStartDemo,
}: {
  onOpenCategory: (c: KnowledgeCategory) => void;
  onOpenSearch: (q: string) => void;
  onBack: () => void;
  onOpenMenu: () => void;
  onStartDemo?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const counts = useMemo(() => getCategoryCounts(), []);
  const [query, setQuery] = useState('');

  const featuredIds = ['curcumine', 'vit-d', 'magnesium', 'microbiote', 'tryptophane', 'sulforaphane'];
  const featured = featuredIds
    .map((id) => KNOWLEDGE_BASE.find((e) => e.id === id))
    .filter((e): e is KnowledgeEntry => e !== undefined);

  const categories = Object.entries(CATEGORY_META) as [KnowledgeCategory, typeof CATEGORY_META[KnowledgeCategory]][];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
          <Icon name="back" size={22} />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Base de connaissances</Text>
          <Text style={styles.topbarSub}>{KNOWLEDGE_BASE.length} entrées · 100 % hors-ligne</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {onStartDemo && (
            <TouchableOpacity style={styles.iconBtnSignal} onPress={onStartDemo} activeOpacity={0.7}>
              <Icon name="activity" size={18} color={Colors.signal} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconBtn} onPress={onOpenMenu} activeOpacity={0.7}>
            <Icon name="menu" size={22} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Barre de recherche */}
        <View style={styles.searchWrap}>
          <Icon name="search" size={16} color={Colors.muted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Magnésium, curcumine, microbiote…"
            placeholderTextColor={Colors.muted2}
            returnKeyType="search"
            onSubmitEditing={() => query.trim() && onOpenSearch(query.trim())}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Icon name="close" size={14} color={Colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Résultats instantanés */}
        {query.trim().length > 1 && (
          <View style={styles.instantResults}>
            {searchKnowledge(query.trim()).slice(0, 5).map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                onPress={() => onOpenSearch(query.trim())}
              />
            ))}
            {searchKnowledge(query.trim()).length > 5 && (
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => onOpenSearch(query.trim())}
                activeOpacity={0.8}
              >
                <Text style={styles.seeAllText}>
                  Voir tous les résultats ({searchKnowledge(query.trim()).length})
                </Text>
                <Icon name="chevron-right" size={13} color={Colors.ok} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Catégories */}
        {query.trim().length <= 1 && (
          <>
            <Text style={styles.homeSection}>Catégories</Text>
            <View style={styles.catGrid}>
              {categories.map(([id, meta]) => (
                <TouchableOpacity
                  key={id}
                  style={[styles.catCard, { borderColor: meta.color + '35', backgroundColor: meta.bg }]}
                  onPress={() => onOpenCategory(id)}
                  activeOpacity={0.78}
                >
                  <Text style={styles.catEmoji}>{meta.emoji}</Text>
                  <Text style={[styles.catLabel, { color: meta.color }]}>{meta.label}</Text>
                  <Text style={[styles.catCount, { color: meta.color + 'AA' }]}>
                    {counts[id]} entrées
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* À explorer */}
            <Text style={[styles.homeSection, { marginTop: 28 }]}>À explorer</Text>
            {featured.map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                onPress={() => onOpenSearch(e.name)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Écran principal ───────────────────────────────────────────

interface KnowledgeScreenProps {
  onBack: () => void;
  onOpenMenu: () => void;
  onStartDemo?: () => void;
}

export function KnowledgeScreen({ onBack, onOpenMenu, onStartDemo }: KnowledgeScreenProps) {
  const [view, setView] = useState<KView>({ type: 'home' });

  const goBack = () => {
    if (view.type === 'home') {
      onBack();
    } else if (view.type === 'entry') {
      setView(view.from);
    } else {
      setView({ type: 'home' });
    }
  };

  const openEntry = (entry: KnowledgeEntry) => {
    setView({ type: 'entry', entry, from: view });
  };

  const openCategory = (category: KnowledgeCategory) => {
    setView({ type: 'list', category, query: '' });
  };

  const openSearch = (query: string) => {
    setView({ type: 'list', category: null, query });
  };

  if (view.type === 'home') {
    return (
      <HomeView
        onOpenCategory={openCategory}
        onOpenSearch={openSearch}
        onBack={onBack}
        onOpenMenu={onOpenMenu}
        onStartDemo={onStartDemo}
      />
    );
  }

  if (view.type === 'list') {
    const entries =
      view.query
        ? searchKnowledge(view.query)
        : view.category
          ? getByCategory(view.category)
          : KNOWLEDGE_BASE;

    const title = view.query
      ? `"${view.query}"`
      : view.category
        ? CATEGORY_META[view.category].label
        : 'Tout';

    return (
      <ListView
        entries={entries}
        title={title}
        onBack={goBack}
        onPickEntry={openEntry}
        onOpenMenu={onOpenMenu}
      />
    );
  }

  // view.type === 'entry'
  return (
    <EntryView
      entry={view.entry}
      onBack={goBack}
      onOpenEntry={openEntry}
      onOpenMenu={onOpenMenu}
    />
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 8,
  },
  iconBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBtnSignal: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.signal + '55',
    backgroundColor: Colors.signal + '12',
  },
  topbarCenter: { flex: 1, alignItems: 'center' },
  topbarTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  topbarSub: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginTop: 1,
  },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.card,
  },
  modeBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  modeBtnActive: {
    backgroundColor: Colors.ink,
  },
  modeBtnText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.muted,
  },
  modeBtnTextActive: {
    color: Colors.paper2,
  },

  // Home: search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 14,
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.ink,
  },
  clearBtn: { padding: 4 },

  instantResults: {
    borderWidth: 1,
    borderColor: Colors.hairline2,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  seeAllText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ok,
  },

  homeSection: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 12,
  },

  // Category grid
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catCard: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 4,
  },
  catEmoji: { fontSize: 28, marginBottom: 4 },
  catLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    letterSpacing: -0.1,
  },
  catCount: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
  },

  // Entry row
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  entryRowEmoji: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  entryRowEmojiText: { fontSize: 22 },
  entryRowText: { flex: 1 },
  entryRowName: {
    fontFamily: Fonts.serif,
    fontSize: 17,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  entryRowTagline: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 1,
    lineHeight: 16,
  },

  listCount: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.muted2,
    marginBottom: 4,
    marginTop: 8,
  },

  // Entry detail hero
  entryHero: {
    paddingTop: 4,
    paddingBottom: 20,
    gap: 6,
  },
  entryEmojiWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  entryEmoji: { fontSize: 38 },
  entryCatPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 2,
  },
  entryCatText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  entryName: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    color: Colors.ink,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  entryAliases: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 0.3,
    lineHeight: 15,
  },
  entryTagline: {
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    color: Colors.ink2,
    lineHeight: 22,
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.hairline2,
    marginBottom: 20,
  },

  // Content sections
  contentBlock: { gap: 20 },
  section: { gap: 8 },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  sectionText: {
    fontFamily: Fonts.sans,
    fontSize: 14.5,
    color: Colors.ink2,
    lineHeight: 22,
  },

  sourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  sourceChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
  },
  sourceChipText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink2,
  },

  // Interactions list
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  interactionDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.muted2,
    marginTop: 8,
    flexShrink: 0,
  },
  interactionText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    color: Colors.ink2,
    lineHeight: 20,
  },

  // Dosage block
  dosageBlock: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.card,
    gap: 4,
  },
  dosageLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  dosageVal: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    color: Colors.ink,
    letterSpacing: -0.5,
  },
  dosageUnit: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    fontWeight: '400',
  },
  dosageUpper: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.warn,
    letterSpacing: 0.2,
    marginTop: 2,
  },

  // Note clinique / FODMAP
  fodmapNoteBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(63,90,58,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(63,90,58,0.25)',
  },
  fodmapNoteLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.ok,
    marginBottom: 3,
  },
  fodmapNoteText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ok,
    lineHeight: 19,
  },

  // Related
  relatedSection: { marginTop: 28, gap: 12 },
  relatedLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  relatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  relatedCard: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: Colors.card,
    padding: 14,
    gap: 3,
  },
  relatedEmoji: { fontSize: 22, marginBottom: 4 },
  relatedName: {
    fontFamily: Fonts.serif,
    fontSize: 15,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  relatedTagline: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.muted,
    lineHeight: 15,
  },
});
