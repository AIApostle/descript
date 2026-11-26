import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { BytecriptCard } from '../components/bytecript/BytecriptCard';
import { NotificationProvider } from '../context/NotificationContext';
import type { Agent } from '../types/agent';

const sampleAgent: Agent = {
  id: 'agent_01936a4e8c207f1ab8492e1f4c73b091',
  name: 'Ledger Sentinel',
  description: 'Autonomous reconciliation agent',
  byteNetwork: 'kiroween',
  residence: 'kiroween-residence',
  status: 'active',
  capabilities: ['reconcile', 'sign'],
  createdAt: '2026-11-25T14:30:00Z',
  updatedAt: '2026-11-25T14:30:00Z',
  credentials: [
    {
      id: 'cred_01',
      agentId: 'agent_01936a4e8c207f1ab8492e1f4c73b091',
      algorithm: 'ed25519',
      publicKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      publicKeyPem: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----',
      fingerprint: '3f4a2b1c9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a695f4e3d2c',
      publicKeyFingerprint: '3f4a2b1c9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a695f4e3d2c',
      status: 'active',
      createdAt: '2026-11-25T14:30:00Z',
    },
  ],
  bytecript: {
    type: 'Bytecript',
    version: 1,
    agentId: 'agent_01936a4e8c207f1ab8492e1f4c73b091',
    agentName: 'Ledger Sentinel',
    description: 'Autonomous reconciliation agent',
    byteNetwork: 'kiroween',
    residence: 'kiroween-residence',
    status: 'active',
    credentials: [
      {
        id: 'cred_01',
        algorithm: 'ed25519',
        publicKeyFingerprint: '3f4a2b1c9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a695f4e3d2c',
        publicKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      },
    ],
    issuedAt: '2026-11-25T14:30:00Z',
    controllerVerified: true,
    issuerPublicKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    signature: '00'.repeat(64),
  },
};

describe('BytecriptCard', () => {
  it('renders canonical identity fields and 4-byte chunked fingerprint', () => {
    render(
      <MemoryRouter>
        <NotificationProvider>
          <BytecriptCard agent={sampleAgent} bytecript={sampleAgent.bytecript} showQr={false} />
        </NotificationProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('BYTECRIPT')).toBeInTheDocument();
    expect(screen.getByText('Ledger Sentinel')).toBeInTheDocument();
    expect(screen.getByText('agent_01936a4e8c207f1ab8492e1f4c73b091')).toBeInTheDocument();
    expect(screen.getByText('kiroween-residence')).toBeInTheDocument();
    expect(screen.getByText('3f4a2b1c 9e8d7c6b 5a4f3e2d 1c0b9a8f')).toBeInTheDocument();
    expect(screen.getByText('Verified & Active')).toBeInTheDocument();
  });
});
