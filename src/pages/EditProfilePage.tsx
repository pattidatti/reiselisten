import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, writeBatch, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { validateUsername } from '../utils/username';
import { generateSearchTerms } from '../utils/search';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { ArrowLeft, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export function EditProfilePage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setBio(userProfile.bio || '');
      setUsername(userProfile.username || '');
      setOriginalUsername(userProfile.username || '');
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const normalizedUsername = username.toLowerCase().trim();
    const usernameChanged = normalizedUsername !== originalUsername;

    if (usernameChanged) {
      const validationError = validateUsername(normalizedUsername);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Check availability
      const existing = await getDoc(doc(db, 'usernames', normalizedUsername));
      if (existing.exists() && existing.data()?.uid !== user.uid) {
        setError('Brukernavn er allerede tatt');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const batch = writeBatch(db);

      // Update username mapping if changed
      if (usernameChanged) {
        if (originalUsername) {
          batch.delete(doc(db, 'usernames', originalUsername));
        }
        batch.set(doc(db, 'usernames', normalizedUsername), {
          uid: user.uid,
          createdAt: serverTimestamp(),
        });
      }

      batch.update(doc(db, 'users', user.uid), {
        displayName,
        bio,
        username: normalizedUsername,
        searchTerms: generateSearchTerms(displayName, normalizedUsername),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setOriginalUsername(normalizedUsername);
    } catch (err) {
      console.error('Kunne ikke oppdatere profil:', err);
      setError('Noe gikk galt. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-lg mx-auto"
    >
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Tilbake
      </button>

      <h2 className="text-3xl font-medium tracking-tight">Rediger profil</h2>

      <div className="flex justify-center">
        <Avatar
          photoURL={user?.photoURL || undefined}
          displayName={user?.displayName || undefined}
          size="xl"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-stone-400">Visningsnavn</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ditt navn"
            required
          />
        </div>

        <div className="space-y-1">
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

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-stone-400">Om meg</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 200))}
            placeholder="Fortell litt om deg selv..."
            className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all resize-none h-24"
            maxLength={200}
          />
          <p className="text-xs text-stone-400 text-right">{bio.length}/200</p>
        </div>

        <Button type="submit" className="w-full py-3" disabled={loading}>
          {saved ? (
            <><Save className="w-4 h-4" /> Lagret!</>
          ) : loading ? (
            'Lagrer...'
          ) : (
            <><Save className="w-4 h-4" /> Lagre endringer</>
          )}
        </Button>
      </form>
    </motion.div>
  );
}
