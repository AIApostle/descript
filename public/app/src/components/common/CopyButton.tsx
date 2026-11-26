import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export interface CopyButtonProps {
  text: string;
  label?: string;
  copiedMessage?: string;
  className?: string;
  size?: 'xs' | 'sm';
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label = 'Copy',
  copiedMessage = 'Copied to clipboard',
  className = '',
  size = 'xs',
}) => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useNotification();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast(copiedMessage, 'success', 2000);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      showToast('Clipboard copy failed. Please select and copy manually.', 'error');
    }
  };

  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]';

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className={`inline-flex items-center gap-1.5 rounded-md font-medium border border-base-200 dark:border-base-700 bg-white dark:bg-base-800 text-base-700 dark:text-base-200 hover:bg-base-50 dark:hover:bg-base-700 transition-colors shrink-0 ${sizeClass} ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-identity-600 dark:text-identity-400" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
