import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { UiProvider } from './theme';
import { QueryProvider } from './lib/query-provider';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <UiProvider>
      <QueryProvider>
        <App />
      </QueryProvider>
    </UiProvider>
  </StrictMode>,
);
