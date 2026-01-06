import { useMemo, useRef, useState } from 'react';
import { getConfig } from '../config/env';
import { sendChatMessage, type ChatMessage } from '../services/chatService';
import { getErrorMessage } from '../utils/errors';
import './Chat.scss';

type ChatStatus = 'idle' | 'sending' | 'error';

const Chat = () => {
  const { chatEndpoint } = getConfig();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Welcome to Laura chat. Ask me about the cosmic dream experience or how to get started.',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const isSending = status === 'sending';

  const connectionStatus = useMemo(() => {
    return chatEndpoint
      ? 'Connected to your configured chat endpoint.'
      : 'Chat is running in demo mode. Add VITE_CHAT_ENDPOINT to enable live responses.';
  }, [chatEndpoint]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
    };

    setInputValue('');
    setStatus('sending');
    setErrorMessage(null);
    setMessages((prev) => [...prev, userMessage]);

    try {
      const { message } = await sendChatMessage([
        ...messages,
        userMessage,
      ]);
      setMessages((prev) => [...prev, message]);
      setStatus('idle');
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: 'smooth',
        });
      });
    } catch (error) {
      setStatus('error');
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void handleSend();
  };

  return (
    <div className="chat">
      <div className="container">
        <section className="chat-hero">
          <h1>Laura Chat</h1>
          <p className="lead text-secondary">
            Real-time conversation powered by your Meta Llama endpoint.
          </p>
        </section>

        <div className="grid grid-2">
          <div className="chat-panel">
            <div className="card chat-card">
              <div className="chat-messages" ref={listRef} aria-live="polite">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`chat-message chat-message--${message.role}`}
                  >
                    <div className="chat-message__role">
                      {message.role === 'assistant' ? 'Laura' : 'You'}
                    </div>
                    <p className="chat-message__content">{message.content}</p>
                  </div>
                ))}
              </div>
              <form className="chat-input" onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Ask Laura anything..."
                  disabled={isSending}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSending || !inputValue.trim()}
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </form>
              {errorMessage ? (
                <div className="chat-error" role="alert">
                  <span>⚠️</span>
                  <p>{errorMessage}</p>
                </div>
              ) : null}
            </div>
          </div>

          <aside className="chat-sidebar">
            <div className="card">
              <h2>Connection status</h2>
              <p className="text-secondary">{connectionStatus}</p>
            </div>
            <div className="card mt-md">
              <h2>Suggested prompts</h2>
              <ul className="chat-prompts text-secondary">
                <li>“Summarize the Laura cosmic dream theme.”</li>
                <li>“How do I enable live chat on Vercel?”</li>
                <li>“Draft a friendly onboarding message.”</li>
              </ul>
            </div>
            <div className="card mt-md">
              <h2>API payload</h2>
              <p className="text-secondary">
                Send <code>{'{ messages: [{ role, content }] }'}</code> to your
                configured endpoint for best compatibility.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Chat;
