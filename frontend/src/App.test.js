import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page by default', () => {
  render(<App />);
  const loginHeading = screen.getByText(/team login/i);
  expect(loginHeading).toBeInTheDocument();
});
