import React, { useState, useEffect } from 'react';
import { doc, writeBatch, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { validateUsername, suggestUsername } from '../../utils/username';
import { generateSearchTerms } from '../../utils/search';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Backpack } from 'lucide-react';
import { motion } from 'framer-motion';

export function UsernameSetupModal() {
  const { user, needsUsernameSetup, refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && needsUsernameSetup) {
      const displayName = user.displayName || user.email?.split('@')[0] || '';
      setUsername(suggestUsername(displayName));
    }
  }, [user, needsUsernameSetup]);

  if (!needsUsernameSetup || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUsername = username.toLowerCase().trim();

    const validationError = validateUsername(normalizedUsername);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if username is taken
      const usernameDoc = await getDoc(doc(db, 'usernames', normalizedUsername));
      if (usernameDoc.exists()) {
        setError('Brukernavn er allerede tatt');
        setLoading(false);
        return;
      }

      const displayName = user.displayName || user.email?.split('@')[0] || 'Bruker';
      const batch = writeBatch(db);

      batch.set(doc(db, 'usernames', normalizedUsername), {
        uid: user.uid,
        createdAt: serverTimestamp(),
      });

      batch.update(doc(db, 'users', user.uid), {
        username: normalizedUsername,
        bio: '',
        isProfilePublic: true,
        followerCount: 0,
        followingCount: 0,
        publicListCount: 0,
        searchTerms: generateSearchTerms(displayName, normalizedUsername),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      await refreshProfile();
    } catch (err) {
      if (err instanceof Error && err.message.includes('ALREADY_EXISTS')) {
        setError('Brukernavn er allerede tatt');
      } else {
        setError('Noe gikk galt. Prøv igjen.');
        console.error('Feil ved oppsett av brukernavn:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-stone-900 text-white rounded-2xl flex items-center justify-center">
            <Backpack className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-medium">Velg brukernavn</h2>
            <p className="text-sm text-stone-500">Andre kan finne deg med dette navnet</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-stone-400">Brukernavn</label>
            <div className="flex items-center gap-2">
              <span className="text-stone-400 font-medium">@</span>
              <Input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase());
                  setError(null);
                }}
                placeholder="ditt-brukernavn"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <p className="text-xs text-stone-400">3-30 tegn. Små bokstaver, tall og bindestrek.</p>
          </div>

          <Button type="submit" className="w-full py-3" disabled={loading}>
            {loading ? 'Lagrer...' : 'Bekreft brukernavn'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
