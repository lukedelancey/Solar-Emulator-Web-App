import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock all service imports to avoid axios issues
jest.mock('./services', () => ({}));
jest.mock('./components/ApiTestPageFixed', () => {
  return function MockApiTestPage() {
    return <div>API Test Page</div>;
  };
});

import App from './App';

test('renders Solar PV Emulator app', () => {
  render(<App />);
  const headingElement = screen.getByRole('heading', { name: /Solar PV Emulator/i });
  expect(headingElement).toBeInTheDocument();
});
