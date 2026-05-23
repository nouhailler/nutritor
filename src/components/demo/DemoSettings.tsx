import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../../theme/tokens';
import { useDemoEngine, SW, SH } from './useDemoEngine';
import { DemoShell } from './DemoShell';

const PHASES = ['openrouter', 'ollama', 'data'] as const;
type Phase = typeof PHASES[number];

// ── Fake data ──────────────────────────────────────────────────

const OR_MODELS = [
  { id: 'google/gemini-2.0-flash-exp:free',          name: 'Gemini 2.0 Flash Exp',   selected: true  },
  { id: 'meta-llama/llama-3.1-8b-instruct:free',     name: 'Llama 3.1 8B Instruct',  selected: false },
  { id: 'mistralai/mistral-7b-instruct:free',        name: 'Mistral 7B Instruct',     selected: false },
];

const APP_VERSION = '0.26.0';
const FOOD_COUNT  = 47;

// ── Component ──────────────────────────────────────────────────

interface Props { visible: boolean; onClose: () => void; }

export function DemoSettings({ visible, onClose }: Props) {
  const engine = useDemoEngine();
  const { overlayA, isRunning, at, clearAll, move, tap, fadeIn } = engine;

  const [phase,   setPhase]   = useState<Phase>('openrouter');
  const [caption, setCaption] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!visible) { isRunning.current = false; clearAll(); return; }
    isRunning.current = true;

    const run = () => {
      clearAll();
      setPhase('openrouter');
      setCaption('');
      overlayA.setValue(0);
      engine.fingerX.setValue(SW * 0.5 - 26);
      engine.fingerY.setValue(SH * 0.22 - 26);
      engine.fOpacity.setValue(0);
      engine.fScale.setValue(1);
      engine.ripS.setValue(0);
      engine.ripO.setValue(0);

      at(100, fadeIn);

      // t=0.9s : doigt → pills fournisseur
      at(900, () => {
        engine.fOpacity.setValue(1);
        move(SW * 0.72, SH * 0.225, 400);
        setCaption('Choix du moteur d\'IA pour enrichir les aliments');
      });

      // t=2.4s : doigt → pill Ollama
      at(2400, () => {
        move(SW * 0.85, SH * 0.225, 400);
        setCaption('');
      });

      // t=3.2s : tap → ollama phase
      at(3200, () => {
        tap();
        setPhase('ollama');
        setCaption('Ollama local — données privées, sans coût d\'API');
      });

      // t=4.4s : doigt → champ URL
      at(4400, () => move(SW * 0.5, SH * 0.310, 500));

      // t=5.8s : doigt → bouton tester connexion
      at(5800, () => {
        move(SW * 0.84, SH * 0.385, 400);
        setCaption('Connexion vérifiée · llama3.2:latest actif');
      });

      // t=7.2s : doigt → pill OpenRouter
      at(7200, () => {
        move(SW * 0.68, SH * 0.225, 500);
        setCaption('');
      });

      // t=8.0s : tap → openrouter phase
      at(8000, () => {
        tap();
        setPhase('openrouter');
        setCaption('OpenRouter — accès aux meilleurs modèles gratuits');
      });

      // t=9.2s : doigt → champ clé API
      at(9200, () => {
        move(SW * 0.5, SH * 0.310, 500);
        setCaption('Clé API saisie de façon sécurisée');
      });

      // t=10.7s : doigt → premier modèle (sélectionné)
      at(10700, () => {
        move(SW * 0.5, SH * 0.445, 500);
        setCaption('');
      });

      // t=12.0s : doigt → deuxième modèle
      at(12000, () => {
        move(SW * 0.5, SH * 0.495, 400);
        setCaption('Sélectionne parmi les modèles gratuits disponibles');
      });

      // t=13.5s : tap → data phase
      at(13500, () => {
        tap();
        setPhase('data');
        setCaption('Import / export de ta base d\'aliments');
      });

      // t=14.5s : doigt → ligne importer
      at(14500, () => move(SW * 0.5, SH * 0.225, 500));

      // t=15.8s : doigt → ligne exporter
      at(15800, () => {
        move(SW * 0.5, SH * 0.295, 400);
        setCaption('Exporte ou importe en JSON — sauvegarde et migration');
      });

      // t=17.2s : doigt → revoir introduction
      at(17200, () => {
        move(SW * 0.5, SH * 0.415, 500);
        setCaption('');
      });

      // t=18.4s : doigt → à propos
      at(18400, () => {
        move(SW * 0.5, SH * 0.535, 400);
        setCaption('Données stockées localement sur l\'appareil');
      });

      // t=19.6s : tap → retour openrouter
      at(19600, () => {
        tap();
        setPhase('openrouter');
        setCaption('Paramètres sauvegardés automatiquement');
      });

      // t=21.2s : boucle
      at(21200, () => { if (isRunning.current) run(); });
    };

    run();
    return () => { isRunning.current = false; clearAll(); };
  }, [visible]);

  return (
    <DemoShell visible={visible} onClose={onClose} engine={engine} phases={PHASES} currentPhase={phase} caption={caption}>
      <View style={s.bg}>

        {/* ── TOPBAR ── */}
        <View style={s.topbar}>
          <View style={s.iconBtn} />
          <View style={s.titleBlock}>
            <Text style={s.eyebrow}>Application</Text>
            <Text style={s.title}>Paramètres</Text>
          </View>
          <View style={s.iconBtn} />
          <View style={s.iconBtn} />
        </View>

        <View style={s.content}>

          {/* ══ IA ══════════════════════════════════════════════ */}
          <View style={s.sectionHeader}>
            <View style={s.sectionDot} />
            <Text style={s.sectionLabel}>Intelligence artificielle</Text>
          </View>

          <View style={s.card}>

            {/* Fournisseur row */}
            <View style={s.row}>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>Fournisseur</Text>
                <Text style={s.rowDesc}>Moteur utilisé pour enrichir les aliments</Text>
              </View>
              <View style={s.pillGroup}>
                <View style={[s.pill, phase !== 'ollama' && s.pillActive]}>
                  <Text style={[s.pillText, phase !== 'ollama' && s.pillTextActive]}>OpenRouter</Text>
                </View>
                <View style={[s.pill, phase === 'ollama' && s.pillActive]}>
                  <Text style={[s.pillText, phase === 'ollama' && s.pillTextActive]}>Ollama</Text>
                </View>
              </View>
            </View>

            {/* ── OpenRouter ── */}
            {phase === 'openrouter' && (
              <>
                {/* Clé API */}
                <View style={s.inputRow}>
                  <View style={s.inputIcon} />
                  <Text style={s.inputMasked}>sk-or-v1-●●●●●●●●●●●●●●●●●●</Text>
                </View>
                <View style={s.divider} />

                {/* Modèles */}
                <View style={s.row}>
                  <View style={s.rowText}>
                    <Text style={s.rowLabel}>Modèles gratuits</Text>
                    <Text style={s.rowDesc}>{OR_MODELS.length} modèles disponibles</Text>
                  </View>
                  <View style={s.refreshBtn}>
                    <View style={s.refreshIcon} />
                  </View>
                </View>

                <View style={s.modelList}>
                  {OR_MODELS.map(m => (
                    <View key={m.id} style={[s.modelItem, m.selected && s.modelItemSelected]}>
                      <View style={s.modelLeft}>
                        <Text style={s.modelId} numberOfLines={1}>{m.id}</Text>
                        <Text style={s.modelName}>{m.name}</Text>
                      </View>
                      {m.selected && <View style={s.checkDot} />}
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* ── Ollama ── */}
            {phase === 'ollama' && (
              <>
                {/* URL */}
                <View style={s.inputRow}>
                  <View style={s.inputIcon} />
                  <Text style={s.inputText}>http://localhost:11434</Text>
                </View>
                <View style={s.divider} />

                {/* Tester connexion */}
                <View style={[s.row, s.rowLast]}>
                  <View style={s.rowText}>
                    <Text style={s.rowLabel}>Tester la connexion</Text>
                    <Text style={s.rowDesc}>Modèle actif : llama3.2:latest</Text>
                  </View>
                  <View style={s.refreshBtn}>
                    <View style={s.refreshIcon} />
                  </View>
                </View>
              </>
            )}

            {/* ── Data phase : IA card vide ── */}
            {phase === 'data' && (
              <View style={[s.row, s.rowLast]}>
                <View style={s.rowText}>
                  <Text style={s.rowLabel}>Modèles gratuits</Text>
                  <Text style={s.rowDesc}>Appuie sur Actualiser pour charger la liste</Text>
                </View>
                <View style={s.refreshBtn}>
                  <View style={s.refreshIcon} />
                </View>
              </View>
            )}

          </View>

          {/* ══ BASE DE DONNÉES ══════════════════════════════════ */}
          {phase === 'data' && (
            <>
              <View style={s.sectionHeader}>
                <View style={s.sectionDot} />
                <Text style={s.sectionLabel}>Base de données</Text>
              </View>

              <View style={s.card}>
                <View style={s.row}>
                  <View style={s.rowText}>
                    <Text style={s.rowLabel}>Importer des aliments</Text>
                    <Text style={s.rowDesc}>Fichier JSON — fusionné avec la liste existante</Text>
                  </View>
                  <View style={s.arrowIcon} />
                </View>
                <View style={[s.row, s.rowLast]}>
                  <View style={s.rowText}>
                    <Text style={s.rowLabel}>Exporter les aliments</Text>
                    <Text style={s.rowDesc}>{FOOD_COUNT} aliments dans ta base</Text>
                  </View>
                  <View style={s.arrowIcon} />
                </View>
              </View>

              {/* Visite guidée */}
              <View style={s.sectionHeader}>
                <View style={s.sectionDot} />
                <Text style={s.sectionLabel}>Visite guidée</Text>
              </View>
              <View style={s.card}>
                <View style={[s.row, s.rowLast]}>
                  <View style={s.rowText}>
                    <Text style={s.rowLabel}>Revoir l'introduction</Text>
                    <Text style={s.rowDesc}>Relance les écrans de démarrage et les conseils</Text>
                  </View>
                  <View style={s.arrowIcon} />
                </View>
              </View>

              {/* À propos */}
              <View style={s.sectionHeader}>
                <View style={s.sectionDot} />
                <Text style={s.sectionLabel}>À propos de Nutritor</Text>
              </View>
              <View style={s.card}>
                <View style={s.aboutRow}>
                  <Text style={s.aboutName}>Nutritor</Text>
                  <View style={s.versionBadge}>
                    <Text style={s.versionBadgeText}>v{APP_VERSION}</Text>
                  </View>
                </View>
                <View style={[s.row, s.rowLast]}>
                  <Text style={s.rowDesc}>Base de données locale · données stockées sur l'appareil</Text>
                </View>
              </View>
            </>
          )}

        </View>
      </View>
    </DemoShell>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const H_PAD = 16;

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.paper },

  topbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, gap: 12,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20 },
  titleBlock: { flex: 1, gap: 1 },
  eyebrow: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: Colors.muted },
  title:   { fontFamily: Fonts.serif, fontSize: 24, letterSpacing: -0.4, color: Colors.ink },

  content: { flex: 1, paddingHorizontal: H_PAD, gap: 8 },

  // Section header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingTop: 12, paddingBottom: 6, paddingHorizontal: 4,
  },
  sectionDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.muted2 },
  sectionLabel: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: Colors.muted },

  // Card
  card: {
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.hairline2, overflow: 'hidden',
  },

  // Rows
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.hairline2,
  },
  rowLast: { borderBottomWidth: 0 },
  rowText:  { flex: 1 },
  rowLabel: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.ink },
  rowDesc:  { fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted, marginTop: 2 },

  // Provider pills
  pillGroup: { flexDirection: 'row', gap: 6 },
  pill: {
    paddingVertical: 5, paddingHorizontal: 12,
    borderRadius: 100, borderWidth: 1,
    borderColor: Colors.hairline, backgroundColor: Colors.paper2,
  },
  pillActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  pillText: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 0.8, color: Colors.muted },
  pillTextActive: { color: Colors.paper2 },

  // Input
  divider: { height: 1, backgroundColor: Colors.hairline2, marginHorizontal: 16 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13, gap: 10,
  },
  inputIcon:   { width: 15, height: 15, borderRadius: 4, backgroundColor: Colors.muted2 + '60' },
  inputMasked: { flex: 1, fontFamily: Fonts.mono, fontSize: 13, color: Colors.ink2, letterSpacing: 1 },
  inputText:   { flex: 1, fontFamily: Fonts.mono, fontSize: 13, color: Colors.ink },

  // Refresh button
  refreshBtn: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.hairline,
    backgroundColor: Colors.paper2,
    alignItems: 'center', justifyContent: 'center',
  },
  refreshIcon: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: Colors.muted },

  // Model list
  modelList: { borderTopWidth: 1, borderTopColor: Colors.hairline2 },
  modelItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.hairline2, gap: 10,
  },
  modelItemSelected: { backgroundColor: Colors.paper2 },
  modelLeft: { flex: 1 },
  modelId:   { fontFamily: Fonts.mono, fontSize: 11, color: Colors.ink, letterSpacing: 0.2 },
  modelName: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted, marginTop: 1 },
  checkDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.ok },

  // Arrows (import/export)
  arrowIcon: {
    width: 18, height: 18, borderRadius: 4,
    backgroundColor: Colors.muted2 + '30',
  },

  // About
  aboutRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, gap: 10,
  },
  aboutName: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.ink, letterSpacing: -0.3, flex: 1 },
  versionBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 100, backgroundColor: Colors.paper2,
    borderWidth: 1, borderColor: Colors.hairline,
  },
  versionBadgeText: { fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 0.5, color: Colors.ink },
});
