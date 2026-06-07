import type { PropsWithChildren, ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { UiProvider } from '@/theme';
import { I18nProvider } from '@/i18n';
import { createQueryClient } from '@/lib/query-client';
import { AuthProvider } from '@/auth/AuthProvider';
import { UnitPreferenceProvider } from '@/units';

export interface RenderWithProvidersOptions extends RenderOptions {
  /** Wrap in a `MemoryRouter` (needed for screens that use router hooks/links). */
  withRouter?: boolean;
  /** Initial router entries (e.g. `['/login']` or with `state`). Implies `withRouter`. */
  routerProps?: MemoryRouterProps;
  /** Wrap in the real `AuthProvider` (needed for screens/components that call `useAuth`). */
  withAuth?: boolean;
}

/**
 * Render helper that mounts a component inside the app's providers: i18n (so tests can assert
 * translated text), Chakra `UiProvider` (theme + color mode), and an **isolated** TanStack
 * Query client (created per render so test cases don't share cache).
 *
 * Phase 4 adds two opt-in wrappers:
 *  - `withRouter`/`routerProps` → a `MemoryRouter` for router hooks/links,
 *  - `withAuth` → the real `AuthProvider` (tests stub `authClient`/`fetch` so it never hits a
 *    live backend; the provider installs the live `TokenStore` into the middleware on mount).
 */
export function renderWithProviders(ui: ReactElement, options?: RenderWithProvidersOptions) {
  const { withRouter, routerProps, withAuth, ...renderOptions } = options ?? {};
  // Fresh client per render keeps query cache from leaking across tests.
  const queryClient = createQueryClient();

  function Wrapper({ children }: PropsWithChildren) {
    const routed =
      withRouter || routerProps ? (
        <MemoryRouter {...routerProps}>{children}</MemoryRouter>
      ) : (
        children
      );
    const authed = withAuth ? <AuthProvider>{routed}</AuthProvider> : routed;
    return (
      <I18nProvider>
        <UiProvider>
          <QueryClientProvider client={queryClient}>
            <UnitPreferenceProvider>{authed}</UnitPreferenceProvider>
          </QueryClientProvider>
        </UiProvider>
      </I18nProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export * from '@testing-library/react';
