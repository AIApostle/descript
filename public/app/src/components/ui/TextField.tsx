import React from 'react';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  hint,
  error,
  icon,
  required,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-base-700 dark:text-base-200"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-base-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={`w-full ${icon ? 'pl-10' : 'px-3.5'} pr-3.5 py-2.5 rounded-lg border bg-white dark:bg-base-950 text-base-900 dark:text-base-50 placeholder:text-base-400 dark:placeholder:text-base-500 text-sm transition-colors ${
            error
              ? 'border-red-400 dark:border-red-500 focus:ring-red-500/20 focus:border-red-500'
              : 'border-base-300 dark:border-base-700 focus:border-descript-500 focus:ring-2 focus:ring-descript-500/20'
          } outline-none ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-xs text-base-500 dark:text-base-400">
          {hint}
        </p>
      )}
    </div>
  );
};
