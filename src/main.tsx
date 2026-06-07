import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { UiProvider } from './theme';
import { QueryProvider } from './lib/query-provider';
import { I18nProvider } from './i18n';
import { AuthProvider } from './auth/AuthProvider';
import { env } from './lib/env';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

/**
 * Optionally start the MSW mock worker before the app renders (so the first map query already hits
 * the mock). Gated on `env.enableApiMocks`; the worker module + handlers are dynamically imported
 * so they tree-shake out of a production build where mocks are off.
 */
async function enableMocks(): Promise<void> {
  if (!env.enableApiMocks) return;
  const { startMockWorker } = await import('./mocks/browser');
  await startMockWorker();
}

void enableMocks().then(() => {
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
});
