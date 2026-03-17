import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignInWithGoogle, useSignInWithEmailAndPassword, useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ListCard } from '../components/lists/ListCard';
import { PackingList } from '../types';
import { Backpack, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [signInWithGoogle] = useSignInWithGoogle(auth);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInWithEmail] = useSignInWithEmailAndPassword(auth);
  const [createUserWithEmail] = useCreateUserWithEmailAndPassword(auth);

  const publicListsQuery = query(
    collection(db, 'lists'),
    where('isPublic', '==', true),
    orderBy('createdAt', 'desc'),
    limit(6)
  );
  const [publicSnap] = useCollection(publicListsQuery);
  const publicLists = publicSnap?.docs.map(d => ({ id: d.id, ...d.data() } as PackingList)) || [];

  // Redirect if already logged in
  if (user) {
    navigate('/dashbord', { replace: true });
    return null;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await createUserWithEmail(email, password);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Innlogging feilet');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-col md:flex-row flex-1">
        {/* Venstre side: Hero */}
        <div className="flex-1 bg-stone-900 text-white p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <Backpack className="w-8 h-8" />
              <span className="text-2xl font-medium tracking-tight">Reiselisten</span>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl md:text-8xl font-medium leading-[0.9] tracking-tighter mb-8"
            >
              PAKK <br /> SMARTERE, <br /> REIS <br /> LETTERE.
            </motion.h1>

            <p className="text-stone-400 max-w-md text-lg">
              Den ultimate pakkekompanjongen. Lag, del og oppdag lister for ethvert eventyr.
            </p>
          </div>

          <div className="relative z-10 flex gap-8 mt-12">
            <div className="flex flex-col">
              <span className="text-stone-500 text-xs uppercase tracking-widest mb-2">Funksjoner</span>
              <span className="text-sm">Offentlige lister</span>
              <span className="text-sm">Sanntidsdeling</span>
              <span className="text-sm">Smarte kategorier</span>
            </div>
            <div className="flex flex-col">
              <span className="text-stone-500 text-xs uppercase tracking-widest mb-2">Fellesskap</span>
              <span className="text-sm">Følg brukere</span>
              <span className="text-sm">Oppdag lister</span>
            </div>
          </div>

          <div className="absolute top-1/2 -right-24 w-96 h-96 bg-stone-800 rounded-full blur-3xl opacity-50" />
        </div>

        {/* Høyre side: Auth */}
        <div className="flex-1 bg-white p-12 flex items-center justify-center">
          <div className="max-w-sm w-full">
            <h2 className="text-3xl font-medium mb-2">{isLogin ? 'Velkommen tilbake' : 'Opprett konto'}</h2>
            <p className="text-stone-500 mb-8">Start neste reise med en perfekt liste.</p>

            <form onSubmit={handleAuth} className="space-y-4 mb-6">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-stone-400">E-post</label>
                <Input
                  type="email"
                  placeholder="deg@eksempel.no"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-stone-400">Passord</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full py-3">
                {isLogin ? 'Logg inn' : 'Registrer deg'}
              </Button>
            </form>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-100"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-stone-400">Eller fortsett med</span></div>
            </div>

            <div className="mb-8">
              <Button variant="secondary" onClick={() => signInWithGoogle()} className="w-full py-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-stone-500">
                {isLogin ? 'Har du ikke konto?' : 'Har du allerede konto?'}{' '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-stone-900 font-medium hover:underline"
                >
                  {isLogin ? 'Registrer deg' : 'Logg inn'}
                </button>
              </p>
              <button
                onClick={() => navigate('/sok')}
                className="text-sm text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-1"
              >
                <Search className="w-4 h-4" /> Utforsk
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Offentlige lister seksjon */}
      {publicLists.length > 0 && (
        <div className="bg-stone-50 py-16 px-12">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-medium mb-8">Populære offentlige lister</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicLists.map(list => (
                <ListCard
                  key={list.id}
                  list={list}
                  onClick={() => navigate(`/liste/${list.id}`)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
