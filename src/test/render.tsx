import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { UiProvider } from '@/theme';

/**
 * Render helper that mounts a component inside the app's `UiProvider` (Chakra system +
 * color mode), so component tests get the real theme. Add the router/query providers
 * here as later phases introduce them.
 */
export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: UiProvider, ...options });
}

export * from '@testing-library/react';
