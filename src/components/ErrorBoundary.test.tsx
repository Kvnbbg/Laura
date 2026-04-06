import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrowserRouter, useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders fallback UI when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const ProblemChild = () => {
      throw new Error('Boom');
    };

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('restores in-app navigation loop when returning home from the fallback', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    window.history.pushState({}, '', '/boom');

    const RouteHarness = () => {
      const location = useLocation();
      if (location.pathname === '/boom') {
        throw new Error('Route crash');
      }

      return <h2>Recovered home route</h2>;
    };

    render(
      <BrowserRouter>
        <ErrorBoundary>
          <RouteHarness />
        </ErrorBoundary>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /back to home/i }));

    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { name: /recovered home route/i })).toBeInTheDocument();
  });
});
