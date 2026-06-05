import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { UiProvider } from './theme';
import { QueryProvider } from './lib/query-provider';
import { I18nProvider } from './i18n';
import { AuthProvider } from './auth/AuthProvider';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <I18nProvider>
      <UiProvider>
        <QueryProvider>
          {/* AuthProvider wraps the router (App) so every route can `useAuth`, while the provider
              itself stays outside the router — it never needs navigation, and a hard auth failure
              simply clears state so ProtectedRoute redirects to /login. */}
          <AuthProvider>
            <App />
          </AuthProvider>
        </QueryProvider>
      </UiProvider>
    </I18nProvider>
  </StrictMode>,
);
