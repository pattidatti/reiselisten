import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CreateListModal } from '../lists/CreateListModal';
import { Home, Search, Plus, User } from 'lucide-react';
import { cn } from '../../utils/cn';

export function BottomNav() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (!user) return null;

  const profilePath = userProfile?.username
    ? `/bruker/${userProfile.username}`
    : '/profil/rediger';

  const items = [
    { icon: Home, label: 'Hjem', path: '/dashbord' },
    { icon: Search, label: 'Søk', path: '/sok' },
    { icon: User, label: 'Profil', path: profilePath },
  ];

  const isActive = (path: string) => {
    if (path === '/dashbord') return location.pathname === '/dashbord';
    if (path === '/sok') return location.pathname === '/sok';
    if (path.startsWith('/bruker/')) return location.pathname === path || location.pathname === '/profil/rediger';
    if (path === '/profil/rediger') return location.pathname === '/profil/rediger';
    return false;
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around h-16 px-4">
          {/* Left items */}
          {items.slice(0, 2).map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center gap-0.5 min-w-[4rem] py-1 transition-colors',
                isActive(item.path) ? 'text-stone-900' : 'text-stone-400'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}

          {/* Center FAB */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center w-12 h-12 bg-stone-900 text-white rounded-full -mt-4 shadow-lg active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>

          {/* Right item */}
          {items.slice(2).map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center gap-0.5 min-w-[4rem] py-1 transition-colors',
                isActive(item.path) ? 'text-stone-900' : 'text-stone-400'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <CreateListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
