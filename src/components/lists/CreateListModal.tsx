import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../../utils/firestore-error';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PackingList } from '../../types';

export function CreateListModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user, userProfile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PackingList['category']>('General');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'lists'), {
        title,
        description,
        category,
        isPublic,
        ownerId: user.uid,
        ownerEmail: user.email,
        ownerUsername: userProfile?.username || '',
        ownerDisplayName: userProfile?.displayName || user.displayName || '',
        sharedWith: [],
        shareToken: null,
        starCount: 0,
        copiedFrom: null,
        itemCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      onClose();
      setTitle('');
      setDescription('');
      setCategory('General');
      setIsPublic(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'lists');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lag ny liste">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-stone-400">Tittel</label>
          <Input
            placeholder="f.eks. Sommertur til Italia"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-stone-400">Beskrivelse</label>
          <Input
            placeholder="Hva er denne listen for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-stone-400">Kategori</label>
            <select
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all"
              value={category}
              onChange={(e) => setCategory(e.target.value as PackingList['category'])}
            >
              <option value="General">Generelt</option>
              <option value="Trip">Reise</option>
              <option value="Ski">Ski</option>
              <option value="Children">Barn</option>
              <option value="Other">Annet</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-stone-400">Synlighet</label>
            <div className="flex items-center gap-4 h-[42px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                />
                <span className="text-sm font-medium">Offentlig</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onClose} className="flex-1">Avbryt</Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Oppretter...' : 'Opprett liste'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
