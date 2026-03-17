import React, { useState, useEffect } from 'react';
import { 
  useAuthState, 
  useSignInWithGoogle, 
  useSignInWithEmailAndPassword,
  useCreateUserWithEmailAndPassword
} from 'react-firebase-hooks/auth';
import { 
  useCollection, 
  useDocumentData 
} from 'react-firebase-hooks/firestore';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDoc,
  setDoc,
  getDocFromServer
} from 'firebase/firestore';
import { signOut, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PackingList, ListItem } from './types';
import { 
  Plus, 
  Search, 
  LogOut, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Share2, 
  Globe, 
  Lock, 
  ChevronRight, 
  Backpack, 
  Mountain, 
  Baby, 
  MoreVertical,
  ArrowLeft,
  User as UserIcon,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Error Handling Helper ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Components ---

const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) => {
  const variants = {
    primary: 'bg-stone-900 text-white hover:bg-stone-800',
    secondary: 'bg-white text-stone-900 border border-stone-200 hover:bg-stone-50',
    ghost: 'bg-transparent text-stone-600 hover:bg-stone-100',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  };

  return (
    <button 
      className={cn(
        'px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    className={cn(
      'w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all',
      className
    )}
    {...props}
  />
);

const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600', className)}>
    {children}
  </span>
);

// --- Main App ---

export default function App() {
  const [user, loading, error] = useAuthState(auth);
  const [view, setView] = useState<'dashboard' | 'list'>('dashboard');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // Test connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (err) {
        if (err instanceof Error && err.message.includes('the client is offline')) {
          console.error("Firebase configuration error: client is offline.");
        }
      }
    };
    testConnection();
  }, []);

  // Sync user profile
  useEffect(() => {
    if (user) {
      const syncUser = async () => {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            photoURL: user.photoURL || '',
          }, { merge: true });
        } catch (err) {
          console.error('Failed to sync user profile', err);
        }
      };
      syncUser();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Backpack className="w-12 h-12 text-stone-300" />
          <div className="h-2 w-24 bg-stone-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-stone-900 selection:text-white">
        {!user ? (
          <LandingPage />
        ) : (
          <div className="max-w-5xl mx-auto px-4 py-8">
            <Header user={user} onGoHome={() => setView('dashboard')} />
            
            <AnimatePresence mode="wait">
              {view === 'dashboard' ? (
                <Dashboard 
                  key="dashboard"
                  onSelectList={(id) => {
                    setSelectedListId(id);
                    setView('list');
                  }} 
                />
              ) : (
                <ListView 
                  key="list"
                  listId={selectedListId!} 
                  onBack={() => setView('dashboard')} 
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

// --- Sub-pages ---

function LandingPage() {
  const [signInWithGoogle] = useSignInWithGoogle(auth);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInWithEmail] = useSignInWithEmailAndPassword(auth);
  const [createUserWithEmail] = useCreateUserWithEmailAndPassword(auth);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await createUserWithEmail(email, password);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Auth failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side: Hero */}
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
            PACK <br /> SMARTER, <br /> TRAVEL <br /> LIGHTER.
          </motion.h1>
          
          <p className="text-stone-400 max-w-md text-lg">
            The ultimate packing companion. Create, share, and discover lists for every adventure.
          </p>
        </div>

        <div className="relative z-10 flex gap-8 mt-12">
          <div className="flex flex-col">
            <span className="text-stone-500 text-xs uppercase tracking-widest mb-2">Features</span>
            <span className="text-sm">Public Lists</span>
            <span className="text-sm">Real-time Sharing</span>
            <span className="text-sm">Smart Categories</span>
          </div>
          <div className="flex flex-col">
            <span className="text-stone-500 text-xs uppercase tracking-widest mb-2">Community</span>
            <span className="text-sm">10k+ Lists</span>
            <span className="text-sm">Global Users</span>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-stone-800 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Right Side: Auth */}
      <div className="flex-1 bg-white p-12 flex items-center justify-center">
        <div className="max-w-sm w-full">
          <h2 className="text-3xl font-medium mb-2">{isLogin ? 'Welcome back' : 'Create account'}</h2>
          <p className="text-stone-500 mb-8">Start your next journey with a perfect list.</p>

          <form onSubmit={handleAuth} className="space-y-4 mb-6">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-stone-400">Email</label>
              <Input 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-stone-400">Password</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full py-3">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-stone-400">Or continue with</span></div>
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

          <p className="text-center text-sm text-stone-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-stone-900 font-medium hover:underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Header({ user, onGoHome }: { user: User, onGoHome: () => void }) {
  return (
    <header className="flex items-center justify-between mb-12">
      <div 
        className="flex items-center gap-2 cursor-pointer group"
        onClick={onGoHome}
      >
        <div className="w-10 h-10 bg-stone-900 text-white rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform">
          <Backpack className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-medium tracking-tight">Reiselisten</h1>
          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Your Travel Companion</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-sm font-medium">{user.displayName || user.email}</span>
          <span className="text-[10px] text-stone-400 uppercase font-bold">Explorer</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden border border-stone-100">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
              <UserIcon className="w-5 h-5" />
            </div>
          )}
        </div>
        <Button variant="ghost" onClick={() => signOut(auth)} className="p-2">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}

