import { describe, expect, it } from 'vitest';
import {
  parseProblemDetails,
  problemErrorFromResponse,
  ProblemError,
  AMBIQUALITY_PROBLEM_URN_PREFIX,
} from './problem-details';

describe('parseProblemDetails', () => {
  it('parses a full RFC 9457 body with Ambiquality type URN', () => {
    const result = parseProblemDetails({
      type: 'urn:ambiquality:auth:invalid-credentials',
      title: 'Invalid credentials',
      status: 401,
      detail: 'Email or password is incorrect.',
      instance: '/v1/login',
    });
    expect(result.type).toBe('urn:ambiquality:auth:invalid-credentials');
    expect(result.status).toBe(401);
    expect(result.detail).toBe('Email or password is incorrect.');
    expect(result.errors).toEqual({});
  });

  it('coerces string status to a number (spec types status as int|string|null)', () => {
    expect(parseProblemDetails({ status: '429' }).status).toBe(429);
    expect(parseProblemDetails({ status: 'oops' }).status).toBeNull();
    expect(parseProblemDetails({}).status).toBeNull();
  });

  it('extracts ValidationProblemDetails field errors', () => {
    const result = parseProblemDetails({
      type: 'urn:ambiquality:evidence:validation',
      errors: { name: ['Required'], year: ['Out of range', 'Too small'] },
    });
    expect(result.errors).toEqual({ name: ['Required'], year: ['Out of range', 'Too small'] });
  });

  it('preserves unknown extension members', () => {
    const result = parseProblemDetails({ type: 'x', traceId: 'abc', balance: 30 });
    expect(result.extensions).toEqual({ traceId: 'abc', balance: 30 });
  });

  it('is tolerant of non-object / null bodies', () => {
    expect(parseProblemDetails(null).type).toBeNull();
    expect(parseProblemDetails('not json').errors).toEqual({});
  });
});

describe('problemErrorFromResponse', () => {
  it('builds a ProblemError from a problem+json response and keeps the body readable', async () => {
    const response = new Response(
      JSON.stringify({ type: 'urn:ambiquality:public:not-found', title: 'Not found', status: 404 }),
      { status: 404, headers: { 'content-type': 'application/problem+json' } },
    );
    const err = await problemErrorFromResponse(response);
    expect(err).toBeInstanceOf(ProblemError);
    expect(err.httpStatus).toBe(404);
    expect(err.code).toBe('urn:ambiquality:public:not-found');
    expect(err.isAmbiquality).toBe(true);
    expect(err.code?.startsWith(AMBIQUALITY_PROBLEM_URN_PREFIX)).toBe(true);
    // Original response body must still be consumable (we cloned before reading).
    await expect(response.json()).resolves.toMatchObject({ status: 404 });
  });

  it('parses Retry-After (seconds) for rate-limited responses', async () => {
    const response = new Response('{}', { status: 429, headers: { 'retry-after': '30' } });
    const err = await problemErrorFromResponse(response);
    expect(err.httpStatus).toBe(429);
    expect(err.retryAfterSeconds).toBe(30);
  });

  it('falls back gracefully when the body is not valid JSON', async () => {
    const response = new Response('<html>502</html>', { status: 502, statusText: 'Bad Gateway' });
    const err = await problemErrorFromResponse(response);
    expect(err.httpStatus).toBe(502);
    expect(err.problem.status).toBe(502);
    expect(err.isAmbiquality).toBe(false);
  });
});
