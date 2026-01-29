import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Brain, 
  BookOpen, 
  Thermometer, 
  Target, 
  Zap, 
  MessageSquare, 
  GitBranch, 
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Settings2,
  ChevronDown,
  ChevronRight,
  Database,
  Cpu,
  BarChart3,
  Layers
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ChatWidget from '../components/ChatWidget';
import './Chat.scss';

// Utility
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// TYPES - Probabilistic vs Deterministic Mental Model
// ============================================================================

type ReasoningMode = 'fast' | 'balanced' | 'deep'; // DeepSeek R1 style
type AccuracyProfile = 'precise' | 'balanced' | 'creative';
type TaskDomain = 'general' | 'code' | 'analysis' | 'research' | 'creative';

interface RAGSource {
  id: string;
  title: string;
  relevance: number; // 0-1 probabilistic relevance score
  chunk: string;
  metadata: {
    source: string;
    timestamp: Date;
    confidence: number;
  };
}

interface ReasoningStep {
  id: string;
  step: number;
  thought: string;
  confidence: number;
  type: 'deduction' | 'retrieval' | 'calculation' | ' speculation';
  timestamp: Date;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'thinking';
  content: string;
  reasoning?: ReasoningStep[];
  sources?: RAGSource[];
  probabilities?: {
    topAnswer: number;
    alternatives: { text: string; prob: number }[];
  };
  latency?: number;
  tokensUsed?: { input: number; output: number };
}

interface ModelConfig {
  reasoningMode: ReasoningMode;
  temperature: number; // 0-2 (probabilistic sampling)
  topP: number; // Nucleus sampling
  presencePenalty: number;
  contextWindow: number; // Token limit
  ragEnabled: boolean;
  showThinking: boolean;
  accuracyProfile: AccuracyProfile;
}

// ============================================================================
// COMPONENTS - AI Capability Demonstrators
// ============================================================================

const ProbabilityMeter: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="w-16 text-slate-400">{label}</span>
    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div 
        className={cn(
          "h-full rounded-full transition-all duration-500",
          value > 0.8 ? "bg-emerald-400" : value > 0.5 ? "bg-amber-400" : "bg-rose-400"
        )}
        style={{ width: `${value * 100}%` }}
      />
    </div>
    <span className="w-10 text-right text-slate-300">{Math.round(value * 100)}%</span>
  </div>
);

