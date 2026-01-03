import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import './styles/main.scss';

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/commercial" element={<commercial/>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </ErrorBoundary>
    </Router>
  );
}
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

export default App;
