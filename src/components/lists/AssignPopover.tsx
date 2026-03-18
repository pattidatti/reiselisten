import React, { useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ListMemberInfo } from '../../types';
import { handleFirestoreError, OperationType } from '../../utils/firestore-error';
import { Avatar } from '../ui/Avatar';
import { Check, UserMinus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AssignPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  members: ListMemberInfo[];
  currentAssignedTo: string | null | undefined;
  listId: string;
  itemId: string;
}

export function AssignPopover({ isOpen, onClose, members, currentAssignedTo, listId, itemId }: AssignPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const assign = async (member: ListMemberInfo | null) => {
    try {
      await updateDoc(doc(db, 'lists', listId, 'items', itemId), {
        assignedTo: member?.uid ?? null,
        assignedToName: member?.displayName ?? null,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `lists/${listId}/items/${itemId}`);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl border border-stone-200 shadow-lg py-1 min-w-[200px]"
        >
          <button
            onClick={() => assign(null)}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-stone-50 transition-colors text-left"
          >
            <div className="w-6 h-6 rounded-full border border-dashed border-stone-300 flex items-center justify-center flex-shrink-0">
              <UserMinus className="w-3 h-3 text-stone-400" />
            </div>
            <span className="text-sm text-stone-500">Ingen</span>
            {!currentAssignedTo && (
              <Check className="w-4 h-4 text-stone-900 ml-auto" />
            )}
          </button>

          <div className="h-px bg-stone-100 mx-2" />

          {members.map((member) => (
            <button
              key={member.uid}
              onClick={() => assign(member)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-stone-50 transition-colors text-left"
            >
              <Avatar photoURL={member.photoURL} displayName={member.displayName} size="xs" />
              <span className="text-sm text-stone-700 truncate">{member.displayName}</span>
              {currentAssignedTo === member.uid && (
                <Check className="w-4 h-4 text-stone-900 ml-auto flex-shrink-0" />
              )}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
