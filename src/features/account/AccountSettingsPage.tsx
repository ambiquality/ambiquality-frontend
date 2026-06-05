import { useState, type FormEvent } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Heading,
  Input,
  Separator,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FormField, FormActions, ProblemError } from '@/components';
import { ProblemError as ProblemErrorObject } from '@/api/middleware/problem-details';
import { authClient } from '@/api/auth/client';
import { useAuth } from '@/auth/useAuth';
import { passwordValidator, emailValidator, requiredValidator } from './validation';

/**
 * F03/F04 account settings (authenticated, behind `ProtectedRoute`). One screen, several small
 * forms each routed through the shared primitives (KON): show `me`, change password, change email
 * (202 → "confirm via email"), sign out, and delete account (current-password + explicit typed
 * confirmation; uses `me.id`). Every mutation surfaces RFC 9457 problems via `ProblemError`.
 */
export function AccountSettingsPage() {
  const { t } = useTranslation('account');
  const { user } = useAuth();

  // `user` is always set here (ProtectedRoute gates on isAuthenticated ⇒ user !== null).
  if (!user) return null;

  return (
    <Box maxW="lg" mx="auto">
      <Heading size="2xl" mb="6">
        {t('settings.title')}
      </Heading>

      <VStack gap="8" align="stretch">
        <ProfileSection email={user.email} emailConfirmed={user.emailConfirmed} />
        <Separator />
        <ChangePasswordSection />
        <Separator />
        <ChangeEmailSection />
        <Separator />
        <LogoutSection />
        <Separator />
        <DeleteAccountSection userId={user.id} />
      </VStack>
    </Box>
  );
}

function ProfileSection({ email, emailConfirmed }: { email: string; emailConfirmed: boolean }) {
  const { t } = useTranslation('account');
  return (
    <Box>
      <Text fontWeight="medium">{t('settings.emailLabel')}</Text>
      <Stack direction="row" align="center" gap="3" mt="1">
        <Text>{email}</Text>
        <Badge colorPalette={emailConfirmed ? 'green' : 'orange'}>
          {emailConfirmed ? t('settings.statusConfirmed') : t('settings.statusUnconfirmed')}
        </Badge>
      </Stack>
    </Box>
  );
}

