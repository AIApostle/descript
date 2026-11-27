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
    <div className={`double-bezel card-lift ${className}`}>
      <div className="double-bezel-inner p-0 overflow-hidden">
        {(title || actions) && (
          <div className="px-6 py-5 border-b border-base-200/80 dark:border-base-800/80 flex flex-wrap items-start justify-between gap-4 bg-base-50/50 dark:bg-base-900/30">
            <div>
              {title && (
                <h2 className="text-base font-bold text-base-950 dark:text-white">{title}</h2>
              )}
              {subtitle && (
                <p className="text-xs text-base-500 dark:text-base-400 mt-1 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        <div className="p-6">{children}</div>
        {footer && (
          <div className="px-6 py-4 bg-base-50/80 dark:bg-base-900/50 border-t border-base-200/80 dark:border-base-800/80">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
