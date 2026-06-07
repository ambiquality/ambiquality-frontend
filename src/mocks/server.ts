/**
 * Node MSW server for tests. Unlike the browser worker, this isn't installed globally — test files
 * that exercise the map's data flow import and start it themselves (`beforeAll`/`afterAll`) so the
 * rest of the suite, which stubs `fetch`/clients directly, is unaffected.
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
