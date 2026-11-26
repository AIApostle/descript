import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
}

interface ConfirmDialogState extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

interface NotificationContextValue {
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
  dismissToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmDialogState | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', durationMs = 3600) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (durationMs > 0) {
        window.setTimeout(() => {
          dismissToast(id);
        }, durationMs);
      }
    },
    [dismissToast]
  );

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const handleConfirmClose = (accepted: boolean) => {
    if (confirmState) {
      confirmState.resolve(accepted);
      setConfirmState(null);
    }
  };

  const toastStyles: Record<ToastType, { border: string; icon: React.ReactNode }> = {
    success: {
      border: 'border-identity-200 dark:border-identity-800 bg-white dark:bg-base-900',
      icon: <CheckCircle2 className="h-5 w-5 text-identity-600 dark:text-identity-400 shrink-0" />,
    },
    error: {
      border: 'border-red-200 dark:border-red-900 bg-white dark:bg-base-900',
      icon: <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />,
    },
    warning: {
      border: 'border-amber-200 dark:border-amber-800 bg-white dark:bg-base-900',
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />,
    },
    info: {
      border: 'border-descript-200 dark:border-descript-800 bg-white dark:bg-base-900',
      icon: <Info className="h-5 w-5 text-descript-600 dark:text-descript-400 shrink-0" />,
    },
  };

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm, dismissToast }}>
      {children}

      {/* Toast stack */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none no-print"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-down ${toastStyles[toast.type].border}`}
          >
            {toastStyles[toast.type].icon}
            <p className="text-sm font-medium text-base-800 dark:text-base-100 flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-base-400 hover:text-base-600 dark:hover:text-base-200 p-0.5 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation dialog */}
      {confirmState && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base-950/60 backdrop-blur-xs animate-fade-in no-print"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <div className="bg-white dark:bg-base-900 border border-base-200 dark:border-base-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-in">
            <h3 id="confirm-dialog-title" className="text-lg font-semibold text-base-900 dark:text-base-50 mb-2">
              {confirmState.title}
            </h3>
            <p className="text-sm text-base-600 dark:text-base-300 leading-relaxed mb-6">{confirmState.message}</p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => handleConfirmClose(false)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium border border-base-200 dark:border-base-700 text-base-700 dark:text-base-200 hover:bg-base-50 dark:hover:bg-base-800 transition-colors"
              >
                {confirmState.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmClose(true)}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${
                  confirmState.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-descript-600 hover:bg-descript-700'
                }`}
              >
                {confirmState.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
