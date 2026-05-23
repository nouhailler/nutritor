/**
 * SettingsScreen — stack 'settings'
 * Configuration de l'IA (OpenRouter avec clé API + sélection modèle,
 * ou Ollama local avec URL + test de connexion).
 * Import et export JSON de la bibliothèque d'aliments.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Icon } from '../components/Icon';
import { HelpButton, HelpModal } from '../components/HelpModal';
import { HELP } from '../data/helpContent';
import { Colors, Fonts } from '../theme/tokens';
import { Food } from '../types';
import {
  AIProvider, AppSettings, OpenRouterModel,
  ANTHROPIC_MODELS, OPENAI_MODELS,
} from '../types/settings';
import { SavedPlate } from '../data/saved';
import { KEYS, save } from '../storage/store';
import { aiLogger } from '../services/aiLogger';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const APP_VERSION: string = require('../../package.json').version;

// ── Section header ─────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: React.ComponentProps<typeof Icon>['name']; label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Icon name={icon} size={15} color={Colors.muted} />
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

// ── Settings card ──────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

// ── Row ────────────────────────────────────────────────────────

function Row({
  label,
  description,
  right,
  onPress,
  borderBottom = true,
}: {
  label: string;
  description?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  borderBottom?: boolean;
}) {
  const inner = (
    <View style={[styles.row, !borderBottom && styles.rowNoBorder]}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? <Text style={styles.rowDesc}>{description}</Text> : null}
      </View>
      {right}
    </View>
  );
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

// ── Provider pill ──────────────────────────────────────────────

function ProviderPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Model list item ────────────────────────────────────────────

function ModelItem({
  model,
  selected,
  onPress,
}: {
  model: OpenRouterModel;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.modelItem, selected && styles.modelItemSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.modelItemLeft}>
        <Text style={styles.modelId} numberOfLines={1}>{model.id}</Text>
        <Text style={styles.modelName} numberOfLines={1}>{model.name}</Text>
      </View>
      {selected && <Icon name="check" size={16} color={Colors.ok} />}
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────

interface Props {
  settings: AppSettings;
  foodList: Food[];
  savedPlates: SavedPlate[];
  onSave: (settings: AppSettings) => void;
  onImportFoods: (foods: Food[]) => void;
  onImportPlates: (plates: SavedPlate[]) => void;
  onBack: () => void;
  onOpenMenu: () => void;
  onResetOnboarding: () => Promise<void>;
  showToast: (msg: string) => void;
  onStartDemo?: () => void;
}

export function SettingsScreen({
  settings,
  foodList,
  savedPlates,
  onSave,
  onImportFoods,
  onImportPlates,
  onBack,
  onOpenMenu,
  onResetOnboarding,
  showToast,
  onStartDemo,
}: Props) {
  const insets = useSafeAreaInsets();
  const [local, setLocal] = useState<AppSettings>(settings);
  const [loadingModels, setLoadingModels] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importPlatesLoading, setImportPlatesLoading] = useState(false);
  const [exportPlatesLoading, setExportPlatesLoading] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [logText, setLogText] = useState(() => aiLogger.export());

  useEffect(() => {
    const unsub = aiLogger.subscribe(() => setLogText(aiLogger.export()));
    return unsub;
  }, []);

  const handleCopyLogs = useCallback(async () => {
    await Clipboard.setStringAsync(logText);
    showToast('Logs copiés dans le presse-papier');
  }, [logText, showToast]);

  const handleClearLogs = useCallback(() => {
    aiLogger.clear();
    showToast('Logs effacés');
  }, []);

  const update = (patch: Partial<AppSettings>) =>
    setLocal((s) => {
      const next = { ...s, ...patch };
      onSave(next);
      return next;
    });

  const updateOllama = (patch: Partial<AppSettings['ollama']>) =>
    update({ ollama: { ...local.ollama, ...patch } });

  const updateOpenRouter = (patch: Partial<AppSettings['openrouter']>) =>
    update({ openrouter: { ...local.openrouter, ...patch } });

  const updateAnthropic = (patch: Partial<AppSettings['anthropic']>) =>
    update({ anthropic: { ...local.anthropic, ...patch } });

  const updateOpenAI = (patch: Partial<AppSettings['openai']>) =>
    update({ openai: { ...local.openai, ...patch } });

  const setProvider = (p: AIProvider) => update({ aiProvider: p });

  // ── Fetch OpenRouter free models ───────────────────────────

  const fetchOpenRouterModels = async () => {
    if (!local.openrouter.apiKey.trim()) {
      Alert.alert('Clé API manquante', 'Renseigne ta clé OpenRouter avant de rafraîchir.');
      return;
    }
    setLoadingModels(true);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${local.openrouter.apiKey.trim()}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const free: OpenRouterModel[] = (json.data as { id: string; name: string }[])
        .filter((m) => m.id.endsWith(':free'))
        .map((m) => ({ id: m.id, name: m.name }))
        .sort((a, b) => a.name.localeCompare(b.name));
      updateOpenRouter({ models: free, model: free[0]?.id ?? local.openrouter.model });
      showToast(`${free.length} modèles gratuits chargés`);
    } catch (e: unknown) {
      Alert.alert('Erreur', `Impossible de charger les modèles.\n${(e as Error).message}`);
    } finally {
      setLoadingModels(false);
    }
  };

  // ── Fetch Ollama models ────────────────────────────────────

  const fetchOllamaModels = async () => {
    setLoadingModels(true);
    try {
      const url = local.ollama.baseUrl.replace(/\/$/, '');
      const res = await fetch(`${url}/api/tags`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const models: OpenRouterModel[] = (json.models as { name: string }[]).map((m) => ({
        id: m.name,
        name: m.name,
      }));
      if (models.length === 0) {
        Alert.alert('Aucun modèle', 'Ollama est accessible mais aucun modèle n\'est installé.');
        return;
      }
      updateOllama({ model: models[0].id });
      showToast(`${models.length} modèles Ollama détectés`);
    } catch {
      Alert.alert(
        'Ollama inaccessible',
        `Vérife que Ollama tourne sur :\n${local.ollama.baseUrl}\n\nSur Android, utilise l'IP de ton PC (pas localhost).`,
      );
    } finally {
      setLoadingModels(false);
    }
  };

  // ── Export ─────────────────────────────────────────────────

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const json = JSON.stringify(foodList, null, 2);
      const path = FileSystem.cacheDirectory + 'nutritor_aliments.json';
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Partage non disponible', 'Le partage de fichiers n\'est pas supporté sur cet appareil.');
        return;
      }
      await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Exporter les aliments Nutritor' });
    } catch (e: unknown) {
      Alert.alert('Erreur export', (e as Error).message);
    } finally {
      setExportLoading(false);
    }
  };

  // ── Import ─────────────────────────────────────────────────

  const handleImport = async () => {
    setImportLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const parsed = JSON.parse(content);
      const foods: Food[] = Array.isArray(parsed) ? parsed : [parsed];
      if (!foods.every((f) => f.id && f.name && f.per100)) {
        Alert.alert('Format invalide', 'Le fichier JSON ne contient pas des aliments valides.');
        return;
      }
      onImportFoods(foods);
      showToast(`${foods.length} aliment${foods.length > 1 ? 's' : ''} importé${foods.length > 1 ? 's' : ''}`);
    } catch (e: unknown) {
      Alert.alert('Erreur import', (e as Error).message);
    } finally {
      setImportLoading(false);
    }
  };

  // ── Export plats ───────────────────────────────────────────

  const handleExportPlates = async () => {
    setExportPlatesLoading(true);
    try {
      const json = JSON.stringify(savedPlates, null, 2);
      const path = FileSystem.cacheDirectory + 'nutritor_plats.json';
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Partage non disponible', 'Le partage de fichiers n\'est pas supporté sur cet appareil.');
        return;
      }
      await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Exporter les plats Nutritor' });
    } catch (e: unknown) {
      Alert.alert('Erreur export', (e as Error).message);
    } finally {
      setExportPlatesLoading(false);
    }
  };

  // ── Import plats ───────────────────────────────────────────

  const handleImportPlates = async () => {
    setImportPlatesLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const parsed = JSON.parse(content);
      const plates: SavedPlate[] = Array.isArray(parsed) ? parsed : [parsed];
      if (!plates.every((p) => p.id && p.name && typeof p.kcal === 'number')) {
        Alert.alert('Format invalide', 'Le fichier JSON ne contient pas des plats valides.');
        return;
      }
      onImportPlates(plates);
      showToast(`${plates.length} plat${plates.length > 1 ? 's' : ''} importé${plates.length > 1 ? 's' : ''}`);
    } catch (e: unknown) {
      Alert.alert('Erreur import', (e as Error).message);
    } finally {
      setImportPlatesLoading(false);
    }
  };

  const isOllama      = local.aiProvider === 'ollama';
  const isOpenRouter  = local.aiProvider === 'openrouter';
  const isAnthropic   = local.aiProvider === 'anthropic';
  const isOpenAI      = local.aiProvider === 'openai';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
          <Icon name="back" size={20} color={Colors.ink} />
        </TouchableOpacity>
        <View>
          <Text style={styles.eyebrow}>Application</Text>
          <Text style={styles.title}>Paramètres</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={onOpenMenu} activeOpacity={0.7}>
          <Icon name="menu" size={22} color={Colors.ink} />
        </TouchableOpacity>
        {onStartDemo && (
          <TouchableOpacity style={styles.iconBtnSignal} onPress={onStartDemo} activeOpacity={0.7}>
            <Icon name="activity" size={18} color={Colors.signal} />
          </TouchableOpacity>
        )}
        <HelpButton onPress={() => setHelpVisible(true)} />
      </View>
      <HelpModal visible={helpVisible} content={HELP.settings} onClose={() => setHelpVisible(false)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {/* ── IA ─────────────────────────────────────────────── */}
        <SectionHeader icon="cpu" label="Intelligence artificielle" />
        <Card>
          <View style={styles.providerSection}>
            <Text style={styles.rowLabel}>Fournisseur</Text>
            <Text style={styles.rowDesc}>Moteur utilisé pour enrichir les aliments</Text>
            <View style={styles.pillGroup}>
              <ProviderPill label="OpenRouter" active={isOpenRouter}  onPress={() => setProvider('openrouter')} />
              <ProviderPill label="Anthropic"  active={isAnthropic}   onPress={() => setProvider('anthropic')} />
              <ProviderPill label="OpenAI"     active={isOpenAI}      onPress={() => setProvider('openai')} />
              <ProviderPill label="Ollama"     active={isOllama}      onPress={() => setProvider('ollama')} />
            </View>
          </View>

          {/* OpenRouter */}
          {isOpenRouter && (
            <>
              <View style={styles.inputRow}>
                <Icon name="key" size={15} color={Colors.muted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="sk-or-v1-…"
                  placeholderTextColor={Colors.muted2}
                  value={local.openrouter.apiKey}
                  onChangeText={(v) => updateOpenRouter({ apiKey: v })}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                />
              </View>
              <View style={styles.rowDivider} />
              <Row
                label="Modèles gratuits"
                description={
                  local.openrouter.models.length > 0
                    ? `${local.openrouter.models.length} modèles disponibles`
                    : 'Appuie sur Actualiser pour charger la liste'
                }
                borderBottom={local.openrouter.models.length === 0}
                right={
                  <TouchableOpacity
                    style={styles.refreshBtn}
                    onPress={fetchOpenRouterModels}
                    activeOpacity={0.7}
                    disabled={loadingModels}
                  >
                    {loadingModels ? (
                      <ActivityIndicator size="small" color={Colors.ink} />
                    ) : (
                      <Icon name="refresh" size={16} color={Colors.ink} />
                    )}
                  </TouchableOpacity>
                }
              />
              {local.openrouter.models.length > 0 && (
                <View style={styles.modelList}>
                  {local.openrouter.models.map((m) => (
                    <ModelItem
                      key={m.id}
                      model={m}
                      selected={local.openrouter.model === m.id}
                      onPress={() => updateOpenRouter({ model: m.id })}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {/* Anthropic */}
          {isAnthropic && (
            <>
              <View style={styles.inputRow}>
                <Icon name="key" size={15} color={Colors.muted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="sk-ant-…"
                  placeholderTextColor={Colors.muted2}
                  value={local.anthropic.apiKey}
                  onChangeText={(v) => updateAnthropic({ apiKey: v })}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                />
              </View>
              <View style={styles.rowDivider} />
              <Row
                label="Modèle Claude"
                description="Sélectionne le modèle à utiliser"
                borderBottom={true}
              />
              <View style={styles.modelList}>
                {ANTHROPIC_MODELS.map((m) => (
                  <ModelItem
                    key={m.id}
                    model={m}
                    selected={local.anthropic.model === m.id}
                    onPress={() => updateAnthropic({ model: m.id })}
                  />
                ))}
              </View>
            </>
          )}

          {/* OpenAI */}
          {isOpenAI && (
            <>
              <View style={styles.inputRow}>
                <Icon name="key" size={15} color={Colors.muted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="sk-…"
                  placeholderTextColor={Colors.muted2}
                  value={local.openai.apiKey}
                  onChangeText={(v) => updateOpenAI({ apiKey: v })}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                />
              </View>
              <View style={styles.rowDivider} />
              <Row
                label="Modèle GPT"
                description="Sélectionne le modèle à utiliser"
                borderBottom={true}
              />
              <View style={styles.modelList}>
                {OPENAI_MODELS.map((m) => (
                  <ModelItem
                    key={m.id}
                    model={m}
                    selected={local.openai.model === m.id}
                    onPress={() => updateOpenAI({ model: m.id })}
                  />
                ))}
              </View>
            </>
          )}

          {/* Ollama */}
          {isOllama && (
            <>
              <View style={styles.inputRow}>
                <Icon name="cpu" size={15} color={Colors.muted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="http://localhost:11434"
                  placeholderTextColor={Colors.muted2}
                  value={local.ollama.baseUrl}
                  onChangeText={(v) => updateOllama({ baseUrl: v })}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>
              <View style={styles.rowDivider} />
              <Row
                label="Tester la connexion"
                description={
                  local.ollama.model
                    ? `Modèle actif : ${local.ollama.model}`
                    : 'Vérifie qu\'Ollama est accessible'
                }
                borderBottom={false}
                onPress={fetchOllamaModels}
                right={
                  loadingModels ? (
                    <ActivityIndicator size="small" color={Colors.ink} />
                  ) : (
                    <Icon name="refresh" size={16} color={Colors.muted} />
                  )
                }
              />
            </>
          )}
        </Card>

        {/* ── Base de données ─────────────────────────────────── */}
        <SectionHeader icon="database" label="Base de données" />
        <Card>
          <Row
            label="Importer des aliments"
            description="Fichier JSON — fusionné avec la liste existante"
            borderBottom={true}
            onPress={handleImport}
            right={
              importLoading ? (
                <ActivityIndicator size="small" color={Colors.ink} />
              ) : (
                <Icon name="upload" size={18} color={Colors.muted} />
              )
            }
          />
          <Row
            label="Exporter les aliments"
            description={`${foodList.length} aliment${foodList.length > 1 ? 's' : ''} dans ta base`}
            borderBottom={false}
            onPress={handleExport}
            right={
              exportLoading ? (
                <ActivityIndicator size="small" color={Colors.ink} />
              ) : (
                <Icon name="download" size={18} color={Colors.muted} />
              )
            }
          />
        </Card>

        {/* ── Bibliothèque de plats ───────────────────────────── */}
        <SectionHeader icon="layers" label="Bibliothèque de plats" />
        <Card>
          <Row
            label="Importer des plats"
            description="Fichier JSON — fusionne avec ta bibliothèque existante"
            borderBottom={true}
            onPress={handleImportPlates}
            right={
              importPlatesLoading ? (
                <ActivityIndicator size="small" color={Colors.ink} />
              ) : (
                <Icon name="upload" size={18} color={Colors.muted} />
              )
            }
          />
          <Row
            label="Exporter les plats"
            description={`${savedPlates.length} plat${savedPlates.length > 1 ? 's' : ''} dans ta bibliothèque`}
            borderBottom={false}
            onPress={handleExportPlates}
            right={
              exportPlatesLoading ? (
                <ActivityIndicator size="small" color={Colors.ink} />
              ) : (
                <Icon name="download" size={18} color={Colors.muted} />
              )
            }
          />
        </Card>

        {/* ── Onboarding ──────────────────────────────────────── */}
        <SectionHeader icon="info" label="Visite guidée" />
        <Card>
          <Row
            label="Revoir l'introduction"
            description="Relance les écrans de démarrage et les conseils contextuels"
            borderBottom={false}
            onPress={onResetOnboarding}
            right={<Icon name="arrow-right" size={18} color={Colors.muted} />}
          />
        </Card>

        {/* ── À propos ─────────────────────────────────────────── */}
        <SectionHeader icon="info" label="À propos de Nutritor" />
        <Card>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutAppName}>Nutritor</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionBadgeText}>v{APP_VERSION}</Text>
            </View>
          </View>
          <View style={[styles.row, styles.rowNoBorder]}>
            <Text style={styles.rowDesc}>Base de données locale · données stockées sur l'appareil</Text>
          </View>
        </Card>

        {/* ── Diagnostic IA ────────────────────────────────────── */}
        <SectionHeader icon="cpu" label="Diagnostic enrichissement IA" />
        <Card>
          <View style={styles.diagHeader}>
            <Text style={styles.diagHint}>
              Logs des appels IA — copie et colle dans un chat pour analyser
            </Text>
            <View style={styles.diagActions}>
              <TouchableOpacity style={styles.diagBtn} onPress={handleCopyLogs} activeOpacity={0.7}>
                <Icon name="upload" size={13} color={Colors.ink} />
                <Text style={styles.diagBtnText}>Copier</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.diagBtn} onPress={handleClearLogs} activeOpacity={0.7}>
                <Text style={styles.diagBtnText}>Effacer</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.logBox}>
            <Text style={styles.logText} selectable>
              {logText}
            </Text>
          </View>
        </Card>

        {/* ── Dev / Test ───────────────────────────────────────── */}
        <SectionHeader icon="alert" label="Développement" />
        <Card>
          <Row
            label="Simuler passage au lendemain"
            description="Réinitialise la date du journal à hier — redémarre l'app pour déclencher la duplication"
            borderBottom={false}
            onPress={() => {
              const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
              save(KEYS.mealsDate, yesterday).then(() => {
                showToast('Date réinitialisée à hier — ferme et rouvre l\'app');
              });
            }}
            right={<Icon name="layers" size={18} color={Colors.muted} />}
          />
        </Card>
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
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnSignal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.signal + '55',
    backgroundColor: Colors.signal + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    color: Colors.ink,
    letterSpacing: -0.4,
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 48,
    gap: 8,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.muted,
  },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.hairline2,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  rowNoBorder: { borderBottomWidth: 0 },
  rowText: { flex: 1 },
  rowLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.ink,
  },
  rowDesc: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.hairline2,
    marginHorizontal: 16,
  },

  providerSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  pillGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.paper2,
  },
  pillActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  pillText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.muted,
  },
  pillTextActive: { color: Colors.paper2 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.ink,
    paddingVertical: 0,
  },

  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.paper2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modelList: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
    gap: 10,
  },
  modelItemSelected: { backgroundColor: Colors.paper2 },
  modelItemLeft: { flex: 1 },
  modelId: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.ink,
    letterSpacing: 0.2,
  },
  modelName: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.muted,
    marginTop: 1,
  },

  diagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline2,
  },
  diagHint: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.muted,
    lineHeight: 15,
  },
  diagActions: {
    flexDirection: 'row',
    gap: 6,
  },
  diagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.paper2,
  },
  diagBtnText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.ink,
    letterSpacing: 0.5,
  },
  logBox: {
    backgroundColor: '#111',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 12,
    minHeight: 120,
    maxHeight: 240,
  },
  logText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: '#a8e6a3',
    lineHeight: 16,
    letterSpacing: 0.2,
  },

  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 10,
  },
  aboutAppName: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.ink,
    letterSpacing: -0.3,
    flex: 1,
  },
  versionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: Colors.paper2,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  versionBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 0.5,
    color: Colors.ink,
  },
});
