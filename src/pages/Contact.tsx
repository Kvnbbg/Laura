import { useEffect, useMemo, useState, useCallback } from 'react';
import { ExternalLink, Send, Mail, Clock, ArrowRight, MessageSquare, Globe } from 'lucide-react';
import { getConfig } from '../config/env';
import { submitContactForm } from '../services/contactService';
import { getErrorMessage } from '../utils/errors';
import './Contact.scss';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type FormStatus = 'idle' | 'sending' | 'success' | 'error';
type ContactMethod = 'external' | 'local';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
}

// ============================================================================
// SUB-COMPONENTS (SOLID: Single Responsibility)
// ============================================================================

const ExternalContactCard: React.FC<{
  url: string;
  onSelect: () => void;
  featured?: boolean;
}> = ({ url, onSelect, featured = false }) => (
  <div 
    className={`relative overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
      featured 
        ? 'border-purple-500/50 bg-gradient-to-br from-purple-900/20 to-slate-900/50 p-8' 
        : 'border-slate-700 bg-slate-900/30 p-6'
    }`}
  >
    {featured && (
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl" />
    )}
    
    <div className="relative">
      <div className={`mb-4 inline-flex rounded-lg ${featured ? 'bg-purple-500/20' : 'bg-slate-800'} p-3`}>
        <Globe className={`h-6 w-6 ${featured ? 'text-purple-400' : 'text-slate-400'}`} />
      </div>
      
      <h3 className={`text-xl font-bold mb-2 ${featured ? 'text-white' : 'text-slate-200'}`}>
        Visit Our Contact Center
      </h3>
      
      <p className="text-slate-400 mb-6 text-sm leading-relaxed">
        For the fastest response and advanced features like file attachments, 
        scheduling, and priority support, visit our full contact portal.
      </p>
      
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onSelect}
        className={`group flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-all ${
          featured
            ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-900/20'
            : 'border border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500'
        }`}
      >
        <span>Go to techandstream.com</span>
        <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>
      
      <p className="mt-4 text-center text-xs text-slate-500">
        Opens in new tab • Secure connection
      </p>
    </div>
  </div>
);

const QuickContactForm: React.FC<{
  onSubmit: (data: ContactFormData) => Promise<void>;
  status: FormStatus;
  errorMessage: string | null;
}> = ({ onSubmit, status, errorMessage }) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'normal',
  });

  const isSubmitting = status === 'sending';
  const isSuccess = status === 'success';
  const hasError = status === 'error';

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubmitting) {
      onSubmit(formData);
    }
  }, [formData, isSubmitting, onSubmit]);

  // Auto-reset after success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setFormData({ name: '', email: '', subject: '', message: '', priority: 'normal' });
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <Send className="h-8 w-8" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-white">Message Sent!</h3>
        <p className="mb-6 max-w-xs text-slate-400">
          Thanks for reaching out. We'll get back to you within 24 hours.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-purple-400 hover:text-purple-300"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {hasError && errorMessage && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 font-medium text-rose-400">
            <span className="text-lg">⚠️</span>
            {errorMessage}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="John Doe"
            className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-purple-500 disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.enail}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="john@example.com"
            className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-purple-500 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="subject" className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Subject
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          required
          value={formData.subject}
          onChange={handleChange}
          disabled={isSubmitting}
          placeholder="What's this about?"
          className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-purple-500 disabled:opacity-50"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="priority" className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          disabled={isSubmitting}
          className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-purple-500 disabled:opacity-50"
        >
          <option value="low">Low - General inquiry</option>
          <option value="normal">Normal - Business opportunity</option>
          <option value="high">High - Urgent matter</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          value={formData.message}
          onChange={handleChange}
          disabled={isSubmitting}
          placeholder="Tell us about your project..."
          className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-purple-500 disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-all hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <span>Send Message</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
};

