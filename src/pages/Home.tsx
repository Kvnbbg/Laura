import { Link } from 'react-router-dom';
import { getConfig } from '../config/env';
import './Home.scss';

const Home = () => {
  const { contactEndpoint, chatEndpoint } = getConfig();

  return (
    <div className="home">
      <div className="container">
        <section className="hero">
          <h1 className="hero-title float">Welcome to Laura</h1>
          <p className="hero-subtitle">
            AI Float Cosmic Dream - Your Professional Cosmic Companion
          </p>
          <div className="hero-actions">
            <Link to="/about" className="btn btn-primary">
              Learn More
            </Link>
            <Link to="/contact" className="btn btn-secondary">
              Get in Touch
            </Link>
          </div>
        </section>

        <section className="features py-xl">
          <h2 className="text-center mb-lg">Cosmic Features</h2>
          <div className="grid grid-3">
            <div className="card">
              <div className="feature-icon cosmic-glow">🌟</div>
              <h3>Cosmic Design</h3>
              <p className="text-secondary">
                Experience stunning cosmic-inspired design with smooth gradients
                and animations.
              </p>
            </div>
            <div className="card">
              <div className="feature-icon cosmic-glow">⚡</div>
              <h3>Lightning Fast</h3>
              <p className="text-secondary">
                Built with React and Vite for blazing-fast performance and
                instant hot reload.
              </p>
            </div>
            <div className="card">
              <div className="feature-icon cosmic-glow">🎨</div>
              <h3>SCSS Powered</h3>
              <p className="text-secondary">
                Fully styled with scss-cosmic-dream for maintainable and
                beautiful styles.
              </p>
            </div>
          </div>
        </section>

        <section className="agentic-roadmap py-xl">
          <h2 className="text-center mb-lg">Agentic Upgrade Path</h2>
          <p className="text-secondary text-center mb-lg">
            Laura is evolving into a full-spectrum AI companion, blending
            agentic planning, graph orchestration, and cinematic visualization.
          </p>
          <div className="grid grid-3">
            <div className="card">
              <div className="feature-icon cosmic-glow">🧠</div>
              <h3>BabyAGI Task Loop</h3>
              <p className="text-secondary">
                Continuous goal decomposition, prioritization, and execution for
                long-running missions.
              </p>
            </div>
            <div className="card">
              <div className="feature-icon cosmic-glow">🧰</div>
              <h3>LangChain Tooling</h3>
              <p className="text-secondary">
                Unified tool calling, memory, retrieval, and prompt
                orchestration for multi-modal reasoning.
              </p>
            </div>
            <div className="card">
              <div className="feature-icon cosmic-glow">🕸️</div>
              <h3>LangGraph Control</h3>
              <p className="text-secondary">
                State-aware agent graphs with checkpoints, retries, and
                deterministic paths.
              </p>
            </div>
            <div className="card">
              <div className="feature-icon cosmic-glow">🤖</div>
              <h3>Auto-GPT Autonomy</h3>
              <p className="text-secondary">
                Autonomous goal execution with self-reflection and
                safety-aligned guardrails.
              </p>
            </div>
            <div className="card">
              <div className="feature-icon cosmic-glow">🛰️</div>
              <h3>Mermaid Telemetry</h3>
              <p className="text-secondary">
                Live visual blueprints of agent flows, data lineage, and
                decision paths.
              </p>
            </div>
            <div className="card">
              <div className="feature-icon cosmic-glow">📡</div>
              <h3>Streamlit Ops Studio</h3>
              <p className="text-secondary">
                Interactive dashboards for operator oversight, metrics, and
                scenario testing.
              </p>
            </div>
          </div>
        </section>

        <section className="py-xl">
          <div className="card text-center">
            <h2>First-run checklist</h2>
            <p className="text-secondary mb-lg">
              Launch quickly with sensible defaults, then personalize the cosmic
              experience.
            </p>
            <div className="grid grid-3">
              <div>
                <h3>1. Start the app</h3>
                <p className="text-secondary">
                  Run <strong>npm run dev</strong> to open the local experience.
                </p>
              </div>
              <div>
                <h3>2. Configure contact</h3>
                <p className="text-secondary">
                  {contactEndpoint
                    ? 'Contact delivery is connected.'
                    : 'Add VITE_CONTACT_ENDPOINT to enable form delivery.'}
                </p>
              </div>
              <div>
                <h3>3. Activate chat</h3>
                <p className="text-secondary">
                  {chatEndpoint
                    ? 'Chat is connected to your LLM endpoint.'
                    : 'Add VITE_CHAT_ENDPOINT to enable the chat experience.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta py-xl">
          <div className="card cta-card text-center">
            <h2>Ready to Start Your Journey?</h2>
            <p className="text-secondary mb-lg">
              Explore the cosmic dream with Laura and discover endless
              possibilities.
            </p>
            <Link to="/chat" className="btn btn-primary">
              Start Chatting
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
