import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authHeaderMiddleware, refreshMiddleware, __resetRefreshStateForTests } from './auth';
import { setTokenStore, InMemoryTokenStore, type TokenStore } from './token-store';

// openapi-fetch middleware callbacks receive more context than we use; build the minimal
// slice the middleware actually reads. `options`/`schemaPath`/`params`/`id` are required by
// the type but unused here.
function onResponseCtx(request: Request, response: Response) {
  return {
    request,
    response,
    options: {} as never,
    schemaPath: '',
    params: {},
    id: 'test',
  };
}

function onRequestCtx(request: Request) {
  return { request, options: {} as never, schemaPath: '', params: {}, id: 'test' };
}

afterEach(() => {
  __resetRefreshStateForTests();
  setTokenStore(new InMemoryTokenStore());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('authHeaderMiddleware', () => {
  it('attaches the bearer token when present', async () => {
    const store = new InMemoryTokenStore();
    store.setTokens({ accessToken: 'access-123' });
    setTokenStore(store);

    const request = new Request('https://api.test/v1/account/me');
    const out = await authHeaderMiddleware.onRequest!(onRequestCtx(request));
    expect((out as Request).headers.get('Authorization')).toBe('Bearer access-123');
  });

  it('leaves the request unauthenticated when there is no token', async () => {
    setTokenStore(new InMemoryTokenStore());
    const request = new Request('https://api.test/v1/buildings');
    const out = await authHeaderMiddleware.onRequest!(onRequestCtx(request));
    // returns undefined (no mutation) -> original request has no auth header
    expect(request.headers.get('Authorization')).toBeNull();
    expect(out === undefined || (out as Request).headers.get('Authorization') === null).toBe(true);
  });
});

describe('refreshMiddleware single-flight (pitfall #8)', () => {
  beforeEach(() => {
    __resetRefreshStateForTests();
  });

  it('passes non-401 responses straight through', async () => {
    const ok = new Response('{}', { status: 200 });
    const out = await refreshMiddleware.onResponse!(
      onResponseCtx(new Request('https://api.test/x'), ok),
    );
    expect(out).toBe(ok);
  });

  it('triggers exactly ONE refresh for many concurrent 401s and replays each', async () => {
    let refreshCalls = 0;
    const store: TokenStore = {
      getAccessToken: () => 'stale',
      getRefreshToken: () => 'refresh-token',
      refresh: vi.fn(async () => {
        refreshCalls += 1;
        // simulate latency so all three 401s overlap on the same in-flight promise
        await new Promise((r) => setTimeout(r, 10));
        return { accessToken: 'fresh-token' };
      }),
      onAuthFailure: vi.fn(),
    };
    setTokenStore(store);

    // The middleware replays via global fetch; capture the replays.
    const replays: Request[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (req: Request) => {
        replays.push(req);
        return new Response('{}', { status: 200 });
      }),
    );

    const make401 = (path: string) =>
      refreshMiddleware.onResponse!(
        onResponseCtx(new Request(`https://api.test${path}`), new Response('{}', { status: 401 })),
      );

    const results = await Promise.all([make401('/v1/a'), make401('/v1/b'), make401('/v1/c')]);

    // Exactly one refresh despite three concurrent 401s.
    expect(refreshCalls).toBe(1);
    // Each original request was replayed with the fresh token + retry marker.
    expect(replays).toHaveLength(3);
    for (const replay of replays) {
      expect(replay.headers.get('Authorization')).toBe('Bearer fresh-token');
      expect(replay.headers.get('x-amq-retry')).toBe('1');
    }
    for (const res of results) {
      expect((res as Response).status).toBe(200);
    }
    expect(store.onAuthFailure).not.toHaveBeenCalled();
  });

  it('hard-logs-out when refresh fails and returns the original 401', async () => {
    const onAuthFailure = vi.fn();
    const store: TokenStore = {
      getAccessToken: () => 'stale',
      getRefreshToken: () => 'refresh-token',
      refresh: vi.fn(async () => {
        throw new Error('refresh token expired');
      }),
      onAuthFailure,
    };
    setTokenStore(store);

    const original = new Response('{}', { status: 401 });
    const out = await refreshMiddleware.onResponse!(
      onResponseCtx(new Request('https://api.test/v1/x'), original),
    );
    expect(onAuthFailure).toHaveBeenCalledOnce();
    expect(out).toBe(original);
  });

  it('hard-logs-out immediately when there is no refresh token', async () => {
    const onAuthFailure = vi.fn();
    const store: TokenStore = {
      getAccessToken: () => null,
      getRefreshToken: () => null,
      refresh: vi.fn(),
      onAuthFailure,
    };
    setTokenStore(store);

    const original = new Response('{}', { status: 401 });
    const out = await refreshMiddleware.onResponse!(
      onResponseCtx(new Request('https://api.test/v1/x'), original),
    );
    expect(store.refresh).not.toHaveBeenCalled();
    expect(onAuthFailure).toHaveBeenCalledOnce();
    expect(out).toBe(original);
  });

  it('does not refresh again for an already-retried request (no loop)', async () => {
    const store: TokenStore = {
      getAccessToken: () => 'x',
      getRefreshToken: () => 'r',
      refresh: vi.fn(),
      onAuthFailure: vi.fn(),
    };
    setTokenStore(store);

    const retried = new Request('https://api.test/v1/x', { headers: { 'x-amq-retry': '1' } });
    const original = new Response('{}', { status: 401 });
    const out = await refreshMiddleware.onResponse!(onResponseCtx(retried, original));
    expect(store.refresh).not.toHaveBeenCalled();
    expect(out).toBe(original);
  });
});
