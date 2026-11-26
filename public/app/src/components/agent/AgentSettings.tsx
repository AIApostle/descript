import React, { useState } from 'react';
import { PauseCircle, PlayCircle, Save, ShieldAlert, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAgents } from '../../context/AgentContext';
import { useNotification } from '../../context/NotificationContext';
import type { Agent } from '../../types/agent';
import { formatUtcDateTime } from '../../utils/formatting';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { TextField } from '../ui/TextField';

interface AgentSettingsProps {
  agent: Agent;
  onUpdated: (agent: Agent) => void;
}

export const AgentSettings: React.FC<AgentSettingsProps> = ({ agent, onUpdated }) => {
  const { updateAgent, setAgentStatus, deleteAgent } = useAgents();
  const { showToast, showConfirm } = useNotification();
  const navigate = useNavigate();

  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description || '');
  const [agentType, setAgentType] = useState(agent.agentType || '');
  const [framework, setFramework] = useState(agent.framework || '');
  const [capabilitiesText, setCapabilitiesText] = useState((agent.capabilities || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const capabilities = capabilitiesText
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      const updated = await updateAgent(agent.id, {
        name: name.trim(),
        description: description.trim(),
        agentType: agentType.trim() || undefined,
        framework: framework.trim() || undefined,
        capabilities,
      });
      onUpdated(updated);
      showToast('Agent metadata updated', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update metadata', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusTransition = async (
    targetStatus: 'active' | 'suspended' | 'revoked' | 'compromised'
  ) => {
    const messages: Record<string, { title: string; body: string; variant: 'primary' | 'danger' }> = {
      suspended: {
        title: 'Suspend Agent Identity?',
        body: 'External services will immediately reject challenge-response and signature checks for this agent until you reactivate it.',
        variant: 'danger',
      },
      active: {
        title: 'Reactivate Agent Identity?',
        body: 'This agent will be restored to ACTIVE status and permitted to authenticate across integrated services.',
        variant: 'primary',
      },
      revoked: {
        title: 'Permanently Revoke Identity?',
        body: 'Revoking an agent identity is permanent and irreversible. The Agent ID can never be reactivated.',
        variant: 'danger',
      },
      compromised: {
        title: 'Mark Identity Compromised?',
        body: 'All authentication will be blocked immediately while you investigate and rotate credentials.',
        variant: 'danger',
      },
    };

    const meta = messages[targetStatus];
    const ok = await showConfirm({
      title: meta.title,
      message: meta.body,
      confirmLabel: targetStatus === 'active' ? 'Reactivate' : `Confirm ${targetStatus}`,
      variant: meta.variant,
    });
    if (!ok) return;

    setChangingStatus(true);
    try {
      const updated = await setAgentStatus(
        agent.id,
        targetStatus,
        statusReason.trim() || undefined
      );
      setStatusReason('');
      onUpdated(updated);
      showToast(`Agent status changed to ${targetStatus}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Status update failed', 'error');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleDelete = async () => {
    const ok = await showConfirm({
      title: 'Delete Agent Record?',
      message:
        'This removes the agent, credentials, and audit log from your workspace permanently. Consider revoking instead if external services may query this ID.',
      confirmLabel: 'Delete Agent',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await deleteAgent(agent.id);
      showToast('Agent deleted', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete agent', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Agent Metadata" subtitle="Update public identity metadata displayed on your Bytecript.">
        <form onSubmit={handleSaveMetadata} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField
              label="Agent Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <TextField
              label="Capabilities (comma-separated)"
              value={capabilitiesText}
              onChange={(e) => setCapabilitiesText(e.target.value)}
              placeholder="reconcile, sign, api_integration"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <TextField
              label="Agent Type"
              value={agentType}
              onChange={(e) => setAgentType(e.target.value)}
              placeholder="autonomous, workflow, worker"
            />
            <TextField
              label="Framework"
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              placeholder="langgraph, crewai, custom"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-base-700 dark:text-base-200 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={512}
              className="w-full px-3.5 py-2.5 rounded-lg border border-base-300 dark:border-base-700 bg-white dark:bg-base-950 text-sm text-base-900 dark:text-base-100 outline-none focus:border-descript-500 focus:ring-2 focus:ring-descript-500/20"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={saving} icon={<Save className="h-4 w-4" />}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      <Card
        title="Identity Lifecycle & Emergency Controls"
        subtitle={`Current status: ${agent.status.toUpperCase()} - Created ${formatUtcDateTime(agent.createdAt)}`}
      >
        <div className="space-y-4">
          <TextField
            label="Audit Reason (optional)"
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            placeholder="e.g. Suspected host compromise, scheduled maintenance"
          />

          <div className="flex flex-wrap items-center gap-3">
            {agent.status === 'active' && (
              <Button
                variant="outline"
                loading={changingStatus}
                icon={<PauseCircle className="h-4 w-4 text-amber-600" />}
                onClick={() => handleStatusTransition('suspended')}
              >
                Suspend Identity
              </Button>
            )}

            {(agent.status === 'suspended' || agent.status === 'pending' || agent.status === 'compromised') && (
              <Button
                variant="primary"
                loading={changingStatus}
                icon={<PlayCircle className="h-4 w-4" />}
                onClick={() => handleStatusTransition('active')}
              >
                Reactivate Identity
              </Button>
            )}

            {agent.status !== 'revoked' && agent.status !== 'compromised' && (
              <Button
                variant="outline"
                loading={changingStatus}
                icon={<ShieldAlert className="h-4 w-4 text-red-600" />}
                onClick={() => handleStatusTransition('compromised')}
              >
                Mark Compromised
              </Button>
            )}

            {agent.status !== 'revoked' && (
              <Button
                variant="danger"
                loading={changingStatus}
                onClick={() => handleStatusTransition('revoked')}
              >
                Revoke Permanently
              </Button>
            )}

            <Button
              variant="ghost"
              className="text-red-600 dark:text-red-400 ml-auto"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={handleDelete}
            >
              Delete Agent
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
