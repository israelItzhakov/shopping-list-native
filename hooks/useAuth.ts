import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  onAuthChange,
  getOrCreateFamily,
  signInWithGoogleToken,
  signOut as firebaseSignOut,
} from '../services/firebase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '../utils/constants';

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
});

interface AuthState {
  user: User | null;
  familyId: string | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    familyId: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        try {
          const familyId = await getOrCreateFamily(user);
          setState({ user, familyId, loading: false });
        } catch (error) {
          console.error('Error getting family:', error);
          setState({ user, familyId: null, loading: false });
        }
      } else {
        setState({ user: null, familyId: null, loading: false });
      }
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo?.data?.idToken ?? (userInfo as any)?.idToken;
      if (idToken) {
        await signInWithGoogleToken(idToken);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await GoogleSignin.signOut();
      await firebaseSignOut();
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  }, []);

  return { ...state, signIn, signOut };
}
