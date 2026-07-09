// Barrel for the vendored brainblast distribution surface. Mirrors the upstream
// `brainblast/distribution` subpath export. See the per-file headers — sync from
// upstream; do not hand-edit the vendored modules.

export {
  handleRequest,
  type ServerRequest,
  type ServerResponse,
  type ServerDeps,
  type ServerLot,
} from "./server";

export {
  buildCatalog,
  renderCatalogMd,
  issueGrant,
  verifyGrant,
  generateDistributorKeypair,
  addressFromSecretKey,
  appendUsage,
  verifyLedger,
  summarizeUsage,
  canonicalJson,
  TIER_PRICING,
  LEDGER_GENESIS,
  type CatalogResult,
  type Grant,
  type GrantSigner,
  type GrantVerifier,
  type GrantVerification,
  type DistributorKeypair,
  type UsageRecord,
  type UsageEntry,
} from "./marketplace";

export {
  selectFeed,
  tierForBrain,
  TIER_ENTITLEMENTS,
  type FeedTier,
  type FeedQuery,
  type FeedResult,
  type FeedRecord,
} from "./feed";

export { scoreVti, type CorpusVti } from "./corpus";
export { TRAP_CLASSES, classifyTrap, type TrapClass } from "./vtiClass";
export { base58Encode, base58Decode } from "./base58";

// HiveMind federation (v0.11.0) — /api/hive/experience runs on these.
export {
  verifyBatch,
  makeBatch,
  signBody,
  verifyBody,
  isSpaceId,
  newSpaceId,
  experienceEventKey,
  MemoryHiveStore,
  SupabaseHiveStore,
  makePolicy,
  verifyPolicy,
  policyAllowsWrite,
  policyAllowsRead,
  BATCH_MAX_EVENTS,
  EVENT_FIELD_MAX,
  type ExperienceBatch,
  type ExperienceBatchBody,
  type BatchVerification,
  type HiveExperienceStore,
  type HiveStoreAppendResult,
  type StoredExperienceEvent,
  type ExperienceEvent,
  type SpacePolicy,
  type SpacePolicyBody,
  type PolicyVerification,
  type WriteMode,
  type ReadMode,
} from "./federation";
