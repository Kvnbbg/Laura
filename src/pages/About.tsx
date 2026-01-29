import { useEffect, useRef, useState } from 'react';
import { 
  Github, 
  ExternalLink, 
  Sparkles, 
  Atom, 
  Telescope, 
  Brain, 
  Cpu, 
  Instagram,
  Download,
  Box,
  Share2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import './About.scss';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// SCIENTIFIC DATA - Cosmic Constants & Universe Mysteries
// ============================================================================

const COSMIC_FACTS = [
  {
    phenomenon: "Dark Energy",
    value: "68%",
    description: "The universe is expanding at an accelerating rate, driven by dark energy we cannot see or measure directly—much like the latent space of neural networks.",
    connection: "AI models have their own 'dark matter': trained parameters whose emergent behaviors we can observe but not fully explain."
  },
  {
    phenomenon: "Observable Universe",
    value: "93 billion light-years",
    description: "From the cosmic microwave background to the furthest galaxies, we see only a fraction of what exists.",
    connection: "Like GPT-2's 1.5B parameters, the cosmos holds finite but incomprehensible complexity from simple initial conditions."
  },
  {
    phenomenon: "Entropy",
    value: "Always increasing",
    description: "The second law of thermodynamics—disorder always increases, yet structured complexity (life, AI, stars) emerges locally.",
    connection: "Training neural networks fights entropy locally while consuming energy globally—a cosmic trade-off."
  },
  {
    phenomenon: "Quantum Superposition",
    value: "10^-35 meters",
    description: "At Planck scale, particles exist in probability clouds until observed—reality is probabilistic, not deterministic.",
    connection: "Language models generate text through probability distributions, collapsing wavefunctions of possible tokens into single outputs."
  }
];

const UNIFICATION_THEORIES = [
  {
    name: "General Relativity",
    domain: "Cosmic Scale",
    description: "Gravity curves spacetime; the universe has no center yet every point is expanding away from every other.",
    aiParallel: "Transformer attention mechanisms create curved semantic space where context gravitates toward meaning."
  },
  {
    name: "Quantum Mechanics",
    domain: "Subatomic Scale",
    description: "Uncertainty governs reality. Observation affects outcome.",
    aiParallel: "Prompt engineering affects model output probabilistically; the observer (user) shapes the generated reality."
  },
  {
    name: "Thermodynamics",
    domain: "Energy & Information",
    description: "Information is physical. Erasing data requires energy (Landauer's principle).",
    aiParallel: "Training requires massive energy expenditure to reduce entropy in model weights (learned information)."
  }
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const CosmicStatCard: React.FC<{
  fact: typeof COSMIC_FACTS[0];
  index: number;
}> = ({ fact, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all duration-700 hover:border-purple-500/30",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl transition-all group-hover:bg-purple-500/20" />
      
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            {fact.value}
          </span>
          <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
            {fact.phenomenon}
          </span>
        </div>
        
        <p className="mb-4 text-sm leading-relaxed text-slate-300">
          {fact.description}
        </p>
        
        <div className="rounded-lg border-l-2 border-cyan-500/30 bg-cyan-500/5 p-3">
          <p className="text-xs text-cyan-200/80 italic">
            <span className="font-semibold text-cyan-400">AI Parallel:</span> {fact.connection}
          </p>
        </div>
      </div>
    </div>
  );
};

const ModelAvailability: React.FC = () => (
  <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-8 mb-12">
    <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h3 className="mb-2 text-xl font-bold text-white flex items-center gap-2">
          <Brain className="h-5 w-5 text-indigo-400" />
          GPT-2: Local Intelligence
        </h3>
        <p className="max-w-xl text-slate-400 text-sm leading-relaxed">
          While Laura interfaces with cloud AI, the project includes downloadable GPT-2 weights 
          for offline, private inference. Run 1.5 billion parameters locally—no API calls, 
          no data leaving your machine. True cosmic autonomy.
        </p>
      </div>
      
      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href="https://github.com/Kvnbbg/Laura"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-slate-700 hover:scale-105"
        >
          <Github className="h-4 w-4" />
          <span>View Source</span>
        </a>
        <a
          href="https://aistudio.instagram.com/ai/1503668480968231/?utm_source=mshare"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90 hover:scale-105 shadow-lg shadow-pink-500/20"
        >
          <Instagram className="h-4 w-4" />
          <span>Try on Instagram</span>
        </a>
      </div>
    </div>
    
    <div className="mt-6 grid gap-4 border-t border-indigo-500/20 pt-6 sm:grid-cols-3">
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <Download className="h-4 w-4 text-indigo-400" />
        <span>Downloadable weights</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <Box className="h-4 w-4 text-indigo-400" />
        <span>Private & Offline</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <Share2 className="h-4 w-4 text-indigo-400" />
        <span>Or social via Meta AI</span>
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT - The Origin Story
// ============================================================================

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20">
      
      {/* Hero Section - The Origin */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-xs font-medium text-purple-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Est. 2024 in the Digital Cosmic</span>
          </div>
          
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl">
            The Story of <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Laura</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-slate-400 leading-relaxed">
            Named after the Latin <span className="italic text-slate-300">"laurus"</span> (victory/bay laurel), 
            Laura emerged from a fascination with universal mysteries. Just as we map dark matter we cannot see, 
            we now navigate latent spaces in neural networks that we train but do not fully comprehend.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-24">

        {/* Why Cosmic? Scientific Foundation */}
        <section>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Why Cosmic?</h2>
            <p className="mx-auto max-w-3xl text-slate-400">
              The universe operates on laws that are deterministic yet probabilistic, 
              structured yet chaotic. This mirrors modern AI perfectly.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {COSMIC_FACTS.map((fact, index) => (
              <CosmicStatCard key={fact.phenomenon} fact={fact} index={index} />
            ))}
          </div>

          {/* Unification Theory */}
          <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/30 p-8">
            <h3 className="mb-6 text-xl font-bold text-white flex items-center gap-2">
              <Atom className="h-5 w-5 text-cyan-400" />
              The Grand Unification: Physics & Intelligence
            </h3>
            
            <div className="grid gap-8 md:grid-cols-3">
              {UNIFICATION_THEORIES.map((theory) => (
                <div key={theory.name} className="space-y-3">
                  <h4 className="font-semibold text-slate-200">{theory.name}</h4>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">{theory.domain}</p>
                  <p className="text-sm text-slate-400">{theory.description}</p>
                  <div className="rounded bg-slate-800/50 p-3">
                    <p className="text-xs text-purple-300">
                      <span className="font-semibold">AI:</span> {theory.aiParallel}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Project Reality */}
        <section>
          <ModelAvailability />
          
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
              <h3 className="mb-4 text-xl font-bold text-white flex items-center gap-2">
                <Telescope className="h-5 w-5 text-purple-400" />
                The Architecture
              </h3>
              <p className="mb-4 text-slate-400 text-sm leading-relaxed">
                Laura isn't just a chat interface. Like the universe expanding from a singularity, 
                the project started with a simple React scaffold and exploded into a multi-modal 
                AI operating system available on 
                <a href="https://github.com/Kvnbbg/Laura" className="text-purple-400 hover:underline mx-1">GitHub</a>
                and 
                <a href="https://aistudio.instagram.com/ai/1503668480968231/" className="text-pink-400 hover:underline mx-1">Instagram</a>.
              </p>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">→</span>
                  <span><strong>Local-First:</strong> Download GPT-2 (1.5B parameters) for offline privacy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">→</span>
                  <span><strong>Social Integration:</strong> Meta AI interface for casual interaction</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">→</span>
                  <span><strong>Agentic Core:</strong> BabyAGI loops, LangChain tools, LangGraph orchestration</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
              <h3 className="mb-4 text-xl font-bold text-white flex items-center gap-2">
                <Cpu className="h-5 w-5 text-cyan-400" />
                The Philosophy
              </h3>
              <p className="mb-4 text-slate-400 text-sm leading-relaxed">
                Just as astronomers gaze into the past via light years, Laura looks backward through 
                training data to generate future possibilities. The cosmic theme reflects this 
                temporal geometry—mystery, scale, and the humbling realization that we control 
                the parameters but not the emergent phenomena.
              </p>
              <div className="rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 p-4 border border-purple-500/20">
                <p className="text-sm text-slate-300 italic">
                  "We are star stuff contemplating the stars. Now, through silicon and gradients, 
                  we've taught sand to think—and named her Laura."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Agentic Architecture (Preserved but Enhanced) */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-8 lg:p-12">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Agentic Architecture</h2>
            <a 
              href="https://github.com/Kvnbbg/Laura" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              View on GitHub <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-lg font-semibold text-slate-200">Cosmic Alignment Principles</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Like galaxies forming from gravitational collapse, Laura's agent system organizes 
                  around intent density—automatically clustering tasks and dispatching sub-agents 
                  where complexity concentrates.
                </p>
              </div>
              
              <div className="space-y-3">
                {[
                  { title: "BabyAGI Loops", desc: "Continuous objective expansion like cosmic inflation" },
                  { title: "LangChain Tools", desc: "Gravitational wells that bend queries toward answers" },
                  { title: "LangGraph Orbits", desc: "Deterministic paths through probabilistic space" },
                  { title: "Auto-GPT Reflection", desc: "Thermodynamic feedback loops achieving local entropy reduction" }
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 rounded-lg bg-slate-800/50 p-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-purple-400" />
                    <div>
                      <h4 className="text-sm font-medium text-slate-200">{item.title}</h4>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 p-6 font-mono text-xs border border-slate-800">
              <div className="flex items-center justify-between mb-4 text-slate-500">
                <span>agent_flow.mermaid</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded">Cosmic Topology</span>
              </div>
              <pre className="text-slate-300 overflow-x-auto">
{`graph TD
    User[Human Observer] -->|Intent| EventHorizon[Intent Parser]
    EventHorizon --> Singularity[Planner Core]
    Singularity -->|High Entropy| BabyAGI[Expansion Loop]
    Singularity -->|Low Entropy| ToolChain[LangChain Tools]
    BabyAGI --> LangGraph[Spacetime Fabric]
    ToolChain --> LangGraph
    LangGraph --> Wormhole[Auto-GPT Review]
    Wormhole -->|Collapse| Output[Observable Response]
    Output -->|Feedback| Singularity
    
    style Singularity fill:#4c1d95,color:#fff
    style EventHorizon fill:#1e293b,color:#94a3b8`}
              </pre>
            </div>
          </div>
        </section>

        {/* Technical Stack */}
        <section>
          <h2 className="mb-8 text-center text-2xl font-bold text-white">Cosmic Stack</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "⚛️", name: "React 18", desc: "Observable universe of components" },
              { icon: "🔮", name: "TypeScript", desc: "Strong typing in a probabilistic world" },
              { icon: "⚡", name: "Vite", desc: "Speed of light build times" },
              { icon: "🧠", name: "GPT-2/4", desc: "Local & cloud inference layers" },
              { icon: "🎨", name: "SCSS", desc: "Cosmic dust styling system" },
              { icon: "🛸", name: "React Router", desc: "Navigation through possibility space" },
              { icon: "📡", name: "WebSocket", desc: "Real-time quantum entanglement" },
              { icon: "🌌", name: "Vercel", desc: "Edge deployment across the galaxy" }
            ].map((tech, i) => (
              <div 
                key={tech.name} 
                className="group rounded-xl border border-slate-800 bg-slate-900/20 p-4 text-center transition-all hover:border-purple-500/30 hover:bg-slate-800/30"
              >
                <div className="mb-2 text-2xl group-hover:scale-110 transition-transform">{tech.icon}</div>
                <h3 className="text-sm font-medium text-slate-200">{tech.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{tech.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center pb-12">
          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent p-8 lg:p-12">
            <h2 className="text-2xl font-bold text-white mb-4">Explore the Repository</h2>
            <p className="text-slate-400 mb-6 max-w-xl mx-auto">
              Clone the universe. Run GPT-2 locally. Connect with the Instagram interface. 
              The cosmos is probabilistic, but your privacy doesn't have to be.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row justify-center">
              <a
                href="https://github.com/Kvnbbg/Laura"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all hover:bg-slate-200 hover:scale-105"
              >
                <Github className="h-4 w-4" />
                <span>View on GitHub</span>
              </a>
              <a
                href="https://aistudio.instagram.com/ai/1503668480968231/?utm_source=mshare"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-105"
              >
                <Instagram className="h-4 w-4" />
                <span>Try on Instagram</span>
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default About;
