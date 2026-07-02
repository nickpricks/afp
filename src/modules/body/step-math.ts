import { CONFIG } from '@/constants/config';
import { err, ok } from '@/shared/types';
import type { Result } from '@/shared/types';

/** Tuning constants for accelerometer step detection */
export const STEP_DETECTION = {
  /** Total-acceleration threshold (m/s², incl. gravity) a peak must cross to count as a step */
  THRESHOLD_MS2: 12,
  /** Minimum gap between two steps — samples above threshold inside the window are the same step */
  REFRACTORY_MS: 300,
} as const;

/** One accelerometer sample — total magnitude (incl. gravity) at a timestamp */
export type MotionSample = {
  /** Milliseconds (epoch or monotonic — only deltas matter) */
  t: number;
  /** Total acceleration magnitude in m/s² */
  magnitude: number;
};

/** Streaming step-detector state — thread through processMotionSample calls */
export type StepDetectorState = {
  /** Whether the signal is currently above the threshold (rising-edge tracking) */
  aboveThreshold: boolean;
  /** Timestamp of the last counted step (refractory anchor); null = none yet */
  lastStepAt: number | null;
};

/** Fresh detector state for a new tracking session */
export const initialStepState = (): StepDetectorState => {
  return { aboveThreshold: false, lastStepAt: null };
};

/**
 * Processes one accelerometer sample. Counts a step only on a rising edge
 * (below→above threshold) outside the refractory window — a sustained shake or
 * a single impact spanning many samples counts once, not once per sample.
 */
export const processMotionSample = (
  state: StepDetectorState,
  sample: MotionSample,
): { state: StepDetectorState; stepped: boolean } => {
  const above = sample.magnitude > STEP_DETECTION.THRESHOLD_MS2;
  const risingEdge = above && !state.aboveThreshold;
  const outsideRefractory =
    state.lastStepAt === null || sample.t - state.lastStepAt >= STEP_DETECTION.REFRACTORY_MS;
  const stepped = risingEdge && outsideRefractory;
  return {
    state: { aboveThreshold: above, lastStepAt: stepped ? sample.t : state.lastStepAt },
    stepped,
  };
};

/** Counts steps in a recorded sample batch (fixture testing / imports) via the streaming detector */
export const computeSteps = (samples: MotionSample[]): number => {
  let state = initialStepState();
  let steps = 0;
  for (const sample of samples) {
    const next = processMotionSample(state, sample);
    state = next.state;
    if (next.stepped) steps += 1;
  }
  return steps;
};

/**
 * Derives walked distance in meters from a step count and stride length.
 * Fallback for sessions without usable GPS distance. Result-typed: stride must be
 * a positive, sane value (20–200 cm) and steps non-negative.
 */
export const computeStrideDistance = (steps: number, strideCm: number): Result<number> => {
  if (!Number.isFinite(steps) || steps < 0) {
    return err('Steps must be a non-negative number');
  }
  if (!Number.isFinite(strideCm) || strideCm < 20 || strideCm > 200) {
    return err('Stride length must be between 20 and 200 cm');
  }
  const CM_PER_M = 100;
  return ok((steps * strideCm) / CM_PER_M);
};

/** Converts meters to km for display parity with the rest of the body module */
export const metersToKm = (meters: number): number => {
  return meters / CONFIG.METERS_PER_KM;
};
