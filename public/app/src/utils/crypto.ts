import * as ed25519 from '@noble/ed25519';
import type { Bytecript } from '../types/agent';
import type { Keypair } from '../types/registration';

// ASN.1 prefixes for Ed25519 SPKI (public) and PKCS#8 (private)
const SPKI_PREFIX = new Uint8Array([
  0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00,
]);

const PKCS8_PREFIX = new Uint8Array([
  0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20,
]);

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const cleaned = b64.trim().replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (cleaned.length % 4)) % 4;
  const padded = cleaned + '='.repeat(padLen);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.trim();
  if (cleaned.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(cleaned)) {
    throw new Error('Invalid hex string');
  }
  const out = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function bytesEqualPrefix(data: Uint8Array, prefix: Uint8Array): boolean {
  if (data.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i += 1) {
    if (data[i] !== prefix[i]) return false;
  }
  return true;
}

function wrapPem(label: string, der: Uint8Array): string {
  const b64 = bytesToBase64(der);
  const lines = b64.match(/.{1,64}/g) ?? [b64];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

export function publicKeyToPem(raw32: Uint8Array): string {
  return wrapPem('PUBLIC KEY', concatBytes(SPKI_PREFIX, raw32));
}

export function privateKeyToPem(seed32: Uint8Array): string {
  return wrapPem('PRIVATE KEY', concatBytes(PKCS8_PREFIX, seed32));
}

export async function computeFingerprintHex(rawPublicKey: Uint8Array): Promise<string> {
  const copy = new Uint8Array(rawPublicKey);
  const digest = await crypto.subtle.digest('SHA-256', copy.buffer);
  return bytesToHex(new Uint8Array(digest));
}

export function parsePublicKey(input: string): Uint8Array {
  const raw = input.trim();
  if (!raw) {
    throw new Error('Public key cannot be empty');
  }

  // PEM SPKI
  if (raw.includes('-----BEGIN PUBLIC KEY-----')) {
    const inner = raw
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\s+/g, '');
    const der = base64ToBytes(inner);
    if (der.length === 44 && bytesEqualPrefix(der, SPKI_PREFIX)) {
      return der.slice(12);
    }
    throw new Error('Unsupported or malformed PEM public key (expected Ed25519 SPKI)');
  }

  // OpenSSH ssh-ed25519 AAAA...
  if (raw.startsWith('ssh-ed25519 ')) {
    const parts = raw.split(/\s+/);
    if (parts.length < 2) {
      throw new Error('Malformed OpenSSH Ed25519 public key');
    }
    const blob = base64ToBytes(parts[1]);
    // Wire format: uint32 len("ssh-ed25519") + "ssh-ed25519" + uint32 len(32) + 32 bytes
    if (blob.length < 19 + 32) {
      throw new Error('Invalid OpenSSH Ed25519 key payload');
    }
    const keyLen =
      (blob[blob.length - 36] << 24) |
      (blob[blob.length - 35] << 16) |
      (blob[blob.length - 34] << 8) |
      blob[blob.length - 33];
    if (keyLen !== 32) {
      throw new Error('Invalid OpenSSH Ed25519 key length');
    }
    return blob.slice(blob.length - 32);
  }

  if (raw.startsWith('ssh-rsa ') || raw.startsWith('ecdsa-sha2-')) {
    throw new Error('Only Ed25519 public keys are supported in MVP');
  }

  const normalized = raw.toLowerCase().startsWith('ed25519/') ? raw.slice(8).trim() : raw;

  // Hex 64 chars
  if (/^[0-9a-fA-F]{64}$/.test(normalized)) {
    return hexToBytes(normalized);
  }

  // Base64 raw 32 bytes or 44-byte SPKI DER
  let decoded: Uint8Array;
  try {
    decoded = base64ToBytes(normalized);
  } catch {
    throw new Error('Key format not recognized. Expected base64, PEM, or OpenSSH Ed25519.');
  }

  if (decoded.length === 32) {
    return decoded;
  }
  if (decoded.length === 44 && bytesEqualPrefix(decoded, SPKI_PREFIX)) {
    return decoded.slice(12);
  }
  throw new Error(`Expected a 32-byte Ed25519 public key, received ${decoded.length} bytes.`);
}

export function parsePrivateKey(input: string): Uint8Array {
  const raw = input.trim();
  if (!raw) {
    throw new Error('Private key cannot be empty');
  }

  if (raw.includes('-----BEGIN PRIVATE KEY-----')) {
    const inner = raw
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s+/g, '');
    const der = base64ToBytes(inner);
    if (der.length === 48 && bytesEqualPrefix(der, PKCS8_PREFIX)) {
      return der.slice(16);
    }
    throw new Error('Malformed PKCS#8 Ed25519 private key PEM');
  }

  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return hexToBytes(raw);
  }

  const decoded = base64ToBytes(raw);
  if (decoded.length === 32) {
    return decoded;
  }
  if (decoded.length === 64) {
    return decoded.slice(0, 32);
  }
  if (decoded.length === 48 && bytesEqualPrefix(decoded, PKCS8_PREFIX)) {
    return decoded.slice(16);
  }
  throw new Error('Unrecognized Ed25519 private key format');
}

export async function generateEd25519Keypair(): Promise<Keypair> {
  const { secretKey, publicKey } = await ed25519.keygenAsync();
  const fingerprint = await computeFingerprintHex(publicKey);

  return {
    publicKey: bytesToBase64(publicKey),
    publicKeyPem: publicKeyToPem(publicKey),
    privateKey: bytesToBase64(secretKey),
    privateKeyPem: privateKeyToPem(secretKey),
    algorithm: 'ed25519',
    fingerprint,
    generatedAt: new Date().toISOString(),
  };
}

export async function inspectPublicKey(keyString: string): Promise<{
  algorithm: 'ed25519';
  publicKey: string;
  publicKeyPem: string;
  fingerprint: string;
}> {
  const raw32 = parsePublicKey(keyString);
  // Validate curve point using @noble/ed25519
  ed25519.Point.fromBytes(raw32).assertValidity();
  const fingerprint = await computeFingerprintHex(raw32);
  return {
    algorithm: 'ed25519',
    publicKey: bytesToBase64(raw32),
    publicKeyPem: publicKeyToPem(raw32),
    fingerprint,
  };
}

export async function signWithPrivateKey(privateKeyInput: string, message: string): Promise<string> {
  const seed = parsePrivateKey(privateKeyInput);
  const msgBytes = new TextEncoder().encode(message);
  const sig = await ed25519.signAsync(msgBytes, seed);
  return bytesToHex(sig);
}

function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonKeys);
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0
    );
    const out: Record<string, unknown> = {};
    for (const [k, v] of entries) {
      out[k] = sortJsonKeys(v);
    }
    return out;
  }
  return value;
}

export async function verifyBytecriptOffline(
  bytecript: Bytecript,
  issuerPublicKeyOverride?: string
): Promise<boolean> {
  try {
    const pubB64 = issuerPublicKeyOverride || bytecript.issuerPublicKey;
    if (!pubB64 || !bytecript.signature) return false;
    const rawPub = parsePublicKey(pubB64);
    const sigBytes = hexToBytes(bytecript.signature);

    const { signature: _sig, issuerPublicKey: _iss, ...claims } = bytecript;
    const canonical = JSON.stringify(sortJsonKeys(claims));
    const msgBytes = new TextEncoder().encode(canonical);
    return await ed25519.verifyAsync(sigBytes, msgBytes, rawPub);
  } catch {
    return false;
  }
}
