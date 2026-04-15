import { MilestoneCategory } from '@/modules/baby/types';

/** Predefined milestone templates for quick-add chips — one tap prefills title + category */
export const MILESTONE_TEMPLATES: readonly { title: string; category: MilestoneCategory }[] = [
  { title: 'First word', category: MilestoneCategory.Language },
  { title: 'First steps', category: MilestoneCategory.Motor },
  { title: 'Started crawling', category: MilestoneCategory.Motor },
  { title: 'First tooth', category: MilestoneCategory.Other },
  { title: 'First haircut', category: MilestoneCategory.Other },
  { title: 'Slept through the night', category: MilestoneCategory.Other },
  { title: 'Started solid food', category: MilestoneCategory.Other },
  { title: 'Started potty training', category: MilestoneCategory.Other },
  { title: 'First day at daycare/school', category: MilestoneCategory.Social },
  { title: 'First friend', category: MilestoneCategory.Social },
] as const;