function ChangePasswordSection() {
  const { t } = useTranslation('account');
  const { t: tf } = useTranslation('forms');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [problem, setProblem] = useState<ProblemErrorObject | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setProblem(null);
    setDone(false);
    setSubmitting(true);
    try {
      await authClient.POST('/v1/account/change-password', {
        body: { currentPassword, newPassword },
      });
      setDone(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      if (error instanceof ProblemErrorObject) setProblem(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box as="section" aria-labelledby="change-password-heading">
      <Heading id="change-password-heading" size="md" mb="4">
        {t('settings.changePasswordTitle')}
      </Heading>
      <form onSubmit={handleSubmit} noValidate>
        <VStack gap="4" align="stretch">
          {done && <SuccessNote>{t('settings.changePasswordDone')}</SuccessNote>}
          <ProblemError error={problem} />
          <FormField
            label={t('fields.currentPassword')}
            required
            validate={requiredValidator(tf('validation.required'))}
          >
            <Input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </FormField>
          <FormField
            label={t('fields.newPassword')}
            required
            validate={passwordValidator({
              required: tf('validation.required'),
              tooShort: tf('validation.passwordTooShort'),
            })}
          >
            <Input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </FormField>
          <FormActions>
            <Button type="submit" colorPalette="brand" loading={submitting}>
              {t('settings.changePasswordSubmit')}
            </Button>
          </FormActions>
        </VStack>
      </form>
    </Box>
  );
}

function ChangeEmailSection() {
  const { t } = useTranslation('account');
  const { t: tf } = useTranslation('forms');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [problem, setProblem] = useState<ProblemErrorObject | null>(null);
  const [pending, setPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setProblem(null);
    setPending(false);
    setSubmitting(true);
    try {
      // 202 Accepted: change is async — applied only once the new address is confirmed.
      await authClient.POST('/v1/account/change-email', {
        body: { currentPassword, newEmail },
      });
      setPending(true);
      setCurrentPassword('');
      setNewEmail('');
    } catch (error) {
      if (error instanceof ProblemErrorObject) setProblem(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box as="section" aria-labelledby="change-email-heading">
      <Heading id="change-email-heading" size="md" mb="4">
        {t('settings.changeEmailTitle')}
      </Heading>
      <form onSubmit={handleSubmit} noValidate>
        <VStack gap="4" align="stretch">
          {pending && <SuccessNote>{t('settings.changeEmailPending')}</SuccessNote>}
          <ProblemError error={problem} />
          <FormField
            label={t('fields.currentPassword')}
            required
            validate={requiredValidator(tf('validation.required'))}
          >
            <Input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </FormField>
          <FormField
            label={t('fields.newEmail')}
            required
            validate={emailValidator({
              required: tf('validation.required'),
              invalid: tf('validation.email'),
            })}
          >
            <Input
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </FormField>
          <FormActions>
            <Button type="submit" colorPalette="brand" loading={submitting}>
              {t('settings.changeEmailSubmit')}
            </Button>
          </FormActions>
        </VStack>
      </form>
    </Box>
  );
}

function LogoutSection() {
  const { t } = useTranslation('account');
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  async function handleLogout() {
    setSubmitting(true);
    await logout();
    setSubmitting(false);
    navigate('/login', { replace: true });
  }

  return (
    <Box as="section" aria-labelledby="logout-heading">
      <Heading id="logout-heading" size="md" mb="4">
        {t('settings.logoutTitle')}
      </Heading>
      <Button variant="outline" onClick={handleLogout} loading={submitting}>
        {t('settings.logoutSubmit')}
      </Button>
    </Box>
  );
}

function DeleteAccountSection({ userId }: { userId: string }) {
  const { t } = useTranslation('account');
  const { t: tf } = useTranslation('forms');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const keyword = t('settings.deleteConfirmKeyword');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [problem, setProblem] = useState<ProblemErrorObject | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const confirmed = confirmText.trim() === keyword;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setProblem(null);
    setGenericError(null);
    if (!confirmed) return;

    setSubmitting(true);
    try {
      await authClient.DELETE('/v1/account/{id}', {
        params: { path: { id: userId } },
        body: { currentPassword },
      });
      // Account gone: clear local session and leave the operator area.
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      if (error instanceof ProblemErrorObject) {
        if (error.httpStatus === 403) {
          setGenericError(t('settings.deleteForbidden'));
        } else {
          setProblem(error);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box as="section" aria-labelledby="delete-account-heading">
      <Heading id="delete-account-heading" size="md" mb="2" color="fg.error">
        {t('settings.dangerTitle')}
      </Heading>
      <Text color="fg.muted" mb="4">
        {t('settings.dangerBody')}
      </Text>
      <form onSubmit={handleSubmit} noValidate>
        <VStack gap="4" align="stretch">
          {genericError && (
            <Text color="fieldError.fg" role="alert">
              {genericError}
            </Text>
          )}
          <ProblemError error={problem} />
          <FormField
            label={t('fields.currentPassword')}
            required
            validate={requiredValidator(tf('validation.required'))}
          >
            <Input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </FormField>
          <FormField
            label={t('settings.deleteConfirmLabel')}
            required
            validate={(value) =>
              value.trim() === keyword ? null : t('settings.deleteConfirmMismatch')
            }
          >
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
          </FormField>
          <FormActions>
            <Button
              type="submit"
              colorPalette="red"
              loading={submitting}
              disabled={!confirmed || currentPassword === ''}
            >
              {t('settings.deleteSubmit')}
            </Button>
          </FormActions>
        </VStack>
      </form>
    </Box>
  );
}

function SuccessNote({ children }: { children: React.ReactNode }) {
  return (
    <Alert.Root status="success">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Description>{children}</Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}
