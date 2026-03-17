import { useState, useEffect } from 'react';
import { doc, getDoc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function useStar(listId: string) {
  const { user } = useAuth();
  const [isStarred, setIsStarred] = useState(false);
  const [loading, setLoading] = useState(true);

  const starId = user ? `${user.uid}_${listId}` : null;

  useEffect(() => {
    if (!starId) {
      setLoading(false);
      return;
    }
    const check = async () => {
      const snap = await getDoc(doc(db, 'stars', starId));
      setIsStarred(snap.exists());
      setLoading(false);
    };
    check();
  }, [starId]);

  const toggleStar = async (listTitle: string, listOwnerId: string) => {
    if (!user || !starId) return;

    setLoading(true);
    const batch = writeBatch(db);
    const starRef = doc(db, 'stars', starId);

    try {
      if (isStarred) {
        batch.delete(starRef);
        batch.update(doc(db, 'lists', listId), { starCount: increment(-1) });
        await batch.commit();
        setIsStarred(false);
      } else {
        batch.set(starRef, {
          uid: user.uid,
          listId,
          listTitle,
          listOwnerId,
          createdAt: serverTimestamp(),
        });
        batch.update(doc(db, 'lists', listId), { starCount: increment(1) });
        await batch.commit();
        setIsStarred(true);
      }
    } catch (err) {
      console.error('Kunne ikke oppdatere favoritt:', err);
    } finally {
      setLoading(false);
    }
  };

  return { isStarred, toggleStar, loading };
}