function Dashboard({ onSelectList }: { onSelectList: (id: string) => void }) {
  const [activeTab, setActiveTab] = useState<'my' | 'shared' | 'public'>('my');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const myListsQuery = query(
    collection(db, 'lists'),
    where('ownerId', '==', auth.currentUser?.uid),
    orderBy('createdAt', 'desc')
  );

  const sharedListsQuery = query(
    collection(db, 'lists'),
    where('sharedWith', 'array-contains', auth.currentUser?.uid),
    orderBy('createdAt', 'desc')
  );

  const publicListsQuery = query(
    collection(db, 'lists'),
    where('isPublic', '==', true),
    orderBy('createdAt', 'desc')
  );

  const [myListsSnap] = useCollection(myListsQuery);
  const [sharedListsSnap] = useCollection(sharedListsQuery);
  const [publicListsSnap] = useCollection(publicListsQuery);

  const lists = {
    my: myListsSnap?.docs.map(d => ({ id: d.id, ...d.data() } as PackingList)) || [],
    shared: sharedListsSnap?.docs.map(d => ({ id: d.id, ...d.data() } as PackingList)) || [],
    public: publicListsSnap?.docs.map(d => ({ id: d.id, ...d.data() } as PackingList)) || [],
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-stone-100 p-1 rounded-2xl w-fit">
          <TabButton active={activeTab === 'my'} onClick={() => setActiveTab('my')}>My Lists</TabButton>
          <TabButton active={activeTab === 'shared'} onClick={() => setActiveTab('shared')}>Shared</TabButton>
          <TabButton active={activeTab === 'public'} onClick={() => setActiveTab('public')}>Public</TabButton>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-5 h-5" />
          Create New List
        </Button>
      </div>

      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {lists[activeTab].map((list) => (
            <ListCard 
              key={list.id} 
              list={list} 
              onClick={() => onSelectList(list.id)} 
            />
          ))}
        </AnimatePresence>

        {lists[activeTab].length === 0 && (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-stone-200 rounded-3xl">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-stone-300" />
            </div>
            <h3 className="text-lg font-medium text-stone-900">No lists found</h3>
            <p className="text-stone-500">Start by creating your first packing list.</p>
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

function TabButton({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        'px-6 py-2 rounded-xl text-sm font-medium transition-all',
        active ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
      )}
    >
      {children}
    </button>
  );
}

function ListCard({ list, onClick }: { list: PackingList, onClick: () => void }) {
  const icons = {
    General: Backpack,
    Trip: Backpack,
    Ski: Mountain,
    Children: Baby,
    Other: MoreVertical
  };
  const Icon = icons[list.category] || Backpack;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-48"
    >
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-colors">
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex gap-2">
            {list.isPublic ? <Globe className="w-4 h-4 text-stone-300" /> : <Lock className="w-4 h-4 text-stone-300" />}
          </div>
        </div>
        <h3 className="text-xl font-medium tracking-tight mb-1 truncate">{list.title}</h3>
        <p className="text-sm text-stone-500 line-clamp-1">{list.description || 'No description'}</p>
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <Badge>{list.category}</Badge>
        <div className="flex items-center gap-1 text-xs text-stone-400 font-medium">
          View List <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </motion.div>
  );
}

function CreateListModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PackingList['category']>('General');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'lists'), {
        title,
        description,
        category,
        isPublic,
        ownerId: auth.currentUser?.uid,
        ownerEmail: auth.currentUser?.email,
        sharedWith: [],
        createdAt: serverTimestamp(),
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl"
      >
        <h2 className="text-2xl font-medium mb-6">Create New List</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-stone-400">Title</label>
            <Input 
              placeholder="e.g. Summer Trip to Italy" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-stone-400">Description</label>
            <Input 
              placeholder="What's this list for?" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-stone-400">Category</label>
              <select 
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all"
                value={category}
                onChange={(e) => setCategory(e.target.value as PackingList['category'])}
              >
                <option value="General">General</option>
                <option value="Trip">Trip</option>
                <option value="Ski">Ski</option>
                <option value="Children">Children</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-stone-400">Visibility</label>
              <div className="flex items-center gap-4 h-[42px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isPublic} 
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                  <span className="text-sm font-medium">Public List</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Creating...' : 'Create List'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ListView({ listId, onBack }: { listId: string, onBack: () => void }) {
  const [list, listLoading] = useDocumentData(doc(db, 'lists', listId));
  const itemsQuery = query(
    collection(db, 'lists', listId, 'items'),
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
      await addDoc(collection(db, 'lists', listId, 'items'), {
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
      await updateDoc(doc(db, 'lists', listId, 'items', item.id), {
        isChecked: !item.isChecked
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `lists/${listId}/items/${item.id}`);
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, 'lists', listId, 'items', itemId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `lists/${listId}/items/${itemId}`);
    }
  };

  const deleteList = async () => {
    if (!confirm('Are you sure you want to delete this list?')) return;
    try {
      await deleteDoc(doc(db, 'lists', listId));
      onBack();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `lists/${listId}`);
    }
  };

  if (listLoading) return <div className="py-12 text-center text-stone-400">Loading list...</div>;
  if (!list) return <div className="py-12 text-center text-stone-400">List not found.</div>;

  const isOwner = list.ownerId === auth.currentUser?.uid;
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
            onClick={onBack}
            className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-4xl font-medium tracking-tight">{list.title}</h2>
              <Badge>{list.category}</Badge>
            </div>
            <p className="text-stone-500 text-lg">{list.description}</p>
          </div>

          <div className="flex items-center gap-4 text-sm text-stone-400">
            <div className="flex items-center gap-1">
              <UserIcon className="w-4 h-4" />
              <span>By {list.ownerEmail}</span>
            </div>
            <div className="flex items-center gap-1">
              {list.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{list.isPublic ? 'Public' : 'Private'}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {isOwner && (
            <>
              <Button variant="secondary" onClick={() => setIsShareModalOpen(true)}>
                <Share2 className="w-4 h-4" /> Share
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
            <span className="text-stone-400 text-sm ml-1">of {items.length} items packed</span>
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

      {/* Items List */}
      <div className="space-y-4">
        <form onSubmit={handleAddItem} className="flex gap-2">
          <Input 
            placeholder="Add something to pack..." 
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            className="py-3"
          />
          <Button type="submit" className="px-6">Add</Button>
        </form>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          {items.length === 0 ? (
            <div className="p-12 text-center text-stone-400">
              Your list is empty. Add items above!
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
                    className="p-2 text-stone-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
        listId={listId}
        currentSharedWith={list.sharedWith || []}
      />
    </motion.div>
  );
}

function ShareModal({ isOpen, onClose, listId, currentSharedWith }: { isOpen: boolean, onClose: () => void, listId: string, currentSharedWith: string[] }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      // In a real app, we'd look up the UID by email. 
      // For this demo, we'll just add the email to the sharedWith array.
      // Our security rules handle both UID and Email checks.
      if (!currentSharedWith.includes(email)) {
        await updateDoc(doc(db, 'lists', listId), {
          sharedWith: [...currentSharedWith, email]
        });
      }
      setEmail('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `lists/${listId}`);
    } finally {
      setLoading(false);
    }
  };

  const removeShare = async (target: string) => {
    try {
      await updateDoc(doc(db, 'lists', listId), {
        sharedWith: currentSharedWith.filter(e => e !== target)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `lists/${listId}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-medium">Share List</h2>
          <Button variant="ghost" onClick={onClose} className="p-1">
            <Plus className="w-6 h-6 rotate-45" />
          </Button>
        </div>

        <form onSubmit={handleShare} className="space-y-4 mb-8">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-stone-400">Invite by Email</label>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="friend@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading}>Invite</Button>
            </div>
          </div>
        </form>

        <div className="space-y-4">
          <label className="text-xs font-bold uppercase text-stone-400">Shared with</label>
          <div className="space-y-2">
            {currentSharedWith.length === 0 ? (
              <p className="text-sm text-stone-400 italic">No one else has access yet.</p>
            ) : (
              currentSharedWith.map((target) => (
                <div key={target} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium truncate max-w-[180px]">{target}</span>
                  </div>
                  <button 
                    onClick={() => removeShare(target)}
                    className="text-stone-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
