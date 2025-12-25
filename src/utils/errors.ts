export type AppErrorOptions = {
  cause?: unknown;
  userMessage?: string;
  details?: Record<string, unknown>;
};

export class AppError extends Error {
  readonly code: string;
  readonly userMessage?: string;
  readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, options?: AppErrorOptions) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = options?.userMessage;
    this.details = options?.details;

    if (options?.cause && !(this as { cause?: unknown }).cause) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

export const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  return new Error('Unknown error');
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AppError && error.userMessage) {
    return error.userMessage;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};
