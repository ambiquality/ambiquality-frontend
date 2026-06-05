import { describe, expect, it, vi, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/render';
import type { LoginOutcome } from '@/auth/auth-context';
import { LoginPage } from './LoginPage';

const login = vi.fn<(email: string, password: string) => Promise<LoginOutcome>>();
vi.mock('@/auth/useAuth', () => ({
  useAuth: () => ({ login, isAuthenticated: false }),
}));

function renderLogin(initialEntry: { pathname: string; state?: unknown } | string = '/login') {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<div>admin-home</div>} />
      <Route path="/admin/buildings" element={<div>buildings-screen</div>} />
    </Routes>,
    { routerProps: { initialEntries: [initialEntry] } },
  );
}

async function fillCredentials(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/email/i), 'a@b.cz');
  await user.type(screen.getByLabelText(/^password/i), 'password1');
}

afterEach(() => {
  login.mockReset();
});

describe('LoginPage', () => {
  it('shows a generic message on invalid credentials (never reveals email existence)', async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({ ok: false, reason: 'invalid-credentials' });
    renderLogin();

    await fillCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Email or password is incorrect.')).toBeInTheDocument();
    expect(screen.queryByText('admin-home')).not.toBeInTheDocument();
  });

  it('shows a rate-limit message with the Retry-After seconds on 429', async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({ ok: false, reason: 'rate-limited', retryAfterSeconds: 30 });
    renderLogin();

    await fillCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByText('Too many attempts. Please try again in 30 s.'),
    ).toBeInTheDocument();
  });

  it('redirects to the intended location on success', async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({ ok: true });
    renderLogin({ pathname: '/login', state: { from: { pathname: '/admin/buildings' } } });

    await fillCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('buildings-screen')).toBeInTheDocument();
  });
});
