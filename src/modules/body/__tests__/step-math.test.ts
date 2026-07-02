import { describe, expect, it } from 'vitest';

import {
  computeSteps,
  computeStrideDistance,
  initialStepState,
  metersToKm,
  processMotionSample,
  STEP_DETECTION,
} from '@/modules/body/step-math';
import type { MotionSample } from '@/modules/body/step-math';
import { isErr, isOk } from '@/shared/types';

/** Builds a sample stream at ~50Hz from magnitude values */
function stream(magnitudes: number[], hz = 50): MotionSample[] {
  const dt = 1000 / hz;
  return magnitudes.map((magnitude, i) => ({ t: i * dt, magnitude }));
}

/** Idle noise around gravity (9.8 ± 0.5) — should count zero steps */
const IDLE = stream(Array.from({ length: 200 }, (_, i) => 9.8 + Math.sin(i) * 0.5));

/** Walk-like fixture: one sharp impact every ~600ms, ~50Hz sampling (10 impacts) */
const WALK = stream(
  Array.from({ length: 300 }, (_, i) => (i % 30 === 0 && i > 0 ? 15 : 9.8)),
);

/** Sustained shake: 100 consecutive samples above threshold — one rising edge */
const SHAKE = stream(Array.from({ length: 100 }, () => 18));

/** Tests rising-edge + refractory step detection against recorded-style fixtures */
describe('computeSteps', () => {
  it('counts zero steps for idle noise', () => {
    expect(computeSteps(IDLE)).toBe(0);
  });

  it('counts one step per walk impact (not per sample)', () => {
    expect(computeSteps(WALK)).toBe(9);
  });

  it('counts a sustained shake as a single step, not hundreds', () => {
    expect(computeSteps(SHAKE)).toBe(1);
  });

  it('respects the refractory window for rapid double impacts', () => {
    // Two rising edges 100ms apart — second is inside REFRACTORY_MS
    const samples: MotionSample[] = [
      { t: 0, magnitude: 15 },
      { t: 50, magnitude: 9 },
      { t: 100, magnitude: 15 },
      { t: 150, magnitude: 9 },
      { t: 100 + STEP_DETECTION.REFRACTORY_MS, magnitude: 15 },
    ];
    expect(computeSteps(samples)).toBe(2);
  });
});

/** Tests the streaming detector state transitions */
describe('processMotionSample', () => {
  it('steps on a rising edge and anchors the refractory window', () => {
    const first = processMotionSample(initialStepState(), { t: 0, magnitude: 15 });
    expect(first.stepped).toBe(true);
    expect(first.state.lastStepAt).toBe(0);
    const second = processMotionSample(first.state, { t: 20, magnitude: 15 });
    expect(second.stepped).toBe(false);
  });
});

/** Tests stride-based distance derivation (Result-typed validation) */
describe('computeStrideDistance', () => {
  it('derives meters from steps × stride', () => {
    const result = computeStrideDistance(1000, 75);
    expect(isOk(result) && result.data).toBe(750);
  });

  it('rejects negative steps and out-of-range strides', () => {
    expect(isErr(computeStrideDistance(-1, 75))).toBe(true);
    expect(isErr(computeStrideDistance(100, 10))).toBe(true);
    expect(isErr(computeStrideDistance(100, 500))).toBe(true);
    expect(isErr(computeStrideDistance(Number.NaN, 75))).toBe(true);
  });
});

/** Tests the m→km display helper uses the CONFIG constant */
describe('metersToKm', () => {
  it('converts via CONFIG.METERS_PER_KM', () => {
    expect(metersToKm(2500)).toBe(2.5);
  });
});
