import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer select-none';

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
      'bg-gradient-to-r from-descript-600 to-indigo-600 hover:from-descript-500 hover:to-indigo-500 text-white shadow-md shadow-descript-600/20 hover:shadow-lg hover:shadow-descript-600/30 border border-white/10',
    secondary:
      'bg-base-100 text-base-900 hover:bg-base-200 dark:bg-base-800 dark:text-base-100 dark:hover:bg-base-750 border border-base-200 dark:border-base-700/60',
    outline:
      'border border-base-200 dark:border-base-800 bg-white dark:bg-base-900 text-base-800 dark:text-base-100 hover:bg-base-50 dark:hover:bg-base-800/80 shadow-2xs',
    ghost:
      'text-base-600 dark:text-base-300 hover:bg-base-100/70 dark:hover:bg-white/5 hover:text-base-950 dark:hover:text-white',
    danger:
      'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20 border border-white/10',
  };

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'px-3 py-1.5 text-xs min-h-[34px] rounded-lg',
    md: 'px-4 py-2 text-sm min-h-[40px]',
    lg: 'px-6 py-3 text-base min-h-[46px] rounded-2xl',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : icon}
      {children}
    </button>
  );
};
