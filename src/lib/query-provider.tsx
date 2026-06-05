/**
 * TanStack Query provider for the app tree. Mounts the shared {@link queryClient} and, in dev
 * only, the React Query Devtools. Place this alongside the Chakra `UiProvider` near the root.
 */

import type { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './query-client';

export function QueryProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools are tree-shaken out of production builds via this guard. */}
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
