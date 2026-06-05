import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { UiProvider } from './theme';
import { QueryProvider } from './lib/query-provider';
import { I18nProvider } from './i18n';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <I18nProvider>
      <UiProvider>
        <QueryProvider>
          <App />
        </QueryProvider>
      </UiProvider>
    </I18nProvider>
  </StrictMode>,
);
