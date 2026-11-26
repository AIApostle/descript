import React, { useState } from 'react';
import { CheckCircle2, KeyRound, ShieldCheck, Sparkles, XCircle } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { verifyService } from '../../services/agentService';
import type { ChallengeResponse, VerificationResult } from '../../types/agent';
import { signWithPrivateKey } from '../../utils/crypto';
import { CopyButton } from '../common/CopyButton';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface ChallengeTesterProps {
  agentId: string;
  onVerified?: () => Promise<void>;
}

export const ChallengeTester: React.FC<ChallengeTesterProps> = ({ agentId, onVerified }) => {
  const { showToast } = useNotification();
  const [audience, setAudience] = useState('bytebank');
  const [challenge, setChallenge] = useState<ChallengeResponse | null>(null);
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [signatureInput, setSignatureInput] = useState('');
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleIssueChallenge = async () => {
    setLoadingChallenge(true);
    setResult(null);
    setSignatureInput('');
    try {
      const chg = await verifyService.createChallenge(agentId, audience.trim() || 'external-service');
      setChallenge(chg);
      showToast('Challenge nonce issued', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to issue challenge', 'error');
    } finally {
      setLoadingChallenge(false);
    }
  };

  const handleSignLocally = async () => {
    if (!challenge || !privateKeyInput.trim()) return;
    try {
      const sig = await signWithPrivateKey(privateKeyInput, challenge.nonce);
      setSignatureInput(sig);
      showToast('Signed nonce locally in browser (private key never sent)', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to sign with private key', 'error');
    }
  };

  const handleVerifyChallenge = async () => {
    if (!challenge || !signatureInput.trim()) return;
    setVerifying(true);
    try {
      const res = await verifyService.verifyChallenge({
        agentId,
        challengeId: challenge.challengeId,
        signature: signatureInput.trim(),
      });
      setResult(res);
      if (res.verified && onVerified) {
        await onVerified();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Verification request failed', 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card
      title="Challenge-Response Authentication Lab"
      subtitle="Simulate how an external service like Bytebank authenticates this agent."
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-base-700 dark:text-base-300 mb-1.5">
              Relying Service Audience
            </label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="bytebank"
              className="w-full px-3.5 py-2 rounded-lg border border-base-300 dark:border-base-700 bg-white dark:bg-base-950 text-sm text-base-900 dark:text-base-100"
            />
          </div>
          <Button
            loading={loadingChallenge}
            onClick={handleIssueChallenge}
            icon={<Sparkles className="h-4 w-4" />}
          >
            Issue Challenge Nonce
          </Button>
        </div>

        {challenge && (
          <div className="space-y-4 p-4 rounded-xl bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-base-500 dark:text-base-400">
                  Challenge Nonce (sign this string with your Ed25519 private key)
                </span>
                <CopyButton text={challenge.nonce} label="Copy Nonce" />
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-base-900 border border-base-200 dark:border-base-800 font-mono text-xs break-all text-base-800 dark:text-base-200">
                {challenge.nonce}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-base-600 dark:text-base-300">
                Optional: Sign Locally in Browser with Saved Private Key (.pem or base64)
              </label>
              <textarea
                rows={3}
                value={privateKeyInput}
                onChange={(e) => setPrivateKeyInput(e.target.value)}
                placeholder="Paste private key PEM or base64 to sign nonce locally (stays in browser memory)"
                className="w-full p-2.5 rounded-lg border border-base-300 dark:border-base-700 bg-white dark:bg-base-900 font-mono text-xs text-base-900 dark:text-base-100"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!privateKeyInput.trim()}
                icon={<KeyRound className="h-3.5 w-3.5" />}
                onClick={handleSignLocally}
              >
                Sign Nonce Locally
              </Button>
            </div>

            <div>
              <label className="block text-xs font-medium text-base-700 dark:text-base-300 mb-1.5">
                Signature (Hex or Base64)
              </label>
              <textarea
                rows={2}
                value={signatureInput}
                onChange={(e) => setSignatureInput(e.target.value)}
                placeholder="Paste Ed25519 signature of the challenge nonce..."
                className="w-full p-2.5 rounded-lg border border-base-300 dark:border-base-700 bg-white dark:bg-base-900 font-mono text-xs text-base-900 dark:text-base-100"
              />
            </div>

            <Button
              variant="primary"
              loading={verifying}
              disabled={!signatureInput.trim()}
              icon={<ShieldCheck className="h-4 w-4" />}
              onClick={handleVerifyChallenge}
            >
              Verify Challenge Response
            </Button>
          </div>
        )}

        {result && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              result.verified
                ? 'bg-identity-50 dark:bg-identity-950/50 border-identity-200 dark:border-identity-800'
                : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800'
            }`}
          >
            {result.verified ? (
              <CheckCircle2 className="h-5 w-5 text-identity-600 dark:text-identity-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <div className="font-semibold text-sm text-base-900 dark:text-base-50">
                {result.verified ? 'Agent Authenticated Successfully' : 'Authentication Rejected'}
              </div>
              <div className="text-base-600 dark:text-base-300">
                {result.verified
                  ? `Matched active credential ${result.credentialId} (${result.fingerprint?.slice(0, 16)}...)`
                  : result.reason}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
