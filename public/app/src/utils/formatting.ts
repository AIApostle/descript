export function formatFingerprint(fingerprint: string): string {
  const cleaned = fingerprint.replace(/\s+/g, '');
  return cleaned.match(/.{1,8}/g)?.join(' ') ?? fingerprint;
}

export function formatFingerprintLines(fingerprint: string): [string, string] {
  const chunks = formatFingerprint(fingerprint).split(' ');
  const firstHalf = chunks.slice(0, 4).join(' ');
  const secondHalf = chunks.slice(4).join(' ');
  return [firstHalf, secondHalf];
}

export function formatUtcDateTime(iso: string | null | undefined): string {
  if (!iso) return 'N/A';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toISOString().replace('T', ' at ').slice(0, 19) + ' UTC';
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function truncateMiddle(value: string, start = 12, end = 8): string {
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}
