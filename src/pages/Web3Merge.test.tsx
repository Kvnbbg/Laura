import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Web3Merge from './Web3Merge';

describe('Web3 merge desk', () => {
  it('states Laura as orchestrator and refuses custody', () => {
    render(<Web3Merge />);
    expect(screen.getByRole('heading', { name: /merge desk/i })).toBeInTheDocument();
    expect(screen.getByText(/laura orchestrates/i)).toBeInTheDocument();
    expect(screen.getByText(/custody/i)).toBeInTheDocument();
  });
});
