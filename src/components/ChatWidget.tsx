import { useEffect, useMemo, useRef, useState } from 'react';
import { getConfig } from '../config/env';
import { sendChatMessage, type ChatMessage } from '../services/mistralService';
import {
  deleteDocuments,
  listDocuments,
  uploadDocuments,
  type DocumentSummary,
} from '../services/documentService';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import './ChatWidget.scss';

type ChatStatus = 'idle' | 'sending' | 'error';

type ChatWidgetProps = {
  variant?: 'floating' | 'page';
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: 'assistant',
    content:
      'Welcome to Laura. Ask me about the cosmic dream experience or upload documents for grounded answers.',
  },
];

const ChatWidget = ({ variant = 'floating' }: ChatWidgetProps) => {
  const config = getConfig();
  const [isOpen, setIsOpen] = useState(variant === 'page');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const chatUnavailableMessage = useMemo(() => {
    if (config.chatEnabled) {
      return null;
    }
    return config.chatErrors[0] ?? 'Chat is currently disabled.';
  }, [config.chatEnabled, config.chatErrors]);

  useEffect(() => {
    if (!config.chatEnabled) {
      return;
    }

    listDocuments()
      .then((docs) => setDocuments(docs))
      .catch((error) => {
        logger.warn('Failed to load documents', {
          error: error instanceof Error ? error.message : String(error),
        });
      });
  }, [config.chatEnabled]);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, status]);

  const handleToggle = () => {
    if (!config.chatEnabled && !isOpen) {
      setErrorMessage(chatUnavailableMessage);
      return;
    }
    setIsOpen((prev) => !prev);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const trimmed = inputValue.trim();
    if (!trimmed || status === 'sending') {
      return;
    }

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputValue('');
    setStatus('sending');

    try {
      const response = await sendChatMessage(nextMessages);
      const citationSuffix = response.citations.length
        ? `\n\nSources: ${response.citations
            .map((citation) => `[${citation}]`)
            .join(' ')}`
        : '';
      setMessages((prev) => [
        ...prev,
        {
          ...response.message,
          content: `${response.message.content}${citationSuffix}`,
        },
      ]);
      setStatus('idle');
    } catch (error) {
      setStatus('error');
      if (error instanceof AppError) {
        setErrorMessage(error.userMessage ?? error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unexpected error while sending your message.');
      }
    }
  };

  const handleClear = () => {
    setMessages(INITIAL_MESSAGES);
    setErrorMessage(null);
    setStatus('idle');
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const updated = await uploadDocuments(files);
      setDocuments(updated);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      if (error instanceof AppError) {
        setErrorMessage(error.userMessage ?? error.message);
      } else {
        setErrorMessage('Unable to upload documents. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocuments = async () => {
    setErrorMessage(null);
    try {
      await deleteDocuments();
      setDocuments([]);
    } catch (error) {
      if (error instanceof AppError) {
        setErrorMessage(error.userMessage ?? error.message);
      } else {
        setErrorMessage('Unable to delete documents. Please try again.');
      }
    }
  };

  return (
    <div className={`chat-widget chat-widget--${variant}`}>
      <button
        type="button"
        className="chat-widget__toggle"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls="chat-widget-panel"
      >
        {isOpen ? 'Close Chat' : 'Chat with Laura'}
      </button>

      {isOpen && (
        <section
          className="chat-widget__panel"
          id="chat-widget-panel"
          aria-label="Laura AI chat"
        >
          <header className="chat-widget__header">
            <div>
              <h2>Laura AI</h2>
              <p className="text-secondary">
                Model: {config.mistralModel}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-secondary"
              aria-label="Clear chat history"
            >
              Clear history
            </button>
          </header>

          {chatUnavailableMessage && (
            <div className="chat-widget__status" role="alert">
              {chatUnavailableMessage}
            </div>
          )}

          <div
            className="chat-widget__messages"
            ref={listRef}
            aria-live="polite"
            aria-busy={status === 'sending'}
          >
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`chat-widget__message chat-widget__message--${message.role}`}
              >
                <span className="chat-widget__role">
                  {message.role === 'assistant' ? 'Laura' : 'You'}
                </span>
                <p>{message.content}</p>
              </div>
            ))}
            {status === 'sending' && (
              <div className="chat-widget__message chat-widget__message--assistant">
                <span className="chat-widget__role">Laura</span>
                <p className="chat-widget__typing" aria-live="assertive">
                  Laura is typing…
                </p>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="chat-widget__error" role="alert">
              {errorMessage}
            </div>
          )}

          <form className="chat-widget__input" onSubmit={handleSubmit}>
            <label htmlFor="chat-input" className="sr-only">
              Type your message
            </label>
            <input
              id="chat-input"
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Ask Laura anything…"
              disabled={!config.chatEnabled}
            />
            <button type="submit" className="btn btn-primary" disabled={!config.chatEnabled}>
              Send
            </button>
          </form>

          <section className="chat-widget__documents" aria-label="Your documents">
            <div className="chat-widget__documents-header">
              <div>
                <h3>Attachments</h3>
                <p className="text-secondary">
                  Upload TXT or Markdown files to ground Laura's answers.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDeleteDocuments}
                disabled={!documents.length}
                aria-label="Delete all uploaded documents"
              >
                Delete my documents
              </button>
            </div>
            <div className="chat-widget__upload">
              <label htmlFor="chat-upload" className="btn btn-secondary">
                {isUploading ? 'Uploading…' : 'Upload files'}
              </label>
              <input
                id="chat-upload"
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md,text/plain,text/markdown"
                onChange={handleUpload}
                disabled={!config.chatEnabled || isUploading}
              />
              <span className="text-secondary">
                Max 2MB per file.
              </span>
            </div>

            {documents.length > 0 && (
              <ul className="chat-widget__document-list">
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <span>{doc.name}</span>
                    <span className="text-secondary">{doc.chunks} chunks</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>
      )}
    </div>
  );
};

export default ChatWidget;
