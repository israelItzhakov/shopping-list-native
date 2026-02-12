import { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../hooks/AuthContext';

export default function LoginScreen() {
  const { signIn } = useContext(AuthContext);

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error: any) {
      Alert.alert('שגיאה', 'לא ניתן להתחבר. נסה שוב.');
      console.error('Sign in error:', error);
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🛒</Text>
        <Text style={styles.title}>רשימת קניות</Text>
        <Text style={styles.subtitle}>רשימת קניות משפחתית חכמה</Text>

        <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
          <Image
            source={{
              uri: 'https://developers.google.com/identity/images/g-logo.png',
            }}
            style={styles.googleIcon}
          />
          <Text style={styles.signInText}>התחבר עם Google</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 60,
    textAlign: 'center',
  },
  signInButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginLeft: 12,
  },
  signInText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});