const ReasoningChain: React.FC<{ steps: ReasoningStep[]; isVisible: boolean }> = ({ 
  steps, 
  isVisible 
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="mb-4 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-xs font-medium text-indigo-300 hover:text-indigo-200"
      >
        <span className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5" />
          Chain-of-Thought Reasoning ({steps.length} steps)
        </span>
        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      
      {expanded && (
        <div className="mt-3 space-y-2 border-t border-indigo-500/10 pt-3">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex gap-3 text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                {step.step}
              </span>
              <div className="flex-1">
                <p className="text-slate-300 leading-relaxed">{step.thought}</p>
                <div className="mt-1 flex items-center gap-3">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider",
                    step.type === 'deduction' && "bg-blue-500/10 text-blue-400",
                    step.type === 'retrieval' && "bg-purple-500/10 text-purple-400",
                    step.type === 'calculation' && "bg-emerald-500/10 text-emerald-400",
                    step.type === 'speculation' && "bg-amber-500/10 text-amber-400",
                  )}>
                    {step.type}
                  </span>
                  <ProbabilityMeter value={step.confidence} label="Certainty" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RAGContextPanel: React.FC<{ sources: RAGSource[] }> = ({ sources }) => (
  <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 mb-4">
    <div className="flex items-center gap-2 mb-3 text-xs font-medium text-purple-300 uppercase tracking-wider">
      <Database className="h-3.5 w-3.5" />
      Retrieved Context ({sources.length} sources)
    </div>
    <div className="space-y-2">
      {sources.map((source) => (
        <div 
          key={source.id} 
          className="group relative rounded border border-slate-800 bg-slate-900/50 p-2.5 hover:border-purple-500/30 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-200 truncate max-w-[200px]">
              {source.title}
            </span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full",
              source.relevance > 0.8 ? "bg-emerald-500/20 text-emerald-400" : 
              source.relevance > 0.5 ? "bg-amber-500/20 text-amber-400" : "bg-slate-700 text-slate-400"
            )}>
              {Math.round(source.relevance * 100)}% match
            </span>
          </div>
          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
            {source.chunk}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-600">
            <span>{source.metadata.source}</span>
            <span>•</span>
            <span>{source.metadata.timestamp.toLocaleTimeString()}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ModelControls: React.FC<{
  config: ModelConfig;
  onChange: (config: ModelConfig) => void;
}> = ({ config, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Model Configuration</h3>
            <p className="text-xs text-slate-400">
              {config.reasoningMode === 'deep' ? 'DeepSeek R1 Mode' : 
               config.reasoningMode === 'balanced' ? 'Qwen 3 Thinking' : 'Fast GPT-4o'}
              {' • '}
              Temp: {config.temperature}
            </p>
          </div>
        </div>
        <Settings2 className={cn("h-4 w-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="border-t border-slate-800 p-4 space-y-4">
          {/* Reasoning Depth - The "Thinking" Capability */}
          <div>
            <label className="mb-2 flex items-center justify-between text-xs font-medium text-slate-300">
              <span className="flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-indigo-400" />
                Reasoning Depth
              </span>
              <span className="text-indigo-400">{config.reasoningMode}</span>
            </label>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-800 p-1">
              {(['fast', 'balanced', 'deep'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onChange({ ...config, reasoningMode: mode })}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                    config.reasoningMode === mode
                      ? "bg-purple-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {mode === 'fast' && 'Quick'}
                  {mode === 'balanced' && 'Think'}
                  {mode === 'deep' && 'Deep'}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              {config.reasoningMode === 'deep' 
                ? "Multi-step reasoning with self-correction (slower, more accurate)" 
                : config.reasoningMode === 'balanced'
                ? "Moderate reasoning with context awareness"
                : "Direct response, deterministic output"}
            </p>
          </div>

          {/* Probabilistic Controls */}
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Thermometer className="h-3 w-3" />
                  Temperature (Randomness)
                </span>
                <span className="text-slate-200 font-mono">{config.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature}
                onChange={(e) => onChange({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Deterministic</span>
                <span>Creative</span>
                <span>Chaotic</span>
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Target className="h-3 w-3" />
                  Top-p (Nucleus Sampling)
                </span>
                <span className="text-slate-200 font-mono">{config.topP}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={config.topP}
                onChange={(e) => onChange({ ...config, topP: parseFloat(e.target.value) })}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>

          {/* Accuracy Profile */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-300">
              Accuracy Profile
            </label>
            <select
              value={config.accuracyProfile}
              onChange={(e) => onChange({ ...config, accuracyProfile: e.target.value as AccuracyProfile })}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
            >
              <option value="precise">Precise (High accuracy, low hallucination)</option>
              <option value="balanced">Balanced (Standard instruction following)</option>
              <option value="creative">Creative (Novel solutions, higher variance)</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-slate-300 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-purple-400" />
                Enable RAG Retrieval
              </span>
              <input
                type="checkbox"
                checked={config.ragEnabled}
                onChange={(e) => onChange({ ...config, ragEnabled: e.target.checked })}
                className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-slate-300 flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5 text-indigo-400" />
                Show Thinking Process
              </span>
              <input
                type="checkbox"
                checked={config.showThinking}
                onChange={(e) => onChange({ ...config, showThinking: e.target.checked })}
                className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

const CapabilityCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  deterministic: boolean;
}> = ({ icon, title, description, deterministic }) => (
  <div className={cn(
    "relative overflow-hidden rounded-xl border p-4 transition-all hover:scale-[1.02]",
    deterministic 
      ? "border-slate-700 bg-slate-800/30" 
      : "border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-indigo-500/5"
  )}>
    <div className="flex items-start gap-3">
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
        deterministic ? "bg-slate-700 text-slate-400" : "bg-purple-500/20 text-purple-400"
      )}>
        {icon}
      </div>
      <div>
        <h4 className={cn(
          "text-sm font-medium",
          deterministic ? "text-slate-300" : "text-white"
        )}>{title}</h4>
        <p className="mt-1 text-xs text-slate-400 leading-relaxed">{description}</p>
        <div className="mt-2 flex items-center gap-1.5">
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium",
            deterministic 
              ? "bg-slate-700 text-slate-400" 
              : "bg-purple-500/20 text-purple-300"
          )}>
            {deterministic ? 'Deterministic' : 'Probabilistic'}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT - AI Control Center
// ============================================================================

const Chat: React.FC = () => {
  const [config, setConfig] = useState<ModelConfig>({
    reasoningMode: 'balanced',
    temperature: 0.7,
    topP: 0.9,
    presencePenalty: 0,
    contextWindow: 4096,
    ragEnabled: true,
    showThinking: true,
    accuracyProfile: 'balanced',
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulate a reasoning response (DeepSeek/Qwen style)
  const simulateThinkingResponse = useCallback(async (userMessage: string) => {
    setIsProcessing(true);
    
    // Simulate reasoning delay based on mode
    const delay = config.reasoningMode === 'deep' ? 3000 : config.reasoningMode === 'balanced' ? 1500 : 500;
    
    // Simulate chain-of-thought
    const reasoningSteps: ReasoningStep[] = config.showThinking ? [
      {
        id: '1',
        step: 1,
        thought: 'Analyzing user intent and query classification...',
        confidence: 0.95,
        type: 'deduction',
        timestamp: new Date(),
      },
      {
        id: '2',
        step: 2,
        thought: config.ragEnabled ? 'Retrieving relevant context from knowledge base...' : 'Consulting internal knowledge...',
        confidence: 0.88,
        type: 'retrieval',
        timestamp: new Date(),
      },
      {
        id: '3',
        step: 3,
        thought: 'Evaluating multiple solution paths and ranking by probability...',
        confidence: config.accuracyProfile === 'precise' ? 0.92 : 0.75,
        type: 'calculation',
        timestamp: new Date(),
      },
    ] : undefined;

    await new Promise(resolve => setTimeout(resolve, delay));

    const response: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'assistant',
      content: config.reasoningMode === 'deep'
        ? `**Analysis**: Based on multi-step reasoning with ${config.temperature > 1 ? 'exploratory' : 'focused'} sampling (temp: ${config.temperature})...\n\nYour query involves complex contextual understanding. With RAG ${config.ragEnabled ? 'enabled' : 'disabled'}, I'm leveraging ${config.ragEnabled ? 'retrieved documents' : 'parametric knowledge'} to minimize hallucination.\n\n**Confidence**: ${config.accuracyProfile === 'precise' ? 'High precision mode engaged' : 'Balanced accuracy/creativity trade-off'}.`
        : "Quick response mode: Direct answer generated with minimal reasoning overhead.",
      reasoning: reasoningSteps,
      sources: config.ragEnabled ? [
        {
          id: '1',
          title: 'Technical Documentation v2.4',
          relevance: 0.94,
          chunk: 'Relevant section discussing probabilistic model behaviors and temperature settings...',
          metadata: { source: 'docs', timestamp: new Date(), confidence: 0.96 },
        },
        {
          id: '2',
          title: 'Research Paper: Chain-of-Thought',
          relevance: 0.82,
          chunk: 'Studies show significant accuracy improvements when reasoning is explicit...',
          metadata: { source: 'arxiv', timestamp: new Date(), confidence: 0.89 },
        },
      ] : undefined,
      probabilities: {
        topAnswer: 0.87,
        alternatives: [
          { text: "Alternative interpretation...", prob: 0.08 },
          { text: "Edge case handling...", prob: 0.05 },
        ],
      },
      latency: delay,
      tokensUsed: { input: userMessage.length, output: 150 },
    };

    setMessages(prev => [...prev, response]);
    setIsProcessing(false);
  }, [config]);

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header - Mental Model Shift Explanation */}
        <header className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-purple-400" />
                Laura AI Control Center
              </h1>
              <p className="mt-2 text-slate-400 max-w-2xl">
                Experience the shift from deterministic software to <span className="text-purple-400 font-medium">probabilistic intelligence</span>. 
                Leverage DeepSeek reasoning, Qwen 3 accuracy, and GPT-4o capabilities with full transparency.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Model: {config.reasoningMode === 'deep' ? 'DeepSeek-R1' : config.reasoningMode === 'balanced' ? 'Qwen3-72B' : 'GPT-4o'}
              {' • '}
              Context: {config.contextWindow} tokens
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Left: Model Configuration & Capabilities */}
          <div className="space-y-6">
            <ModelControls config={config} onChange={setConfig} />
            
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Capability Matrix
              </h3>
              <CapabilityCard
                icon={<Brain className="h-4 w-4" />}
                title="Chain-of-Thought Reasoning"
                description="Explicit step-by-step thinking process with confidence scoring at each step."
                deterministic={false}
              />
              <CapabilityCard
                icon={<Database className="h-4 w-4" />}
                title="RAG Retrieval"
                description="Grounds responses in retrieved documents with relevance probabilities."
                deterministic={false}
              />
              <CapabilityCard
                icon={<BarChart3 className="h-4 w-4" />}
                title="Uncertainty Quantification"
                description="Top-p sampling and confidence intervals for transparent reliability."
                deterministic={false}
              />
              <CapabilityCard
                icon={<Layers className="h-4 w-4" />}
                title="Context Window Management"
                description="Deterministic token counting and attention mechanisms."
                deterministic={true}
              />
            </div>

            {/* Instagram Meta AI Link */}
            <a 
              href="https://aistudio.instagram.com/ai/1503668480968231/?utm_source=mshare"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-pink-500/20 bg-gradient-to-r from-pink-500/10 to-purple-500/10 p-4 hover:border-pink-500/40 transition-all group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white group-hover:text-pink-200 transition-colors">
                  Try Meta AI on Instagram
                </h4>
                <p className="text-xs text-slate-400">Alternative conversational interface</p>
              </div>
              <Zap className="h-4 w-4 text-pink-400" />
            </a>
          </div>

          {/* Center: Chat Interface */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Configuration Status Bar */}
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Brain className={cn("h-3.5 w-3.5", config.reasoningMode === 'deep' && "text-indigo-400")} />
                Reasoning: <span className="text-slate-200">{config.reasoningMode}</span>
              </span>
              <span className="w-px h-3 bg-slate-700" />
              <span className="flex items-center gap-1.5 text-slate-400">
                <Thermometer className={cn("h-3.5 w-3.5", config.temperature > 1 ? "text-amber-400" : "text-blue-400")} />
                Temp: <span className="text-slate-200">{config.temperature}</span>
              </span>
              <span className="w-px h-3 bg-slate-700" />
              <span className="flex items-center gap-1.5 text-slate-400">
                <BookOpen className={cn("h-3.5 w-3.5", config.ragEnabled ? "text-purple-400" : "text-slate-600")} />
                RAG: <span className="text-slate-200">{config.ragEnabled ? 'ON' : 'OFF'}</span>
              </span>
              <span className="w-px h-3 bg-slate-700" />
              <span className="flex items-center gap-1.5 text-slate-400">
                <Target className="h-3.5 w-3.5" />
                Profile: <span className="text-slate-200 capitalize">{config.accuracyProfile}</span>
              </span>
            </div>

            {/* Chat Window */}
            <div className="relative rounded-2xl border border-slate-700 bg-slate-900/30 overflow-hidden min-h-[600px] flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
                      <MessageSquare className="h-8 w-8 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-slate-300">Start a conversation</p>
                      <p className="text-sm max-w-sm mt-1">
                        Experience {config.reasoningMode === 'deep' ? 'multi-step reasoning' : 'fast inference'} 
                        with {config.ragEnabled ? 'retrieval augmentation' : 'pure parametric knowledge'}.
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg.id} className={cn(
                    "flex flex-col",
                    msg.role === 'user' ? "items-end" : "items-start"
                  )}>
                    {msg.role === 'assistant' && msg.reasoning && (
                      <ReasoningChain steps={msg.reasoning} isVisible={config.showThinking} />
                    )}
                    
                    {msg.role === 'assistant' && msg.sources && config.ragEnabled && (
                      <RAGContextPanel sources={msg.sources} />
                    )}

                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-purple-600 text-white rounded-br-md"
                        : "bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-md"
                    )}>
                      <div className="prose prose-invert prose-sm max-w-none">
                        {msg.content}
                      </div>
                      
                      {msg.probabilities && msg.role === 'assistant' && (
                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                          <ProbabilityMeter value={msg.probabilities.topAnswer} label="Confidence" />
                          {msg.probabilities.alternatives.slice(0, 2).map((alt, idx) => (
                            <div key={idx} className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                              <span className="truncate max-w-[200px]">{alt.text}</span>
                              <span>{Math.round(alt.prob * 100)}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {msg.latency && (
                      <span className="mt-1 text-[10px] text-slate-600 flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {msg.latency}ms • {msg.tokensUsed?.output} tokens
                      </span>
                    )}
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-purple-400" />
                    {config.reasoningMode === 'deep' ? 'Thinking deeply...' : 'Generating...'}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-slate-800 p-4 bg-slate-900/50">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = (e.target as HTMLFormElement).elements.namedItem('message') as HTMLInputElement;
                    if (!input.value.trim()) return;
                    
                    const userMsg: Message = {
                      id: Math.random().toString(36).substr(2, 9),
                      role: 'user',
                      content: input.value,
                    };
                    setMessages(prev => [...prev, userMsg]);
                    simulateThinkingResponse(input.value);
                    input.value = '';
                  }}
                  className="flex gap-2"
                >
                  <input
                    name="message"
                    type="text"
                    placeholder={`Ask anything (${config.accuracyProfile} mode)...`}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500 placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </button>
                </form>
                <p className="mt-2 text-[10px] text-center text-slate-600">
                  {config.temperature < 0.3 ? 'High precision mode' : config.temperature > 1.0 ? 'High creativity mode' : 'Balanced mode'} 
                  {' • '}
                  Responses are probabilistic, not deterministic.
                </p>
              </div>
            </div>

            {/* Educational Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-900/30 p-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-slate-300">Deterministic:</span>
                  <p className="text-slate-500 mt-0.5">Context windows, token limits, and system prompts behave predictably every time.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-900/30 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-slate-300">Probabilistic:</span>
                  <p className="text-slate-500 mt-0.5">Temperature, top-p, and reasoning paths introduce variability and creativity.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-900/30 p-3">
                <Brain className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-slate-300">Emergent:</span>
                  <p className="text-slate-500 mt-0.5">Complex reasoning arises from simple probabilistic next-token prediction.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
