import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getConfig } from '../config/env';
import './Home.scss';

// ============================================================================
// INTERFACES (SOLID: Dependency Inversion + Interface Segregation)
// ============================================================================

interface BaseCard {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

interface Metric {
  label: string;
  value: string;
}

interface ExperienceMode {
  id: string;
  label: string;
  summary: string;
  metrics: Metric[];
  actions: string[];
}

interface CardSection<T extends BaseCard> {
  id: string;
  title: string;
  description: string;
  cards: T[];
  cta?: {
    label: string;
    to: string;
  };
}

interface ChecklistStep {
  id: string;
  title: string;
  description: string | ((config: ReturnType<typeof getConfig>) => string);
}

// ============================================================================
// CUSTOM HOOKS (DRY: Reusable Logic, SOLID: Single Responsibility)
// ============================================================================

const useAnimatedDelay = (baseDelay: number = 0.08) => {
  return useCallback(
    (index: number): React.CSSProperties => ({
      '--delay': `${index * baseDelay}s`,
      animationDelay: `${index * baseDelay}s`,
    }),
    [baseDelay]
  );
};

const useExperienceMode = (modes: ExperienceMode[]) => {
  const [activeId, setActiveId] = useState<string>(modes[0]?.id ?? '');
  
  const activeMode = useMemo(
    () => modes.find((m) => m.id === activeId) ?? modes[0],
    [modes, activeId]
  );

  const selectMode = useCallback((id: string) => setActiveId(id), []);

  return { activeId, activeMode, selectMode };
};

// ============================================================================
// SUB-COMPONENTS (SOLID: Single Responsibility/Composition)
// ============================================================================

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => (
  <header className="section-head text-center mb-lg">
    <h2>{title}</h2>
    {subtitle && <p className="text-secondary">{subtitle}</p>}
  </header>
);

const FeatureCard: React.FC<{
  card: BaseCard;
  index: number;
  getDelay: (i: number) => React.CSSProperties;
}> = ({ card, index, getDelay }) => (
  <article
    className="card animated-card h-full flex flex-col"
    style={getDelay(index)}
    aria-labelledby={`card-title-${card.id}`}
  >
    {card.icon && (
      <div className="feature-icon cosmic-glow" aria-hidden="true">
        {card.icon}
      </div>
    )}
    <h3 id={`card-title-${card.id}`}>{card.title}</h3>
    <p className="text-secondary flex-grow">{card.description}</p>
  </article>
);

const MetricDisplay: React.FC<{ metric: Metric }> = ({ metric }) => (
  <div className="metric text-center">
    <span className="metric-value block text-2xl font-bold">{metric.value}</span>
    <span className="text-secondary text-sm">{metric.label}</span>
  </div>
);

const ModeTab: React.FC<{
  mode: ExperienceMode;
  isActive: boolean;
  onSelect: (id: string) => void;
}> = ({ mode, isActive, onSelect }) => (
  <button
    type="button"
    role="tab"
    aria-selected={isActive}
    aria-controls={`panel-${mode.id}`}
    id={`tab-${mode.id}`}
    className={`mode-tab ${isActive ? 'active' : ''}`}
    onClick={() => onSelect(mode.id)}
  >
    {mode.label}
  </button>
);

// ============================================================================
// DATA LAYER (CRUD: Separation of concerns, SOLID: Open/Closed for extensions)
// ============================================================================

const STATIC_DATA = {
  heroHighlights: [
    'Adaptive UI layouts',
    'Smart automation layers',
    'Cosmic-grade theming',
  ],
  
  featureCards: [
    {
      id: 'cosmic-design',
      title: 'Cosmic Design',
      description: 'Experience stunning cosmic-inspired design with smooth gradients and animations.',
      icon: '🌟',
    },
    {
      id: 'lightning-fast',
      title: 'Lightning Fast',
      description: 'Built with React and Vite for blazing-fast performance and instant hot reload.',
      icon: '⚡',
    },
    {
      id: 'scss-powered',
      title: 'SCSS Powered',
      description: 'Fully styled with scss-cosmic-dream for maintainable and beautiful styles.',
      icon: '🎨',
    },
  ] as BaseCart[],

  agenticCapabilities: [
    {
      id: 'babyagi',
      title: 'BabyAGI Task Loop',
      description: 'Continuous goal decomposition, prioritization, and execution for long-running missions.',
      icon: '🧠',
    },
    {
      id: 'langchain-tooling',
      title: 'LangChain Tooling',
      description: 'Unified tool calling, memory, retrieval, and prompt orchestration for multi-modal reasoning.',
      icon: '🧰',
    },
    {
      id: 'langgraph-control',
      title: 'LangGraph Control',
      description: 'State-aware agent graphs with checkpoints, retries, and deterministic paths.',
      icon: '🕸️',
    },
    {
      id: 'auto-gpt',
      title: 'Auto-GPT Autonomy',
      description: 'Autonomous goal execution with self-reflection and safety-aligned guardrails.',
      icon: '🤖',
    },
    {
      id: 'mermaid-telemetry',
      title: 'Mermaid Telemetry',
      description: 'Live visual blueprints of agent flows, data lineage, and decision paths.',
      icon: '🛰️',
    },
    {
      id: 'streamlit-ops',
      title: 'Streamlit Ops Studio',
      description: 'Interactive dashboards for operator oversight, metrics, and scenario testing.',
      icon: '📡',
    },
  ] as BaseCard[],

  crmHighlights: [
    {
      id: 'unified-crm',
      title: 'Unified CRM Workspace',
      description: 'Centralize accounts, contacts, and pipeline intelligence in a single command view.',
      icon: '🧭',
    },
    {
      id: 'ops-dashboards',
      title: 'Operational Dashboards',
      description: 'Monitor pipeline health, task load, and engagement signals with quick filters.',
      icon: '📊',
    },
    {
      id: 'crud-flows',
      title: 'Actionable CRUD Flows',
      description: 'Create, update, and close deals quickly with reusable, consistent components.',
      icon: '✅',
    },
  ] as BaseCard[],

  checklistSteps: [
    {
      id: 'start-app',
      title: '1. Start the app',
      description: () => 'Run npm run dev to open the local experience.',
    },
    {
      id: 'configure-contact',
      title: '2. Configure contact',
      description: (config) => config.contactEndpoint
        ? 'Contact delivery is connected.'
        : 'Add VITE_CONTACT_ENDPOINT to enable form delivery.',
    },
    {
      id: 'activate-chat',
      title: '3. Activate chat',
      description: (config) => config.chatEnabled
        ? 'Chat is enabled and ready to answer with attachments.'
        : 'Set VITE_ENABLE_CHAT=true and add VITE_MISTRAL_API_KEY to enable the chat experience.',
    },
  ] as ChecklistStep[],

  experienceModes: [
    {
      id: 'sales',
      label: 'Sales Velocity',
      summary: 'Auto-prioritize leads, accelerate follow-ups, and keep pipeline momentum.',
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
      summary: 'Maintain response quality with guided playbooks, sentiment signals, and auto-tagging.',
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
      summary: 'Monitor health, automate reports, and keep every team aligned daily.',
      metrics: [
        { label: 'Automation rate', value: '68%' },
        { label: 'Weekly reports', value: 'Auto-ready' },
        { label: 'Process drift', value: 'Low' },
      ],
      actions: ['Generate KPI digest', 'Audit workflows', 'Optimize handoffs'],
    },
  ] as ExperienceMode[],
};

// ============================================================================
// MAIN COMPONENT (Smart, Mobile-First, SOLID)
// ============================================================================

const Home: React.FC = () => {
  const config = useMemo(() => getConfig(), []);
  const getDelay = useAnimatedDelay();
  const { activeId, activeMode, selectMode } = useExperienceMode(STATIC_DATA.experienceModes);

  // CRUD-Ready: Prepared for API integration (currently static)
  const cardSections = useMemo<CardSection<BaseCard>[]>(
    () => [
      {
        id: 'features',
        title: 'Cosmic Features',
        description: 'A curated set of UI, motion, and styling primitives designed for rapid cosmic launches.',
        cards: STATIC_DATA.featureCards,
      },
      {
        id: 'agentic',
        title: 'Agentic Upgrade Path',
        description: 'Laura is evolving into a full-spectrum AI companion, blending agentic planning, graph orchestration, and cinematic visualization.',
        cards: STATIC_DATA.agenticCapabilities,
      },
      {
        id: 'crm',
        title: 'CRM-Ready Experience',
        description: 'A ready-to-deploy experience layer for teams that need clarity, focus, and momentum.',
        cards: STATIC_DATA.crmHighlights,
        cta: { label: 'Explore the CRM Dashboard', to: '/dashboard' },
      },
    ],
    []
  );

  return (
    <div className="home">
      <div className="container px-4 md:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="hero py-16 md:py-24 lg:py-32" aria-labelledby="hero-title">
          <div className="hero-panel max-w-4xl mx-auto text-center md:text-left">
            <span className="hero-badge inline-block mb-4">Cosmic-grade AI Experience</span>
            <h1 id="hero-title" className="hero-title float text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Welcome to Laura
            </h1>
            <p className="hero-subtitle text-lg md:text-xl text-secondary mb-8">
              AI Float Cosmic Dream - Your Professional Cosmic Companion
            </p>
            
            <div className="hero-actions flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-8">
              <Link to="/about" className="btn btn-primary w-full sm:w-auto">
                Learn More
              </Link>
              <Link to="/contact" className="btn btn-secondary w-full sm:w-auto">
                Get in Touch
              </Link>
            </div>

            <ul className="hero-highlights grid grid-cols-1 sm:grid-cols-3 gap-4" role="list">
              {STATIC_DATA.heroHighlights.map((highlight) => (
                <li key={highlight} className="flex items-center gap-2">
                  <span className="cosmic-bullet" aria-hidden="true">✦</span>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Card Sections - Dynamic Rendering (DRY) */}
        {cardSections.map((section) => (
          <section
            key={section.id}
            className={`features py-12 md:py-16 lg:py-24 section-shell ${section.id}-section`}
            aria-labelledby={`section-${section.id}`}
          >
            <SectionHeader
              title={section.title}
              subtitle={section.description}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.cards.map((card, index) => (
                <FeatureCard
                  key={card.id}
                  card={card}
                  index={index}
                  getDelay={getDelay}
                />
              ))}
            </div>

            {section.cta && (
              <div className="text-center mt-8 md:mt-12">
                <Link to={section.cta.to} className="btn btn-secondary inline-block">
                  {section.cta.label}
                </Link>
              </div>
            )}
          </section>
        ))}

        {/* Checklist Section */}
        <section className="py-12 md:py-16" aria-labelledby="checklist-title">
          <div className="card p-6 md:p-8 text-center">
            <h2 id="checklist-title" className="text-2xl md:text-3xl mb-2">First-run checklist</h2>
            <p className="text-secondary mb-8">
              Launch quickly with sensible defaults, then personalize the cosmic experience.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {STATIC_DATA.checklistSteps.map((step, idx) => (
                <article
                  key={step.id}
                  className="checklist-item p-4 rounded-lg border border-opacity-10 border-current"
                  style={getDelay(idx)}
                >
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-secondary text-sm">
                    {typeof step.description === 'function' 
                      ? step.description(config) 
                      : step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Experience Section */}
        <section className="experience py-12 md:py-16" aria-labelledby="experience-title">
          <SectionHeader
            title="Interactive Command Center"
            subtitle="Switch modes to preview how Laura adapts to daily workflows without disrupting your display."
          />

          <div role="tablist" aria-label="Experience modes" className="mode-switch flex flex-wrap justify-center gap-2 mb-6">
            {STATIC_DATA.experienceModes.map((mode) => (
              <ModeTab
                key={mode.id}
                mode={mode}
                isActive={activeId === mode.id}
                onSelect={selectMode}
              />
            ))}
          </div>

          <div
            id={`panel-${activeMode.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeMode.id}`}
            className="card mode-panel animated-card p-6 md:p-8"
          >
            <div className="mode-header flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h3 className="text-xl md:text-2xl font-bold">{activeMode.label}</h3>
              <span className="mode-pill self-start sm:self-auto text-xs uppercase tracking-wide px-3 py-1 rounded-full">
                Live preview
              </span>
            </div>
            
            <p className="text-secondary mb-6">{activeMode.summary}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              {activeMode.metrics.map((metric) => (
                <MetricDisplay key={metric.label} metric={metric} />
              ))}
            </div>
            
            <div className="mode-actions flex flex-wrap gap-2">
              {activeMode.actions.map((action) => (
                <span
                  key={action}
                  className="mode-chip inline-flex items-center px-3 py-1 rounded-full text-sm bg-opacity-10 bg-current"
                >
                  {action}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta py-12 md:py-24" aria-labelledby="cta-title">
          <div className="card cta-card text-center p-8 md:p-12 lg:p-16 max-w-3xl mx-auto">
            <h2 id="cta-title" className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-secondary mb-8 text-lg">
              Explore the cosmic dream with Laura and discover endless possibilities.
            </p>
            <Link to="/chat" className="btn btn-primary text-lg px-8 py-3">
              Start Chatting
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
