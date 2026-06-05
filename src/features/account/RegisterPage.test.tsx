import { describe, expect, it, vi, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import type { RegisterOutcome } from '@/auth/auth-context';
import { RegisterPage } from './RegisterPage';

const register = vi.fn<(email: string, password: string) => Promise<RegisterOutcome>>();
vi.mock('@/auth/useAuth', () => ({
  useAuth: () => ({ register }),
}));

// The resend affordance calls the auth client directly; stub it so it never hits the network.
const post = vi.fn().mockResolvedValue({ data: undefined });
vi.mock('@/api/auth/client', () => ({
  authClient: { POST: (...args: unknown[]) => post(...args) },
}));

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^email/i), 'new@user.cz');
  await user.type(screen.getByLabelText(/^password/i), 'password1');
  await user.type(screen.getByLabelText(/confirm password/i), 'password1');
}

afterEach(() => {
  register.mockReset();
  post.mockClear();
});

describe('RegisterPage', () => {
  it('shows the "check your email" state on a 201 success', async () => {
    const user = userEvent.setup();
    register.mockResolvedValue({ ok: true });
    renderWithProviders(<RegisterPage />, { withRouter: true });

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Check your email')).toBeInTheDocument();
    expect(screen.getByText(/We sent a confirmation link to new@user.cz/)).toBeInTheDocument();
    expect(register).toHaveBeenCalledWith('new@user.cz', 'password1');
  });

  it('blocks submission and shows a mismatch error when the passwords differ', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { withRouter: true });

    await user.type(screen.getByLabelText(/^email/i), 'new@user.cz');
    await user.type(screen.getByLabelText(/^password/i), 'password1');
    await user.type(screen.getByLabelText(/confirm password/i), 'different1');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('The passwords do not match.')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('shows a generic message on 409 conflict (anti-enumeration)', async () => {
    const user = userEvent.setup();
    register.mockResolvedValue({ ok: false, reason: 'conflict', error: null });
    renderWithProviders(<RegisterPage />, { withRouter: true });

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText(/a confirmation link has been sent/i)).toBeInTheDocument();
    // Anti-enumeration: the message must NOT state the email is already registered/in use.
    expect(screen.queryByText(/already registered|already in use|email exists/i)).toBeNull();
  });
});
