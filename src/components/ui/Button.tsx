import React from 'react';
import { cn } from '../../utils/cn';

export const Button = ({
  children,
  className,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) => {
  const variants = {
    primary: 'bg-stone-900 text-white hover:bg-stone-800',
    secondary: 'bg-white text-stone-900 border border-stone-200 hover:bg-stone-50',
    ghost: 'bg-transparent text-stone-600 hover:bg-stone-100',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  };

  return (
    <button
      className={cn(
        'px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
