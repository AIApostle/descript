import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  Info,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CopyButton } from '../components/common/CopyButton';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TextField } from '../components/ui/TextField';
import { useAgents } from '../context/AgentContext';
import { useNotification } from '../context/NotificationContext';
import { useKeyGeneration } from '../hooks/useKeyGeneration';
import type { Agent } from '../types/agent';
import { downloadTextFile } from '../utils/download';
import { formatFingerprint } from '../utils/formatting';
import { validateAgentName, validateDescription } from '../utils/validators';

type WizardStep = 'details' | 'choice' | 'generate' | 'import' | 'confirmed';

export default function RegisterAgentPage() {
  const { networks, registrationData, setRegistrationData, createAgent, resetRegistration } =
    useAgents();
  const { showToast } = useNotification();
  const { keypair, isGenerating, generate, validateImport, clear } = useKeyGeneration();
  const navigate = useNavigate();

  const [step, setStep] = useState<WizardStep>('details');
  const [capabilitiesInput, setCapabilitiesInput] = useState(
    registrationData.capabilities.join(', ')
  );
  const [nameError, setNameError] = useState<string | undefined>();
  const [descError, setDescError] = useState<string | undefined>();

  // Step 3a (Generate)
  const [savedConfirmed, setSavedConfirmed] = useState(false);

  // Step 3b (Import)
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [validatedImport, setValidatedImport] = useState<{
    publicKey: string;
    fingerprint: string;
  } | null>(null);

  // Step 4 (Confirmed)
  const [submitting, setSubmitting] = useState(false);
  const [createdAgent, setCreatedAgent] = useState<Agent | null>(null);

  const selectedNetwork = networks.find((n) => n.slug === registrationData.byteNetwork);

  const handleDetailsNext = (e: React.FormEvent) => {
    e.preventDefault();
    const nErr = validateAgentName(registrationData.agentName);
    const dErr = validateDescription(registrationData.description || '');
    setNameError(nErr);
    setDescError(dErr);
    if (nErr || dErr || !registrationData.byteNetwork) return;

    const capabilities = capabilitiesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setRegistrationData({ capabilities });
    setStep('choice');
  };

  const handleChooseGenerate = async () => {
    setRegistrationData({ keypairSource: 'generate' });
    setSavedConfirmed(false);
    setStep('generate');
    if (!keypair) {
      await generate();
    }
  };

  const handleChooseImport = () => {
    setRegistrationData({ keypairSource: 'import' });
    setStep('import');
  };

  const handleValidateImport = async () => {
    setImportError(null);
    try {
      const result = await validateImport(importText);
      setValidatedImport({ publicKey: result.publicKey, fingerprint: result.fingerprint });
    } catch (err) {
      setValidatedImport(null);
      setImportError(err instanceof Error ? err.message : 'Invalid public key');
    }
  };

  const handleSubmitRegistration = async (publicKey: string) => {
    setSubmitting(true);
    try {
      const agent = await createAgent({
        name: registrationData.agentName.trim(),
        description: registrationData.description?.trim() || undefined,
        byteNetwork: registrationData.byteNetwork,
        publicKey,
        algorithm: 'ed25519',
        agentType: registrationData.agentType,
        framework: registrationData.framework,
        capabilities: registrationData.capabilities,
        credentialLabel: registrationData.credentialLabel || 'Primary Key',
      });
      setCreatedAgent(agent);
      clear();
      resetRegistration();
      setStep('confirmed');
      showToast('Agent identity registered and Bytecript issued', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Agent registration failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const stepIndex =
    step === 'details' ? 1 : step === 'choice' ? 2 : step === 'generate' || step === 'import' ? 3 : 4;

  return (
    <DashboardLayout
      title="Register New Agent"
      subtitle="Assign a persistent Agent ID and bind an Ed25519 public key."
    >
      {/* Progress indicator */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="grid grid-cols-4 gap-2 text-xs font-medium">
          {[
            { num: 1, label: 'Agent Details' },
            { num: 2, label: 'Keypair Setup' },
            { num: 3, label: 'Credentials' },
            { num: 4, label: 'Confirmation' },
          ].map((item) => (
            <div key={item.num} className="space-y-1.5">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  stepIndex >= item.num
                    ? 'bg-descript-600'
                    : 'bg-base-200 dark:bg-base-800'
                }`}
              />
              <div
                className={
                  stepIndex >= item.num
                    ? 'text-descript-700 dark:text-descript-300 font-semibold'
                    : 'text-base-400 dark:text-base-500'
                }
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {step === 'details' && (
          <Card
            title="Agent Identity Details"
            subtitle="Choose a unique name and Byte Network namespace for your agent."
          >
            <form onSubmit={handleDetailsNext} className="space-y-5">
              <TextField
                label="Agent Name"
                required
                value={registrationData.agentName}
                onChange={(e) => {
                  const val = e.target.value;
                  setRegistrationData({ agentName: val });
                  setNameError(validateAgentName(val));
                }}
                error={nameError}
                hint="3-64 characters: letters, numbers, spaces, hyphens, or underscores."
                placeholder="API Integration Agent"
              />

              <div>
                <label
                  htmlFor="agent-description"
                  className="block text-sm font-medium text-base-700 dark:text-base-200 mb-1.5"
                >
                  Description
                </label>
                <textarea
                  id="agent-description"
                  rows={3}
                  value={registrationData.description || ''}
                  onChange={(e) => {
                    setRegistrationData({ description: e.target.value });
                    setDescError(validateDescription(e.target.value));
                  }}
                  placeholder="Describe what this agent does and how external services interact with it."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-base-300 dark:border-base-700 bg-white dark:bg-base-950 text-sm text-base-900 dark:text-base-100 outline-none focus:border-descript-500 focus:ring-2 focus:ring-descript-500/20"
                />
                {descError && <p className="text-xs text-red-600 mt-1">{descError}</p>}
              </div>

              <div>
                <label
                  htmlFor="byte-network"
                  className="block text-sm font-medium text-base-700 dark:text-base-200 mb-1.5"
                >
                  Byte Network <span className="text-red-500">*</span>
                </label>
                <select
                  id="byte-network"
                  value={registrationData.byteNetwork}
                  onChange={(e) => setRegistrationData({ byteNetwork: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-base-300 dark:border-base-700 bg-white dark:bg-base-950 text-sm text-base-900 dark:text-base-100 outline-none focus:border-descript-500"
                >
                  {networks.map((net) => (
                    <option key={net.slug} value={net.slug}>
                      {net.name} ({net.slug}) - {net.residenceDomain}
                    </option>
                  ))}
                </select>
                {selectedNetwork && (
                  <div className="mt-2.5 p-3.5 rounded-xl bg-descript-50 dark:bg-descript-950/40 border border-descript-200 dark:border-descript-900 flex items-start gap-2.5 text-xs text-descript-900 dark:text-descript-200">
                    <Info className="h-4 w-4 text-descript-600 dark:text-descript-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">
                        Residence: {selectedNetwork.residenceDomain}
                      </div>
                      <div className="mt-0.5 text-descript-800 dark:text-descript-300">
                        {selectedNetwork.policySummary}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="agent-type"
                    className="block text-sm font-medium text-base-700 dark:text-base-200 mb-1.5"
                  >
                    Agent Type
                  </label>
                  <select
                    id="agent-type"
                    value={registrationData.agentType || 'autonomous'}
                    onChange={(e) => setRegistrationData({ agentType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-base-300 dark:border-base-700 bg-white dark:bg-base-950 text-sm text-base-900 dark:text-base-100"
                  >
                    <option value="autonomous">Autonomous Agent</option>
                    <option value="workflow">Workflow / Orchestrator</option>
                    <option value="worker">Background Worker</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="agent-framework"
                    className="block text-sm font-medium text-base-700 dark:text-base-200 mb-1.5"
                  >
                    Runtime Framework
                  </label>
                  <select
                    id="agent-framework"
                    value={registrationData.framework || 'custom'}
                    onChange={(e) => setRegistrationData({ framework: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-base-300 dark:border-base-700 bg-white dark:bg-base-950 text-sm text-base-900 dark:text-base-100"
                  >
                    <option value="custom">Python SDK / Custom</option>
                    <option value="langgraph">LangGraph / LangChain</option>
                    <option value="crewai">CrewAI</option>
                    <option value="adk">Google ADK</option>
                    <option value="autogen">AutoGen</option>
                  </select>
                </div>
              </div>

              <TextField
                label="Capabilities (optional)"
                value={capabilitiesInput}
                onChange={(e) => setCapabilitiesInput(e.target.value)}
                placeholder="api_integration, reconcile, verify"
                hint="Comma-separated capabilities advertised in public metadata."
              />

              <div className="flex items-center justify-between pt-3">
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-base-600 dark:text-base-400 hover:text-base-900 dark:hover:text-white"
                >
                  Cancel
                </Link>
                <Button
                  type="submit"
                  disabled={!registrationData.agentName.trim() || Boolean(nameError)}
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  Continue to Keypair Setup
                </Button>
              </div>
            </form>
          </Card>
        )}

        {step === 'choice' && (
          <Card
            title="Agent Keypair Setup"
            subtitle="How would you like to configure the Ed25519 credential for this agent?"
          >
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={handleChooseGenerate}
                className="p-6 rounded-2xl border-2 border-descript-200 dark:border-descript-800 hover:border-descript-600 dark:hover:border-descript-500 bg-descript-50/40 dark:bg-descript-950/30 text-left transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-descript-600 text-white flex items-center justify-center">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-identity-100 text-identity-800 dark:bg-identity-950 dark:text-identity-300">
                    Recommended
                  </span>
                </div>
                <h3 className="text-base font-semibold text-base-900 dark:text-white mb-2">
                  Generate New Keypair
                </h3>
                <ul className="text-xs text-base-600 dark:text-base-300 space-y-1.5">
                  <li>Ed25519 keypair generated locally in browser</li>
                  <li>Private key shown once for .pem download</li>
                  <li>Only public key transmitted to Descript</li>
                </ul>
              </button>

              <button
                type="button"
                onClick={handleChooseImport}
                className="p-6 rounded-2xl border-2 border-base-200 dark:border-base-800 hover:border-descript-500 bg-white dark:bg-base-900 text-left transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-base-100 dark:bg-base-800 text-base-700 dark:text-base-200 flex items-center justify-center mb-3">
                  <Upload className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-base-900 dark:text-white mb-2">
                  Import Existing Public Key
                </h3>
                <ul className="text-xs text-base-600 dark:text-base-300 space-y-1.5">
                  <li>Use keys generated via Python SDK or KMS</li>
                  <li>Accepts Base64, SPKI PEM, or OpenSSH</li>
                  <li>You retain full custody of the private key</li>
                </ul>
              </button>
            </div>

            <Button
              variant="outline"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => setStep('details')}
            >
              Back
            </Button>
          </Card>
        )}

        {step === 'generate' && (
          <Card
            title="Your Generated Ed25519 Private Key"
            subtitle="Generated client-side via @noble/ed25519. Never stored on or sent to Descript servers."
          >
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-red-800 dark:text-red-200 leading-relaxed">
                  <strong>IMPORTANT:</strong> This is the ONLY time you will see your private key. Download or copy it now. If lost, you will need to rotate credentials.
                </div>
              </div>

              {isGenerating || !keypair ? (
                <div className="py-10 text-center text-sm text-base-500">
                  Generating cryptographic keypair...
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-medium text-base-600 dark:text-base-300">
                        Private Key (PKCS#8 PEM)
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<RefreshCw className="h-3.5 w-3.5" />}
                          onClick={() => {
                            setSavedConfirmed(false);
                            generate();
                          }}
                        >
                          Regenerate
                        </Button>
                        <CopyButton text={keypair.privateKeyPem} label="Copy Private Key" />
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Download className="h-3.5 w-3.5" />}
                          onClick={() => {
                            const slug =
                              registrationData.agentName
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-') || 'agent';
                            downloadTextFile(`${slug}-ed25519-private.pem`, keypair.privateKeyPem);
                          }}
                        >
                          Download .pem
                        </Button>
                      </div>
                    </div>
                    <pre className="p-4 rounded-xl bg-base-950 text-base-100 font-mono text-xs overflow-x-auto select-all">
                      {keypair.privateKeyPem}
                    </pre>
                  </div>

                  <div className="rounded-xl bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-base-500 dark:text-base-400">
                        Public Key (registered on Descript)
                      </span>
                      <CopyButton text={keypair.publicKey} label="Copy Public Key" />
                    </div>
                    <div className="font-mono text-xs text-base-800 dark:text-base-200 break-all">
                      {keypair.publicKey}
                    </div>
                    <div className="text-[11px] font-mono text-base-500 dark:text-base-400 pt-1">
                      SHA256 Fingerprint: {formatFingerprint(keypair.fingerprint)}
                    </div>
                  </div>

                  <label className="flex items-center gap-3 p-3.5 rounded-xl border border-base-200 dark:border-base-800 bg-base-50/70 dark:bg-base-950 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={savedConfirmed}
                      onChange={(e) => setSavedConfirmed(e.target.checked)}
                      className="h-4 w-4 rounded border-base-300 text-descript-600"
                    />
                    <span className="text-sm font-medium text-base-800 dark:text-base-200">
                      I have securely saved my private key
                    </span>
                  </label>

                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline"
                      icon={<ArrowLeft className="h-4 w-4" />}
                      onClick={() => setStep('choice')}
                    >
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      loading={submitting}
                      disabled={!savedConfirmed}
                      icon={<ShieldCheck className="h-4 w-4" />}
                      onClick={() => handleSubmitRegistration(keypair.publicKey)}
                    >
                      Register Agent
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}

        {step === 'import' && (
          <Card
            title="Import Existing Public Key"
            subtitle="Paste a Base64, SPKI PEM, or OpenSSH Ed25519 public key."
          >
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800 text-xs text-base-600 dark:text-base-300 space-y-1 font-mono">
                <div>Base64: MCowBQYDK2VwAyEA... or 32-byte raw base64</div>
                <div>PEM: -----BEGIN PUBLIC KEY----- ...</div>
                <div>OpenSSH: ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA...</div>
              </div>

              <div>
                <label
                  htmlFor="import-public-key"
                  className="block text-sm font-medium text-base-700 dark:text-base-200 mb-1.5"
                >
                  Public Key
                </label>
                <textarea
                  id="import-public-key"
                  rows={5}
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    setValidatedImport(null);
                    setImportError(null);
                  }}
                  placeholder="Paste your Ed25519 public key here..."
                  className="w-full p-3.5 rounded-lg border border-base-300 dark:border-base-700 bg-white dark:bg-base-950 font-mono text-xs text-base-900 dark:text-base-100 outline-none focus:border-descript-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleValidateImport} disabled={!importText.trim()}>
                  Validate Key
                </Button>
                {validatedImport && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-identity-700 dark:text-identity-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Valid Ed25519 public key
                  </span>
                )}
              </div>

              {importError && <p className="text-xs font-medium text-red-600 dark:text-red-400">{importError}</p>}

              {validatedImport && (
                <div className="p-3.5 rounded-xl bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800 text-xs font-mono text-base-700 dark:text-base-300 break-all">
                  <div>Algorithm: Ed25519</div>
                  <div className="mt-1">Fingerprint: {formatFingerprint(validatedImport.fingerprint)}</div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3">
                <Button
                  variant="outline"
                  icon={<ArrowLeft className="h-4 w-4" />}
                  onClick={() => setStep('choice')}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  loading={submitting}
                  disabled={!validatedImport}
                  icon={<ShieldCheck className="h-4 w-4" />}
                  onClick={() => validatedImport && handleSubmitRegistration(validatedImport.publicKey)}
                >
                  Register Agent
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === 'confirmed' && createdAgent && (
          <Card title="Agent Registered">
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-identity-50 dark:bg-identity-950/50 border border-identity-200 dark:border-identity-800">
                <CheckCircle2 className="h-6 w-6 text-identity-600 dark:text-identity-400 shrink-0" />
                <div>
                  <div className="font-semibold text-base-900 dark:text-white">
                    {createdAgent.name} is active on {createdAgent.byteNetwork}
                  </div>
                  <p className="text-xs text-base-600 dark:text-base-300 mt-0.5">
                    Canonical Agent ID assigned and Bytecript digital card signed.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-base-500 dark:text-base-400">
                    Assigned Agent ID
                  </span>
                  <CopyButton text={createdAgent.id} label="Copy Agent ID" />
                </div>
                <div className="font-mono text-sm text-base-900 dark:text-base-100 break-all">
                  {createdAgent.id}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => navigate(`/agents/${createdAgent.id}`)}>
                  View Bytecript Card
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
