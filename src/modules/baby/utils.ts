/** Computes a human-readable age string from a date-of-birth (YYYY-MM-DD) */
export const computeAge = (dob: string): string => {
  const birth = new Date(dob);
  const now = new Date();

  if (isNaN(birth.getTime())) {
    return 'Unknown';
  }

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  const days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years > 0) {
    return years === 1 ? '1 year' : `${years} years`;
  }
  if (months > 0) {
    return months === 1 ? '1 month' : `${months} months`;
  }
  return 'Newborn';
};
