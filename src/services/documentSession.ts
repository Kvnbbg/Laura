const DOCUMENT_SESSION_STORAGE_KEY = 'laura-document-session';
const DOCUMENT_SESSION_HEADER = 'X-Laura-Session';

const randomFallback = () =>
  `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 18)}`;

export const getDocumentSessionId = (): string => {
  if (typeof window === 'undefined') {
    return randomFallback();
  }

  try {
    const existing = window.sessionStorage.getItem(DOCUMENT_SESSION_STORAGE_KEY);
    if (existing) {
      return existing;
    }
    const next =
      typeof window.crypto?.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : randomFallback();
    window.sessionStorage.setItem(DOCUMENT_SESSION_STORAGE_KEY, next);
    return next;
  } catch {
    return randomFallback();
  }
};

export const getDocumentSessionHeaders = (): Record<string, string> => ({
  [DOCUMENT_SESSION_HEADER]: getDocumentSessionId(),
});
