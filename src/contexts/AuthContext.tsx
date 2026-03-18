import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';
import { generateSearchTerms } from '../utils/search';

interface AuthContextValue {
  user: User | null | undefined;
  userProfile: UserProfile | null;
  loading: boolean;
  error: Error | undefined;
  needsUsernameSetup: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userProfile: null,
  loading: true,
  error: undefined,
  needsUsernameSetup: false,
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, loading, error] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [needsUsernameSetup, setNeedsUsernameSetup] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const syncAndLoadProfile = async (firebaseUser: User) => {
    setProfileLoading(true);
    try {
      const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Bruker';

      // Read profile first — this must succeed for the app to work
      const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const isNewUser = !profileDoc.exists();

      // For existing users, load profile into context immediately
      // (before attempting writes that might fail due to permissions)
      if (!isNewUser && profileDoc.exists()) {
        const data = profileDoc.data() as UserProfile;
        setUserProfile(data);
        setNeedsUsernameSetup(!data.username);
      }

      // Try to sync writes — non-critical, profile is already loaded above
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          ...(isNewUser ? {
            displayName,
            photoURL: firebaseUser.photoURL || '',
          } : {}),
          updatedAt: serverTimestamp(),
        }, { merge: true });

        // Re-read profile after successful write
        const updatedProfileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (updatedProfileDoc.exists()) {
          let data = updatedProfileDoc.data() as UserProfile;

          // Backfill missing fields for older profiles — only set defaults for fields that are actually missing
          if (data.followerCount === undefined) {
            const defaults: Record<string, unknown> = {
              followerCount: 0,
              followingCount: 0,
              publicListCount: 0,
            };
            if (data.bio === undefined) defaults.bio = '';
            if (data.isProfilePublic === undefined) defaults.isProfilePublic = true;
            if (data.searchTerms === undefined) {
              defaults.searchTerms = generateSearchTerms(displayName, data.username || '');
            }
            if (data.createdAt === undefined) defaults.createdAt = serverTimestamp();
            await setDoc(doc(db, 'users', firebaseUser.uid), defaults, { merge: true });

            // Re-read after backfill to get consistent state
            const postBackfillDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (postBackfillDoc.exists()) {
              data = postBackfillDoc.data() as UserProfile;
            }
          }

          setUserProfile(data);
          setNeedsUsernameSetup(!data.username);
        }
      } catch (writeErr) {
        console.warn('Kunne ikke synkronisere profil (skriving feilet, men profil er lastet)', writeErr);
      }
    } catch (err) {
      console.error('Kunne ikke laste brukerprofil', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileDoc = await getDoc(doc(db, 'users', user.uid));
      if (profileDoc.exists()) {
        const data = profileDoc.data() as UserProfile;
        setUserProfile(data);
        setNeedsUsernameSetup(!data.username);
      }
    }
  };

  useEffect(() => {
    if (user) {
      syncAndLoadProfile(user);
    } else {
      setUserProfile(null);
      setNeedsUsernameSetup(false);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading: loading || profileLoading,
      error,
      needsUsernameSetup,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
