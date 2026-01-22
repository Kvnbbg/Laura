import { getConfig } from '../config/env';
import { AppError } from '../utils/errors';
import { fetchWithTimeout } from './http';

export type DocumentSummary = {
  id: string;
  name: string;
  chunks: number;
};

export const uploadDocuments = async (files: File[]) => {
  const config = getConfig();
  if (!config.chatEnabled) {
    throw new AppError('CHAT_DISABLED', 'Chat is disabled', {
      userMessage:
        config.chatErrors[0] ??
        'Chat is currently disabled. Please enable it in your environment.',
    });
  }

  const body = new FormData();
  files.forEach((file) => body.append('files', file));

  const response = await fetchWithTimeout(
    '/api/documents',
    {
      method: 'POST',
      body,
    },
    config.chatTimeoutMs
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new AppError('DOC_UPLOAD_FAILED', 'Document upload failed', {
      userMessage:
        payload?.message ??
        'We could not upload your documents. Please try again.',
    });
  }

  const payload = (await response.json()) as { documents: DocumentSummary[] };
  return payload.documents;
};

export const listDocuments = async () => {
  const response = await fetch('/api/documents');
  if (!response.ok) {
    throw new AppError('DOC_LIST_FAILED', 'Document listing failed', {
      userMessage: 'We could not load your documents. Please try again.',
    });
  }

  const payload = (await response.json()) as { documents: DocumentSummary[] };
  return payload.documents;
};

export const deleteDocuments = async () => {
  const response = await fetch('/api/documents', { method: 'DELETE' });
  if (!response.ok) {
    throw new AppError('DOC_DELETE_FAILED', 'Document deletion failed', {
      userMessage: 'We could not delete your documents. Please try again.',
    });
  }
};
