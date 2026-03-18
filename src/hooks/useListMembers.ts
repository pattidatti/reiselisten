import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { ListMemberInfo, UserProfile } from '../types';

export function useListMembers(ownerId: string | undefined, sharedWith: string[] | undefined) {
  const [members, setMembers] = useState<ListMemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef<Map<string, ListMemberInfo>>(new Map());
  const prevKeyRef = useRef<string>('');

  useEffect(() => {
    if (!ownerId) {
      setLoading(false);
      return;
    }

    const allIds = [ownerId, ...(sharedWith || [])];
    const key = allIds.join(',');
    if (key === prevKeyRef.current) {
      setLoading(false);
      return;
    }
    prevKeyRef.current = key;

    let cancelled = false;

    async function resolve() {
      const results: ListMemberInfo[] = [];

      for (const id of allIds) {
        if (cacheRef.current.has(id)) {
          results.push(cacheRef.current.get(id)!);
          continue;
        }

        const isOwner = id === ownerId;

        if (id.includes('@')) {
          // Email-based entry: try to find user by email
          try {
            const q = query(collection(db, 'users'), where('email', '==', id), limit(1));
            const snap = await getDocs(q);
            if (!snap.empty) {
              const profile = snap.docs[0].data() as UserProfile;
              const member: ListMemberInfo = {
                uid: profile.uid,
                displayName: profile.displayName,
                photoURL: profile.photoURL,
                isOwner,
              };
              cacheRef.current.set(id, member);
              results.push(member);
            } else {
              const member: ListMemberInfo = {
                uid: id,
                displayName: id,
                photoURL: '',
                isOwner,
              };
              cacheRef.current.set(id, member);
              results.push(member);
            }
          } catch {
            const member: ListMemberInfo = {
              uid: id,
              displayName: id,
              photoURL: '',
              isOwner,
            };
            cacheRef.current.set(id, member);
            results.push(member);
          }
        } else {
          // UID-based entry
          try {
            const snap = await getDoc(doc(db, 'users', id));
            if (snap.exists()) {
              const profile = snap.data() as UserProfile;
              const member: ListMemberInfo = {
                uid: profile.uid,
                displayName: profile.displayName,
                photoURL: profile.photoURL,
                isOwner,
              };
              cacheRef.current.set(id, member);
              results.push(member);
            } else {
              const member: ListMemberInfo = {
                uid: id,
                displayName: id,
                photoURL: '',
                isOwner,
              };
              cacheRef.current.set(id, member);
              results.push(member);
            }
          } catch {
            const member: ListMemberInfo = {
              uid: id,
              displayName: id,
              photoURL: '',
              isOwner,
            };
            cacheRef.current.set(id, member);
            results.push(member);
          }
        }
      }

      if (!cancelled) {
        setMembers(results);
        setLoading(false);
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, [ownerId, sharedWith]);

  return { members, loading };
}
