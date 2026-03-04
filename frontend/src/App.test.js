import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock(
  'react-router-dom',
  () => ({
    BrowserRouter: ({ children }) => <>{children}</>,
    Routes: ({ children }) => <>{children}</>,
    Route: ({ element }) => element,
    NavLink: ({ children }) => <>{children}</>,
    Link: ({ children }) => <>{children}</>,
  }),
  { virtual: true }
);

import App from './App';

test('renders exhibits and attractions homepage title', () => {
  render(<App />);
  const titleElement = screen.getByText(/For the Wild/i);
  expect(titleElement).toBeInTheDocument();
});
