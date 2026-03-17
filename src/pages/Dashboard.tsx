import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { PackingList, Star as StarType } from '../types';
import { ListCard } from '../components/lists/ListCard';
import { CreateListModal } from '../components/lists/CreateListModal';
import { TabButton } from '../components/ui/TabButton';
import { Button } from '../components/ui/Button';
import { Plus, Search, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'my' | 'shared' | 'public' | 'favorites'>('my');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const myListsQuery = query(
    collection(db, 'lists'),
    where('ownerId', '==', user?.uid),
    orderBy('createdAt', 'desc')
  );

  const sharedListsQuery = query(
    collection(db, 'lists'),
    where('sharedWith', 'array-contains', user?.uid),
    orderBy('createdAt', 'desc')
  );

  const publicListsQuery = query(
    collection(db, 'lists'),
    where('isPublic', '==', true),
    orderBy('createdAt', 'desc')
  );

  const starsQuery = query(
    collection(db, 'stars'),
    where('uid', '==', user?.uid),
    orderBy('createdAt', 'desc')
  );

  const [myListsSnap] = useCollection(myListsQuery);
  const [sharedListsSnap] = useCollection(sharedListsQuery);
  const [publicListsSnap] = useCollection(publicListsQuery);
  const [starsSnap] = useCollection(starsQuery);

  const lists = {
    my: myListsSnap?.docs.map(d => ({ id: d.id, ...d.data() } as PackingList)) || [],
    shared: sharedListsSnap?.docs.map(d => ({ id: d.id, ...d.data() } as PackingList)) || [],
    public: publicListsSnap?.docs.map(d => ({ id: d.id, ...d.data() } as PackingList)) || [],
  };

  const starredListIds = starsSnap?.docs.map(d => (d.data() as StarType).listId) || [];

  const handleSelectList = (listId: string) => {
    const list = [...lists.my, ...lists.shared].find(l => l.id === listId);
    if (list && (list.ownerId === user?.uid || list.sharedWith?.includes(user?.uid || ''))) {
      navigate(`/liste/${listId}/rediger`);
    } else {
      navigate(`/liste/${listId}`);
    }
  };

  const currentLists = activeTab === 'favorites'
    ? lists.public.filter(l => starredListIds.includes(l.id))
    : lists[activeTab as keyof typeof lists];

  const emptyMessages: Record<string, { title: string; desc: string }> = {
    my: { title: 'Ingen lister ennå', desc: 'Lag din første pakkeliste for å komme i gang.' },
    shared: { title: 'Ingen delte lister', desc: 'Når noen deler en liste med deg, vises den her.' },
    public: { title: 'Ingen offentlige lister', desc: 'Det finnes ingen offentlige lister ennå.' },
    favorites: { title: 'Ingen favoritter', desc: 'Stjern lister du liker, så finner du dem igjen her.' },
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-stone-100 p-1 rounded-2xl w-fit flex-wrap">
          <TabButton active={activeTab === 'my'} onClick={() => setActiveTab('my')}>Mine lister</TabButton>
          <TabButton active={activeTab === 'shared'} onClick={() => setActiveTab('shared')}>Delt med meg</TabButton>
          <TabButton active={activeTab === 'public'} onClick={() => setActiveTab('public')}>Offentlige</TabButton>
          <TabButton active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')}>
            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> Favoritter</span>
          </TabButton>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-5 h-5" />
          Lag ny liste
        </Button>
      </div>

      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {currentLists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              onClick={() => handleSelectList(list.id)}
            />
          ))}
        </AnimatePresence>

        {currentLists.length === 0 && (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-stone-200 rounded-3xl">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-stone-300" />
            </div>
            <h3 className="text-lg font-medium text-stone-900">{emptyMessages[activeTab].title}</h3>
            <p className="text-stone-500">{emptyMessages[activeTab].desc}</p>
          </div>
        )}
      </motion.div>

      <CreateListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
