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

      // Sync basic profile data
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName,
        photoURL: firebaseUser.photoURL || '',
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Load full profile
      const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (profileDoc.exists()) {
        const data = profileDoc.data() as UserProfile;
        setUserProfile(data);
        setNeedsUsernameSetup(!data.username);

        // If profile exists but missing new fields, add defaults
        if (data.followerCount === undefined) {
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            bio: '',
            isProfilePublic: true,
            followerCount: 0,
            followingCount: 0,
            publicListCount: 0,
            searchTerms: generateSearchTerms(displayName, data.username || ''),
            createdAt: data.createdAt || serverTimestamp(),
          }, { merge: true });
        }
      }
    } catch (err) {
      console.error('Kunne ikke synkronisere brukerprofil', err);
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
