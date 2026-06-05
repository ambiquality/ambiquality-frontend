import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { i18n } from '@/i18n';
import {
  ProblemError as ProblemErrorObject,
  parseProblemDetails,
} from '@/api/middleware/problem-details';
import { ProblemError } from './ProblemError';

function makeError(body: unknown, httpStatus = 400) {
  return new ProblemErrorObject(parseProblemDetails(body), httpStatus, null);
}

describe('ProblemError component', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders no alert for a nullish error', () => {
    renderWithProviders(<ProblemError error={null} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('maps a known type URN to a localized message via the errors namespace', () => {
    const error = makeError(
      { type: 'urn:ambiquality:auth:invalid-credentials', title: 'Unauthorized', status: 401 },
      401,
    );
    renderWithProviders(<ProblemError error={error} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Email or password is incorrect.')).toBeInTheDocument();
  });

  it('localizes the same URN in Czech', async () => {
    await i18n.changeLanguage('cs');
    const error = makeError({ type: 'urn:ambiquality:auth:invalid-credentials' }, 401);
    renderWithProviders(<ProblemError error={error} />);
    expect(screen.getByText('E-mail nebo heslo je nesprávné.')).toBeInTheDocument();
  });

  it('falls back to server detail/title for an unmapped URN', () => {
    const error = makeError(
      { type: 'urn:ambiquality:unknown:weird', detail: 'A very specific server message.' },
      400,
    );
    renderWithProviders(<ProblemError error={error} />);
    expect(screen.getByText('A very specific server message.')).toBeInTheDocument();
  });

  it('surfaces ValidationProblemDetails field errors', () => {
    const error = makeError(
      {
        type: 'urn:ambiquality:evidence:validation',
        errors: { name: ['Required'], year: ['Out of range'] },
      },
      422,
    );
    renderWithProviders(<ProblemError error={error} />);
    expect(screen.getByText(/please correct the following/i)).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText(/: Required/)).toBeInTheDocument();
    expect(screen.getByText('year')).toBeInTheDocument();
  });
});
