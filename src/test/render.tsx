import type { PropsWithChildren, ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { UiProvider } from '@/theme';
import { I18nProvider } from '@/i18n';
import { createQueryClient } from '@/lib/query-client';

/**
 * Render helper that mounts a component inside the app's providers: i18n (so tests can assert
 * translated text), Chakra `UiProvider` (theme + color mode), and an **isolated** TanStack
 * Query client (created per render so test cases don't share cache). Add the router provider
 * here as later phases introduce it.
 */
export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  // Fresh client per render keeps query cache from leaking across tests.
  const queryClient = createQueryClient();
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <I18nProvider>
        <UiProvider>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </UiProvider>
      </I18nProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
