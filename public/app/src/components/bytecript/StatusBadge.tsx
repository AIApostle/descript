import React from 'react';
import { AlertCircle, CheckCircle2, Clock, PauseCircle, ShieldAlert } from 'lucide-react';
import type { AgentStatus } from '../../types/agent';

interface StatusBadgeProps {
  status: AgentStatus | string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<
  string,
  { label: string; classes: string; icon: React.ReactNode; aria: string }
> = {
  active: {
    label: 'Verified & Active',
    classes:
      'bg-identity-50 text-identity-800 border-identity-200 dark:bg-identity-950/60 dark:text-identity-300 dark:border-identity-800',
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-identity-600 dark:text-identity-400" />,
    aria: 'Status: Active, verified and in good standing',
  },
  pending: {
    label: 'Pending Verification',
    classes:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    icon: <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />,
    aria: 'Status: Pending verification',
  },
  suspended: {
    label: 'Suspended',
    classes:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 animate-pulse-subtle',
    icon: <PauseCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />,
    aria: 'Status: Suspended - authentication temporarily disabled',
  },
  revoked: {
    label: 'Revoked',
    classes:
      'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
    icon: <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />,
    aria: 'Status: Revoked - identity permanently invalidated',
  },
  compromised: {
    label: 'Compromised',
    classes:
      'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800 animate-pulse-subtle',
    icon: <ShieldAlert className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />,
    aria: 'Status: Compromised - rotate or revoke credentials immediately',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    classes: 'bg-base-100 text-base-700 border-base-200 dark:bg-base-800 dark:text-base-200',
    icon: <Clock className="h-3.5 w-3.5" />,
    aria: `Status: ${status}`,
  };

  const sizeClass = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <span
      aria-label={cfg.aria}
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${cfg.classes} ${sizeClass}`}
    >
      {cfg.icon}
      <span>{cfg.label}</span>
    </span>
  );
};
