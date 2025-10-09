type GlobalWithCrypto = typeof globalThis & { crypto?: Crypto };

const getGlobalWithCrypto = (): GlobalWithCrypto | undefined => {
  if (typeof globalThis === 'undefined') {
    return undefined;
  }
  return globalThis as GlobalWithCrypto;
};

export const getGlobalCrypto = (): Crypto | undefined => {
  const globalCandidate = getGlobalWithCrypto();
  if (!globalCandidate) {
    return undefined;
  }
  return globalCandidate.crypto;
};

export const ensureSubtleCrypto = (): Crypto['subtle'] => {
  const cryptoObj = getGlobalCrypto();
  if (!cryptoObj?.subtle) {
    throw new Error('Crypto API not available. Please use HTTPS.');
  }
  return cryptoObj.subtle;
};

export const safeRandomUUID = (): string => {
  const cryptoObj = getGlobalCrypto();
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  // Fallback: RFC4122-like random string (not cryptographically strong)
  const randomPart = () => Math.random().toString(36).slice(2, 10);
  return `uuid-${Date.now().toString(36)}-${randomPart()}-${randomPart()}`;
};
