import { 
  useState, 
  useMemo, 
  useCallback, 
  useRef, 
  useEffect,
  createContext, 
  useContext, 
  ReactNode,
  memo,
  useTransition 
} from 'react';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  RefreshCcw, 
  Download, 
  Activity,
  Sparkles,
  MoreHorizontal 
} from 'lucide-react'; // Add: npm i lucide-react
import { clsx, type ClassValue } from 'clsx'; // Add: npm i clsx
import { twMerge } from 'tailwind-merge'; // Add: npm i tailwind-merge

// ============================================================================
// UTILITY FUNCTIONS (Mobile-first & Accessibility)
// ============================================================================

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

// ============================================================================
// TYPES & INTERFACES (SOLID: Interface Segregation)
// ============================================================================

type EntityType = 'contact' | 'deal' | 'task';

type CRUDAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_DELETE';

interface ActivityLog {
  id: string;
  action: CRUDAction;
  entityType: EntityType;
  entityId: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CRMContact extends BaseEntity {
  type: 'contact';
  name: string;
  company: string;
  email: string;
  segment: 'SMB' | 'Mid-Market' | 'Enterprise';
  lastActivity?: Date;
}

type DealStage = 'Prospecting' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';

interface CRMDeal extends BaseEntity {
  type: 'deal';
  name: string;
  company: string;
  value: number;
  stage: DealStage;
  owner: string;
  probability?: number; // AI-calculated
}

type TaskStatus = 'Open' | 'In Progress' | 'Blocked' | 'Done' | 'Archived';

interface CRMTask extends BaseEntity {
  type: 'task';
  title: string;
  owner: string;
  dueDate: string;
  status: TaskStatus;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  aiSuggested?: boolean;
}

type CRMEntity = CRMContact | CRMDeal | CRMTask;

interface DashboardMetrics {
  totalPipeline: number;
  weightedPipeline: number;
  activeDeals: number;
  winRate: number;
  tasksDue: number;
  tasksOverdue: number;
  activityVelocity: number; // Actions per hour
}

// ============================================================================
// MOCK SERVICE LAYER (Repository Pattern - Ready for API migration)
// ============================================================================

class CRMRepository {
  private contacts: CRMContact[] = [];
  private deals: CRMDeal[] = [];
  private tasks: CRMTask[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Seed data
    this.contacts = [
      { id: '1', name: 'Alice Corp', company: 'TechStart', email: 'alice@tech.com', segment: 'Enterprise', createdAt: new Date(), updatedAt: new Date() },
    ];
    this.deals = [
      { id: '1', name: 'Q4 Software License', company: 'TechStart', value: 50000, stage: 'Proposal', owner: 'John Doe', createdAt: new Date(), updatedAt: new Date() },
    ];
    this.tasks = [
      { id: '1', title: 'Follow up on proposal', owner: 'John Doe', dueDate: new Date().toISOString().split('T')[0], status: 'Open', priority: 'High', createdAt: new Date(), updatedAt: new Date() },
    ];
  }

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  // CRUD Operations
  createContact(data: Omit<CRMContact, 'id' | 'createdAt' | 'updatedAt' | 'type'>): CRMContact {
    const contact: CRMContact = {
      ...data,
      id: generateId(),
      type: 'contact',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.contacts.unshift(contact);
    this.notify();
    return contact;
  }

  updateContact(id: string, updates: Partial<CRMContact>): CRMContact | null {
    const idx = this.contacts.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.contacts[idx] = { ...this.contacts[idx], ...updates, updatedAt: new Date() };
    this.notify();
    return this.contacts[idx];
  }

  deleteContact(id: string): boolean {
    const initialLength = this.contacts.length;
    this.contacts = this.contacts.filter(c => c.id !== id);
    if (this.contacts.length !== initialLength) {
      this.notify();
      return true;
    }
    return false;
  }

  createDeal(data: Omit<CRMDeal, 'id' | 'createdAt' | 'updatedAt' | 'type'>): CRMDeal {
    const deal: CRMDeal = {
      ...data,
      id: generateId(),
      type: 'deal',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.deals.unshift(deal);
    this.notify();
    return deal;
  }

  updateDeal(id: string, updates: Partial<CRMDeal>): CRMDeal | null {
    const idx = this.deals.findIndex(d => d.id === id);
    if (idx === -1) return null;
    this.deals[idx] = { ...this.deals[idx], ...updates, updatedAt: new Date() };
    this.notify();
    return this.deals[idx];
  }

  deleteDeal(id: string): boolean {
    const initialLength = this.deals.length;
    this.deals = this.deals.filter(d => d.id !== id);
    if (this.deals.length !== initialLength) {
      this.notify();
      return true;
    }
    return false;
  }

  createTask(data: Omit<CRMTask, 'id' | 'createdAt' | 'updatedAt' | 'type'>): CRMTask {
    const task: CRMTask = {
      ...data,
      id: generateId(),
      type: 'task',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.unshift(task);
    this.notify();
    return task;
  }

  updateTask(id: string, updates: Partial<CRMTask>): CRMTask | null {
    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.tasks[idx] = { ...this.tasks[idx], ...updates, updatedAt: new Date() };
    this.notify();
    return this.tasks[idx];
  }

  deleteTask(id: string): boolean {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(t => t.id !== id);
    if (this.tasks.length !== initialLength) {
      this.notify();
      return true;
    }
    return false;
  }

  // Queries
  getAll() {
    return {
      contacts: [...this.contacts],
      deals: [...this.deals],
      tasks: [...this.tasks],
    };
  }

  getMetrics(): DashboardMetrics {
    const { deals, tasks } = this.getAll();
    const activeDeals = deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost');
    const totalPipeline = deals.reduce((sum, d) => sum + d.value, 0);
    const weightedPipeline = deals.reduce((sum, d) => {
      const prob = d.stage === 'Closed Won' ? 100 : d.stage === 'Proposal' ? 50 : 25;
      return sum + (d.value * (prob / 100));
    }, 0);
    
    const today = new Date().toISOString().split('T')[0];
    const tasksDue = tasks.filter(t => t.status !== 'Done' && t.status !== 'Archived').length;
    const tasksOverdue = tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'Done').length;
    
    const won = deals.filter(d => d.stage === 'Closed Won').length;
    const winRate = deals.length ? Math.round((won / deals.length) * 100) : 0;

    return {
      totalPipeline,
      weightedPipeline,
      activeDeals: activeDeals.length,
      winRate,
      tasksDue,
      tasksOverdue,
      activityVelocity: Math.floor(Math.random() * 10) + 5, // Simulated
    };
  }
}

const crmRepo = new CRMRepository();

// ============================================================================
// HOOKS (DRY: Reusable Logic)
// ============================================================================

function useCRMData() {
  const [data, setData] = useState(crmRepo.getAll());
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return crmRepo.subscribe(() => {
      startTransition(() => {
        setData(crmRepo.getAll());
      });
    });
  }, []);

