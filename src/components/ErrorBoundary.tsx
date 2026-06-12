import { Component, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme/tokens';

// Volontairement sans i18n, sans hooks et sans dépendance aux providers :
// cet écran doit pouvoir s'afficher même si le crash vient d'un provider,
// de l'initialisation i18next ou du chargement des polices.
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>🌱</Text>
        <Text style={styles.title}>Oups, quelque chose s'est mal passé</Text>
        <Text style={styles.subtitle}>
          Une erreur inattendue a interrompu l'affichage. Tes données (journal,
          profil, aliments) sont enregistrées sur l'appareil et restent intactes.
        </Text>

        <View style={styles.errorCard}>
          <Text style={styles.errorMessage}>{this.state.error.message}</Text>
        </View>

        <Pressable style={styles.retryBtn} onPress={this.handleRetry}>
          <Text style={styles.retryLabel}>Réessayer</Text>
        </Pressable>

        {__DEV__ && (
          <Text style={styles.stack}>{this.state.error.stack}</Text>
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 28,
  },
  emoji: {
    fontSize: 44,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.ink2,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  errorMessage: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.warn,
    fontFamily: 'monospace',
  },
  retryBtn: {
    backgroundColor: Colors.ok,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  retryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.paper,
  },
  stack: {
    marginTop: 24,
    fontSize: 10,
    lineHeight: 15,
    color: Colors.muted,
    fontFamily: 'monospace',
  },
});
