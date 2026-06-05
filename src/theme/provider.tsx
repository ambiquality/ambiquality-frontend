'use client';

import { ChakraProvider } from '@chakra-ui/react';
import type { PropsWithChildren } from 'react';
import { ColorModeProvider } from './color-mode';
import { system } from './system';

/**
 * App-wide UI provider: wires the Ambiquality Chakra v3 `system` and color-mode
 * support. Mount this once near the root, above the router.
 */
export function UiProvider({ children }: PropsWithChildren) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider>{children}</ColorModeProvider>
    </ChakraProvider>
  );
}
