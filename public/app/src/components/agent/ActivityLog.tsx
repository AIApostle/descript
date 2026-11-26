import React from 'react';
import { Activity, KeyRound, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { AuditEvent } from '../../types/agent';
import { formatRelativeTime, formatUtcDateTime } from '../../utils/formatting';
import { Card } from '../ui/Card';

interface ActivityLogProps {
  events: AuditEvent[];
  isLoading?: boolean;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ events, isLoading = false }) => {
  const iconForEvent = (eventType: string) => {
    if (eventType.includes('revoked') || eventType.includes('suspended') || eventType.includes('compromised')) {
      return <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />;
    }
    if (eventType.startsWith('credential.')) {
      return <KeyRound className="h-4 w-4 text-descript-600 dark:text-descript-400" />;
    }
    if (eventType.includes('verified') || eventType.includes('registered') || eventType.includes('active')) {
      return <ShieldCheck className="h-4 w-4 text-identity-600 dark:text-identity-400" />;
    }
    return <Activity className="h-4 w-4 text-base-500" />;
  };

  return (
    <Card
      title="Audit Trail"
      subtitle="Immutable timeline of registrations, key rotations, status changes, and verifications."
    >
      {isLoading ? (
        <div className="py-6 text-sm text-base-500 dark:text-base-400">Loading audit events...</div>
      ) : events.length === 0 ? (
        <div className="py-6 text-sm text-base-500 dark:text-base-400">No audit events recorded yet.</div>
      ) : (
        <ol className="relative border-l border-base-200 dark:border-base-800 ml-3 space-y-5">
          {events.map((evt) => (
            <li key={evt.id} className="ml-6">
              <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-base-900 border border-base-200 dark:border-base-700">
                {iconForEvent(evt.eventType)}
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-descript-700 dark:text-descript-300 bg-descript-50 dark:bg-descript-950/50 px-2 py-0.5 rounded">
                  {evt.eventType}
                </span>
                <span
                  title={formatUtcDateTime(evt.createdAt)}
                  className="text-xs text-base-500 dark:text-base-400"
                >
                  {formatRelativeTime(evt.createdAt)}
                </span>
              </div>
              <p className="text-sm text-base-800 dark:text-base-200 mt-1.5">{evt.summary}</p>
              <div className="text-[11px] text-base-500 dark:text-base-400 mt-1">
                Actor: <span className="font-mono">{evt.actorType}</span>
                {evt.actorId ? ` (${evt.actorId})` : ''}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
};
