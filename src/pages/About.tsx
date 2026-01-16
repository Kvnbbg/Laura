import './About.scss';

const About = () => {
  return (
    <div className="about">
      <div className="container">
        <section className="about-hero">
          <h1>About Laura</h1>
          <p className="lead text-secondary">
            Your AI companion in the cosmic dream universe
          </p>
        </section>

        <section className="about-content py-lg">
          <div className="grid grid-2">
            <div className="card">
              <h2>🌌 Our Vision</h2>
              <p className="text-secondary">
                Laura represents the fusion of artificial intelligence and
                cosmic inspiration. We believe in creating beautiful, functional
                experiences that inspire creativity and innovation.
              </p>
              <p className="text-secondary">
                Our cosmic dream theme reflects the infinite possibilities of
                technology and the beauty of the universe we explore together.
              </p>
            </div>

            <div className="card">
              <h2>💫 Our Mission</h2>
              <p className="text-secondary">
                To provide a professional, elegant platform that showcases the
                power of modern web technologies combined with stunning design
                aesthetics.
              </p>
              <p className="text-secondary">
                We strive to create experiences that are both visually
                captivating and technically excellent.
              </p>
            </div>
          </div>
        </section>

        <section className="agentic-blueprint py-lg">
          <div className="grid grid-2">
            <div className="card">
              <h2>🧭 Agentic Architecture</h2>
              <p className="text-secondary">
                Laura is expanding into a multi-agent system with structured
                reasoning, reliable graph execution, and observability across
                every decision step.
              </p>
              <ul className="text-secondary blueprint-list">
                <li>
                  BabyAGI-inspired planning loop for objective expansion and
                  dynamic reprioritization.
                </li>
                <li>
                  LangChain toolchains for retrieval, memory, and action
                  routing.
                </li>
                <li>
                  LangGraph orchestration for state checkpoints and controlled
                  autonomy.
                </li>
                <li>
                  Auto-GPT-inspired feedback loops for self-critique and
                  quality gating.
                </li>
              </ul>
            </div>
            <div className="card">
              <h2>🗺️ Mermaid Blueprint</h2>
              <p className="text-secondary">
                Visualize the agent flow for explainability and alignment with
                operator goals.
              </p>
              <pre className="blueprint-code">
                <code>{`graph TD
  Intent[User Intent] --> Plan[Planner]
  Plan --> Tools[LangChain Tools]
  Tools --> Graph[LangGraph Orchestrator]
  Graph --> Review[Auto-GPT Review]
  Review --> Output[Laura Response]`}</code>
              </pre>
              <p className="text-secondary">
                Streamlit dashboards keep humans in the loop with live metrics,
                traces, and intervention controls.
              </p>
            </div>
          </div>
        </section>

        <section className="agentic-practices py-lg">
          <div className="grid grid-2">
            <div className="card">
              <h2>📘 Agentic Workflow Practices</h2>
              <p className="text-secondary">
                Our operating rhythm aligns with Anthropic’s guidance for
                dependable agentic coding: keep context durable, enable
                real-time intervention, and parallelize safely.
              </p>
              <ul className="text-secondary practices-list">
                <li>
                  Maintain persistent context with CLAUDE.md playbooks and
                  living project notes.
                </li>
                <li>
                  Support immediate human overrides using the Esc key during
                  live sessions and streamed outputs.
                </li>
                <li>
                  Dispatch focused sub-agents for research, testing, and
                  refactoring in parallel.
                </li>
              </ul>
            </div>
            <div className="card practices-panel">
              <h2>⚙️ Execution Signals</h2>
              <p className="text-secondary">
                These signals keep the system in a stable “ground state” while
                still accelerating delivery.
              </p>
              <div className="signal-grid">
                <div>
                  <h3>Context Preservation</h3>
                  <p className="text-secondary">
                    Canonical documentation, versioned decisions, and reliable
                    handoffs.
                  </p>
                </div>
                <div>
                  <h3>Human-in-the-Loop</h3>
                  <p className="text-secondary">
                    Interruptible workflows, rapid checkpoints, and operator
                    visibility.
                  </p>
                </div>
                <div>
                  <h3>Parallel Execution</h3>
                  <p className="text-secondary">
                    Sub-agents explore solution space while we monitor risk and
                    latency.
                  </p>
                </div>
                <div>
                  <h3>Quality Gates</h3>
                  <p className="text-secondary">
                    Automated checks, reviews, and merged learnings from every
                    run.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="tech-stack py-lg">
          <h2 className="text-center mb-lg">Built With Modern Tech</h2>
          <div className="grid grid-3">
            <div className="card text-center">
              <div className="tech-icon">⚛️</div>
              <h3>React 18</h3>
              <p className="text-secondary">
                Modern React with hooks and functional components
              </p>
            </div>
            <div className="card text-center">
              <div className="tech-icon">🎨</div>
              <h3>SCSS</h3>
              <p className="text-secondary">
                Powerful styling with scss-cosmic-dream theme
              </p>
            </div>
            <div className="card text-center">
              <div className="tech-icon">⚡</div>
              <h3>Vite</h3>
              <p className="text-secondary">
                Lightning-fast build tool and dev server
              </p>
            </div>
            <div className="card text-center">
              <div className="tech-icon">🛣️</div>
              <h3>React Router</h3>
              <p className="text-secondary">Smooth client-side navigation</p>
            </div>
            <div className="card text-center">
              <div className="tech-icon">📘</div>
              <h3>TypeScript</h3>
              <p className="text-secondary">
                Type-safe code for better development
              </p>
            </div>
            <div className="card text-center">
              <div className="tech-icon">🎯</div>
              <h3>Modern CSS</h3>
              <p className="text-secondary">Flexbox, Grid, and animations</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