  const logActivity = useCallback((action: CRUDAction, entityType: EntityType, entityId: string, description: string) => {
    const log: ActivityLog = {
      id: generateId(),
      action,
      entityType,
      entityId,
      description,
      timestamp: new Date(),
    };
    setActivities(prev => [log, ...prev].slice(0, 50)); // Keep last 50
  }, []);

  const createEntity = useCallback(<T extends CRMEntity>(
    type: EntityType,
    payload: unknown
  ): T | null => {
    let result: T | null = null;
    let description = '';

    switch (type) {
      case 'contact':
        result = crmRepo.createContact(payload as Omit<CRMContact, 'id' | 'createdAt' | 'updatedAt' | 'type'>) as unknown as T;
        description = `Created contact: ${(result as unknown as CRMContact).name}`;
        break;
      case 'deal':
        result = crmRepo.createDeal(payload as Omit<CRMDeal, 'id' | 'createdAt' | 'updatedAt' | 'type'>) as unknown as T;
        description = `Created deal: ${(result as unknown as CRMDeal).name} (${formatCurrency((result as unknown as CRMDeal).value)})`;
        break;
      case 'task':
        result = crmRepo.createTask(payload as Omit<CRMTask, 'id' | 'createdAt' | 'updatedAt' | 'type'>) as unknown as T;
        description = `Created task: ${(result as unknown as CRMTask).title}`;
        break;
    }

    if (result) {
      logActivity('CREATE', type, result.id, description);
    }
    return result;
  }, [logActivity]);

