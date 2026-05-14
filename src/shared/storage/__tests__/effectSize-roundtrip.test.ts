import { describe, it, expect, beforeEach } from 'vitest';
import { createLocalStorageAdapter } from '@/shared/storage/localStorage-adapter';
import { bucketEffectSize, EFFECT_SIZE_DEFAULT } from '@/shared/utils/effectSize';

/**
 * Locks the persistence contract for `UserProfile.effectSize`:
 *   - Saving a profile with `effectSize` round-trips unchanged through the adapter.
 *   - Legacy profiles (no `effectSize` field) read as `undefined` and resolve to
 *     `EFFECT_SIZE_DEFAULT` via the `bucketEffectSize` consumer in Layout.tsx.
 *   - Any persisted tier value (70/100/140) buckets back to itself.
 *
 * This guards against regressions where: a future schema change drops the field,
 * the localStorage serializer mishandles `undefined`, or the consumer fallback
 * (`bucketEffectSize(undefined)`) drifts from `EFFECT_SIZE_DEFAULT`.
 */
describe('effectSize round-trip persistence', () => {
  // Use unique paths per test to sidestep the adapter cache (ADAPTER_INSTANCES Map).
  let testCounter = 0;
  let basePath: string;

  beforeEach(() => {
    localStorage.clear();
    testCounter += 1;
    basePath = `users/test-uid-${testCounter}`;
  });

  it('saves profile with effectSize=70 and reads it back unchanged', async () => {
    const adapter = createLocalStorageAdapter(basePath);
    const result = await adapter.save('profile', {
      id: 'main',
      theme: 'family-blue',
      effectSize: 70,
    });
    expect(result.ok).toBe(true);

    const read = await adapter.getById('profile', 'main');
    expect(read.ok).toBe(true);
    if (read.ok) {
      expect((read.data as { effectSize?: number }).effectSize).toBe(70);
    }
  });

  it('legacy profile without effectSize reads as undefined (the absent-field path)', async () => {
    // Seed localStorage as if a profile was written before the `effectSize` field existed.
    localStorage.setItem(
      `afp:${basePath}:profile`,
      JSON.stringify([{ id: 'main', theme: 'family-blue' }]),
    );

    const adapter = createLocalStorageAdapter(basePath);
    const read = await adapter.getById('profile', 'main');
    expect(read.ok).toBe(true);
    if (read.ok) {
      expect((read.data as { effectSize?: number }).effectSize).toBeUndefined();
    }
  });

  it('legacy effectSize=undefined → Layout consumer resolves to EFFECT_SIZE_DEFAULT (Medium)', () => {
    // Mirrors what Layout.tsx does: `bucketEffectSize(profile.effectSize)`. For a legacy
    // profile this collapses to `bucketEffectSize(undefined) === EFFECT_SIZE_DEFAULT`.
    expect(bucketEffectSize(undefined)).toBe(EFFECT_SIZE_DEFAULT);
    expect(EFFECT_SIZE_DEFAULT).toBe(100);
  });

  it('stored tier value buckets back to itself on read (idempotent)', async () => {
    const adapter = createLocalStorageAdapter(basePath);
    for (const tierValue of [70, 100, 140]) {
      await adapter.save('profile', { id: 'main', effectSize: tierValue });
      const read = await adapter.getById('profile', 'main');
      expect(read.ok).toBe(true);
      if (read.ok) {
        const stored = (read.data as { effectSize?: number }).effectSize;
        expect(bucketEffectSize(stored)).toBe(tierValue);
      }
    }
  });

  it('non-tier stored value (e.g. legacy slider 60) buckets to nearest tier on display', async () => {
    const adapter = createLocalStorageAdapter(basePath);
    await adapter.save('profile', { id: 'main', effectSize: 60 });
    const read = await adapter.getById('profile', 'main');
    expect(read.ok).toBe(true);
    if (read.ok) {
      const stored = (read.data as { effectSize?: number }).effectSize;
      expect(stored).toBe(60); // Storage stays raw (Option 2 — see ROADMAP P2 #20)
      expect(bucketEffectSize(stored)).toBe(70); // Display bucket: Small
    }
  });
});
