import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`bg-white w-full ${maxWidth} rounded-3xl p-8 shadow-2xl`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-medium">{title}</h2>
          <Button variant="ghost" onClick={onClose} className="p-1">
            <Plus className="w-6 h-6 rotate-45" />
          </Button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
