import React from 'react';

export interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  footer,
  children,
  className = '',
}) => {
  return (
    <div
      className={`bg-white dark:bg-base-900 border border-base-200 dark:border-base-800 rounded-2xl shadow-xs ${className}`}
    >
      {(title || actions) && (
        <div className="px-6 py-5 border-b border-base-200 dark:border-base-800 flex flex-wrap items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-base font-semibold text-base-900 dark:text-base-50">{title}</h2>
            )}
            {subtitle && (
              <p className="text-sm text-base-500 dark:text-base-400 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-4 bg-base-50 dark:bg-base-950/60 border-t border-base-200 dark:border-base-800 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  );
};
