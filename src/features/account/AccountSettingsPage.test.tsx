import { describe, expect, it, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/render';
import { AccountSettingsPage } from './AccountSettingsPage';

const logout = vi.fn().mockResolvedValue(undefined);
const ME = { id: 'user-1', email: 'me@ex.cz', emailConfirmed: true };
vi.mock('@/auth/useAuth', () => ({
  useAuth: () => ({ user: ME, logout }),
}));

const post = vi.fn();
const del = vi.fn();
vi.mock('@/api/auth/client', () => ({
  authClient: {
    POST: (...args: unknown[]) => post(...args),
    DELETE: (...args: unknown[]) => del(...args),
  },
}));

function renderSettings() {
  return renderWithProviders(
    <Routes>
      <Route path="/operator/account" element={<AccountSettingsPage />} />
      <Route path="/login" element={<div>login-screen</div>} />
    </Routes>,
    { routerProps: { initialEntries: ['/operator/account'] } },
  );
}

beforeEach(() => {
  post.mockReset();
  del.mockReset();
  logout.mockClear();
});

describe('AccountSettingsPage', () => {
  it('shows the current account email and confirmation status', () => {
    renderSettings();
    expect(screen.getByText('me@ex.cz')).toBeInTheDocument();
    expect(screen.getByText('Email confirmed')).toBeInTheDocument();
  });

  it('changes the password and shows a success note (happy path)', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({ data: undefined });
    renderSettings();

    const section = screen.getByRole('region', { name: 'Change password' });
    const currentPw = section.querySelector<HTMLInputElement>(
      'input[autocomplete="current-password"]',
    )!;
    const newPw = section.querySelector<HTMLInputElement>('input[autocomplete="new-password"]')!;
    await user.type(currentPw, 'oldpassword');
    await user.type(newPw, 'newpassword1');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    await waitFor(() =>
      expect(screen.getByText('Your password has been changed.')).toBeInTheDocument(),
    );
    expect(post).toHaveBeenCalledWith('/v1/account/change-password', {
      body: { currentPassword: 'oldpassword', newPassword: 'newpassword1' },
    });
  });

  it('deletes the account after typed confirmation, then signs out and redirects (happy path)', async () => {
    const user = userEvent.setup();
    del.mockResolvedValue({ data: undefined });
    renderSettings();

    const section = screen.getByRole('region', { name: 'Delete account' });
    const currentPw = section.querySelector<HTMLInputElement>(
      'input[autocomplete="current-password"]',
    )!;
    const confirm = section.querySelector<HTMLInputElement>('input:not([autocomplete])')!;

    await user.type(currentPw, 'mypassword');
    await user.type(confirm, 'DELETE');
    await user.click(screen.getByRole('button', { name: 'Permanently delete account' }));

    await waitFor(() => expect(screen.getByText('login-screen')).toBeInTheDocument());
    expect(del).toHaveBeenCalledWith('/v1/account/{id}', {
      params: { path: { id: 'user-1' } },
      body: { currentPassword: 'mypassword' },
    });
    expect(logout).toHaveBeenCalled();
  });
});
