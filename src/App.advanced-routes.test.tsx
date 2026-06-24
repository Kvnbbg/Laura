import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App advanced route journeys', () => {
  it('navigates through advanced routes and displays route-specific headings', async () => {
    await import('./pages/MatrixCitizen');
    window.history.pushState({}, '', '/');
    render(<App />);

    fireEvent.click(screen.getAllByRole('link', { name: /dashboard/i })[0]);
    expect(screen.getByRole('heading', { name: /crm command center/i })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('link', { name: /growth lab/i })[0]);
    expect(screen.getByRole('heading', { name: /follow & like lift lab/i })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('link', { name: /eco hub/i })[0]);
    expect(screen.getByRole('heading', { name: /eco integration command center/i })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('link', { name: /open source/i })[0]);
    expect(screen.getByRole('heading', { name: /laura craft les moltbots pour techandstream/i })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('link', { name: /matrix/i })[0]);
    expect(
      await screen.findByRole(
        'heading',
        { name: /moltbots become matrixcitizen records/i },
        { timeout: 10000 },
      ),
    ).toBeInTheDocument();
  }, 60000);
});
