import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { getConfig } from '../config/env';
import './Home.scss';

const Home = () => {
  const { contactEndpoint, chatEndpoint } = getConfig();
  const delayStyle = (index: number): CSSProperties =>
    ({
      '--delay': `${index * 0.08}s`,
    }) as CSSProperties;

  const featureCards = [
    {
      title: 'Cosmic Design',
      description:
        'Experience stunning cosmic-inspired design with smooth gradients and animations.',
      icon: '🌟',
    },
    {
      title: 'Lightning Fast',
      description:
        'Built with React and Vite for blazing-fast performance and instant hot reload.',
      icon: '⚡',
    },
    {
      title: 'SCSS Powered',
      description:
        'Fully styled with scss-cosmic-dream for maintainable and beautiful styles.',
      icon: '🎨',
    },
  ];
  const agenticCapabilities = [
    {
      title: 'BabyAGI Task Loop',
      description:
        'Continuous goal decomposition, prioritization, and execution for long-running missions.',
      icon: '🧠',
    },
    {
      title: 'LangChain Tooling',
      description:
        'Unified tool calling, memory, retrieval, and prompt orchestration for multi-modal reasoning.',
      icon: '🧰',
    },
    {
      title: 'LangGraph Control',
      description:
        'State-aware agent graphs with checkpoints, retries, and deterministic paths.',
      icon: '🕸️',
    },
    {
      title: 'Auto-GPT Autonomy',
      description:
        'Autonomous goal execution with self-reflection and safety-aligned guardrails.',
      icon: '🤖',
    },
    {
      title: 'Mermaid Telemetry',
      description:
        'Live visual blueprints of agent flows, data lineage, and decision paths.',
      icon: '🛰️',
    },
    {
      title: 'Streamlit Ops Studio',
      description:
        'Interactive dashboards for operator oversight, metrics, and scenario testing.',
      icon: '📡',
    },
  ];
  const checklistSteps = [
    {
      title: '1. Start the app',
      description: 'Run npm run dev to open the local experience.',
    },
    {
      title: '2. Configure contact',
      description: contactEndpoint
        ? 'Contact delivery is connected.'
        : 'Add VITE_CONTACT_ENDPOINT to enable form delivery.',
    },
    {
      title: '3. Activate chat',
      description: chatEndpoint
        ? 'Chat is connected to your LLM endpoint.'
        : 'Add VITE_CHAT_ENDPOINT to enable the chat experience.',
    },
  ];
  const crmHighlights = [
    {
      title: 'Unified CRM Workspace',
      description:
        'Centralize accounts, contacts, and pipeline intelligence in a single command view.',
      icon: '🧭',
    },
    {
      title: 'Operational Dashboards',
      description:
        'Monitor pipeline health, task load, and engagement signals with quick filters.',
      icon: '📊',
    },
    {
      title: 'Actionable CRUD Flows',
      description:
        'Create, update, and close deals quickly with reusable, consistent components.',
      icon: '✅',
    },
  ];
  const experienceModes = [
    {
      id: 'sales',
      label: 'Sales Velocity',
      summary:
        'Auto-prioritize leads, accelerate follow-ups, and keep pipeline momentum.',
      metrics: [
        { label: 'Lead velocity', value: '+32%' },
        { label: 'Follow-up SLA', value: '2 hours' },
        { label: 'Win signals', value: 'Realtime' },
      ],
      actions: ['Trigger follow-up sequences', 'Draft deal notes', 'Sync calendar'],
    },
    {
      id: 'service',
      label: 'Service Assurance',
      summary:
        'Maintain response quality with guided playbooks, sentiment signals, and auto-tagging.',
      metrics: [
        { label: 'CSAT trend', value: '+14%' },
        { label: 'Escalations', value: '-22%' },
        { label: 'Resolution time', value: 'Same day' },
      ],
      actions: ['Deploy service macros', 'Surface risks', 'Recommend next steps'],
    },
    {
      id: 'ops',
      label: 'Ops Control',
      summary:
        'Monitor health, automate reports, and keep every team aligned daily.',
      metrics: [
        { label: 'Automation rate', value: '68%' },
        { label: 'Weekly reports', value: 'Auto-ready' },
        { label: 'Process drift', value: 'Low' },
      ],
      actions: ['Generate KPI digest', 'Audit workflows', 'Optimize handoffs'],
    },
  ];
  const [activeModeId, setActiveModeId] = useState(experienceModes[0].id);
  const activeMode =
    experienceModes.find((mode) => mode.id === activeModeId) ?? experienceModes[0];

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
            {featureCards.map((feature, index) => (
              <div
                key={feature.title}
                className="card animated-card"
                style={delayStyle(index)}
              >
                <div className="feature-icon cosmic-glow">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p className="text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="agentic-roadmap py-xl">
          <h2 className="text-center mb-lg">Agentic Upgrade Path</h2>
          <p className="text-secondary text-center mb-lg">
            Laura is evolving into a full-spectrum AI companion, blending
            agentic planning, graph orchestration, and cinematic visualization.
          </p>
          <div className="grid grid-3">
            {agenticCapabilities.map((capability, index) => (
              <div
                key={capability.title}
                className="card animated-card"
                style={delayStyle(index)}
              >
                <div className="feature-icon cosmic-glow">{capability.icon}</div>
                <h3>{capability.title}</h3>
                <p className="text-secondary">{capability.description}</p>
              </div>
            ))}
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
              {checklistSteps.map((step) => (
                <div key={step.title} className="checklist-item">
                  <h3>{step.title}</h3>
                  <p className="text-secondary">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="experience py-xl">
          <div className="text-center mb-lg">
            <h2>Interactive Command Center</h2>
            <p className="text-secondary">
              Switch modes to preview how Laura adapts to daily workflows without
              disrupting your display.
            </p>
          </div>
          <div className="mode-switch">
            {experienceModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`mode-tab ${activeModeId === mode.id ? 'active' : ''}`}
                onClick={() => setActiveModeId(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <div className="card mode-panel animated-card">
            <div className="mode-header">
              <h3>{activeMode.label}</h3>
              <span className="mode-pill">Live preview</span>
            </div>
            <p className="text-secondary">{activeMode.summary}</p>
            <div className="grid grid-3 mode-metrics">
              {activeMode.metrics.map((metric) => (
                <div key={metric.label} className="metric">
                  <span className="metric-value">{metric.value}</span>
                  <span className="text-secondary">{metric.label}</span>
                </div>
              ))}
            </div>
            <div className="mode-actions">
              {activeMode.actions.map((action) => (
                <span key={action} className="mode-chip">
                  {action}
                </span>
              ))}
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

        <section className="features py-xl">
          <h2 className="text-center mb-lg">CRM-Ready Experience</h2>
          <div className="grid grid-3">
            {crmHighlights.map((highlight, index) => (
              <div
                key={highlight.title}
                className="card animated-card"
                style={delayStyle(index)}
              >
                <div className="feature-icon cosmic-glow">{highlight.icon}</div>
                <h3>{highlight.title}</h3>
                <p className="text-secondary">{highlight.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-lg">
            <Link to="/dashboard" className="btn btn-secondary">
              Explore the CRM Dashboard
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
