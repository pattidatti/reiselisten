import React from 'react';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStar } from '../../hooks/useStar';
import { cn } from '../../utils/cn';

interface StarButtonProps {
  listId: string;
  listTitle: string;
  listOwnerId: string;
  className?: string;
}

export function StarButton({ listId, listTitle, listOwnerId, className }: StarButtonProps) {
  const { user } = useAuth();
  const { isStarred, toggleStar, loading } = useStar(listId);
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/logg-inn');
      return;
    }
    toggleStar(listTitle, listOwnerId);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'p-2 rounded-xl transition-all',
        isStarred ? 'text-amber-500 hover:text-amber-600' : 'text-stone-300 hover:text-stone-500',
        className
      )}
      title={isStarred ? 'Fjern fra favoritter' : 'Legg til i favoritter'}
    >
      <Star className={cn('w-5 h-5', isStarred && 'fill-current')} />
    </button>
  );
}
