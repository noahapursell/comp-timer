import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Timers Dashboard heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/Timers Dashboard/i);
  expect(headingElement).toBeInTheDocument();
});
