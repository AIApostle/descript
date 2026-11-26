import { describe, expect, it } from 'vitest';
import {
  generateEd25519Keypair,
  inspectPublicKey,
  parsePublicKey,
  signWithPrivateKey,
  verifyBytecriptOffline,
} from '../utils/crypto';
import { formatFingerprint, formatFingerprintLines } from '../utils/formatting';
import { validateAgentName, validateEmail, validatePassword } from '../utils/validators';

describe('Frontend Ed25519 crypto & formatting', () => {
  it('generates Ed25519 keypair, parses PEM/Base64, and computes consistent SHA-256 fingerprint', async () => {
    const kp = await generateEd25519Keypair();
    expect(kp.algorithm).toBe('ed25519');
    expect(kp.fingerprint).toHaveLength(64);
    expect(kp.privateKeyPem).toContain('-----BEGIN PRIVATE KEY-----');
    expect(kp.publicKeyPem).toContain('-----BEGIN PUBLIC KEY-----');

    const inspectedB64 = await inspectPublicKey(kp.publicKey);
    const inspectedPem = await inspectPublicKey(kp.publicKeyPem);
    expect(inspectedB64.fingerprint).toBe(kp.fingerprint);
    expect(inspectedPem.fingerprint).toBe(kp.fingerprint);

    const rawBytes = parsePublicKey(kp.publicKey);
    expect(rawBytes).toHaveLength(32);

    const sig = await signWithPrivateKey(kp.privateKeyPem, 'challenge-nonce');
    expect(sig).toHaveLength(128);
  });

  it('rejects malformed or non-Ed25519 keys', () => {
    expect(() => parsePublicKey('')).toThrow();
    expect(() => parsePublicKey('ssh-rsa AAAAB3NzaC1yc2EAAAADAQAB')).toThrow();
  });

  it('formats 64-char hex fingerprints in 4-byte chunks', () => {
    const fp = '3f4a2b1c9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a695f4e3d2c';
    expect(formatFingerprint(fp)).toBe(
      '3f4a2b1c 9e8d7c6b 5a4f3e2d 1c0b9a8f 7e6d5c4b 3a2f1e0d 9c8b7a69 5f4e3d2c'
    );
    const [l1, l2] = formatFingerprintLines(fp);
    expect(l1).toBe('3f4a2b1c 9e8d7c6b 5a4f3e2d 1c0b9a8f');
    expect(l2).toBe('7e6d5c4b 3a2f1e0d 9c8b7a69 5f4e3d2c');
  });

  it('validates agent names, emails, and passwords', () => {
    expect(validateAgentName('API Integration Agent')).toBeUndefined();
    expect(validateAgentName('ab')).toBeDefined();
    expect(validateAgentName('Bad!Agent')).toBeDefined();
    expect(validateEmail('builder@descript.dev')).toBeUndefined();
    expect(validateEmail('invalid')).toBeDefined();
    expect(validatePassword('1234567')).toBeDefined();
    expect(validatePassword('12345678')).toBeUndefined();
  });

  it('verifies offline Bytecript signature failure cleanly on tampered payloads', async () => {
    const ok = await verifyBytecriptOffline({
      type: 'Bytecript',
      version: 1,
      agentId: 'agent_123',
      agentName: 'Test',
      byteNetwork: 'kiroween',
      residence: 'kiroween-residence',
      status: 'active',
      credentials: [],
      issuedAt: '2026-11-25T00:00:00Z',
      controllerVerified: true,
      issuerPublicKey: 'invalid',
      signature: '00',
    });
    expect(ok).toBe(false);
  });
});
