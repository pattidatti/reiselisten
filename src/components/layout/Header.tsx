import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { LogOut, Search, Backpack } from 'lucide-react';

export function Header() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between mb-6 md:mb-12">
      <div
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => navigate('/dashbord')}
      >
        <div className="w-10 h-10 bg-stone-900 text-white rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform">
          <Backpack className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-medium tracking-tight">Reiselisten</h1>
          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Din reisekompanjong</p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/sok')} className="p-2">
          <Search className="w-5 h-5" />
        </Button>

        {user && (
          <>
            <div
              className="flex flex-col items-end cursor-pointer hover:opacity-80"
              onClick={() => userProfile?.username ? navigate(`/bruker/${userProfile.username}`) : navigate('/profil/rediger')}
            >
              <span className="text-sm font-medium">{user.displayName || user.email}</span>
              {userProfile?.username && (
                <span className="text-[10px] text-stone-400 font-bold">@{userProfile.username}</span>
              )}
            </div>
            <Avatar
              photoURL={user.photoURL || undefined}
              displayName={user.displayName || undefined}
              className="cursor-pointer"
              onClick={() => userProfile?.username ? navigate(`/bruker/${userProfile.username}`) : navigate('/profil/rediger')}
            />
            <Button variant="ghost" onClick={() => signOut(auth)} className="p-2">
              <LogOut className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
