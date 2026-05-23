import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../../theme/tokens';
import { useDemoEngine, SW, SH } from './useDemoEngine';
import { DemoShell } from './DemoShell';

const PHASES = ['nav', 'ia'] as const;
type Phase = typeof PHASES[number];

// ── Fake data ──────────────────────────────────────────────────

const DRAWER_WIDTH = 290;

const PROFILE = {
  initial: 'M',
  name: 'Marie D.',
  diet: 'Sans lactose · Méditerranéen',
  goal: 'Confort digestif',
};

const NAV_ITEMS = [
  { label: 'Journal',       desc: 'Bilan du jour',                 active: true  },
  { label: 'Aliments',      desc: 'Ma bibliothèque d\'aliments',   active: false },
  { label: 'Plats',         desc: 'Mes repas sauvegardés',         active: false },
  { label: 'Statistiques',  desc: 'Tendances hebdomadaires',       active: false },
  { label: 'Profil',        desc: 'Allergies & objectifs',         active: false },
];

const IA_ITEMS = [
  { label: 'Générateur de repas', desc: 'Recettes personnalisées par IA', accent: Colors.ink    },
  { label: 'Encyclopédie',        desc: 'Vitamines, minéraux, bioactifs', accent: '#2E5A8B'     },
];

// ── Coordinate helpers ─────────────────────────────────────────
// Drawer paddingHorizontal=22, paddingTop=54 (safeArea~44 + 10)
// Item center X : 22 (padding) + 12 (navItem paddingH) + 18 (icon half) = 52 px (icon)
// Or 22 + 12 + 36 + 14 + 50 = ~134 px (row center)
const DX_ICON = 52;          // icon center x
const DX_ROW  = 134;         // row center x

// Phase nav — profile + 5 nav items
// closeBtn center y ≈ 54 + 19 = 73
// avatar center y ≈ 54 + 44 + 6 + 30 = 134
// goal pill y ≈ 54 + 44 + 188 - 30 ≈ 256
// separator end ≈ 303
// nav item i center y ≈ 303 + 28 + i * 60
const NAV_Y = (i: number) => 303 + 28 + i * 60;

// Phase ia — abbreviated profile + IA items + footer
// separator end ≈ 54 + 44 + 114 + 17 = 229
// ia item i center y ≈ 229 + 12 + 24 + 8 + i * 64 + 28
const IA_SEP_Y = 229;
const IA_Y     = (i: number) => IA_SEP_Y + 12 + 24 + 8 + i * 72 + 28;
// footer settings y ≈ IA_Y(1) + 28 + 48
const FOOTER_Y  = IA_Y(1) + 28 + 50;
const BRAND_Y   = FOOTER_Y + 44;

// ── Component ──────────────────────────────────────────────────

interface Props { visible: boolean; onClose: () => void; }

