import { render, screen } from '@testing-library/react';
import App from './App';

test('renders recon scan form', () => {
  render(<App />);
  expect(screen.getByText(/automated recon pipeline/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/enter target domain/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /initiate scan/i })).toBeInTheDocument();
});
