import React, { useState } from 'react';
import { CheckCircle2, Download, ExternalLink, Printer, Share2, ShieldCheck, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { verifyService } from '../../services/agentService';
import type { Bytecript, BytecriptVerifyResult } from '../../types/agent';
import { verifyBytecriptOffline } from '../../utils/crypto';
import { downloadJsonFile } from '../../utils/download';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface BytecriptActionsProps {
  agentId: string;
  agentName: string;
  bytecript?: Bytecript | null;
  isPublicView?: boolean;
}

export const BytecriptActions: React.FC<BytecriptActionsProps> = ({
  agentId,
  agentName,
  bytecript,
  isPublicView = false,
}) => {
  const { showToast } = useNotification();
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [offlineValid, setOfflineValid] = useState<boolean | null>(null);
  const [onlineResult, setOnlineResult] = useState<BytecriptVerifyResult | null>(null);

  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/agent/${agentId}` : `/agent/${agentId}`;

  const handleExport = () => {
    if (!bytecript) {
      showToast('Bytecript payload is not ready yet', 'warning');
      return;
    }
    const slug = agentName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || agentId;
    downloadJsonFile(`bytecript-${slug}.json`, bytecript);
    showToast('Saved Bytecript JSON credential', 'success');
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Public verification link copied to clipboard', 'success');
    } catch {
      showToast('Copy failed. Link: ' + shareUrl, 'info');
    }
  };

  const handleVerify = async () => {
    if (!bytecript) return;
    setVerifyModalOpen(true);
    setIsVerifying(true);
    try {
      const [localOk, serverRes] = await Promise.all([
        verifyBytecriptOffline(bytecript),
        verifyService.verifyBytecript(bytecript as unknown as Record<string, unknown>, true),
      ]);
      setOfflineValid(localOk);
      setOnlineResult(serverRes);
    } catch {
      const localOk = await verifyBytecriptOffline(bytecript);
      setOfflineValid(localOk);
      setOnlineResult(null);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-6 no-print">
        <Button variant="primary" size="md" icon={<Download className="h-4 w-4" />} onClick={handleExport}>
          Export as JSON
        </Button>

        <Button variant="outline" size="md" icon={<Share2 className="h-4 w-4" />} onClick={handleShare}>
          Share Public Link
        </Button>

        <Button
          variant="outline"
          size="md"
          icon={<ShieldCheck className="h-4 w-4" />}
          onClick={handleVerify}
        >
          Verify Signature
        </Button>

        <Button
          variant="ghost"
          size="md"
          icon={<Printer className="h-4 w-4" />}
          onClick={() => window.print()}
        >
          Print Card
        </Button>

        {!isPublicView && (
          <Link
            to={`/agent/${agentId}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-descript-600 dark:text-descript-400 hover:underline"
          >
            <span>Public Profile</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title="Bytecript Cryptographic Verification"
        footer={
          <Button variant="secondary" onClick={() => setVerifyModalOpen(false)}>
            Close
          </Button>
        }
      >
        {isVerifying ? (
          <div className="py-8 text-center text-sm text-base-600 dark:text-base-300">
            Verifying Ed25519 issuer signature and live directory status...
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                offlineValid && (onlineResult ? onlineResult.verified : true)
                  ? 'bg-identity-50 dark:bg-identity-950/50 border-identity-200 dark:border-identity-800'
                  : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800'
              }`}
            >
              {offlineValid && (onlineResult ? onlineResult.verified : true) ? (
                <CheckCircle2 className="h-5 w-5 text-identity-600 dark:text-identity-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-semibold text-sm text-base-900 dark:text-base-50">
                  {offlineValid && (onlineResult ? onlineResult.verified : true)
                    ? 'Bytecript Verified & Authentic'
                    : 'Verification Check Failed'}
                </div>
                <p className="text-xs text-base-600 dark:text-base-300 mt-1">
                  {onlineResult?.reason ||
                    (offlineValid
                      ? 'Ed25519 issuer signature matched canonical Bytecript claims.'
                      : 'Issuer signature could not be verified.')}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-base-200 dark:border-base-800 divide-y divide-base-200 dark:divide-base-800 text-sm">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-base-500 dark:text-base-400">Client-Side Ed25519 Check</span>
                <span className="font-semibold text-base-900 dark:text-base-100">
                  {offlineValid ? 'Valid' : 'Invalid'}
                </span>
              </div>
              {onlineResult && (
                <>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-base-500 dark:text-base-400">Registry Signature Check</span>
                    <span className="font-semibold text-base-900 dark:text-base-100">
                      {onlineResult.signatureValid ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-base-500 dark:text-base-400">Live Directory Status</span>
                    <span className="font-mono text-xs uppercase font-semibold text-base-900 dark:text-base-100">
                      {onlineResult.liveStatus || 'unknown'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {bytecript?.signature && (
              <div>
                <div className="text-xs font-medium text-base-500 dark:text-base-400 mb-1">
                  Issuer Signature (Ed25519 Hex)
                </div>
                <div className="p-3 rounded-lg bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800 font-mono text-[11px] break-all text-base-700 dark:text-base-300">
                  {bytecript.signature}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};
