// One-shot smoke test for the self-serve settlement primitives (no network,
// no DB). Run: npm run test:purchases
import { generateKeyPairSync, sign as cryptoSign } from "node:crypto";
import { verifyWalletSignature, licensesMessage, claimMatches } from "../lib/purchases";
import { issueGrant, verifyGrant, generateDistributorKeypair, base58Encode } from "../lib/brainblast";
import { priceSelection, computePricing } from "../lib/lots";
import { createHash } from "node:crypto";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  if (!ok) failures++;
}

// 1. wallet signMessage round-trip (what /api/purchases/mine verifies)
{
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const jwk = publicKey.export({ format: "jwk" }) as { x: string };
  const wallet = base58Encode(Buffer.from(jwk.x, "base64url"));
  const ts = Date.now();
  const sig = cryptoSign(null, Buffer.from(licensesMessage(wallet, ts), "utf8"), privateKey);
  check("wallet-sig valid", verifyWalletSignature(wallet, ts, base58Encode(sig)));
  check("wallet-sig stale ts rejected", !verifyWalletSignature(wallet, ts - 11 * 60_000, base58Encode(sig)));
  check("wallet-sig wrong wallet rejected", !verifyWalletSignature(wallet.replace(/.$/, wallet.endsWith("1") ? "2" : "1"), ts, base58Encode(sig)));
}

// 2. purchase-shaped grants verify at the feed's verifier
{
  const kp = generateDistributorKeypair();
  const grant = issueGrant({
    buyer: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    tier: "firehose",
    lots: [],
    signer: { alg: "ed25519", secretKey: kp.secretKey },
    ttlDays: 366,
  });
  const v = verifyGrant(grant, { alg: "ed25519", publicKey: kp.address });
  check("firehose grant verifies", v.valid === true && v.tier === "firehose");
  const scoped = issueGrant({
    buyer: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    tier: "standard",
    lots: ["solana", "evm"],
    signer: { alg: "ed25519", secretKey: kp.secretKey },
    ttlDays: 31,
  });
  const v2 = verifyGrant(scoped, { alg: "ed25519", publicKey: kp.address });
  check("standard lot-scoped grant verifies", v2.valid === true && JSON.stringify(v2.lots) === JSON.stringify(["evm", "solana"]));
  const other = generateDistributorKeypair();
  check("grant from wrong signer rejected", verifyGrant(grant, { alg: "ed25519", publicKey: other.address }).valid === false);
}

// 3. claim hashing
{
  const secret = "test-claim-secret";
  const row = { claim_hash: createHash("sha256").update(secret).digest("hex") };
  check("claim matches", claimMatches(row, secret));
  check("wrong claim rejected", !claimMatches(row, "nope"));
  check("empty claim rejected", !claimMatches(row, ""));
}

// 4. priceSelection consistency on a synthetic corpus
{
  const mk = (sdk: string, cls: string, sev: string) => ({ sdk: { name: sdk }, class: cls, severity: sev, trapId: `${sdk}-x-y`, corroborationCount: 1 });
  const vtis = [
    ...Array.from({ length: 12 }, (_, i) => mk(`@solana/web3.js-${i}`, "wrong-constant", "high")),
    ...Array.from({ length: 10 }, (_, i) => mk(`ethers-${i}`, "missing-slippage-guard", "critical")),
    ...Array.from({ length: 8 }, (_, i) => mk(`jsonwebtoken-${i}`, "auth-bypass", "high")),
  ];
  const pricing = computePricing(vtis);
  const solana = priceSelection(pricing, ["solana"]);
  check("single lot priced", solana.total > 0 && solana.applied.length === 0);
  const both = priceSelection(pricing, ["solana", "evm"]);
  check("web3 bundle discount applied", both.applied.length === 1 && both.total < solana.total + priceSelection(pricing, ["evm"]).total);
  const all = priceSelection(pricing, pricing.lots.map((l) => l.lot));
  check("scale detected", all.isScale === true);
}

// 5. client-side b58 (MyLicenses) matches lib base58
{
  const { randomBytes } = await import("node:crypto");
  const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  function b58(bytes: Uint8Array): string {
    let zeros = 0;
    while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
    const digits: number[] = [];
    for (let i = zeros; i < bytes.length; i++) {
      let carry = bytes[i];
      for (let j = 0; j < digits.length; j++) {
        carry += digits[j] << 8;
        digits[j] = carry % 58;
        carry = (carry / 58) | 0;
      }
      while (carry > 0) {
        digits.push(carry % 58);
        carry = (carry / 58) | 0;
      }
    }
    return "1".repeat(zeros) + digits.reverse().map((d) => B58[d]).join("");
  }
  let ok = true;
  for (let i = 0; i < 50; i++) {
    const buf = randomBytes(1 + Math.floor(Math.random() * 80));
    if (b58(buf) !== base58Encode(buf)) ok = false;
  }
  ok = ok && b58(Buffer.from([0, 0, 5])) === base58Encode(Buffer.from([0, 0, 5]));
  check("client b58 === lib base58 (50 random + leading zeros)", ok);
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
