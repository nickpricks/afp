import { GreetingMsg } from '@/constants/messages';

/** Returns today's local date as YYYY-MM-DD */
export const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Returns the current time as HH:MM */
export const nowTime = (): string => {
  return new Date().toTimeString().slice(0, 5);
};

/** Returns a time-of-day greeting */
export const computeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return GreetingMsg.Morning;
  if (hour < 17) return GreetingMsg.Afternoon;
  return GreetingMsg.Evening;
};

/** Formats a YYYY-MM-DD string as "Wednesday, April 7" */
export const formatDayDate = (dateStr: string): string => {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};
