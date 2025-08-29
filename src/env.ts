// src/env.ts
type Maybe<T> = T | undefined;

const fromVite = (k: string): Maybe<string> => {
  try {
    // @ts-ignore
    return (import.meta as any)?.env?.[k];
  } catch {
    return undefined;
  }
};

const fromCRA = (k: string): Maybe<string> => {
  if (typeof process !== "undefined" && process.env) {
    // @ts-ignore
    return process.env[k] as Maybe<string>;
  }
  return undefined;
};

// Optionally allow a window-injected fallback (see step 4)
const fromWindow = (k: string): Maybe<string> => {
  if (typeof window !== "undefined" && (window as any).__ENV) {
    return (window as any).__ENV[k];
  }
  return undefined;
};

export function getEnv(key: string): string {
  // Try Vite first, then CRA, then window fallback
  const val = fromVite(key) ?? fromCRA(key) ?? fromWindow(key);
  if (!val) throw new Error(`Missing env: ${key}`);
  return val;
}