export function DemoDrawer({ visible, onClose }: Props) {
  const engine = useDemoEngine();
  const { overlayA, isRunning, at, clearAll, move, tap, fadeIn } = engine;

  const [phase,   setPhase]   = useState<Phase>('nav');
  const [caption, setCaption] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!visible) { isRunning.current = false; clearAll(); return; }
    isRunning.current = true;

    const run = () => {
      clearAll();
      setPhase('nav');
      setCaption('');
      overlayA.setValue(0);
      engine.fingerX.setValue(DX_ICON - 26);
      engine.fingerY.setValue(134 - 26);
      engine.fOpacity.setValue(0);
      engine.fScale.setValue(1);
      engine.ripS.setValue(0);
      engine.ripO.setValue(0);

      at(100, fadeIn);

      // t=0.9s : doigt → avatar
      at(900, () => {
        engine.fOpacity.setValue(1);
        move(DX_ICON, 134, 400);
        setCaption('Accès rapide à toutes les sections');
      });

      // t=2.5s : doigt → item Journal (actif)
      at(2500, () => {
        move(DX_ROW, NAV_Y(0), 500);
        setCaption('Journal · Aliments · Plats · Stats · Profil');
      });

      // t=3.8s : doigt → Aliments
      at(3800, () => move(DX_ROW, NAV_Y(1), 400));

      // t=4.8s : doigt → Statistiques
      at(4800, () => {
        move(DX_ROW, NAV_Y(3), 500);
        setCaption('');
      });

      // t=6.0s : tap → phase IA
      at(6000, () => {
        tap();
        setPhase('ia');
        setCaption('Outils IA directement accessibles');
      });

      // t=7.2s : doigt → Générateur de repas
      at(7200, () => {
        move(DX_ROW, IA_Y(0), 500);
        setCaption('Génère des recettes adaptées à ton profil');
      });

      // t=8.8s : doigt → Encyclopédie
      at(8800, () => {
        move(DX_ROW, IA_Y(1), 400);
        setCaption('Vitamines, minéraux, bioactifs référencés');
      });

      // t=10.4s : doigt → Paramètres
      at(10400, () => {
        move(DX_ICON, FOOTER_Y, 500);
        setCaption('');
      });

      // t=11.6s : doigt → branding Nutritor
      at(11600, () => move(DX_ICON, BRAND_Y, 400));

      // t=12.8s : tap → retour nav
      at(12800, () => {
        tap();
        setPhase('nav');
        setCaption('Ouvert depuis l\'icône ☰ de chaque écran');
      });

      // t=14.2s : boucle
      at(14200, () => { if (isRunning.current) run(); });
    };

    run();
    return () => { isRunning.current = false; clearAll(); };
  }, [visible]);

  return (
    <DemoShell visible={visible} onClose={onClose} engine={engine} phases={PHASES} currentPhase={phase} caption={caption}>
      {/* Overlay sombre couvrant la zone à droite du tiroir */}
      <View style={s.rightOverlay} />

      {/* Panneau du tiroir */}
      <View style={s.drawer}>

        {/* Bouton fermer */}
        <View style={s.closeRow}>
          <View style={s.closeBtn} />
        </View>

        {/* ══ PHASE NAV ════════════════════════════════════════ */}
        {phase === 'nav' && (
          <>
            {/* En-tête profil */}
            <View style={s.profileSection}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{PROFILE.initial}</Text>
              </View>
              <Text style={s.profileName}>{PROFILE.name}</Text>
              <Text style={s.profileDiet}>{PROFILE.diet}</Text>
              <View style={s.goalPill}>
                <Text style={s.goalText}>{PROFILE.goal}</Text>
              </View>
            </View>

            <View style={s.separator} />

            {/* Navigation */}
            <View style={s.nav}>
              {NAV_ITEMS.map((item) => (
                <View key={item.label} style={[s.navItem, item.active && s.navItemActive]}>
                  <View style={[s.navIcon, item.active && s.navIconActive]} />
                  <View style={s.navText}>
                    <Text style={[s.navLabel, item.active && s.navLabelActive]}>{item.label}</Text>
                    <Text style={s.navDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ══ PHASE IA ═════════════════════════════════════════ */}
        {phase === 'ia' && (
          <>
            {/* Profil compact (header toujours visible) */}
            <View style={s.profileCompact}>
              <View style={s.avatarSm}>
                <Text style={s.avatarSmText}>{PROFILE.initial}</Text>
              </View>
              <View>
                <Text style={s.profileNameSm}>{PROFILE.name}</Text>
                <Text style={s.profileDietSm}>{PROFILE.diet}</Text>
              </View>
            </View>

            <View style={s.separator} />

            {/* Section IA */}
            <View style={s.iaSection}>
              <Text style={s.iaSectionLabel}>Intelligence artificielle</Text>
              {IA_ITEMS.map((item) => (
                <View key={item.label} style={s.iaItem}>
                  <View style={[s.iaIcon, { backgroundColor: item.accent }]} />
                  <View style={s.navText}>
                    <Text style={s.iaLabel}>{item.label}</Text>
                    <Text style={s.navDesc}>{item.desc}</Text>
                  </View>
                  <View style={s.chevron} />
                </View>
              ))}
            </View>

            {/* Footer */}
            <View style={s.footer}>
              <View style={s.separator} />
              <View style={s.settingsRow}>
                <View style={s.settingsIcon} />
                <Text style={s.settingsText}>Paramètres</Text>
              </View>
              <Text style={s.brand}>Nutritor</Text>
              <Text style={s.tagline}>Allergies & micronutriments</Text>
            </View>
          </>
        )}

      </View>
    </DemoShell>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const s = StyleSheet.create({
  rightOverlay: {
    position: 'absolute',
    left: DRAWER_WIDTH,
    right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(15,12,8,0.45)',
  },

  drawer: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.paper,
    borderRightWidth: 1,
    borderRightColor: Colors.hairline2,
    paddingHorizontal: 22,
    paddingTop: 54,
    paddingBottom: 24,
    shadowColor: '#0f0c08',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },

  closeRow: { alignItems: 'flex-end', marginBottom: 6 },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.hairline2 + '80',
  },

  // ── Profile (nav phase) ─────────────────────────────────────
  profileSection: { paddingTop: 6, paddingBottom: 22 },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.ink,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText:  { fontFamily: Fonts.serif, fontSize: 30, color: Colors.paper2, letterSpacing: -0.5 },
  profileName: { fontFamily: Fonts.serif, fontSize: 28, color: Colors.ink, letterSpacing: -0.5, marginBottom: 4 },
  profileDiet: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted, marginBottom: 12 },
  goalPill: {
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: Colors.hairline,
    borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12,
    backgroundColor: Colors.card,
  },
  goalText: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 1.2, color: Colors.muted, textTransform: 'uppercase' },

  separator: { height: 1, backgroundColor: Colors.hairline2, marginBottom: 16 },

  // ── Navigation ──────────────────────────────────────────────
  nav: { gap: 4 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14,
  },
  navItemActive: {
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.hairline2,
  },
  navIcon: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.hairline,
    backgroundColor: Colors.paper2,
  },
  navIconActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  navText:  { flex: 1 },
  navLabel: { fontFamily: Fonts.serif, fontSize: 18, color: Colors.ink, letterSpacing: -0.2, lineHeight: 20 },
  navLabelActive: { color: Colors.ink },
  navDesc:  { fontFamily: Fonts.sans, fontSize: 11.5, color: Colors.muted, marginTop: 1 },

  // ── Profile compact (ia phase) ──────────────────────────────
  profileCompact: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 6, paddingBottom: 18,
  },
  avatarSm: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.ink,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarSmText:  { fontFamily: Fonts.serif, fontSize: 18, color: Colors.paper2 },
  profileNameSm: { fontFamily: Fonts.serif, fontSize: 17, color: Colors.ink, letterSpacing: -0.3 },
  profileDietSm: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted, marginTop: 2 },

  // ── IA section ──────────────────────────────────────────────
  iaSection: {
    marginTop: 4, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.hairline2,
    gap: 8,
  },
  iaSectionLabel: {
    fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 2,
    textTransform: 'uppercase', color: Colors.muted2, marginBottom: 4,
  },
  iaItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 14, backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.hairline2,
  },
  iaIcon: { width: 36, height: 36, borderRadius: 10, flexShrink: 0 },
  iaLabel: { fontFamily: Fonts.serif, fontSize: 18, color: Colors.ink, letterSpacing: -0.2, lineHeight: 20 },
  chevron: { width: 8, height: 8, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: Colors.muted2, transform: [{ rotate: '45deg' }] },

  // ── Footer ──────────────────────────────────────────────────
  footer: { marginTop: 'auto', paddingTop: 8 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, marginBottom: 12 },
  settingsIcon: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.muted2 + '60' },
  settingsText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted },
  brand:    { fontFamily: Fonts.serif, fontSize: 22, color: Colors.ink, letterSpacing: -0.3, marginBottom: 2 },
  tagline:  { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase', color: Colors.muted2 },
});
