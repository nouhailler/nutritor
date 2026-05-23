/**
 * ProfileScreen — tab 'profile'
 * Résumé du profil utilisateur : allergènes actifs avec niveaux de sévérité,
 * régimes actifs, objectif calorique. Accès au protocole FODMAP et à l'édition.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { HelpButton, HelpModal } from '../components/HelpModal';
import { HELP } from '../data/helpContent';
import { AllergenLevel, UserProfile, computeDietLabel } from '../data/user';
import { Colors, Fonts } from '../theme/tokens';
import { LabScores, LabStatus } from '../types/labScores';

// ── Severity pill ────────────────────────────────────────────

const LEVEL_STYLE: Record<AllergenLevel, { bg: string; color: string; border: string }> = {
  sévère:  { bg: Colors.warn,    color: '#fff',          border: Colors.warn },
  modéré:  { bg: 'transparent',  color: Colors.warn,     border: 'rgba(139,58,46,0.3)' },
  trace:   { bg: 'transparent',  color: Colors.signal,   border: 'rgba(107,90,46,0.3)' },
  aucun:   { bg: Colors.card,    color: Colors.muted2,   border: Colors.hairline },
};

function LevelPill({ level }: { level: AllergenLevel }) {
  const s = LEVEL_STYLE[level];
  return (
    <View style={[styles.levelPill, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[styles.levelPillText, { color: s.color }]}>{level}</Text>
    </View>
  );
}

// ── Profile Screen ───────────────────────────────────────────

const LAB_METRICS: { key: keyof LabScores; emoji: string; name: string }[] = [
  { key: 'omega',          emoji: '🐟', name: 'Ratio ω-3 / ω-6' },
  { key: 'microDensity',   emoji: '🌿', name: 'Densité micronutrit.' },
  { key: 'inflammatory',   emoji: '🔥', name: 'Score inflammatoire' },
  { key: 'diversity',      emoji: '🎨', name: 'Diversité alimentaire' },
  { key: 'ultraProcessed', emoji: '🏭', name: 'Ultra-transformé' },
  { key: 'fodmap',         emoji: '🪣', name: 'Charge FODMAP' },
  { key: 'aminoBalance',   emoji: '🧬', name: 'Équilibre acides aminés' },
];

const STATUS_COLOR: Record<LabStatus, string> = {
  ok:   Colors.ok,
  mid:  Colors.signal,
  warn: Colors.warn,
};

const STATUS_LABEL: Record<LabStatus, string> = {
  ok:   'Bon',
  mid:  'Moyen',
  warn: 'À corriger',
};

interface ProfileScreenProps {
  profile: UserProfile;
  digestiveMemory: string;
  digestiveMemoryDate: string;
  memoryLoading: boolean;
  memoryError: string | null;
  labScores: LabScores | null;
  labScoresDate: string;
  labLoading: boolean;
  labError: string | null;
  onEdit: () => void;
  onToggleDiet: (id: string) => void;
  onOpenMenu: () => void;
  onOpenFodmap: () => void;
  onUpdateMemory: () => void;
  onGenerateLab: () => void;
  onExportReport: () => void;
  onStartDemo?: () => void;
}

export function ProfileScreen({
  profile,
  digestiveMemory,
  digestiveMemoryDate,
  memoryLoading,
  memoryError,
  labScores,
  labScoresDate,
  labLoading,
  labError,
  onEdit,
  onToggleDiet,
  onOpenMenu,
  onOpenFodmap,
  onUpdateMemory,
  onGenerateLab,
  onExportReport,
  onStartDemo,
}: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const [helpVisible, setHelpVisible] = useState(false);
  const dietLabel = computeDietLabel(profile.diets);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Topbar */}
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.iconBtn} onPress={onOpenMenu} activeOpacity={0.7}>
            <Icon name="menu" size={22} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          {onStartDemo && (
            <TouchableOpacity style={styles.iconBtnSignal} onPress={onStartDemo} activeOpacity={0.7}>
              <Icon name="activity" size={18} color={Colors.signal} />
            </TouchableOpacity>
          )}
          <HelpButton onPress={() => setHelpVisible(true)} />
          <TouchableOpacity style={styles.iconBtn} onPress={onEdit} activeOpacity={0.7}>
            <Icon name="sliders" size={20} />
          </TouchableOpacity>
        </View>
        <HelpModal visible={helpVisible} content={HELP.profile} onClose={() => setHelpVisible(false)} />

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.initial}</Text>
          </View>
          <Text style={styles.eyebrow}>Profil nutritionnel</Text>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.goal}>{profile.goal}</Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Âge</Text>
              <Text style={styles.statVal}>
                {profile.age}
                <Text style={styles.statUnit}> ans</Text>
              </Text>
            </View>
            <View style={[styles.statCell, styles.statCellBordered]}>
              <Text style={styles.statLabel}>Poids</Text>
              <Text style={styles.statVal}>
                {profile.weight}
                <Text style={styles.statUnit}> kg</Text>
              </Text>
            </View>
            <View style={[styles.statCell, styles.statCellBordered]}>
              <Text style={styles.statLabel}>Taille</Text>
              <Text style={styles.statVal}>
                {profile.height}
                <Text style={styles.statUnit}> cm</Text>
              </Text>
            </View>
          </View>

          <Text style={styles.activity}>{profile.activity}</Text>
        </View>

        {/* Export professionnel */}
        <TouchableOpacity style={styles.exportBtn} onPress={onExportReport} activeOpacity={0.8}>
          <Text style={styles.exportEmoji}>👨‍⚕️</Text>
          <View style={styles.exportText}>
            <Text style={styles.exportTitle}>Export professionnel</Text>
            <Text style={styles.exportDesc}>PDF partageable — nutritionniste, gastro-entérologue, diététicien</Text>
          </View>
          <Icon name="upload" size={16} color={Colors.ok} />
        </TouchableOpacity>

        {/* Section: Mode Low FODMAP */}
        <TouchableOpacity style={styles.fodmapCard} onPress={onOpenFodmap} activeOpacity={0.85}>
          <View style={styles.fodmapLeft}>
            <Text style={styles.fodmapTitle}>Mode Low FODMAP</Text>
            <Text style={styles.fodmapDesc}>
              Phases · Timers · Aliments testés · Réactions · Carte de tolérance
            </Text>
          </View>
          <Icon name="activity" size={18} color={Colors.ok} />
        </TouchableOpacity>

        {/* Section: Allergènes */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Allergènes & intolérances</Text>
          <Text style={styles.sectionDesc}>
            Quatre niveaux de surveillance : sévère, modéré, trace, aucun. Les aliments concernés
            sont filtrés dans la recherche.
          </Text>
          <View style={styles.allergenList}>
            {profile.allergens.map((a) => (
              <View key={a.name} style={styles.allergenRow}>
                <View style={styles.allergenLeft}>
                  <Text style={styles.allergenName}>{a.name}</Text>
                  {a.note ? <Text style={styles.allergenNote}>{a.note}</Text> : null}
                </View>
                <LevelPill level={a.level} />
              </View>
            ))}
          </View>
        </View>

        {/* Section: Régimes */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Régimes alimentaires</Text>
          <View style={styles.dietList}>
            {profile.diets.map((d) => (
              <View key={d.id} style={styles.dietRow}>
                <View style={styles.dietLeft}>
                  <Text style={styles.dietLabel}>{d.label}</Text>
                  <Text style={styles.dietRule}>{d.rule}</Text>
                </View>
                <Switch
                  value={d.on}
                  onValueChange={() => onToggleDiet(d.id)}
                  trackColor={{ false: Colors.hairline, true: Colors.ink }}
                  thumbColor={Colors.paper}
                  ios_backgroundColor={Colors.hairline}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Section: Mémoire digestive */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Mémoire digestive</Text>
          <Text style={styles.sectionDesc}>
            L'IA analyse tes repas des 21 derniers jours croisés avec tes symptômes quotidiens pour construire une mémoire personnalisée de ta tolérance digestive.
          </Text>

          {/* Existing memory */}
          {digestiveMemory ? (
            <View style={styles.memoryCard}>
              <View style={styles.memoryHeader}>
                <Icon name="sparkle" size={12} color={Colors.ok} />
                <Text style={styles.memoryHeaderText}>Observations personnalisées</Text>
                {digestiveMemoryDate ? (
                  <Text style={styles.memoryDate}>mis à jour le {digestiveMemoryDate}</Text>
                ) : null}
              </View>
              <View style={styles.memoryLines}>
                {digestiveMemory.split('\n').filter((l) => l.trim()).map((line, i) => (
                  <View key={i} style={styles.memoryLine}>
                    <View style={styles.memoryDot} />
                    <Text style={styles.memoryLineText}>
                      {line.replace(/^\d+\.\s*/, '')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.memoryEmpty}>
              <Icon name="leaf" size={18} color={Colors.muted2} />
              <Text style={styles.memoryEmptyText}>
                Aucune observation enregistrée.{'\n'}Note tes repas et ton bien-être quotidien pendant quelques jours, puis lance l'analyse.
              </Text>
            </View>
          )}

          {memoryError ? (
            <Text style={styles.memoryError}>{memoryError}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.memoryBtn, memoryLoading && styles.memoryBtnLoading]}
            onPress={onUpdateMemory}
            disabled={memoryLoading}
            activeOpacity={0.75}
          >
            {memoryLoading
              ? <ActivityIndicator size="small" color={Colors.paper2} />
              : <Icon name="sparkle" size={14} color={Colors.paper2} />
            }
            <Text style={styles.memoryBtnText}>
              {memoryLoading
                ? 'Analyse en cours…'
                : digestiveMemory ? 'Mettre à jour la mémoire' : 'Analyser mes données'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section: Laboratoire nutritionnel */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>🧪 Laboratoire nutritionnel</Text>
          <Text style={styles.sectionDesc}>
            Analyse IA de ta journée selon 7 indicateurs de santé nutritionnelle avancés : ratio oméga, densité micronutritionnelle, score inflammatoire, diversité, ultra-transformé, charge FODMAP et équilibre protéique.
          </Text>

          {labScores ? (
            <View style={styles.labCard}>
              {labScoresDate ? (
                <Text style={styles.labDate}>Analysé le {labScoresDate}</Text>
              ) : null}
              {LAB_METRICS.map(({ key, emoji, name }) => {
                const score = labScores[key];
                if (!score) return null;
                const color = STATUS_COLOR[score.status];
                return (
                  <View key={key} style={styles.labRow}>
                    <Text style={styles.labEmoji}>{emoji}</Text>
                    <View style={styles.labRowCenter}>
                      <View style={styles.labRowTop}>
                        <Text style={styles.labName}>{name}</Text>
                        <View style={[styles.labStatusBadge, { backgroundColor: color + '20', borderColor: color + '50' }]}>
                          <Text style={[styles.labStatusText, { color }]}>{score.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.labValue}>{score.value}</Text>
                      <Text style={styles.labComment}>{score.comment}</Text>
                    </View>
                    <View style={[styles.labDot, { backgroundColor: color }]} />
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.labEmpty}>
              <Text style={styles.labEmptyIcon}>🧪</Text>
              <Text style={styles.labEmptyText}>
                Analyse basée sur les repas d'aujourd'hui.{'\n'}Ajoute tes repas dans le Journal puis lance l'évaluation.
              </Text>
            </View>
          )}

          {labError ? (
            <Text style={styles.labError}>{labError}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.memoryBtn, labLoading && styles.memoryBtnLoading]}
            onPress={onGenerateLab}
            disabled={labLoading}
            activeOpacity={0.75}
          >
            {labLoading
              ? <ActivityIndicator size="small" color={Colors.paper2} />
              : <Icon name="sparkle" size={14} color={Colors.paper2} />
            }
            <Text style={styles.memoryBtnText}>
              {labLoading
                ? 'Analyse en cours…'
                : labScores ? 'Ré-analyser la journée' : 'Analyser ma journée'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section: Objectifs */}
        <View style={[styles.section, { paddingBottom: 40 }]}>
          <Text style={styles.sectionEyebrow}>Objectifs quotidiens</Text>
          <View style={styles.nutriTable}>
            <View style={styles.nutriRow}>
              <Text style={styles.nutriNameLarge}>Énergie</Text>
              <Text style={styles.nutriValLarge}>{profile.kcalTarget} kcal</Text>
            </View>
            <View style={styles.nutriRow}>
              <Text style={styles.nutriName}>Protéines</Text>
              <Text style={styles.nutriVal}>{profile.macroTargets.protein} g</Text>
            </View>
            <View style={styles.nutriRow}>
              <Text style={styles.nutriName}>Glucides</Text>
              <Text style={styles.nutriVal}>{profile.macroTargets.carbs} g</Text>
            </View>
            <View style={styles.nutriRow}>
              <Text style={styles.nutriName}>Lipides</Text>
              <Text style={styles.nutriVal}>{profile.macroTargets.fat} g</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
  },
  topbarPlaceholder: { width: 40 },
  iconBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnSignal: {
    width: 40, height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.signal + '55',
    backgroundColor: Colors.signal + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  avatar: {
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontFamily: Fonts.serif,
    fontSize: 38,
    color: Colors.paper2,
    letterSpacing: -0.8,
  },
  eyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 6,
  },
  name: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    color: Colors.ink,
    letterSpacing: -0.7,
    marginBottom: 4,
  },
  goal: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    color: Colors.muted,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.hairline2,
    marginBottom: 12,
  },
  statCell: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 14,
  },
  statCellBordered: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.hairline2,
  },
  statLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 4,
  },
  statVal: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  statUnit: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.muted,
    fontWeight: '400',
  },
  activity: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
  },

  // FODMAP card
  exportBtn: {
    marginHorizontal: 24,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(63,90,58,0.25)',
    borderRadius: 16,
    backgroundColor: 'rgba(63,90,58,0.04)',
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exportEmoji: { fontSize: 22 },
  exportText: { flex: 1, gap: 2 },
  exportTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.ink,
    letterSpacing: -0.1,
  },
  exportDesc: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 0.3,
    lineHeight: 14,
  },

  fodmapCard: {
    marginHorizontal: 24,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(63,90,58,0.3)',
    borderRadius: 16,
    backgroundColor: 'rgba(63,90,58,0.06)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fodmapLeft: { flex: 1, gap: 3 },
  fodmapTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.ok,
    letterSpacing: -0.1,
  },
  fodmapDesc: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 0.3,
    lineHeight: 14,
  },

  // Section
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionEyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
    fontWeight: '500',
    marginBottom: 8,
  },
  sectionDesc: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 20,
    marginBottom: 14,
  },

  // Allergens
  allergenList: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  allergenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
    gap: 12,
  },
  allergenLeft: { flex: 1 },
  allergenName: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  allergenNote: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
    lineHeight: 17,
  },
  levelPill: {
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexShrink: 0,
  },
  levelPillText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Diets
  dietList: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  dietRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  dietLeft: { flex: 1, marginRight: 16 },
  dietLabel: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  dietRule: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.4,
    color: Colors.muted,
    marginTop: 2,
  },

  // Nutrient table
  nutriTable: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
    marginTop: 12,
  },
  nutriRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  nutriName: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink2,
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

  // Digestive memory
  memoryCard: {
    borderWidth: 1,
    borderColor: 'rgba(63,90,58,0.25)',
    borderRadius: 18,
    backgroundColor: 'rgba(63,90,58,0.04)',
    padding: 16,
    marginBottom: 14,
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  memoryHeaderText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.ok,
    letterSpacing: 0.1,
    flex: 1,
  },
  memoryDate: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted2,
    letterSpacing: 0.3,
  },
  memoryLines: {
    gap: 10,
  },
  memoryLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  memoryDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.ok,
    marginTop: 7,
    flexShrink: 0,
  },
  memoryLineText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink2,
    lineHeight: 21,
  },
  memoryEmpty: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    borderRadius: 16,
    borderStyle: 'dashed',
    marginBottom: 14,
  },
  memoryEmptyText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 20,
  },
  memoryError: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.warn,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  memoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.ink,
    borderRadius: 100,
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  memoryBtnLoading: {
    opacity: 0.6,
  },
  memoryBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.paper2,
    letterSpacing: 0.1,
  },

  // Lab nutritionnel
  labCard: {
    borderWidth: 1,
    borderColor: 'rgba(46,78,139,0.2)',
    borderRadius: 18,
    backgroundColor: 'rgba(46,78,139,0.03)',
    padding: 16,
    marginBottom: 14,
    gap: 2,
  },
  labDate: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted2,
    letterSpacing: 0.3,
    marginBottom: 10,
    textAlign: 'right',
  },
  labRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  labEmoji: {
    fontSize: 18,
    lineHeight: 22,
    width: 26,
    textAlign: 'center',
    flexShrink: 0,
  },
  labRowCenter: {
    flex: 1,
    gap: 3,
  },
  labRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  labName: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.ink,
    letterSpacing: -0.1,
    flex: 1,
  },
  labStatusBadge: {
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 8,
    flexShrink: 0,
  },
  labStatusText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  labValue: {
    fontFamily: Fonts.serif,
    fontSize: 15,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  labComment: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 18,
  },
  labDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    flexShrink: 0,
  },
  labEmpty: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    borderRadius: 16,
    borderStyle: 'dashed',
    marginBottom: 14,
  },
  labEmptyIcon: {
    fontSize: 22,
    lineHeight: 26,
    flexShrink: 0,
  },
  labEmptyText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 20,
  },
  labError: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.warn,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
});
