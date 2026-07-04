// Vendored slice of brainblast Keyguard (packages/core/src/keys/detect.ts).
//
// Pure, fs-free secret classifier — detection by CONTENT, not filename. Vendored
// (not imported) because the registry stays lean: this is ~1 file + base58, no
// ts-morph, no prover. The ingest endpoint runs it server-side so a submission's
// fixtures can never carry a keypair / seed / private key into the corpus.
//
// Kept byte-for-byte in step with the upstream classifier; only the imports and
// the small type block are inlined here.

import { base58Decode, base58Encode } from "./base58";

export type SecretKind =
  | "solana-keypair-64"
  | "solana-secret-32"
  | "base58-secret-key"
  | "bip39-mnemonic"
  | "keypair-path-ref"
  | "env-private-key";
export type Confidence = "high" | "medium" | "low";
export interface RawDetection {
  kind: SecretKind;
  confidence: Confidence;
  reason: string;
  pubkey?: string;
  line?: number;
  match?: string;
}

function asByteArray(text: string): number[] | null {
  const t = text.trim();
  if (!t.startsWith("[") || !t.endsWith("]")) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(t);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  if (!parsed.every((n) => typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 255)) {
    return null;
  }
  return parsed as number[];
}

function looksLikeMnemonic(text: string): boolean {
  const words = text.trim().split(/\s+/);
  if (words.length !== 12 && words.length !== 24) return false;
  return words.every((w) => /^[a-z]{3,8}$/.test(w));
}

const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{80,90}$/;

function isBase58SecretKey(value: string): boolean {
  if (!BASE58_RE.test(value)) return false;
  try {
    return base58Decode(value).length === 64;
  } catch {
    return false;
  }
}

const PLACEHOLDER_RE = /^(|<.*>|\$\{.*\}|x{3,}|\.{3,}|change[-_ ]?me|your[-_ ].*|todo|placeholder|none|null|undefined|example)$/i;

function unquote(v: string): string {
  const t = v.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

function detectionFromBytes(bytes: number[]): RawDetection | null {
  if (bytes.length === 64) {
    let pubkey: string | undefined;
    try {
      pubkey = base58Encode(Uint8Array.from(bytes.slice(32)));
    } catch {
      pubkey = undefined;
    }
    return {
      kind: "solana-keypair-64",
      confidence: "high",
      reason: "64-byte ed25519 keypair array — the solana-keygen file format.",
      pubkey,
    };
  }
  if (bytes.length === 32) {
    return {
      kind: "solana-secret-32",
      confidence: "medium",
      reason: "32-byte array — likely a Solana secret key or seed (pubkey not derivable offline).",
    };
  }
  return null;
}

export function classifySecretValue(rawValue: string): RawDetection | null {
  const value = unquote(rawValue);
  if (!value || PLACEHOLDER_RE.test(value)) return null;

  const bytes = asByteArray(value);
  if (bytes) return detectionFromBytes(bytes);

  if (isBase58SecretKey(value)) {
    let pubkey: string | undefined;
    try {
      pubkey = base58Encode(base58Decode(value).slice(32));
    } catch {
      pubkey = undefined;
    }
    return {
      kind: "base58-secret-key",
      confidence: "high",
      reason: "Base58 string that decodes to a 64-byte ed25519 secret key.",
      pubkey,
    };
  }

  if (looksLikeMnemonic(value)) {
    return {
      kind: "bip39-mnemonic",
      confidence: "medium",
      reason: "Looks like a 12/24-word BIP39 seed phrase — verify before trusting.",
    };
  }

  return null;
}

const SECRET_NAME_RE = /(PRIVATE_?KEY|SECRET_?KEY|KEYPAIR|MNEMONIC|SEED_?PHRASE|WALLET_?KEY|SOLANA_?KEY)/i;
const PATH_NAME_RE = /(ANCHOR_WALLET|KEYPAIR_?PATH|WALLET_?PATH|KEY_?PATH)/i;

function detectEnvSecrets(content: string): RawDetection[] {
  const out: RawDetection[] = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s*$/);
    if (!m) continue;
    const name = m[1];
    const value = m[2];

    const valueDetection = classifySecretValue(value);
    if (valueDetection) {
      out.push({ ...valueDetection, line: i + 1, match: name });
      continue;
    }

    const v = unquote(value);
    if (PATH_NAME_RE.test(name) && /\.json('|")?$/.test(v)) {
      out.push({ kind: "keypair-path-ref", confidence: "medium", reason: `${name} points at a keypair file (${v}).`, line: i + 1, match: name });
      continue;
    }

    if (SECRET_NAME_RE.test(name) && !PLACEHOLDER_RE.test(unquote(value))) {
      out.push({ kind: "env-private-key", confidence: "low", reason: `${name} is named like a private key and holds a non-placeholder value.`, line: i + 1, match: name });
    }
  }
  return out;
}

export function detectFileSecrets(content: string): RawDetection[] {
  const wholeBytes = asByteArray(content);
  if (wholeBytes) {
    const d = detectionFromBytes(wholeBytes);
    return d ? [d] : [];
  }
  if (looksLikeMnemonic(content)) {
    return [{ kind: "bip39-mnemonic", confidence: "medium", reason: "File contents are a 12/24-word BIP39-style seed phrase." }];
  }
  return detectEnvSecrets(content);
}