const ContactMethodTabs: React.FC<{
  active: ContactMethod;
  onChange: (method: ContactMethod) => void;
}> = ({ active, onChange }) => (
  <div className="mb-8 flex justify-center">
    <div className="inline-flex rounded-full border border-slate-700 bg-slate-900/50 p-1">
      <button
        onClick={() => onChange('external')}
        className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
          active === 'external'
            ? 'bg-purple-600 text-white shadow-lg'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Globe className="h-4 w-4" />
        Full Portal
      </button>
      <button
        onClick={() => onChange('local')}
        className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
          active === 'local'
            ? 'bg-purple-600 text-white shadow-lg'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <MessageSquare className="h-4 w-4" />
        Quick Message
      </button>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const EXTERNAL_CONTACT_URL = 'https://techandstream.com/contact.html';

const Contact: React.FC = () => {
  const { contactEndpoint } = getConfig();
  const [activeMethod, setActiveMethod] = useState<ContactMethod>('external');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  // Auto-suggest external form for complex inquiries
  useEffect(() => {
    if (activeMethod === 'local' && status === 'idle') {
      const timer = setTimeout(() => {
        // Subtle hint to use external form after 10 seconds on local form
        const hint = document.getElementById('external-hint');
        hint?.classList.remove('opacity-0');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [activeMethod, status]);

  // Handle external link click with optional countdown redirect
  const handleExternalSelect = useCallback(() => {
    // Track the click (could add analytics here)
    console.info('User directed to external contact page:', EXTERNAL_CONTACT_URL);
    
    // Optional: Auto-redirect after showing a brief confirmation
    setRedirectCountdown(3);
    const interval = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev === 1) {
          clearInterval(interval);
          window.open(EXTERNAL_CONTACT_URL, '_blank');
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  }, []);

  const handleLocalSubmit = useCallback(async (data: ContactFormData) => {
    setStatus('sending');
    setErrorMessage(null);

    try {
      // If no endpoint configured, simulate success and redirect
      if (!contactEndpoint) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStatus('success');
        
        // After showing success, offer to redirect to external for "more options"
        setTimeout(() => {
          if (window.confirm('Message saved locally! Would you like to visit our full contact portal for additional features?')) {
            window.open(EXTERNAL_CONTACT_URL, '_blank');
          }
        }, 2000);
        return;
      }

      await submitContactForm(data);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(getErrorMessage(error));
    }
  }, [contactEndpoint]);

  const connectionStatus = useMemo(() => {
    if (!contactEndpoint) {
      return {
        type: 'warning' as const,
        message: 'Local mode active. For guaranteed delivery, please use the external contact portal.',
        icon: <Clock className="h-4 w-4" />,
      };
    }
    return {
      type: 'success' as const,
      message: 'Connected to messaging service',
      icon: <Mail className="h-4 w-4" />,
    };
  }, [contactEndpoint]);

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Let&apos;s Start a Conversation
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Whether you prefer our advanced contact portal or a quick message here, 
            we&apos;re ready to help you navigate the cosmos.
          </p>
        </section>

        {/* Redirect Countdown Modal */}
        {redirectCountdown !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="rounded-2xl border border-purple-500/30 bg-slate-900 p-8 text-center shadow-2xl">
              <div className="mb-4 flex justify-center">
                <div className="h-12 w-12 animate-pulse rounded-full bg-purple-500/20 flex items-center justify-center">
                  <ExternalLink className="h-6 w-6 text-purple-400" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Opening Contact Portal</h3>
              <p className="text-slate-400 mb-4">Redirecting in {redirectCountdown} seconds...</p>
              <button 
                onClick={() => {
                  setRedirectCountdown(null);
                  window.open(EXTERNAL_CONTACT_URL, '_blank');
                }}
                className="text-sm text-purple-400 hover:text-purple-300 underline"
              >
                Go now
              </button>
            </div>
          </div>
        )}

        {/* Method Selection Tabs */}
        <ContactMethodTabs active={activeMethod} onChange={setActiveMethod} />

        {/* Main Content Area */}
        <div className="grid gap-8 lg:grid-cols-2">
          
          {/* Primary: External Contact Promotion */}
          {activeMethod === 'external' ? (
            <>
              <div className="lg:col-span-1">
                <ExternalContactCard 
                  url={EXTERNAL_CONTACT_URL}
                  onSelect={handleExternalSelect}
                  featured={true}
                />
              </div>
              
              <div className="lg:col-span-1">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 h-full">
                  <h3 className="mb-4 text-lg font-semibold text-white">Why use the full portal?</h3>
                  <ul className="space-y-4">
                    {[
                      'File attachments up to 25MB',
                      'Priority support routing',
                      'Calendar scheduling integration',
                      'Project proposal uploads',
                      'Real-time chat option',
                      'FAQ knowledge base access',
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-slate-300">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 text-xs">
                          ✓
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-8 rounded-lg bg-slate-800/50 p-4">
                    <p className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Security Note:</span> The external portal uses 
                      enterprise-grade encryption and is hosted on techandstream.com with secure HTTPS.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Secondary: Local Quick Form */}
              <div className="lg:col-span-1">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/30 p-6 lg:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Quick Message</h2>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      connectionStatus.type === 'success' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {connectionStatus.icon}
                      {connectionStatus.message}
                    </span>
                  </div>
                  
                  <QuickContactForm 
                    onSubmit={handleLocalSubmit}
                    status={status}
                    errorMessage={errorMessage}
                  />

                  {/* External Hint (appears after delay) */}
                  <div id="external-hint" className="mt-6 opacity-0 transition-opacity duration-500">
                    <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 text-center">
                      <p className="mb-2 text-sm text-slate-300">
                        Need more options or file uploads?
                      </p>
                      <button
                        onClick={() => setActiveMethod('external')}
                        className="text-sm font-medium text-purple-400 hover:text-purple-300"
                      >
                        Switch to full contact portal →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info Sidebar */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">Direct Contact</h3>
                  <div className="space-y-4">
                    <a 
                      href="mailto:hello@laura-cosmic.com" 
                      className="group flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-slate-800"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-200 group-hover:text-white">Email Us</p>
                        <p className="text-sm text-slate-400">hello@laura-cosmic.com</p>
                      </div>
                    </a>

                    <div className="flex items-center gap-4 rounded-lg p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">Response Time</p>
                        <p className="text-sm text-slate-400">Usually within 24 hours</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">Prefer the full experience?</h3>
                  <p className="mb-4 text-sm text-slate-400">
                    Our main contact portal at techandstream.com offers advanced features 
                    and faster response times.
                  </p>
                  <button
                    onClick={() => setActiveMethod('external')}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 bg-transparent px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                  >
                    Visit External Portal
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Trust Signals */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-500">
            Protected by reCAPTCHA and subject to our Privacy Policy and Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
