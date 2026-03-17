import React, { useState, useEffect } from 'react';
import {
  doc, updateDoc, setDoc, deleteDoc, collection, query, where, getDocs, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../../utils/firestore-error';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TabButton } from '../ui/TabButton';
import { Avatar } from '../ui/Avatar';
import { UserProfile } from '../../types';
import { Trash2, Copy, Link, Mail, Users, Check } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  currentSharedWith: string[];
  shareToken: string | null;
}

export function ShareModal({ isOpen, onClose, listId, currentSharedWith, shareToken }: ShareModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'link' | 'user' | 'email'>('link');
  const [email, setEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentToken, setCurrentToken] = useState(shareToken);

  useEffect(() => {
    setCurrentToken(shareToken);
  }, [shareToken]);

  // Søk etter brukere
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('searchTerms', 'array-contains', searchQuery.toLowerCase()),
          limit(10)
        );
        const snap = await getDocs(q);
        const results = snap.docs
          .map(d => d.data() as UserProfile)
          .filter(u => u.uid !== user?.uid && !currentSharedWith.includes(u.uid));
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user?.uid, currentSharedWith]);

  const generateLink = async () => {
    setLoading(true);
    try {
      const token = crypto.randomUUID();
      await setDoc(doc(db, 'shareTokens', token), {
        listId,
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'lists', listId), { shareToken: token });
      setCurrentToken(token);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'shareTokens');
    } finally {
      setLoading(false);
    }
  };

  const removeLink = async () => {
    if (!currentToken) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'shareTokens', currentToken));
      await updateDoc(doc(db, 'lists', listId), { shareToken: null });
      setCurrentToken(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `shareTokens/${currentToken}`);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!currentToken) return;
    const url = `${window.location.origin}${window.location.pathname}#/delt/${currentToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWithUser = async (targetUid: string) => {
    setLoading(true);
    try {
      if (!currentSharedWith.includes(targetUid)) {
        await updateDoc(doc(db, 'lists', listId), {
          sharedWith: [...currentSharedWith, targetUid]
        });
      }
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `lists/${listId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleShareByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
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

  const shareUrl = currentToken
    ? `${window.location.origin}${window.location.pathname}#/delt/${currentToken}`
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Del liste" maxWidth="max-w-md">
      <div className="flex bg-stone-100 p-1 rounded-2xl mb-6">
        <TabButton active={activeTab === 'link'} onClick={() => setActiveTab('link')}>
          <span className="flex items-center gap-1.5"><Link className="w-3.5 h-3.5" /> Lenke</span>
        </TabButton>
        <TabButton active={activeTab === 'user'} onClick={() => setActiveTab('user')}>
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Bruker</span>
        </TabButton>
        <TabButton active={activeTab === 'email'} onClick={() => setActiveTab('email')}>
          <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> E-post</span>
        </TabButton>
      </div>

      {activeTab === 'link' && (
        <div className="space-y-4">
          {shareUrl ? (
            <>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="text-xs" />
                <Button variant="secondary" onClick={copyLink} className="flex-shrink-0">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button variant="danger" onClick={removeLink} disabled={loading} className="w-full">
                <Trash2 className="w-4 h-4" /> Fjern lenke
              </Button>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-stone-500 mb-4">Opprett en delingslenke som hvem som helst kan bruke.</p>
              <Button onClick={generateLink} disabled={loading} className="w-full">
                <Link className="w-4 h-4" /> {loading ? 'Genererer...' : 'Generer delingslenke'}
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'user' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-stone-400">Søk etter bruker</label>
            <Input
              placeholder="Skriv et navn eller brukernavn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {searchResults.map(u => (
                <div
                  key={u.uid}
                  onClick={() => shareWithUser(u.uid)}
                  className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors"
                >
                  <Avatar photoURL={u.photoURL} displayName={u.displayName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.displayName}</p>
                    {u.username && <p className="text-xs text-stone-400">@{u.username}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'email' && (
        <div className="space-y-4">
          <form onSubmit={handleShareByEmail} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-stone-400">Inviter med e-post</label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="venn@eksempel.no"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" disabled={loading}>Inviter</Button>
              </div>
            </div>
          </form>
          <p className="text-xs text-stone-400 italic">Brukeren må registrere seg med denne e-postadressen for å få tilgang.</p>
        </div>
      )}

      {/* Delt med - vises alltid */}
      <div className="mt-8 space-y-4">
        <label className="text-xs font-bold uppercase text-stone-400">Delt med</label>
        <div className="space-y-2">
          {currentSharedWith.length === 0 ? (
            <p className="text-sm text-stone-400 italic">Ingen har tilgang ennå.</p>
          ) : (
            currentSharedWith.map((target) => (
              <div key={target} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Avatar size="sm" />
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
    </Modal>
  );
}
