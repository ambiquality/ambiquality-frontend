'use client';

import { ChakraProvider } from '@chakra-ui/react';
import type { PropsWithChildren } from 'react';
import { system } from './system';

/**
 * App-wide UI provider: wires the Ambiquality Chakra v3 `system`. The app is light-only
 * (no color-mode switching). Mount this once near the root, above the router.
 */
export function UiProvider({ children }: PropsWithChildren) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
