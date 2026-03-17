import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ShareToken } from '../types';
import { Backpack } from 'lucide-react';

export function SharedLinkRedirect() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    const lookup = async () => {
      try {
        const tokenDoc = await getDoc(doc(db, 'shareTokens', token));
        if (tokenDoc.exists()) {
          const data = tokenDoc.data() as ShareToken;
          navigate(`/liste/${data.listId}`, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch {
        navigate('/', { replace: true });
      }
    };

    lookup();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Backpack className="w-12 h-12 text-stone-300" />
        <p className="text-stone-400 text-sm">Laster delt liste...</p>
      </div>
    </div>
  );
}
