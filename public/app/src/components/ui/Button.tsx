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
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
      'bg-descript-600 text-white hover:bg-descript-700 active:bg-descript-800 shadow-sm hover:shadow',
    secondary:
      'bg-base-100 text-base-800 hover:bg-base-200 dark:bg-base-800 dark:text-base-100 dark:hover:bg-base-700',
    outline:
      'border border-base-300 dark:border-base-700 bg-white dark:bg-base-900 text-base-800 dark:text-base-100 hover:bg-base-50 dark:hover:bg-base-800',
    ghost:
      'text-base-600 dark:text-base-300 hover:bg-base-100 dark:hover:bg-base-800 hover:text-base-900 dark:hover:text-white',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
  };

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'px-3 py-1.5 text-xs min-h-[36px]',
    md: 'px-4 py-2.5 text-sm min-h-[42px]',
    lg: 'px-6 py-3 text-base min-h-[48px]',
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
