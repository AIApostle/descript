import { useCallback, useState } from 'react';
import type { Keypair } from '../types/registration';
import { generateEd25519Keypair, inspectPublicKey } from '../utils/crypto';

export function useKeyGeneration() {
  const [keypair, setKeypair] = useState<Keypair | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (): Promise<Keypair> => {
    setIsGenerating(true);
    setError(null);
    try {
      const generated = await generateEd25519Keypair();
      setKeypair(generated);
      return generated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate Ed25519 keypair';
      setError(msg);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const validateImport = useCallback(async (rawPublicKey: string) => {
    setError(null);
    try {
      return await inspectPublicKey(rawPublicKey);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid public key format';
      setError(msg);
      throw err;
    }
  }, []);

  const clear = useCallback(() => {
    setKeypair(null);
    setError(null);
  }, []);

  return {
    keypair,
    isGenerating,
    error,
    generate,
    validateImport,
    clear,
  };
}
