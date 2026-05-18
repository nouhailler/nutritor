import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { Colors, Fonts } from '../theme/tokens';

const DRAWER_WIDTH = 290;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Tab = 'home' | 'foods' | 'saved' | 'stats' | 'profile';

interface NavItem {
  id: Tab;
  label: string;
  icon: 'home' | 'leaf' | 'book' | 'chart' | 'user';
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home',    label: 'Journal',    icon: 'home',  description: 'Bilan du jour' },
  { id: 'foods',   label: 'Aliments',   icon: 'leaf',  description: 'Ma bibliothèque d\'aliments' },
  { id: 'saved',   label: 'Plats',      icon: 'book',  description: 'Mes repas sauvegardés' },
  { id: 'stats',   label: 'Statistiques', icon: 'chart', description: 'Tendances hebdomadaires' },
  { id: 'profile', label: 'Profil',     icon: 'user',  description: 'Allergies & objectifs' },
];

interface DrawerMenuProps {
  visible: boolean;
  activeTab: Tab;
  profile: { initial: string; name: string; diet: string; goal: string };
  onNavigate: (tab: Tab) => void;
  onOpenSettings: () => void;
  onOpenMealGenerator: () => void;
  onOpenKnowledge: () => void;
  onClose: () => void;
}

export function DrawerMenu({
  visible,
  activeTab,
  profile,
  onNavigate,
  onOpenSettings,
  onOpenMealGenerator,
  onOpenKnowledge,
  onClose,
}: DrawerMenuProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View
        style={[
          styles.drawer,
          {
            paddingTop: insets.top + 10,
            paddingBottom: insets.bottom + 20,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Icon name="close" size={20} />
        </TouchableOpacity>

        {/* Profile header */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.initial}</Text>
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileDiet}>{profile.diet}</Text>
          <View style={styles.goalPill}>
            <Text style={styles.goalText}>{profile.goal}</Text>
          </View>
        </View>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Navigation */}
        <View style={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active = item.id === activeTab;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.navIcon, active && styles.navIconActive]}>
                  <Icon
                    name={item.icon}
                    size={18}
                    color={active ? Colors.paper2 : Colors.ink}
                  />
                </View>
                <View style={styles.navText}>
                  <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                  <Text style={styles.navDesc}>{item.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* IA section */}
        <View style={styles.iaSection}>
          <Text style={styles.iaSectionLabel}>Intelligence artificielle</Text>
          <TouchableOpacity
            style={styles.iaItem}
            onPress={() => { onOpenMealGenerator(); onClose(); }}
            activeOpacity={0.7}
          >
            <View style={styles.iaIcon}>
              <Icon name="sparkle" size={16} color={Colors.paper2} />
            </View>
            <View style={styles.navText}>
              <Text style={styles.iaLabel}>Générateur de repas</Text>
              <Text style={styles.navDesc}>Recettes personnalisées par IA</Text>
            </View>
            <Icon name="chevron-right" size={14} color={Colors.muted2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iaItem, { marginTop: 8 }]}
            onPress={() => { onOpenKnowledge(); onClose(); }}
            activeOpacity={0.7}
          >
            <View style={[styles.iaIcon, { backgroundColor: '#2E5A8B' }]}>
              <Icon name="book" size={16} color={Colors.paper2} />
            </View>
            <View style={styles.navText}>
              <Text style={styles.iaLabel}>Encyclopédie</Text>
              <Text style={styles.navDesc}>Vitamines, minéraux, bioactifs</Text>
            </View>
            <Icon name="chevron-right" size={14} color={Colors.muted2} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.drawerFooter}>
          <View style={styles.separator} />
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => { onOpenSettings(); onClose(); }}
            activeOpacity={0.7}
          >
            <Icon name="settings" size={16} color={Colors.muted} />
            <Text style={styles.settingsBtnText}>Paramètres</Text>
          </TouchableOpacity>
          <Text style={styles.footerBrand}>Nutritor</Text>
          <Text style={styles.footerTagline}>Allergies & micronutriments</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,12,8,0.45)',
  },

  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.paper,
    borderRightWidth: 1,
    borderRightColor: Colors.hairline2,
    shadowColor: '#0f0c08',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
    paddingHorizontal: 22,
  },

  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 6,
  },

  // Profile header
  profileSection: {
    paddingTop: 6,
    paddingBottom: 22,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontFamily: Fonts.serif,
    fontSize: 30,
    color: Colors.paper2,
    letterSpacing: -0.5,
  },
  profileName: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    color: Colors.ink,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  profileDiet: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
    marginBottom: 12,
  },
  goalPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: Colors.card,
  },
  goalText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.muted,
    textTransform: 'uppercase',
  },

  separator: {
    height: 1,
    backgroundColor: Colors.hairline2,
    marginBottom: 16,
  },

  // Nav items
  nav: { gap: 4 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  navItemActive: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline2,
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.paper2,
  },
  navIconActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  navText: { flex: 1 },
  navLabel: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.ink,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  navLabelActive: { color: Colors.ink },
  navDesc: {
    fontFamily: Fonts.sans,
    fontSize: 11.5,
    color: Colors.muted,
    marginTop: 1,
  },

  // IA section
  iaSection: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline2,
  },
  iaSectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.muted2,
    marginBottom: 8,
  },
  iaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline2,
  },
  iaIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iaLabel: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.ink,
    letterSpacing: -0.2,
    lineHeight: 20,
  },

  // Footer
  drawerFooter: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    marginBottom: 12,
  },
  settingsBtnText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.muted,
  },
  footerBrand: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.ink,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  footerTagline: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.muted2,
  },
});
