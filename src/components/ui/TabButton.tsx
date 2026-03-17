import React from 'react';
import { cn } from '../../utils/cn';

export function TabButton({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
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
