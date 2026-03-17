import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFollow } from '../../hooks/useFollow';
import { Button } from '../ui/Button';
import { UserPlus, UserMinus } from 'lucide-react';

interface FollowButtonProps {
  targetUid: string;
}

export function FollowButton({ targetUid }: FollowButtonProps) {
  const { user } = useAuth();
  const { isFollowing, toggleFollow, loading } = useFollow(targetUid);
  const navigate = useNavigate();

  if (user?.uid === targetUid) return null;

  const handleClick = () => {
    if (!user) {
      navigate('/logg-inn');
      return;
    }
    toggleFollow();
  };

  return (
    <Button
      variant={isFollowing ? 'secondary' : 'primary'}
      onClick={handleClick}
      disabled={loading}
    >
      {isFollowing ? (
        <><UserMinus className="w-4 h-4" /> Slutt å følge</>
      ) : (
        <><UserPlus className="w-4 h-4" /> Følg</>
      )}
    </Button>
  );
}
