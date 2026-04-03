/** Computes the body score: up floors count 1 point, down floors count 0.5 */
export function computeBodyScore(up: number, down: number): number {
  return up + down * 0.5;
}