  const updateEntity = useCallback(<T extends CRMEntity>(
    type: EntityType,
    id: string,
    updates: Partial<T>
  ): T | null => {
    let result: T | null = null;
    
    switch (type) {
      case 'contact':
        result = crmRepo.updateContact(id, updates) as unknown as T;
        break;
      case 'deal':
        result = crmRepo.updateDeal(id, updates) as unknown as T;
        break;
      case 'task':
        result = crmRepo.updateTask(id, updates) as unknown as T;
        break;
    }

    if (result) {
      logActivity('UPDATE', type, id, `Updated ${type} #${id.substring(0, 4)}`);
    }
    return result;
  }, [logActivity]);

  const deleteEntity = useCallback((type: EntityType, id: string, name: string): boolean => {
    let success = false;
    
    switch (type) {
      case 'contact':
        success = crmRepo.deleteContact(id);
        break;
      case 'deal':
        success = crmRepo.deleteDeal(id);
        break;
      case 'task':
        success = crmRepo.deleteTask(id);
        break;
    }

    if (success) {
      logActivity('DELETE', type, id, `Deleted ${type}: ${name}`);
    }
    return success;
  }, [logActivity]);

  const metrics = useMemo(() => crmRepo.getMetrics(), [data]);

  return {
    ...data,
    metrics,
    activities,
    isLoading: isPending,
    createEntity,
    updateEntity,
    deleteEntity,
  };
}

// Generic form hook
function useForm<T extends Record<string, any>>(initialState: T, onSubmit: (data: T) => void) {
  const [values, setValues] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simple validation
    const newErrors: Partial<Record<keyof T, string>> = {};
    Object.entries(values).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        newErrors[key as keyof T] = 'Required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(values);
      setValues(initialState); // Reset on success
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, initialState, onSubmit]);

  return { values, errors, isSubmitting, handleChange, handleSubmit, setValues };
}

// ============================================================================
// SUB-COMPONENTS (SOLID: Single Responsibility)
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: ReactNode;
  accent?: 'purple' | 'cyan' | 'gold' | 'green' | 'red';
  isLoading?: boolean;
}

const StatCard = memo<StatCardProps>(({ label, value, trend, trendUp, icon, accent = 'purple', isLoading }) => {
  const accentClasses = {
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    gold: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border p-6 backdrop-blur-sm", accentClasses[accent])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight">
            {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : value}
          </h3>
          {trend && (
            <p className={cn("mt-2 text-sm font-medium", trendUp ? "text-emerald-400" : "text-rose-400")}>
              {trend}
            </p>
          )}
        </div>
        {icon && <div className="rounded-lg bg-white/5 p-2">{icon}</div>}
      </div>
    </div>
  );
});

const SectionHeader = memo<{ title: string; subtitle?: string; action?: ReactNode }>(({ 
  title, 
  subtitle, 
  action 
}) => (
  <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 text-slate-400">{subtitle}</p>}
    </div>
    {action}
  </div>
));

// Generic Entity Form
interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'date';
  options?: { label: string; value: string }[];
  required?: boolean;
}

function EntityForm<T extends Record<string, any>>({
  fields,
  initialData,
  onSubmit,
  submitLabel = 'Save',
  entityType,
}: {
  fields: FieldConfig[];
  initialData: T;
  onSubmit: (data: T) => void;
  submitLabel?: string;
  entityType: EntityType;
}) {
  const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm(initialData, onSubmit);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {field.label}
          </label>
          {field.type === 'select' ? (
            <select
              value={values[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className={cn(
                "w-full rounded-lg border bg-slate-900/50 px-4 py-2.5 text-sm text-white outline-none transition-colors",
                errors[field.name] ? "border-rose-500 focus:border-rose-500" : "border-slate-700 focus:border-purple-500"
              )}
            >
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type}
              value={values[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.label}
              className={cn(
                "w-full rounded-lg border bg-slate-900/50 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-600",
                errors[field.name] ? "border-rose-500 focus:border-rose-500" : "border-slate-700 focus:border-purple-500"
              )}
            />
          )}
          {errors[field.name] && (
            <span className="text-xs text-rose-400">{errors[field.name]}</span>
          )}
        </div>
      ))}
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {submitLabel}
      </button>
    </form>
  );
}

