import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  KeyRound,
  Plus,
  RefreshCw,
  ShieldOff,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useKeyGeneration } from '../../hooks/useKeyGeneration';
import { agentService } from '../../services/agentService';
import type { Credential } from '../../types/agent';
import { formatFingerprint, formatUtcDateTime } from '../../utils/formatting';
import { downloadTextFile } from '../../utils/download';
import { CopyButton } from '../common/CopyButton';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';

interface CredentialListProps {
  agentId: string;
  agentStatus: string;
  credentials: Credential[];
  onRefresh: () => Promise<void>;
}

export const CredentialList: React.FC<CredentialListProps> = ({
  agentId,
  agentStatus,
  credentials,
  onRefresh,
}) => {
  const { showToast, showConfirm } = useNotification();
  const { keypair, isGenerating, generate, validateImport, clear } = useKeyGeneration();

  const [addOpen, setAddOpen] = useState(false);
  const [mode, setMode] = useState<'generate' | 'import'>('generate');
  const [deactivateExisting, setDeactivateExisting] = useState(true);
  const [label, setLabel] = useState('Rotated Key');
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [importedInfo, setImportedInfo] = useState<{
    publicKey: string;
    fingerprint: string;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [revokeTarget, setRevokeTarget] = useState<Credential | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [viewKeyTarget, setViewKeyTarget] = useState<Credential | null>(null);

  const openAddModal = () => {
    clear();
    setMode('generate');
    setDeactivateExisting(true);
    setLabel('Rotated Key');
    setSavedConfirmed(false);
    setImportInput('');
    setImportedInfo(null);
    setImportError(null);
    setAddOpen(true);
  };

  const handleGenerate = async () => {
    setSavedConfirmed(false);
    await generate();
  };

  const handleValidateImport = async () => {
    setImportError(null);
    try {
      const info = await validateImport(importInput);
      setImportedInfo({ publicKey: info.publicKey, fingerprint: info.fingerprint });
    } catch (err) {
      setImportedInfo(null);
      setImportError(err instanceof Error ? err.message : 'Invalid public key');
    }
  };

  const handleSubmitCredential = async () => {
    const publicKey = mode === 'generate' ? keypair?.publicKey : importedInfo?.publicKey;
    if (!publicKey) return;

    setSubmitting(true);
    try {
      await agentService.addCredential(agentId, {
        publicKey,
        label: label.trim() || undefined,
        deactivateExisting,
      });
      showToast(
        deactivateExisting ? 'Credential rotated successfully' : 'New credential added',
        'success'
      );
      setAddOpen(false);
      clear();
      await onRefresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add credential', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (cred: Credential) => {
    const nextStatus = cred.status === 'active' ? 'inactive' : 'active';
    const confirmed = await showConfirm({
      title: nextStatus === 'inactive' ? 'Deactivate Credential?' : 'Reactivate Credential?',
      message:
        nextStatus === 'inactive'
          ? 'This key will no longer authenticate the agent until reactivated.'
          : 'This key will immediately resume authenticating the agent.',
      confirmLabel: nextStatus === 'inactive' ? 'Deactivate' : 'Reactivate',
    });
    if (!confirmed) return;

    try {
      await agentService.updateCredential(agentId, cred.id, { status: nextStatus });
      showToast(`Credential marked ${nextStatus}`, 'success');
      await onRefresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update credential', 'error');
    }
  };

  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return;
    setSubmitting(true);
    try {
      await agentService.revokeCredential(agentId, revokeTarget.id, revokeReason.trim() || undefined);
      showToast('Credential permanently revoked', 'success');
      setRevokeTarget(null);
      setRevokeReason('');
      await onRefresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to revoke credential', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadgeClass: Record<string, string> = {
    active: 'bg-identity-50 text-identity-800 border-identity-200 dark:bg-identity-950/60 dark:text-identity-300 dark:border-identity-800',
    inactive: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    revoked: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800',
  };

  return (
    <>
      <Card
        title="Cryptographic Credentials"
        subtitle="Bound Ed25519 public keys authorized to authenticate this agent."
        actions={
          agentStatus !== 'revoked' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={openAddModal}
            >
              Add / Rotate Key
            </Button>
          )
        }
      >
        {credentials.length === 0 ? (
          <div className="py-8 text-center text-sm text-base-500 dark:text-base-400">
            No credentials bound to this agent.
          </div>
        ) : (
          <div className="space-y-4">
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className="rounded-xl border border-base-200 dark:border-base-800 bg-base-50/70 dark:bg-base-950/60 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-semibold text-sm text-base-900 dark:text-base-100">
                        {cred.label || 'Ed25519 Key'}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${
                          statusBadgeClass[cred.status] || statusBadgeClass.inactive
                        }`}
                      >
                        {cred.status}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-base-200/70 dark:bg-base-800 text-base-700 dark:text-base-300 uppercase">
                        {cred.algorithm}
                      </span>
                    </div>
                    <div className="text-xs text-base-500 dark:text-base-400 mt-1 font-mono">
                      {cred.id}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <CopyButton
                      text={cred.fingerprint}
                      label="Copy Fingerprint"
                      copiedMessage="Fingerprint copied"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewKeyTarget(cred)}
                    >
                      View Key
                    </Button>
                    {cred.status !== 'revoked' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(cred)}
                        >
                          {cred.status === 'active' ? 'Mark Inactive' : 'Reactivate'}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<ShieldOff className="h-3.5 w-3.5" />}
                          onClick={() => setRevokeTarget(cred)}
                        >
                          Revoke
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-white dark:bg-base-900 border border-base-200 dark:border-base-800 p-3 font-mono text-xs text-base-700 dark:text-base-300 break-all">
                  {formatFingerprint(cred.fingerprint)}
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-base-500 dark:text-base-400 mt-3">
                  <span>Created: {formatUtcDateTime(cred.createdAt)}</span>
                  {cred.revokedAt && (
                    <span className="text-red-600 dark:text-red-400">
                      Revoked: {formatUtcDateTime(cred.revokedAt)}
                      {cred.revocationReason ? ` (${cred.revocationReason})` : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add / Rotate Credential Modal */}
      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add or Rotate Agent Credential"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={submitting}
              disabled={
                mode === 'generate' ? !keypair || !savedConfirmed : !importedInfo
              }
              onClick={handleSubmitCredential}
            >
              {deactivateExisting ? 'Rotate & Bind Key' : 'Add Credential'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('generate')}
              className={`p-3.5 rounded-xl border text-left transition-colors ${
                mode === 'generate'
                  ? 'border-descript-600 bg-descript-50 dark:bg-descript-950/40'
                  : 'border-base-200 dark:border-base-800 hover:bg-base-50 dark:hover:bg-base-800'
              }`}
            >
              <div className="text-sm font-semibold text-base-900 dark:text-base-100">
                Generate New Keypair
              </div>
              <div className="text-xs text-base-500 dark:text-base-400 mt-0.5">
                Created locally in browser
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode('import')}
              className={`p-3.5 rounded-xl border text-left transition-colors ${
                mode === 'import'
                  ? 'border-descript-600 bg-descript-50 dark:bg-descript-950/40'
                  : 'border-base-200 dark:border-base-800 hover:bg-base-50 dark:hover:bg-base-800'
              }`}
            >
              <div className="text-sm font-semibold text-base-900 dark:text-base-100">
                Import Public Key
              </div>
              <div className="text-xs text-base-500 dark:text-base-400 mt-0.5">
                Base64, PEM, or OpenSSH
              </div>
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-base-700 dark:text-base-300 mb-1.5">
                Credential Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Production Rotation Q4"
                className="w-full px-3.5 py-2 rounded-lg border border-base-300 dark:border-base-700 bg-white dark:bg-base-950 text-sm text-base-900 dark:text-base-100"
              />
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-base-200 dark:border-base-800 bg-base-50 dark:bg-base-950 cursor-pointer">
              <input
                type="checkbox"
                checked={deactivateExisting}
                onChange={(e) => setDeactivateExisting(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-base-300 text-descript-600"
              />
              <div>
                <div className="text-xs font-semibold text-base-900 dark:text-base-100">
                  Rotate (deactivate old active keys)
                </div>
                <div className="text-[11px] text-base-500 dark:text-base-400">
                  Uncheck to keep both keys active during transition.
                </div>
              </div>
            </label>
          </div>

          {mode === 'generate' ? (
            <div className="space-y-4">
              {!keypair ? (
                <div className="p-6 rounded-xl border border-dashed border-base-300 dark:border-base-700 text-center">
                  <KeyRound className="h-8 w-8 mx-auto text-descript-600 dark:text-descript-400 mb-2" />
                  <p className="text-sm text-base-600 dark:text-base-300 mb-4">
                    Generate a fresh Ed25519 keypair in browser memory. Your private key never touches our servers.
                  </p>
                  <Button loading={isGenerating} onClick={handleGenerate} icon={<RefreshCw className="h-4 w-4" />}>
                    Generate Ed25519 Keypair
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-800 dark:text-red-300">
                      This is the only time your private key will be shown. Download or copy it before binding.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-base-600 dark:text-base-300">
                        Private Key (PKCS#8 PEM)
                      </span>
                      <div className="flex items-center gap-2">
                        <CopyButton text={keypair.privateKeyPem} label="Copy PEM" />
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Download className="h-3.5 w-3.5" />}
                          onClick={() => downloadTextFile(`${agentId}-rotated-key.pem`, keypair.privateKeyPem)}
                        >
                          Download .pem
                        </Button>
                      </div>
                    </div>
                    <pre className="p-3 rounded-lg bg-base-950 text-base-100 font-mono text-[11px] overflow-x-auto">
                      {keypair.privateKeyPem}
                    </pre>
                  </div>

                  <div className="p-3 rounded-lg bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800 text-xs font-mono text-base-700 dark:text-base-300 break-all">
                    Fingerprint: {formatFingerprint(keypair.fingerprint)}
                  </div>

                  <label className="flex items-center gap-2.5 text-sm text-base-800 dark:text-base-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={savedConfirmed}
                      onChange={(e) => setSavedConfirmed(e.target.checked)}
                      className="h-4 w-4 rounded border-base-300 text-descript-600"
                    />
                    <span>I have securely saved my private key</span>
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                rows={4}
                value={importInput}
                onChange={(e) => {
                  setImportInput(e.target.value);
                  setImportedInfo(null);
                  setImportError(null);
                }}
                placeholder="Paste Base64, -----BEGIN PUBLIC KEY-----, or ssh-ed25519 ..."
                className="w-full p-3 rounded-lg border border-base-300 dark:border-base-700 bg-white dark:bg-base-950 font-mono text-xs text-base-900 dark:text-base-100"
              />
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={handleValidateImport}>
                  Validate Key
                </Button>
                {importedInfo && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-identity-700 dark:text-identity-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Valid Ed25519 key
                  </span>
                )}
              </div>
              {importError && <p className="text-xs text-red-600 dark:text-red-400">{importError}</p>}
              {importedInfo && (
                <div className="p-3 rounded-lg bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800 font-mono text-xs text-base-700 dark:text-base-300 break-all">
                  Fingerprint: {formatFingerprint(importedInfo.fingerprint)}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Revoke Credential Modal */}
      <Modal
        isOpen={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        title="Revoke Credential"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRevokeTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={submitting} onClick={handleRevokeConfirm}>
              Permanently Revoke
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-base-600 dark:text-base-300">
            Revoking this key immediately rejects any future authentication or signature verification using it. This action cannot be undone.
          </p>
          <div>
            <label className="block text-xs font-medium text-base-700 dark:text-base-300 mb-1.5">
              Revocation Reason (optional)
            </label>
            <input
              type="text"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="e.g. Key rotated or host decommissioned"
              className="w-full px-3.5 py-2 rounded-lg border border-base-300 dark:border-base-700 bg-white dark:bg-base-950 text-sm text-base-900 dark:text-base-100"
            />
          </div>
        </div>
      </Modal>

      {/* View Full Key Modal */}
      <Modal
        isOpen={Boolean(viewKeyTarget)}
        onClose={() => setViewKeyTarget(null)}
        title={viewKeyTarget?.label || 'Public Key Details'}
        footer={
          <Button variant="secondary" onClick={() => setViewKeyTarget(null)}>
            Close
          </Button>
        }
      >
        {viewKeyTarget && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-base-500 dark:text-base-400">Base64 Public Key</span>
                <CopyButton text={viewKeyTarget.publicKey} label="Copy Base64" />
              </div>
              <pre className="p-3 rounded-lg bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800 font-mono text-xs break-all whitespace-pre-wrap">
                {viewKeyTarget.publicKey}
              </pre>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-base-500 dark:text-base-400">SPKI PEM</span>
                <CopyButton text={viewKeyTarget.publicKeyPem} label="Copy PEM" />
              </div>
              <pre className="p-3 rounded-lg bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800 font-mono text-xs break-all whitespace-pre-wrap">
                {viewKeyTarget.publicKeyPem}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
