import React, { useState } from 'react';
import { Fingerprint, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Agent, Bytecript, Credential } from '../../types/agent';
import { formatFingerprintLines, formatUtcDateTime } from '../../utils/formatting';
import { CopyButton } from '../common/CopyButton';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { StatusBadge } from './StatusBadge';

export interface BytecriptCardProps {
  agent?: Agent | null;
  bytecript?: Bytecript | null;
  credential?: Credential | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  showQr?: boolean;
}

export const BytecriptCard: React.FC<BytecriptCardProps> = ({
  agent,
  bytecript,
  credential,
  isLoading = false,
  error = null,
  onRetry,
  showQr = true,
}) => {
  const [showKeyModal, setShowKeyModal] = useState(false);

  if (isLoading) {
    return (
      <div className="bytecript-card w-full max-w-[640px] mx-auto rounded-2xl border-2 border-base-200 dark:border-base-800 bg-white dark:bg-base-900 p-8 sm:p-10 shadow-xl animate-pulse">
        <div className="h-6 w-36 bg-base-200 dark:bg-base-800 rounded-full mb-6" />
        <div className="h-8 w-48 bg-base-200 dark:bg-base-800 rounded mb-2" />
        <div className="h-4 w-32 bg-base-100 dark:bg-base-800 rounded mb-8" />
        <div className="h-16 w-full bg-base-100 dark:bg-base-800 rounded-xl mb-6" />
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="h-12 bg-base-100 dark:bg-base-800 rounded" />
          <div className="h-12 bg-base-100 dark:bg-base-800 rounded" />
          <div className="h-12 bg-base-100 dark:bg-base-800 rounded" />
        </div>
        <div className="h-20 w-full bg-base-100 dark:bg-base-800 rounded-xl" />
      </div>
    );
  }

  if (error || (!agent && !bytecript)) {
    return (
      <div className="w-full max-w-[640px] mx-auto rounded-2xl border-2 border-red-300 dark:border-red-900 bg-white dark:bg-base-900 p-8 text-center shadow-lg">
        <p className="text-base font-semibold text-red-700 dark:text-red-400 mb-2">
          Unable to load Bytecript credential
        </p>
        <p className="text-sm text-base-600 dark:text-base-400 mb-5">
          {error || 'No credential payload available.'}
        </p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  const resolvedAgentId = bytecript?.agentId || agent?.id || '';
  const resolvedName = bytecript?.agentName || agent?.name || 'Unnamed Agent';
  const resolvedDescription = bytecript?.description ?? agent?.description;
  const resolvedNetwork = bytecript?.byteNetwork || agent?.byteNetwork || 'kiroween';
  const resolvedResidence = bytecript?.residence || agent?.residence || `${resolvedNetwork}-residence`;
  const resolvedStatus = bytecript?.status || agent?.status || 'active';
  const resolvedIssuedAt = bytecript?.issuedAt || agent?.updatedAt || agent?.createdAt || '';
  const resolvedVersion = bytecript?.version ?? 1;
  const controllerVerified = bytecript?.controllerVerified ?? true;

  const primaryCredential =
    credential ||
    agent?.credentials.find((c) => c.status === 'active') ||
    agent?.credentials[0];

  const fingerprint =
    primaryCredential?.fingerprint ||
    bytecript?.credentials[0]?.publicKeyFingerprint ||
    '0000000000000000000000000000000000000000000000000000000000000000';
  const algorithm = primaryCredential?.algorithm || bytecript?.credentials[0]?.algorithm || 'ed25519';
  const fullPublicKey = primaryCredential?.publicKey || bytecript?.credentials[0]?.publicKey || '';
  const fullPublicKeyPem = primaryCredential?.publicKeyPem || '';
  const [fpLine1, fpLine2] = formatFingerprintLines(fingerprint);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/agent/${resolvedAgentId}`
      : `https://descript.app/agent/${resolvedAgentId}`;

  return (
    <>
      <section
        aria-label="Bytecript Digital Identity Card"
        className="bytecript-card relative w-full max-w-[640px] mx-auto rounded-2xl border-2 border-base-200 dark:border-base-700 bg-white dark:bg-base-900 p-6 sm:p-10 shadow-xl overflow-hidden animate-fade-in"
      >
        {/* Subtle institutional corner accent */}
        <div
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-descript-600 via-trust-600 to-identity-600"
        />

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-7 pt-1">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-descript-600 text-white flex items-center justify-center shadow-sm">
              <Fingerprint className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-base-900 dark:text-white leading-none">
                BYTECRIPT
              </h2>
              <p className="text-xs sm:text-sm font-medium text-base-500 dark:text-base-400 mt-1">
                Digital Identity Card
              </p>
            </div>
          </div>

          <StatusBadge status={resolvedStatus} />
        </div>

        {/* Identity Section */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-base-500 dark:text-base-400 mb-1">
              Agent Name
            </div>
            <div className="text-xl sm:text-2xl font-semibold text-base-900 dark:text-white break-words">
              {resolvedName}
            </div>
            {resolvedDescription && (
              <p className="text-sm text-base-600 dark:text-base-300 mt-1.5 leading-relaxed">
                {resolvedDescription}
              </p>
            )}
          </div>

          {showQr && (
            <div className="shrink-0 p-2 bg-white rounded-xl border border-base-200 shadow-2xs self-start">
              <QRCodeSVG value={shareUrl} size={76} level="M" />
            </div>
          )}
        </div>

        {/* Agent ID Section */}
        <div className="mb-6 rounded-xl bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800 p-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-medium text-base-500 dark:text-base-400">Agent ID</span>
            <CopyButton text={resolvedAgentId} label="Copy ID" copiedMessage="Agent ID copied" />
          </div>
          <div className="font-mono text-xs sm:text-sm text-base-800 dark:text-base-100 break-all select-all">
            {resolvedAgentId}
          </div>
        </div>

        {/* Network & Status 3-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-5 border-y border-base-200 dark:border-base-800 mb-6">
          <div>
            <div className="text-xs font-medium text-base-500 dark:text-base-400 mb-1">
              Byte Network
            </div>
            <div className="text-sm font-semibold text-base-900 dark:text-base-100 font-mono">
              {resolvedNetwork}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-base-500 dark:text-base-400 mb-1">
              Residence
            </div>
            <div className="text-sm font-semibold text-base-900 dark:text-base-100 font-mono truncate">
              {resolvedResidence}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-base-500 dark:text-base-400 mb-1">
              Lifecycle State
            </div>
            <div className="text-sm font-semibold text-base-900 dark:text-base-100 capitalize">
              {resolvedStatus}
            </div>
          </div>
        </div>

        {/* Cryptography Section */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <div className="text-xs font-medium text-base-500 dark:text-base-400">
                Public Key Fingerprint
              </div>
              <div className="text-xs font-mono text-descript-600 dark:text-descript-400 mt-0.5">
                {algorithm} | SHA256
              </div>
            </div>
            <div className="flex items-center gap-2 no-print">
              <CopyButton
                text={fingerprint}
                label="Copy Fingerprint"
                copiedMessage="Fingerprint copied"
              />
              {fullPublicKey && (
                <button
                  type="button"
                  onClick={() => setShowKeyModal(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md border border-base-200 dark:border-base-700 bg-white dark:bg-base-800 text-base-700 dark:text-base-200 hover:bg-base-50 dark:hover:bg-base-700 transition-colors"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Full Key</span>
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800 p-3.5 font-mono text-xs leading-relaxed text-base-800 dark:text-base-200 tracking-wide">
            <div className="break-all sm:break-normal">{fpLine1}</div>
            {fpLine2 && <div className="break-all sm:break-normal mt-0.5">{fpLine2}</div>}
          </div>
        </div>

        {/* Metadata & Verification Seal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-base-200 dark:border-base-800 text-xs text-base-500 dark:text-base-400">
          <div className="space-y-1">
            <div>Issued: {formatUtcDateTime(resolvedIssuedAt)}</div>
            <div className="flex items-center gap-2">
              <span>Version: {resolvedVersion}</span>
              <span aria-hidden="true">|</span>
              <span className="inline-flex items-center gap-1 text-base-700 dark:text-base-200 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-identity-600 dark:text-identity-400" />
                {controllerVerified ? 'Controller Verified' : 'Controller Unverified'}
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800 text-base-700 dark:text-base-200 font-medium self-start sm:self-auto">
            <Lock className="h-3.5 w-3.5 text-amber-500" />
            <span>Cryptographically Signed</span>
          </div>
        </div>
      </section>

      <Modal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        title="Bound Ed25519 Public Key"
        footer={
          <Button variant="secondary" onClick={() => setShowKeyModal(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-base-500 dark:text-base-400">
                Base64 Raw (32 bytes)
              </span>
              <CopyButton text={fullPublicKey} label="Copy Base64" />
            </div>
            <pre className="p-3 rounded-lg bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800 font-mono text-xs break-all whitespace-pre-wrap text-base-800 dark:text-base-200">
              {fullPublicKey}
            </pre>
          </div>
          {fullPublicKeyPem && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-base-500 dark:text-base-400">
                  SPKI PEM Format
                </span>
                <CopyButton text={fullPublicKeyPem} label="Copy PEM" />
              </div>
              <pre className="p-3 rounded-lg bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800 font-mono text-xs break-all whitespace-pre-wrap text-base-800 dark:text-base-200">
                {fullPublicKeyPem}
              </pre>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
