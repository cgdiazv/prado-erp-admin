import { TRIAL_DAYS } from "./plans";

export interface TrialStatus {
  isExpired: boolean;
  daysRemaining: number;
}

export { TRIAL_DAYS };
export const TRIAL_DURATION_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;

export function checkTrialExpiry(
  trialEndsAtOrStartsAt: string | Date | null,
  status: string | null,
  isDirectEndsAt: boolean = true
): TrialStatus {
  const normalizedStatus = (status || "").toUpperCase();
  if (normalizedStatus === "ACTIVE") {
    return { isExpired: false, daysRemaining: 0 };
  }

  const now = new Date();

  if (isDirectEndsAt && trialEndsAtOrStartsAt) {
    const expiryDate = new Date(trialEndsAtOrStartsAt);
    const timeDiff = expiryDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
    return {
      isExpired: now > expiryDate,
      daysRemaining,
    };
  }

  const startDate = trialEndsAtOrStartsAt ? new Date(trialEndsAtOrStartsAt) : new Date();
  const expiryDate = new Date(startDate.getTime() + TRIAL_DURATION_MS);
  const timeDiff = expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

  return {
    isExpired: now > expiryDate,
    daysRemaining,
  };
}

export function getTrialDaysLeft(trialEndsAtOrStartsAt: string | Date, isDirectEndsAt: boolean = true): number {
  const now = new Date();
  let expiryDate: Date;

  if (isDirectEndsAt) {
    expiryDate = new Date(trialEndsAtOrStartsAt);
  } else {
    const start = new Date(trialEndsAtOrStartsAt);
    expiryDate = new Date(start.getTime() + TRIAL_DURATION_MS);
  }

  const diffMs = expiryDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return daysLeft > 0 ? daysLeft : 0;
}