// Activity Feed Component
const ActivityFeed = memo<{ activities: ActivityLog[] }>(({ activities }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
      <Activity className="h-5 w-5 text-purple-400" />
      Live Activity Feed
    </h3>
    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
      {activities.length === 0 ? (
        <p className="text-sm text-slate-500 italic">No recent activity...</p>
      ) : (
        activities.map((log) => (
          <div key={log.id} className="flex gap-3 text-sm border-l-2 border-slate-800 pl-3 py-1">
            <div className={cn(
              "mt-0.5 h-2 w-2 rounded-full",
              log.action === 'CREATE' ? "bg-emerald-400" :
              log.action === 'UPDATE' ? "bg-amber-400" : "bg-rose-400"
            )} />
            <div className="flex-1">
              <p className="text-slate-300">{log.description}</p>
              <span className="text-xs text-slate-500">
                {log.timestamp.toLocaleTimeString()} · {log.entityType}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
));

// AI Insights Panel
const AIInsights = memo<{ metrics: DashboardMetrics; deals: CRMDeal[] }>(({ metrics, deals }) => {
  const insights = useMemo(() => {
    const atRisk = deals.filter(d => d.stage === 'Negotiation' && d.value > 100000);
    const suggestions = [];
    
    if (metrics.tasksOverdue > 0) {
      suggestions.push(`⚠️ ${metrics.tasksOverdue} tasks are overdue. Consider reassigning or reprioritizing.`);
    }
    if (metrics.winRate < 30) {
      suggestions.push(`📉 Win rate is ${metrics.winRate}%. Review recent losses for patterns.`);
    }
    if (atRisk.length > 0) {
      suggestions.push(`🎯 High-value deals in negotiation: ${atRisk.length}. Consider executive sponsorship.`);
    }
    if (metrics.weightedPipeline < metrics.totalPipeline * 0.4) {
      suggestions.push(`💰 Weighted pipeline is ${Math.round((metrics.weightedPipeline / metrics.totalPipeline) * 100)}% of total. Qualification needed.`);
    }
    
    return suggestions;
  }, [metrics, deals]);

  if (insights.length === 0) return null;

  return (
    <div className="mb-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-indigo-400" />
        <h3 className="text-lg font-semibold text-indigo-100">AI Insights</h3>
      </div>
      <ul className="space-y-2">
        {insights.map((insight, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-indigo-200/80">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
});

// Generic List Item
function EntityListItem<T extends CRMEntity>({
  entity,
  onDelete,
  children,
}: {
  entity: T;
  onDelete: (e: T) => void;
  children: ReactNode;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(() => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(entity);
      setIsDeleting(false);
    }, 300); // Animation delay
  }, [entity, onDelete]);

  const getName = (e: CRMEntity) => {
    if ('name' in e) return e.name;
    if ('title' in e) return e.title;
    return 'Unknown';
  };

  return (
    <div className={cn(
      "group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-slate-700 hover:bg-slate-800/50",
      isDeleting && "opacity-0 -translate-x-4"
    )}>
      <div className="flex-1 min-w-0">
        {children}
      </div>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="ml-4 rounded-lg p-2 text-slate-500 opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100 focus:opacity-100"
        aria-label={`Delete ${getName(entity)}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Dashboard: React.FC = () => {
  const { 
    contacts, 
    deals, 
    tasks, 
    metrics, 
    activities,
    isLoading,
    createEntity, 
    updateEntity, 
    deleteEntity 
  } = useCRMData();

  const [activeTab, setActiveTab] = useState<'all' | 'contacts' | 'deals' | 'tasks'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered views
  const filteredDeals = useMemo(() => 
    deals.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                     d.company.toLowerCase().includes(searchTerm.toLowerCase())),
    [deals, searchTerm]
  );

  const stageColors: Record<DealStage, string> = {
    'Prospecting': 'bg-slate-500/20 text-slate-300',
    'Qualified': 'bg-blue-500/20 text-blue-300',
    'Proposal': 'bg-purple-500/20 text-purple-300',
    'Negotiation': 'bg-amber-500/20 text-amber-300',
    'Closed Won': 'bg-emerald-500/20 text-emerald-300',
    'Closed Lost': 'bg-rose-500/20 text-rose-300',
  };

  const statusColors: Record<TaskStatus, string> = {
    'Open': 'bg-slate-500/20 text-slate-300',
    'In Progress': 'bg-blue-500/20 text-blue-300',
    'Blocked': 'bg-rose-500/20 text-rose-300',
    'Done': 'bg-emerald-500/20 text-emerald-300',
    'Archived': 'bg-slate-800 text-slate-500',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-purple-400">Delivery Day Overview</p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">CRM Command Center</h1>
            <p className="mt-2 text-slate-400">Unified workspace for revenue operations</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700">
              <RefreshCcw className="h-4 w-4" />
              Sync
            </button>
          </div>
        </div>

        {/* AI Insights */}
        <AIInsights metrics={metrics} deals={deals} />

        {/* Metrics Grid */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            label="Total Pipeline" 
            value={formatCurrency(metrics.totalPipeline)}
            trend={`Weighted: ${formatCurrency(metrics.weightedPipeline)}`}
            accent="purple"
            isLoading={isLoading}
          />
          <StatCard 
            label="Active Deals" 
            value={metrics.activeDeals}
            trend={`${Math.round(metrics.activeDeals > 0 ? (metrics.totalPipeline / metrics.activeDeals) : 0)} avg. value`}
            trendUp={true}
            accent="cyan"
            isLoading={isLoading}
          />
          <StatCard 
            label="Win Rate" 
            value={`${metrics.winRate}%`}
            trend="Target: 35%"
            trendUp={metrics.winRate >= 35}
            accent={metrics.winRate >= 35 ? "green" : "gold"}
            isLoading={isLoading}
          />
          <StatCard 
            label="Tasks Due" 
            value={metrics.tasksDue}
            trend={metrics.tasksOverdue > 0 ? `${metrics.tasksOverdue} overdue` : 'On track'}
            trendUp={metrics.tasksOverdue === 0}
            accent={metrics.tasksOverdue > 0 ? "red" : "purple"}
            isLoading={isLoading}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Deals Section */}
            <section>
              <SectionHeader 
                title="Revenue Pipeline" 
                subtitle="Track deal velocity and stage transitions"
              />
              
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">New Deal</h3>
                  <EntityForm< Omit<CRMDeal, 'id' | 'createdAt' | 'updatedAt' | 'type'> >
                    entityType="deal"
                    fields={[
                      { name: 'name', label: 'Deal Name', type: 'text', required: true },
                      { name: 'company', label: 'Company', type: 'text', required: true },
                      { name: 'value', label: 'Value ($)', type: 'number', required: true },
                      { name: 'owner', label: 'Owner', type: 'text', required: true },
                      { name: 'stage', label: 'Stage', type: 'select', options: [
                        { label: 'Prospecting', value: 'Prospecting' },
                        { label: 'Qualified', value: 'Qualified' },
                        { label: 'Proposal', value: 'Proposal' },
                        { label: 'Negotiation', value: 'Negotiation' },
                        { label: 'Closed Won', value: 'Closed Won' },
                      ]},
                    ]}
                    initialData={{ name: '', company: '', value: 0, stage: 'Prospecting', owner: '' }}
                    onSubmit={(data) => createEntity('deal', data)}
                    submitLabel="Create Deal"
                  />
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Search deals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-white outline-none focus:border-purple-500 mb-4"
                  />
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {filteredDeals.map(deal => (
                      <EntityListItem 
                        key={deal.id} 
                        entity={deal}
                        onDelete={(d) => deleteEntity('deal', d.id, d.name)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white truncate">{deal.name}</span>
                          <span className={cn("px-2 py-0.5 rounded text-xs font-medium", stageColors[deal.stage])}>
                            {deal.stage}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">{deal.company} · {formatCurrency(deal.value)}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <select
                            value={deal.stage}
                            onChange={(e) => updateEntity('deal', deal.id, { stage: e.target.value as DealStage })}
                            className="text-xs rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-300 outline-none focus:border-purple-500"
                          >
                            <option value="Prospecting">Prospecting</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Proposal">Proposal</option>
                            <option value="Negotiation">Negotiation</option>
                            <option value="Closed Won">Closed Won</option>
                          </select>
                          <span className="text-xs text-slate-500">Owner: {deal.owner}</span>
                        </div>
                      </EntityListItem>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Contacts & Tasks Grid */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Contacts */}
              <section>
                <SectionHeader title="Contacts" subtitle="Manage relationships" />
                <div className="space-y-4">
                  <EntityForm< Omit<CRMContact, 'id' | 'createdAt' | 'updatedAt' | 'type'> >
                    entityType="contact"
                    fields={[
                      { name: 'name', label: 'Full Name', type: 'text', required: true },
                      { name: 'company', label: 'Company', type: 'text', required: true },
                      { name: 'email', label: 'Email', type: 'email', required: true },
                      { name: 'segment', label: 'Segment', type: 'select', options: [
                        { label: 'SMB', value: 'SMB' },
                        { label: 'Mid-Market', value: 'Mid-Market' },
                        { label: 'Enterprise', value: 'Enterprise' },
                      ]},
                    ]}
                    initialData={{ name: '', company: '', email: '', segment: 'SMB' }}
                    onSubmit={(data) => createEntity('contact', data)}
                    submitLabel="Add Contact"
                  />
                  <div className="space-y-2 mt-4">
                    {contacts.map(contact => (
                      <EntityListItem 
                        key={contact.id} 
                        entity={contact}
                        onDelete={(c) => deleteEntity('contact', c.id, c.name)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">{contact.name}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs",
                            contact.segment === 'Enterprise' ? "bg-purple-500/20 text-purple-300" : "bg-slate-700 text-slate-300"
                          )}>
                            {contact.segment}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{contact.company} · {contact.email}</p>
                      </EntityListItem>
                    ))}
                  </div>
                </div>
              </section>

              {/* Tasks */}
              <section>
                <SectionHeader title="Execution Board" subtitle="Task management" />
                <div className="space-y-4">
                  <EntityForm< Omit<CRMTask, 'id' | 'createdAt' | 'updatedAt' | 'type'> >
                    entityType="task"
                    fields={[
                      { name: 'title', label: 'Task Title', type: 'text', required: true },
                      { name: 'owner', label: 'Owner', type: 'text', required: true },
                      { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
                      { name: 'priority', label: 'Priority', type: 'select', options: [
                        { label: 'Low', value: 'Low' },
                        { label: 'Medium', value: 'Medium' },
                        { label: 'High', value: 'High' },
                        { label: 'Critical', value: 'Critical' },
                      ]},
                      { name: 'status', label: 'Status', type: 'select', options: [
                        { label: 'Open', value: 'Open' },
                        { label: 'In Progress', value: 'In Progress' },
                        { label: 'Blocked', value: 'Blocked' },
                        { label: 'Done', value: 'Done' },
                      ]},
                    ]}
                    initialData={{ title: '', owner: '', dueDate: '', status: 'Open', priority: 'Medium' }}
                    onSubmit={(data) => createEntity('task', data)}
                    submitLabel="Add Task"
                  />
                  <div className="space-y-2 mt-4">
                    {tasks.map(task => (
                      <EntityListItem 
                        key={task.id} 
                        entity={task}
                        onDelete={(t) => deleteEntity('task', t.id, t.title)}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "font-medium text-sm",
                            task.status === 'Done' ? "text-slate-500 line-through" : "text-white"
                          )}>
                            {task.title}
                          </span>
                          <span className={cn("px-2 py-0.5 rounded text-xs", statusColors[task.status])}>
                            {task.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span>{task.owner}</span>
                          <span>·</span>
                          <span className={task.dueDate < new Date().toISOString().split('T')[0] && task.status !== 'Done' ? "text-rose-400" : ""}>
                            {task.dueDate}
                          </span>
                          <span className={cn(
                            "px-1.5 rounded",
                            task.priority === 'Critical' ? "bg-rose-500/20 text-rose-300" :
                            task.priority === 'High' ? "bg-amber-500/20 text-amber-300" :
                            "bg-slate-700 text-slate-400"
                          )}>
                            {task.priority}
                          </span>
                        </div>
                      </EntityListItem>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            <ActivityFeed activities={activities} />
            
            {/* Quick Stats */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Activity Velocity</span>
                    <span className="text-white font-medium">{metrics.activityVelocity}/hr</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(metrics.activityVelocity * 5, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Pipeline Health</span>
                    <span className="text-white font-medium">
                      {Math.round((metrics.weightedPipeline / (metrics.totalPipeline || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ 
                      width: `${Math.round((metrics.weightedPipeline / (metrics.totalPipeline || 1)) * 100)}%` 
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
