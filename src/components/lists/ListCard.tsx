import React from 'react';
import { motion } from 'framer-motion';
import { Backpack, Mountain, Baby, MoreVertical, Globe, Lock, ChevronRight, Star } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { PackingList } from '../../types';

const categoryLabels: Record<string, string> = {
  General: 'Generelt',
  Trip: 'Reise',
  Ski: 'Ski',
  Children: 'Barn',
  Other: 'Annet',
};

const icons = {
  General: Backpack,
  Trip: Backpack,
  Ski: Mountain,
  Children: Baby,
  Other: MoreVertical,
};

export function ListCard({ list, onClick }: { list: PackingList, onClick: () => void }) {
  const Icon = icons[list.category] || Backpack;
  const starCount = list.starCount || 0;

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
          <div className="flex items-center gap-2">
            {starCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-stone-400">
                <Star className="w-3 h-3" /> {starCount}
              </span>
            )}
            {list.isPublic ? <Globe className="w-4 h-4 text-stone-300" /> : <Lock className="w-4 h-4 text-stone-300" />}
          </div>
        </div>
        <h3 className="text-xl font-medium tracking-tight mb-1 truncate">{list.title}</h3>
        <p className="text-sm text-stone-500 line-clamp-1">{list.description || 'Ingen beskrivelse'}</p>
      </div>

      <div className="flex items-center justify-between mt-4">
        <Badge>{categoryLabels[list.category] || list.category}</Badge>
        <div className="flex items-center gap-1 text-xs text-stone-400 font-medium">
          Se liste <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </motion.div>
  );
}
