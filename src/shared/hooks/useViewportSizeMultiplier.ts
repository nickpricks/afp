import { useMatchMedia } from '@/shared/hooks/useMatchMedia';
import { CONFIG } from '@/constants/config';

const MOBILE_MQ = `(max-width: ${CONFIG.MOBILE_BREAKPOINT_PX}px)`;
const MOBILE_PARTICLE_MULTIPLIER = 0.65;
const DESKTOP_PARTICLE_MULTIPLIER = 1.0;

/** Returns a particle-size multiplier based on viewport width: mobile shrinks to 0.65×, desktop is identity. */
export const useViewportSizeMultiplier = (): number => {
  const isMobile = useMatchMedia(MOBILE_MQ);
  return isMobile ? MOBILE_PARTICLE_MULTIPLIER : DESKTOP_PARTICLE_MULTIPLIER;
};
