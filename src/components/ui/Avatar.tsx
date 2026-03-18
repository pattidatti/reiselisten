import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AvatarProps {
  photoURL?: string;
  displayName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

const sizes = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export function Avatar({ photoURL, displayName, size = 'md', className, onClick }: AvatarProps) {
  return (
    <div onClick={onClick} className={cn('rounded-full bg-stone-200 overflow-hidden border border-stone-100 flex-shrink-0', sizes[size], className)}>
      {photoURL ? (
        <img
          src={photoURL}
          alt={displayName || 'Profil'}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
          <UserIcon className={iconSizes[size]} />
        </div>
      )}
    </div>
  );
}
