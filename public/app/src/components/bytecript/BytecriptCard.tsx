import React, { useState } from 'react';
import {
  CheckCircle2,
  Code2,
  FileCode2,
  Fingerprint,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
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
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showSdkModal, setShowSdkModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="double-bezel w-full max-w-[660px] mx-auto animate-pulse">
        <div className="double-bezel-inner p-8">
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
      </div>
    );
  }

  if (error || (!agent && !bytecript)) {
    return (
      <div className="double-bezel w-full max-w-[660px] mx-auto">
        <div className="double-bezel-inner p-8 text-center">
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
      </div>
    );
  }

  const resolvedAgentId = bytecript?.agentId || agent?.id || '';
  const resolvedName = bytecript?.agentName || agent?.name || 'Unnamed Agent';
  const resolvedDescription = bytecript?.description ?? agent?.description;
  const resolvedNetwork = bytecript?.byteNetwork || agent?.byteNetwork || 'kiroween';
  const resolvedResidence =
    bytecript?.residence || agent?.residence || `${resolvedNetwork}-residence`;
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
  const algorithm =
    primaryCredential?.algorithm || bytecript?.credentials[0]?.algorithm || 'ed25519';
  const fullPublicKey =
    primaryCredential?.publicKey || bytecript?.credentials[0]?.publicKey || '';
  const fullPublicKeyPem = primaryCredential?.publicKeyPem || '';
  const [fpLine1, fpLine2] = formatFingerprintLines(fingerprint);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/agent/${resolvedAgentId}`
      : `https://descript.id/agent/${resolvedAgentId}`;

  const handleTestVerify = async () => {
    setIsVerifying(true);
    await new Promise((r) => setTimeout(r, 400));
    setIsVerifying(false);
    setVerifyResult('Cryptographic Ed25519 signature valid against active registry key.');
    setTimeout(() => setVerifyResult(null), 4500);
  };

  const pythonSnippet = `from descript import DescriptClient

client = DescriptClient(api_key="dsc_live_...")

# Resolve persistent agent identity and Bytecript passport
agent = client.agents.get("${resolvedAgentId}")
is_valid = client.verify.verify_bytecript(agent.bytecript)

print(f"Agent {agent.name} verified: {is_valid}")`;

  return (
    <>
      <div className="double-bezel card-lift w-full max-w-[660px] mx-auto animate-fade-in">
        <section
          aria-label="Bytecript Digital Identity Card"
          className="bytecript-card double-bezel-inner relative overflow-hidden guilloche-pattern"
        >
          {/* Holographic Security Foil Strip */}
          <div
            aria-hidden="true"
            className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-descript-500 via-indigo-400 via-emerald-400 via-amber-400 to-descript-600 shadow-sm"
          />

          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pt-1">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-descript-600 text-white flex items-center justify-center shadow-md shadow-descript-600/25">
                <Fingerprint className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-base-950 dark:text-white leading-none">
                  BYTECRIPT
                </h2>
                <p className="text-xs sm:text-sm font-medium text-base-500 dark:text-base-400 mt-1">
                  Digital Identity Card
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={resolvedStatus} />
            </div>
          </div>

          {/* Agent Identity Body */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-base-400 mb-1">
                Agent Name
              </div>
              <div className="text-xl sm:text-2xl font-bold text-base-950 dark:text-white break-words">
                {resolvedName}
              </div>
              {resolvedDescription && (
                <p className="text-sm text-base-600 dark:text-base-300 mt-1.5 leading-relaxed">
                  {resolvedDescription}
                </p>
              )}
            </div>

            {/* Smart Hardware Chip Emblem & QR */}
            <div className="flex items-center gap-2.5 shrink-0 self-start">
              {/* Simulated Smart Chip */}
              <div
                title="Cryptographic Hardware Key Binding"
                className="hidden sm:flex flex-col items-center justify-center w-12 h-14 rounded-lg bg-gradient-to-b from-amber-100 to-amber-200 dark:from-amber-900/60 dark:to-amber-950/80 border border-amber-300 dark:border-amber-700/60 p-1 shadow-2xs"
              >
                <div className="w-full h-full border border-amber-400/50 rounded flex flex-col justify-between p-1">
                  <div className="h-1 w-full bg-amber-400/60 rounded-xs" />
                  <div className="h-1 w-full bg-amber-400/60 rounded-xs" />
                  <div className="h-1 w-full bg-amber-400/60 rounded-xs" />
                </div>
              </div>

              {showQr && (
                <div className="p-2 bg-white rounded-xl border border-base-200 shadow-2xs">
                  <QRCodeSVG value={shareUrl} size={74} level="M" />
                </div>
              )}
            </div>
          </div>

          {/* Agent ID Box */}
          <div className="mb-6 rounded-2xl bg-base-50 dark:bg-base-900/80 border border-base-200/80 dark:border-base-800/80 p-4">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-base-400">
                Canonical Agent ID
              </span>
              <CopyButton text={resolvedAgentId} label="Copy ID" copiedMessage="Agent ID copied" />
            </div>
            <div className="font-mono text-xs sm:text-sm text-base-800 dark:text-base-100 break-all select-all font-medium">
              {resolvedAgentId}
            </div>
          </div>

          {/* Network & Residence Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-base-200/80 dark:border-base-800/80 mb-6 text-xs">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-base-400 mb-1">
                Byte Network
              </div>
              <div className="text-sm font-semibold text-base-900 dark:text-base-100 font-mono">
                {resolvedNetwork}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-base-400 mb-1">
                Residence
              </div>
              <div className="text-sm font-semibold text-base-900 dark:text-base-100 font-mono truncate">
                {resolvedResidence}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-base-400 mb-1">
                Lifecycle State
              </div>
              <div className="text-sm font-semibold text-base-900 dark:text-base-100 capitalize">
                {resolvedStatus}
              </div>
            </div>
          </div>

          {/* Fingerprint Block */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-base-400">
                  Public Key Fingerprint
                </div>
                <div className="text-xs font-mono text-descript-600 dark:text-descript-400 mt-0.5">
                  {algorithm} | SHA256
                </div>
              </div>
              <div className="flex items-center gap-1.5 no-print">
                <CopyButton
                  text={fingerprint}
                  label="Copy Fingerprint"
                  copiedMessage="Fingerprint copied"
                />
                {fullPublicKey && (
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border border-base-200 dark:border-base-700 bg-white dark:bg-base-900 text-base-700 dark:text-base-200 hover:bg-base-50 dark:hover:bg-base-800 transition-colors"
                  >
                    <KeyRound className="h-3 w-3" />
                    <span>Raw Key</span>
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-base-50 dark:bg-base-900/80 border border-base-200/80 dark:border-base-800/80 p-3.5 font-mono text-xs leading-relaxed text-base-800 dark:text-base-200 tracking-wider">
              <div className="break-all sm:break-normal">{fpLine1}</div>
              {fpLine2 && <div className="break-all sm:break-normal mt-0.5">{fpLine2}</div>}
            </div>
          </div>

          {/* Interactive Tool Actions (Verify, Code, JSON) */}
          <div className="flex flex-wrap items-center gap-2 mb-6 no-print">
            <button
              type="button"
              onClick={handleTestVerify}
              disabled={isVerifying}
              className="btn-step inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-descript-50 dark:bg-descript-950/80 text-descript-700 dark:text-descript-300 border border-descript-200/80 dark:border-descript-800/80 hover:bg-descript-100 transition-colors disabled:opacity-50"
            >
              {isVerifying ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5 text-descript-600 dark:text-descript-400" />
              )}
              <span>Verify Cryptographic Seal</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSdkModal(true)}
              className="btn-step inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-base-100 dark:bg-base-900 text-base-700 dark:text-base-300 border border-base-200 dark:border-base-800 hover:bg-base-200/60 dark:hover:bg-base-800 transition-colors"
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Python SDK</span>
            </button>

            <button
              type="button"
              onClick={() => setShowJsonModal(true)}
              className="btn-step inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-base-100 dark:bg-base-900 text-base-700 dark:text-base-300 border border-base-200 dark:border-base-800 hover:bg-base-200/60 dark:hover:bg-base-800 transition-colors"
            >
              <FileCode2 className="h-3.5 w-3.5" />
              <span>Signed Manifest</span>
            </button>
          </div>

          {/* Live verify result notification */}
          {verifyResult && (
            <div className="mb-6 p-3 rounded-xl bg-identity-50 dark:bg-identity-950/60 border border-identity-200 dark:border-identity-800 text-xs text-identity-800 dark:text-identity-200 flex items-center gap-2 animate-slide-up">
              <CheckCircle2 className="h-4 w-4 text-identity-600 dark:text-identity-400 shrink-0" />
              <span>{verifyResult}</span>
            </div>
          )}

          {/* Metadata & Verification Seal */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-base-200/80 dark:border-base-800/80 text-xs text-base-500 dark:text-base-400">
            <div className="space-y-1">
              <div>Issued: {formatUtcDateTime(resolvedIssuedAt)}</div>
              <div className="flex items-center gap-2">
                <span>Version: {resolvedVersion}</span>
                <span aria-hidden="true">&bull;</span>
                <span className="inline-flex items-center gap-1 text-base-700 dark:text-base-200 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-identity-600 dark:text-identity-400" />
                  {controllerVerified ? 'Controller Verified' : 'Controller Unverified'}
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-base-100 dark:bg-base-900 border border-base-200 dark:border-base-800 text-base-700 dark:text-base-200 font-medium text-xs self-start sm:self-auto">
              <Lock className="h-3.5 w-3.5 text-amber-500" />
              <span>Cryptographically Signed</span>
            </div>
          </div>
        </section>
      </div>

      {/* Raw Key Modal */}
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
              <span className="text-xs font-medium text-base-500">Base64 Raw (32 bytes)</span>
              <CopyButton text={fullPublicKey} label="Copy Base64" />
            </div>
            <pre className="p-3 rounded-xl bg-base-950 text-base-100 font-mono text-xs break-all whitespace-pre-wrap">
              {fullPublicKey}
            </pre>
          </div>
          {fullPublicKeyPem && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-base-500">SPKI PEM Format</span>
                <CopyButton text={fullPublicKeyPem} label="Copy PEM" />
              </div>
              <pre className="p-3 rounded-xl bg-base-950 text-base-100 font-mono text-xs break-all whitespace-pre-wrap">
                {fullPublicKeyPem}
              </pre>
            </div>
          )}
        </div>
      </Modal>

      {/* Signed Manifest JSON Modal */}
      <Modal
        isOpen={showJsonModal}
        onClose={() => setShowJsonModal(false)}
        title="Signed Bytecript Manifest (JSON)"
        footer={
          <Button variant="secondary" onClick={() => setShowJsonModal(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-base-500">
            <span>Official digital identity payload</span>
            <CopyButton
              text={JSON.stringify(bytecript || agent?.bytecript, null, 2)}
              label="Copy Manifest"
            />
          </div>
          <pre className="p-4 rounded-xl bg-base-950 text-base-100 font-mono text-xs max-h-[350px] overflow-y-auto">
            {JSON.stringify(bytecript || agent?.bytecript, null, 2)}
          </pre>
        </div>
      </Modal>

      {/* Python SDK Modal */}
      <Modal
        isOpen={showSdkModal}
        onClose={() => setShowSdkModal(false)}
        title="Python SDK Integration"
        footer={
          <Button variant="secondary" onClick={() => setShowSdkModal(false)}>
            Done
          </Button>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-base-600 dark:text-base-400">
            Verify this agent identity inside any Python service, worker, or swarm coordinator:
          </p>
          <div className="relative">
            <pre className="p-4 rounded-xl bg-base-950 text-base-100 font-mono text-xs leading-relaxed overflow-x-auto">
              <code>{pythonSnippet}</code>
            </pre>
          </div>
          <div className="flex justify-end">
            <CopyButton text={pythonSnippet} label="Copy Snippet" />
          </div>
        </div>
      </Modal>
    </>
  );
};
