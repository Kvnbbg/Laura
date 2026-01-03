import { Link } from 'react-router-dom';
import { getConfig } from '../config/env';
import './Home.scss';

const Home = () => {
  const { contactEndpoint } = getConfig();

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
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Environment variables (simulated; in real app, use process.env)
const APP_NAME = process.env.VITE_APP_NAME || 'Laura AI';
const CONTACT_ENDPOINT = process.env.VITE_CONTACT_ENDPOINT || '';
const CONTACT_TIMEOUT_MS = parseInt(process.env.VITE_CONTACT_TIMEOUT_MS || '5000', 10);

// Utility: Logger
const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
};

// Service: Contact Form
async function submitContactForm(data: { name: string; email: string; message: string }) {
  if (!CONTACT_ENDPOINT) {
    logger.info('Contact form simulation mode');
    return { success: true, message: 'Form submitted (simulated)' };
  }
  try {
    const response = await fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(CONTACT_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (err) {
    logger.error(err.message);
    throw err;
  }
}

// Component: Layout
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  
    
      
        Home | About | Contact
      
    
    
{children}
    
{APP_NAME} © 2026
  
);

// Component: Error Boundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(`Error: ${error.message}`);
  }

  render() {
    return this.state.hasError ? 
Something went wrong.
 : this.props.children;
  }
}

// Page: Home
const Home: React.FC = () => (
  
    
Welcome to Laura's AI Float Cosmic Dream
    
Explore the cosmic persona of Laura, an AI companion.
    
      Try Laura on Instagram AI Studio
    
  
);

// Page: About
const About: React.FC = () => (
  
    
About Laura
    
Laura is a professional AI with a cosmic dream theme, built for engaging user experiences.
  
);

// Page: Contact
const Contact: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  const handleChange = (e: React.ChangeEvent) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Submitting...');
    try {
      const result = await submitContactForm(formData);
      setStatus(result.message || 'Success!');
    } catch (err) {
      setStatus('Error submitting form.');
    }
  };

  return (
    
      
Contact Us
      
        {formData.name}
        
                <button type="submit">Submit</button>
      </form>
      <p>{status}</p>
    </div>
  );
};

// Page: NotFound
const NotFound: React.FC = () => (
  <div>
    <h1>404 - Page Not Found</h1>
    <p>Sorry, the page you are looking for does not exist.</p>
  </div>
);

// Main App
const App: React.FC = () => (
  <ErrorBoundary>
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  </ErrorBoundary>
);

export default App;
</code></pre>
</body></html>

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
                <h3>3. Explore the UI</h3>
                <p className="text-secondary">
                  Review the About + Contact pages for content and styling.
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
            <Link to="/contact" className="btn btn-primary">
              Start Now
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
