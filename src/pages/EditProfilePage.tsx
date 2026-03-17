import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, writeBatch, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { validateUsername } from '../utils/username';
import { generateSearchTerms } from '../utils/search';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { ArrowLeft, Save, Camera, Check, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setBio(userProfile.bio || '');
      setUsername(userProfile.username || '');
      setOriginalUsername(userProfile.username || '');
    }
  }, [userProfile]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Velg en bildefil (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Bildet kan maks være 5 MB');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError(null);
  };

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
      // Upload photo if changed
      let newPhotoURL: string | undefined;
      if (photoFile) {
        setUploadingPhoto(true);
        const photoRef = ref(storage, `profilePhotos/${user.uid}`);
        await uploadBytes(photoRef, photoFile);
        newPhotoURL = await getDownloadURL(photoRef);
        setUploadingPhoto(false);
      }

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

      const updateData: Record<string, unknown> = {
        uid: user.uid,
        email: user.email,
        displayName,
        bio,
        username: normalizedUsername,
        searchTerms: generateSearchTerms(displayName, normalizedUsername),
        updatedAt: serverTimestamp(),
      };

      if (newPhotoURL) {
        updateData.photoURL = newPhotoURL;
      }

      batch.update(doc(db, 'users', user.uid), updateData);

      await batch.commit();
      await refreshProfile();
      setSaved(true);
      setPhotoFile(null);
      setPhotoPreview(null);
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
        <div className="relative group">
          <Avatar
            photoURL={photoPreview || userProfile?.photoURL || user?.photoURL || undefined}
            displayName={user?.displayName || undefined}
            size="xl"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Camera className="w-8 h-8 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>
      </div>
      {photoFile && (
        <p className="text-center text-xs text-stone-400">Nytt bilde valgt — lagre for å oppdatere</p>
      )}

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

        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-medium"
            >
              <Check className="w-4 h-4" />
              Profilen din er oppdatert!
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          className={`w-full py-3 ${saved ? 'bg-emerald-600 hover:bg-emerald-600' : ''}`}
          disabled={loading}
        >
          {saved ? (
            <><Check className="w-4 h-4" /> Lagret!</>
          ) : uploadingPhoto ? (
            'Laster opp bilde...'
          ) : loading ? (
            'Lagrer...'
          ) : (
            <><Save className="w-4 h-4" /> Lagre endringer</>
          )}
        </Button>
      </form>

      <div className="pt-6 border-t border-stone-200">
        <Button variant="ghost" onClick={() => signOut(auth)} className="w-full text-stone-400 hover:text-stone-900">
          <LogOut className="w-4 h-4" /> Logg ut
        </Button>
      </div>
    </motion.div>
  );
}
