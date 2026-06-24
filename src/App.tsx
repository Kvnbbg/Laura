import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Growth from './pages/Growth';
import EcoHub from './pages/EcoHub';
import OpenSource from './pages/OpenSource';
import NotFound from './pages/NotFound';
import './styles/main.scss';

const MatrixCitizen = lazy(() => import('./pages/MatrixCitizen'));

const StaticPageRedirect = ({ to }: { to: string }) => {
  const location = useLocation();

  useEffect(() => {
    window.location.replace(`${to}${location.search}${location.hash}`);
  }, [to, location.search, location.hash]);

  return null;
};

const App = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/growth" element={<Growth />} />
            <Route path="/eco-hub" element={<EcoHub />} />
            <Route path="/open-source" element={<OpenSource />} />
            <Route path="/moltbots" element={<OpenSource />} />
            <Route
              path="/matrix-citizen"
              element={
                <Suspense fallback={<div role="status">Loading MatrixCitizen...</div>}>
                  <MatrixCitizen />
                </Suspense>
              }
            />
            <Route path="/budget-simulator" element={<StaticPageRedirect to="/budget-simulator.html" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </ErrorBoundary>
    </Router>
  );
};

export default App;
