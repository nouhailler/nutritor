import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { Colors, Fonts } from '../theme/tokens';

// ── Content types ──────────────────────────────────────────────

export type HelpIconName =
  | 'search' | 'plus' | 'check' | 'database' | 'sparkle' | 'leaf'
  | 'alert' | 'sliders' | 'bookmark' | 'chart' | 'user' | 'settings'
  | 'scan' | 'zap' | 'shield' | 'target' | 'clock' | 'globe' | 'info'
  | 'key' | 'cpu' | 'upload' | 'download' | 'trash' | 'edit' | 'book'
  | 'calendar' | 'back' | 'layers';

export type HelpBlock =
  | { type: 'heading'; text: string }
  | { type: 'item'; icon: HelpIconName; label: string; text: string }
  | { type: 'tip'; text: string }
  | { type: 'divider' };

export interface HelpContent {
  title: string;
  subtitle?: string;
  blocks: HelpBlock[];
}

// ── Sub-components ─────────────────────────────────────────────

function Heading({ text }: { text: string }) {
  return (
    <View style={styles.headingRow}>
      <View style={styles.headingLine} />
      <Text style={styles.headingText}>{text.toUpperCase()}</Text>
      <View style={styles.headingLine} />
    </View>
  );
}

function HelpItem({ icon, label, text }: { icon: HelpIconName; label: string; text: string }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemIcon}>
        <Icon name={icon} size={16} color={Colors.signal} />
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.itemLabel}>{label}</Text>
        <Text style={styles.itemText}>{text}</Text>
      </View>
    </View>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <View style={styles.tip}>
      <Icon name="zap" size={13} color={Colors.ok} />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

// ── HelpModal ──────────────────────────────────────────────────

interface Props {
  visible: boolean;
  content: HelpContent;
  onClose: () => void;
}

export function HelpModal({ visible, content, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Icon name="info" size={18} color={Colors.signal} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{content.title}</Text>
            {content.subtitle ? (
              <Text style={styles.headerSubtitle}>{content.subtitle}</Text>
            ) : null}
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Icon name="close" size={16} color={Colors.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.dividerLine} />

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.body}
        >
          {content.blocks.map((block, i) => {
            if (block.type === 'heading') return <Heading key={i} text={block.text} />;
            if (block.type === 'item')    return <HelpItem key={i} icon={block.icon} label={block.label} text={block.text} />;
            if (block.type === 'tip')     return <Tip key={i} text={block.text} />;
            if (block.type === 'divider') return <View key={i} style={styles.spacer} />;
            return null;
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Help button (reusable) ─────────────────────────────────────

export function HelpButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.helpBtn} onPress={onPress} activeOpacity={0.7}>
      <Icon name="help" size={16} color={Colors.muted} />
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,12,8,0.45)',
  },
  sheet: {
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#0f0c08',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.hairline,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(180,100,30,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.paper2,
  },
  dividerLine: {
    height: 1,
    backgroundColor: Colors.hairline2,
    marginHorizontal: 0,
  },

  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 6,
  },

  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    marginBottom: 4,
  },
  headingLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.hairline2,
  },
  headingText: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 2,
    color: Colors.muted2,
  },

  item: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(180,100,30,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  itemBody: { flex: 1 },
  itemLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.ink,
    marginBottom: 2,
  },
  itemText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 19,
  },

  tip: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(63,90,58,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(63,90,58,0.2)',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ok,
    lineHeight: 19,
  },

  spacer: { height: 8 },

  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.paper2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
