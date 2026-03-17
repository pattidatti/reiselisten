import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, PackingList } from '../types';
import { TabButton } from '../components/ui/TabButton';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { ListCard } from '../components/lists/ListCard';
import { Search, ArrowLeft, Users, List } from 'lucide-react';
import { motion } from 'framer-motion';

export function SearchPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'lists'>('users');
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [listResults, setListResults] = useState<PackingList[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setUserResults([]);
      setListResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        if (activeTab === 'users') {
          const q = query(
            collection(db, 'users'),
            where('searchTerms', 'array-contains', searchQuery.toLowerCase()),
            limit(20)
          );
          const snap = await getDocs(q);
          setUserResults(snap.docs.map(d => d.data() as UserProfile));
        } else {
          const q = query(
            collection(db, 'lists'),
            where('isPublic', '==', true),
            where('title', '>=', searchQuery),
            where('title', '<=', searchQuery + '\uf8ff'),
            limit(20)
          );
          const snap = await getDocs(q);
          setListResults(snap.docs.map(d => ({ id: d.id, ...d.data() } as PackingList)));
        }
      } catch (err) {
        console.error('Søkefeil:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Tilbake
          </button>

          <div>
            <h2 className="text-3xl font-medium tracking-tight mb-6">Søk</h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søk etter brukere eller lister..."
                className="pl-12 py-3 text-lg"
                autoFocus
              />
            </div>
          </div>

          <div className="flex bg-stone-100 p-1 rounded-2xl w-fit">
            <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Brukere</span>
            </TabButton>
            <TabButton active={activeTab === 'lists'} onClick={() => setActiveTab('lists')}>
              <span className="flex items-center gap-1.5"><List className="w-3.5 h-3.5" /> Lister</span>
            </TabButton>
          </div>

          {loading && (
            <div className="py-8 text-center text-stone-400">Søker...</div>
          )}

          {/* User results */}
          {activeTab === 'users' && !loading && (
            <div className="space-y-3">
              {userResults.map(u => (
                <motion.div
                  key={u.uid}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => u.username && navigate(`/bruker/${u.username}`)}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-stone-200 shadow-sm cursor-pointer hover:shadow-md transition-all"
                >
                  <Avatar photoURL={u.photoURL} displayName={u.displayName} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{u.displayName}</p>
                    {u.username && <p className="text-sm text-stone-400">@{u.username}</p>}
                  </div>
                  <div className="text-xs text-stone-400">
                    {u.followerCount || 0} følgere
                  </div>
                </motion.div>
              ))}
              {searchQuery.length >= 2 && userResults.length === 0 && !loading && (
                <div className="py-12 text-center text-stone-400">
                  Ingen brukere funnet for «{searchQuery}»
                </div>
              )}
            </div>
          )}

          {/* List results */}
          {activeTab === 'lists' && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {listResults.map(list => (
                <ListCard
                  key={list.id}
                  list={list}
                  onClick={() => navigate(`/liste/${list.id}`)}
                />
              ))}
              {searchQuery.length >= 2 && listResults.length === 0 && !loading && (
                <div className="col-span-full py-12 text-center text-stone-400">
                  Ingen lister funnet for «{searchQuery}»
                </div>
              )}
            </div>
          )}

          {searchQuery.length < 2 && (
            <div className="py-16 text-center text-stone-400">
              <Search className="w-12 h-12 mx-auto mb-4 text-stone-200" />
              <p>Skriv minst 2 tegn for å søke</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
