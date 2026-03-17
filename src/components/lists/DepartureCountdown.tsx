import React from 'react';
import { Timestamp } from 'firebase/firestore';
import { CalendarDays } from 'lucide-react';

export function DepartureCountdown({ departureDate }: { departureDate: Timestamp | null | undefined }) {
  if (!departureDate) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const departure = departureDate.toDate();
  departure.setHours(0, 0, 0, 0);
  const diffMs = departure.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-stone-300">
        <CalendarDays className="w-4 h-4" />
        <span>Avreist</span>
      </div>
    );
  }

  if (days === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-stone-500">
        <CalendarDays className="w-4 h-4" />
        <span className="font-bold text-stone-900">I dag!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-stone-500">
      <CalendarDays className="w-4 h-4" />
      <span>
        <span className="font-bold text-stone-900">{days}</span> {days === 1 ? 'dag' : 'dager'} til avreise
      </span>
    </div>
  );
}

export function CompactCountdown({ departureDate }: { departureDate: Timestamp | null | undefined }) {
  if (!departureDate) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const departure = departureDate.toDate();
  departure.setHours(0, 0, 0, 0);
  const diffMs = departure.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) return null;

  return (
    <span className="flex items-center gap-1 text-xs text-stone-400">
      <CalendarDays className="w-3 h-3" />
      {days === 0 ? 'I dag' : `${days}d`}
    </span>
  );
}
