export interface Keypair {
  publicKey: string;       // Base64 raw 32-byte Ed25519 public key
  publicKeyPem: string;    // SPKI PEM
  privateKey: string;      // Base64 raw 32-byte seed (temporary in memory only)
  privateKeyPem: string;   // PKCS#8 PEM (temporary in memory only)
  algorithm: 'ed25519';
  fingerprint: string;     // SHA-256 hex digest of raw 32-byte public key
  generatedAt: string;
}

export interface RegistrationData {
  agentName: string;
  description?: string;
  byteNetwork: string;
  agentType?: string;
  framework?: string;
  capabilities: string[];
  keypairSource?: 'generate' | 'import';
  publicKey?: string;
  publicKeyFingerprint?: string;
  credentialLabel?: string;
}
