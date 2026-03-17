import { useState, useEffect } from 'react';
import { doc, getDoc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function useFollow(targetUid: string) {
  const { user, userProfile } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const followId = user ? `${user.uid}_${targetUid}` : null;

  useEffect(() => {
    if (!followId) {
      setLoading(false);
      return;
    }
    const checkFollow = async () => {
      const snap = await getDoc(doc(db, 'follows', followId));
      setIsFollowing(snap.exists());
      setLoading(false);
    };
    checkFollow();
  }, [followId]);

  const toggleFollow = async () => {
    if (!user || !followId || !userProfile?.username) return;

    setLoading(true);
    const batch = writeBatch(db);
    const followRef = doc(db, 'follows', followId);

    try {
      if (isFollowing) {
        batch.delete(followRef);
        batch.update(doc(db, 'users', targetUid), { followerCount: increment(-1) });
        batch.update(doc(db, 'users', user.uid), { followingCount: increment(-1) });
        await batch.commit();
        setIsFollowing(false);
      } else {
        // Get target username for denormalization
        const targetDoc = await getDoc(doc(db, 'users', targetUid));
        const targetUsername = targetDoc.data()?.username || '';

        batch.set(followRef, {
          followerUid: user.uid,
          followedUid: targetUid,
          followerUsername: userProfile.username,
          followedUsername: targetUsername,
          createdAt: serverTimestamp(),
        });
        batch.update(doc(db, 'users', targetUid), { followerCount: increment(1) });
        batch.update(doc(db, 'users', user.uid), { followingCount: increment(1) });
        await batch.commit();
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Kunne ikke oppdatere følging:', err);
    } finally {
      setLoading(false);
    }
  };

  return { isFollowing, toggleFollow, loading };
}
