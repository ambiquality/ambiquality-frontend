/**
 * Browser MSW worker (dev only). Started from `main.tsx` when `env.enableApiMocks` is on, so the
 * public map runs end-to-end before the backend ships the snapshot/aggregate endpoints.
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

/** Start the worker, bypassing any request the handlers don't explicitly match. */
export async function startMockWorker(): Promise<void> {
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  });
}
