import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { doc, collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { PackingList, ListItem } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StarButton } from '../components/lists/StarButton';
import { ArrowLeft, CheckCircle2, Circle, Globe, Lock, User as UserIcon, Copy, Backpack } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const categoryLabels: Record<string, string> = {
  General: 'Generelt', Trip: 'Reise', Ski: 'Ski', Children: 'Barn', Other: 'Annet',
};

export function PublicListView() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [list, listLoading] = useDocumentData(doc(db, 'lists', listId!));

  const itemsQuery = query(
    collection(db, 'lists', listId!, 'items'),
    orderBy('createdAt', 'asc')
  );
  const [itemsSnap] = useCollection(itemsQuery);
  const items = itemsSnap?.docs.map(d => ({ id: d.id, ...d.data() } as ListItem)) || [];

  if (listLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Backpack className="w-12 h-12 text-stone-300" />
          <div className="h-2 w-24 bg-stone-200 rounded" />
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-medium mb-2">Listen ble ikke funnet</h2>
          <p className="text-stone-500 mb-6">Listen finnes ikke eller er privat.</p>
          <Button onClick={() => navigate('/')}>Tilbake til forsiden</Button>
        </div>
      </div>
    );
  }

  const listData = list as unknown as PackingList;
  const isOwner = user?.uid === listData.ownerId;
  const isShared = user && listData.sharedWith?.includes(user.uid);
  const canEdit = isOwner || isShared;
  const checkedCount = items.filter(i => i.isChecked).length;
  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0;

  const handleCopyList = async () => {
    if (!user) {
      navigate('/logg-inn');
      return;
    }
    try {
      const newListRef = await addDoc(collection(db, 'lists'), {
        title: listData.title,
        description: listData.description,
        category: listData.category,
        isPublic: false,
        ownerId: user.uid,
        ownerEmail: user.email,
        ownerUsername: '',
        ownerDisplayName: user.displayName || '',
        sharedWith: [],
        shareToken: null,
        starCount: 0,
        copiedFrom: listId,
        itemCount: items.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Copy all items
      for (const item of items) {
        await addDoc(collection(db, 'lists', newListRef.id, 'items'), {
          text: item.text,
          isChecked: false,
          listId: newListRef.id,
          createdAt: serverTimestamp(),
        });
      }

      navigate(`/liste/${newListRef.id}/rediger`);
    } catch (err) {
      console.error('Kunne ikke kopiere listen:', err);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-4 flex-1">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" /> Tilbake
              </button>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-4xl font-medium tracking-tight">{listData.title}</h2>
                  <Badge>{categoryLabels[listData.category] || listData.category}</Badge>
                </div>
                <p className="text-stone-500 text-lg">{listData.description}</p>
              </div>

              <div className="flex items-center gap-4 text-sm text-stone-400">
                {listData.ownerUsername ? (
                  <button
                    onClick={() => navigate(`/bruker/${listData.ownerUsername}`)}
                    className="flex items-center gap-1 hover:text-stone-900 transition-colors"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>@{listData.ownerUsername}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <UserIcon className="w-4 h-4" />
                    <span>{listData.ownerDisplayName || listData.ownerEmail}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  {listData.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  <span>{listData.isPublic ? 'Offentlig' : 'Privat'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <StarButton listId={listId!} listTitle={listData.title} listOwnerId={listData.ownerId} />
              {canEdit ? (
                <Button onClick={() => navigate(`/liste/${listId}/rediger`)}>Rediger</Button>
              ) : (
                <Button variant="secondary" onClick={handleCopyList}>
                  <Copy className="w-4 h-4" /> Kopier liste
                </Button>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-2xl font-medium">{checkedCount}</span>
                <span className="text-stone-400 text-sm ml-1">av {items.length} ting pakket</span>
              </div>
              <span className="text-stone-900 font-bold text-sm">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-stone-900"
              />
            </div>
          </div>

          {/* Items (read-only) */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            {items.length === 0 ? (
              <div className="p-12 text-center text-stone-400">
                Listen er tom.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4"
                  >
                    {item.isChecked ? (
                      <CheckCircle2 className="w-6 h-6 text-stone-900 flex-shrink-0" />
                    ) : (
                      <Circle className="w-6 h-6 text-stone-200 flex-shrink-0" />
                    )}
                    <span className={cn(
                      'text-lg',
                      item.isChecked ? 'text-stone-300 line-through' : 'text-stone-900'
                    )}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Login prompt for unauthenticated */}
          {!user && (
            <div className="bg-stone-100 rounded-3xl p-6 text-center">
              <p className="text-stone-600 mb-4">Logg inn for å stjerne, kopiere eller lage dine egne lister.</p>
              <Button onClick={() => navigate('/logg-inn')}>Logg inn</Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
