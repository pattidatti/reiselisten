import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentData, useCollection } from 'react-firebase-hooks/firestore';
import {
  doc, collection, query, orderBy, addDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { PackingList, ListItem } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestore-error';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ShareModal } from '../components/lists/ShareModal';
import { StarButton } from '../components/lists/StarButton';
import {
  ArrowLeft, CheckCircle2, Circle, Trash2, Share2, Globe, Lock,
  User as UserIcon, Backpack,
} from 'lucide-react';
import { motion } from 'framer-motion';

const categoryLabels: Record<string, string> = {
  General: 'Generelt', Trip: 'Reise', Ski: 'Ski', Children: 'Barn', Other: 'Annet',
};

export function ListEditView() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [list, listLoading] = useDocumentData(doc(db, 'lists', listId!));
  const itemsQuery = query(
    collection(db, 'lists', listId!, 'items'),
    orderBy('createdAt', 'asc')
  );
  const [itemsSnap] = useCollection(itemsQuery);
  const [newItemText, setNewItemText] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const items = itemsSnap?.docs.map(d => ({ id: d.id, ...d.data() } as ListItem)) || [];

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    try {
      await addDoc(collection(db, 'lists', listId!, 'items'), {
        text: newItemText,
        isChecked: false,
        listId,
        createdAt: serverTimestamp(),
      });
      setNewItemText('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `lists/${listId}/items`);
    }
  };

  const toggleItem = async (item: ListItem) => {
    try {
      await updateDoc(doc(db, 'lists', listId!, 'items', item.id), {
        isChecked: !item.isChecked
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `lists/${listId}/items/${item.id}`);
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, 'lists', listId!, 'items', itemId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `lists/${listId}/items/${itemId}`);
    }
  };

  const deleteList = async () => {
    if (!confirm('Er du sikker på at du vil slette denne listen?')) return;
    try {
      await deleteDoc(doc(db, 'lists', listId!));
      navigate('/dashbord');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `lists/${listId}`);
    }
  };

  if (listLoading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Backpack className="w-12 h-12 text-stone-300" />
          <div className="h-2 w-24 bg-stone-200 rounded" />
        </div>
      </div>
    );
  }

  if (!list) return <div className="py-12 text-center text-stone-400">Listen ble ikke funnet.</div>;

  const listData = list as unknown as PackingList;
  const isOwner = listData.ownerId === user?.uid;
  const checkedCount = items.filter(i => i.isChecked).length;
  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-4 flex-1">
          <button
            onClick={() => navigate('/dashbord')}
            className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Tilbake til dashbord
          </button>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-4xl font-medium tracking-tight">{listData.title}</h2>
              <Badge>{categoryLabels[listData.category] || listData.category}</Badge>
            </div>
            <p className="text-stone-500 text-lg">{listData.description}</p>
          </div>

          <div className="flex items-center gap-4 text-sm text-stone-400">
            <div className="flex items-center gap-1">
              <UserIcon className="w-4 h-4" />
              <span>{listData.ownerDisplayName || listData.ownerEmail}</span>
            </div>
            <div className="flex items-center gap-1">
              {listData.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{listData.isPublic ? 'Offentlig' : 'Privat'}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <StarButton listId={listId!} listTitle={listData.title} listOwnerId={listData.ownerId} />
          {isOwner && (
            <>
              <Button variant="secondary" onClick={() => setIsShareModalOpen(true)}>
                <Share2 className="w-4 h-4" /> Del
              </Button>
              <Button variant="danger" onClick={deleteList}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
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

      {/* Items */}
      <div className="space-y-4">
        <form onSubmit={handleAddItem} className="flex gap-2">
          <Input
            placeholder="Legg til noe å pakke..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            className="py-3"
          />
          <Button type="submit" className="px-6">Legg til</Button>
        </form>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          {items.length === 0 ? (
            <div className="p-12 text-center text-stone-400">
              Listen er tom. Legg til ting ovenfor!
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
                >
                  <div
                    className="flex items-center gap-4 cursor-pointer flex-1"
                    onClick={() => toggleItem(item)}
                  >
                    {item.isChecked ? (
                      <CheckCircle2 className="w-6 h-6 text-stone-900" />
                    ) : (
                      <Circle className="w-6 h-6 text-stone-200 group-hover:text-stone-400" />
                    )}
                    <span className={cn(
                      'text-lg transition-all',
                      item.isChecked ? 'text-stone-300 line-through' : 'text-stone-900'
                    )}>
                      {item.text}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-2 text-stone-200 hover:text-red-500 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        listId={listId!}
        currentSharedWith={listData.sharedWith || []}
        shareToken={listData.shareToken || null}
      />
    </motion.div>
  );
}
