import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App user journeys', () => {
  it('renders primary navigation entries', () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    expect(screen.getAllByRole('link', { name: /home/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /about/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /contact/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /chat/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /eco hub/i }).length).toBeGreaterThan(0);
  });

  it('allows navigating from home to contact and switching contact methods', () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    fireEvent.click(screen.getAllByRole('link', { name: /contact/i })[0]);
    expect(screen.getByRole('heading', { name: /let's start a conversation/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /quick message/i }));
    expect(screen.getByRole('heading', { name: /quick message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /full portal/i }));
    expect(screen.getByRole('heading', { name: /visit our contact center/i })).toBeInTheDocument();
  });

  it('recovers from an unknown route through the 404 flow', () => {
    window.history.pushState({}, '', '/definitely-missing');
    render(<App />);

    expect(screen.getByRole('heading', { name: /404 - lost in the cosmos/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /return home/i }));
    expect(screen.getByRole('heading', { name: /welcome to laura/i })).toBeInTheDocument();
  });

  it('navigates through advanced routes and displays route-specific headings', () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    fireEvent.click(screen.getAllByRole('link', { name: /dashboard/i })[0]);
    expect(screen.getByRole('heading', { name: /crm command center/i })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('link', { name: /growth lab/i })[0]);
    expect(screen.getByRole('heading', { name: /follow & like lift lab/i })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('link', { name: /eco hub/i })[0]);
    expect(screen.getByRole('heading', { name: /eco integration command center/i })).toBeInTheDocument();
  });

  it('keeps chat flow resilient by trimming input and unblocking after response', async () => {
    window.history.pushState({}, '', '/chat');
    render(<App />);

    const input = screen.getByPlaceholderText(/ask anything/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: '   '} });
    fireEvent.click(sendButton);
    expect(screen.queryByText('   ')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: '   Quantum diagnostics   ' } });
    fireEvent.click(sendButton);
    expect(screen.getByText('Quantum diagnostics')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled();
    }, { timeout: 4000 });
  });
});
