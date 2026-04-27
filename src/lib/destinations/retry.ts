export function nextRetryAt(input: {
  attemptNumber: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const delayMinutes = Math.min(60, Math.max(1, 2 ** (input.attemptNumber - 1)));
  return new Date(now.getTime() + delayMinutes * 60_000);
}

export function shouldRetry(input: {
  retryable: boolean;
  attemptNumber: number;
  maxAttempts: number;
}) {
  return input.retryable && input.attemptNumber < input.maxAttempts;
}
