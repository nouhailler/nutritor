import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { AllergenLevel, UserProfile, computeDietLabel } from '../data/user';
import { Colors, Fonts } from '../theme/tokens';

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

interface ProfileScreenProps {
  profile: UserProfile;
  onEdit: () => void;
  onToggleDiet: (id: string) => void;
}

export function ProfileScreen({ profile, onEdit, onToggleDiet }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
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
          <View style={styles.topbarPlaceholder} />
          <TouchableOpacity style={styles.iconBtn} onPress={onEdit} activeOpacity={0.7}>
            <Icon name="sliders" size={20} />
          </TouchableOpacity>
        </View>

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
});
