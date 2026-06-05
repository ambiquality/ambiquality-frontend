// OpenAPI codegen for the three Ambiquality backend services.
//
// Default (`npm run gen:api`): generate typed schema modules from the VENDORED specs in
// `openapi/` — works fully offline so the build never depends on a running backend.
//
// `npm run gen:api:fetch` (or `node scripts/gen-api.mjs --fetch`): first re-pull each spec
// from the live backend (base URLs from the env / .env), overwrite the vendored copies,
// then generate. Use this to refresh the vendored specs when the backend contract changes.
//
// Output: one `src/api/<service>/schema.d.ts` per service, consumed by the typed
// `openapi-fetch` client in `src/api/<service>/client.ts`.

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

/**
 * Each service: the vendored spec we generate from, the schema module we emit, and the
 * live `/openapi/v1.json` URL used by `--fetch` to refresh the vendored copy.
 *
 * The live URLs mirror the dev Caddy routes (see `.env.example`). `--fetch` honours the
 * matching `VITE_*_API_BASE` env var when set, falling back to the dev defaults.
 */
const services = [
  {
    name: 'auth',
    spec: 'openapi/auth.json',
    out: 'src/api/auth/schema.d.ts',
    envBase: 'VITE_AUTH_API_BASE',
    devBase: 'http://localhost:8080/auth',
  },
  {
    name: 'evidence',
    spec: 'openapi/evidence.json',
    out: 'src/api/evidence/schema.d.ts',
    envBase: 'VITE_EVIDENCE_API_BASE',
    devBase: 'http://localhost:8080/evidence',
  },
  {
    name: 'public',
    spec: 'openapi/public.json',
    out: 'src/api/public/schema.d.ts',
    envBase: 'VITE_PUBLIC_API_BASE',
    devBase: 'http://localhost:8080/public',
  },
];

const shouldFetch = process.argv.includes('--fetch');

async function refreshVendoredSpec(service) {
  const base = (process.env[service.envBase] ?? service.devBase).replace(/\/+$/, '');
  const url = `${base}/openapi/v1.json`;
  process.stdout.write(`[gen:api] fetching ${service.name} spec from ${url}\n`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  // Re-serialize so the vendored file is stable/pretty-printed regardless of server output.
  const json = await res.json();
  writeFileSync(resolve(root, service.spec), `${JSON.stringify(json, null, 2)}\n`);
}

function generate(service) {
  const specPath = resolve(root, service.spec);
  const outPath = resolve(root, service.out);
  mkdirSync(dirname(outPath), { recursive: true });
  process.stdout.write(`[gen:api] generating ${service.out} from ${service.spec}\n`);
  // openapi-typescript writes the module itself; --enum keeps things plain, default output
  // is a single `paths`/`components` types module we re-export from client.ts.
  execFileSync(
    'node',
    [resolve(root, 'node_modules/openapi-typescript/bin/cli.js'), specPath, '--output', outPath],
    { stdio: 'inherit', cwd: root },
  );
}

async function main() {
  for (const service of services) {
    if (shouldFetch) {
      await refreshVendoredSpec(service);
    }
    generate(service);
  }
  process.stdout.write('[gen:api] done.\n');
}

main().catch((err) => {
  process.stderr.write(`[gen:api] ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
