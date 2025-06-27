import { render, screen } from '@testing-library/react';
import App from './App';
import { expect, test } from 'vitest';

test('renders header', () => {
  render(<App />);
  const linkElement = screen.getByText(/Raspored Ispita/i);
  expect(linkElement).toBeInTheDocument();
});
