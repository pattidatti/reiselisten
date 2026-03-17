import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, PackingList, UsernameDoc } from '../types';
import { ListCard } from '../components/lists/ListCard';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { FollowButton } from '../components/social/FollowButton';
import { Backpack, ArrowLeft, Settings, Users, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [publicLists, setPublicLists] = useState<PackingList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        // Look up username -> uid
        const usernameDoc = await getDoc(doc(db, 'usernames', username));
        if (!usernameDoc.exists()) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const { uid } = usernameDoc.data() as UsernameDoc;

        // Load profile
        const profileDoc = await getDoc(doc(db, 'users', uid));
        if (!profileDoc.exists()) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const profileData = profileDoc.data() as UserProfile;
        setProfile(profileData);

        // Load public lists
        const listsQuery = query(
          collection(db, 'lists'),
          where('ownerId', '==', uid),
          where('isPublic', '==', true),
          orderBy('createdAt', 'desc')
        );
        const listsSnap = await getDocs(listsQuery);
        setPublicLists(listsSnap.docs.map(d => ({ id: d.id, ...d.data() } as PackingList)));
      } catch (err) {
        console.error('Kunne ikke laste profil:', err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Backpack className="w-12 h-12 text-stone-300" />
          <div className="h-2 w-24 bg-stone-200 rounded" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <h2 className="text-2xl font-medium mb-2">Bruker ikke funnet</h2>
          <p className="text-stone-500 mb-6">Brukeren «{username}» finnes ikke.</p>
          <Button onClick={() => navigate('/')}>Tilbake til forsiden</Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.uid === profile.uid;

  const isAuthenticated = !!user;

  const content = (
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

          {/* Profile header */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar photoURL={profile.photoURL} displayName={profile.displayName} size="xl" />
              <div className="flex-1">
                <h2 className="text-3xl font-medium tracking-tight">{profile.displayName}</h2>
                <p className="text-stone-400 font-medium">@{profile.username}</p>
                {profile.bio && <p className="text-stone-600 mt-3">{profile.bio}</p>}

                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-1.5 text-sm text-stone-500">
                    <Users className="w-4 h-4" />
                    <span><strong className="text-stone-900">{profile.followerCount || 0}</strong> følgere</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-stone-500">
                    <UserCheck className="w-4 h-4" />
                    <span><strong className="text-stone-900">{profile.followingCount || 0}</strong> følger</span>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  {isOwnProfile ? (
                    <Button variant="secondary" onClick={() => navigate('/profil/rediger')}>
                      <Settings className="w-4 h-4" /> Rediger profil
                    </Button>
                  ) : (
                    <FollowButton targetUid={profile.uid} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Public lists */}
          <div>
            <h3 className="text-xl font-medium mb-4">Offentlige lister ({publicLists.length})</h3>
            {publicLists.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-stone-200 rounded-3xl">
                <p className="text-stone-400">Ingen offentlige lister ennå.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {publicLists.map(list => (
                  <ListCard
                    key={list.id}
                    list={list}
                    onClick={() => navigate(`/liste/${list.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Login prompt */}
          {!user && (
            <div className="bg-stone-100 rounded-3xl p-6 text-center">
              <p className="text-stone-600 mb-4">Logg inn for å følge {profile.displayName} og kopiere lister.</p>
              <Button onClick={() => navigate('/logg-inn')}>Logg inn</Button>
            </div>
          )}
        </motion.div>
  );

  if (isAuthenticated) {
    return content;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {content}
      </div>
    </div>
  );
}
