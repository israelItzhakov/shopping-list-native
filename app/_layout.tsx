import { useEffect, useState } from 'react';
import { I18nManager, ActivityIndicator, View, StyleSheet, Platform, Text, TouchableOpacity } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { useAuth } from '../hooks/useAuth';
import { AuthContext } from '../hooks/AuthContext';

export default function RootLayout() {
  const [needsRestart, setNeedsRestart] = useState(false);
  const { user, familyId, loading, signIn, signOut } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Force RTL for Hebrew
  useEffect(() => {
    if (!I18nManager.isRTL) {
      I18nManager.forceRTL(true);
      I18nManager.allowRTL(true);
      setNeedsRestart(true);
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && inAuthGroup) {
      router.replace('/login');
    } else if (user && familyId && !inAuthGroup) {
      router.replace('/(auth)');
    }
  }, [user, familyId, loading, segments]);

  if (needsRestart) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.restartText}>{"מפעיל תמיכה בעברית..."}</Text>
        <Text style={styles.restartSubtext}>{"יש לסגור ולפתוח מחדש את האפליקציה"}</Text>
        <TouchableOpacity
          style={styles.restartButton}
          onPress={async () => {
            try {
              await Updates.reloadAsync();
            } catch {
              // Fallback - just tell user to restart manually
              setNeedsRestart(true);
            }
          }}
        >
          <Text style={styles.restartButtonText}>{"הפעל מחדש"}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, familyId, signIn, signOut }}>
      <StatusBar style="light" />
      <Slot />
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#667eea',
  },
  restartText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 10,
  },
  restartSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 30,
  },
  restartButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  restartButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
});
