import ChatWidget from '../components/ChatWidget';
import './Chat.scss';

const Chat = () => {
  return (
    <div className="chat">
      <section className="chat-hero">
        <h1>Laura Chat</h1>
        <p>
          Your embedded Mistral AI assistant is now available as a floating
          widget across Laura. Use this page for an expanded view of the
          conversation.
        </p>
      </section>
      <div className="chat-panel">
        <ChatWidget variant="page" />
      </div>
    </div>
  );
};

export default Chat;
