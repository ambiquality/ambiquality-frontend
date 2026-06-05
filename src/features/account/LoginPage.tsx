import { useState, type FormEvent } from 'react';
import { Box, Button, Heading, Input, Link as ChakraLink, Text, VStack } from '@chakra-ui/react';
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FormField, FormActions } from '@/components';
import { useAuth } from '@/auth/useAuth';
import { emailValidator, passwordValidator } from './validation';

interface FromState {
  from?: { pathname?: string };
}

/**
 * F02 login. Email/password through the shared `FormField`/`FormActions` primitives (KON).
 *
 * Auth-failure handling follows the contract:
 *  - **401** → a single GENERIC "invalid credentials" message (anti-enumeration; never reveals
 *    whether the email exists),
 *  - **429** → a rate-limit notice that reads `Retry-After` and tells the user when to retry,
 *  - on success → redirect to the location the user was sent here from (`ProtectedRoute` puts it
 *    in router state as `from`), defaulting to `/admin`.
 */
export function LoginPage() {
  const { t } = useTranslation('account');
  const { t: tf } = useTranslation('forms');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const returnTo = (location.state as FromState | null)?.from?.pathname ?? '/admin';

  // Already signed in (e.g. navigated here directly): bounce to the operator area.
  if (isAuthenticated) {
    return <Navigate to={returnTo} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const outcome = await login(email, password);
    setSubmitting(false);

    if (outcome.ok) {
      navigate(returnTo, { replace: true });
      return;
    }
    if (outcome.reason === 'invalid-credentials') {
      setFormError(t('login.invalidCredentials'));
      return;
    }
    if (outcome.reason === 'rate-limited') {
      setFormError(
        outcome.retryAfterSeconds != null
          ? t('login.rateLimited', { seconds: String(outcome.retryAfterSeconds) })
          : t('login.rateLimitedNoTime'),
      );
      return;
    }
    setFormError(t('login.invalidCredentials'));
  }

  return (
    <Box maxW="sm" mx="auto">
      <Heading size="2xl" mb="6">
        {t('login.title')}
      </Heading>

      <form onSubmit={handleSubmit} noValidate>
        <VStack gap="4" align="stretch">
          {formError && (
            <Text color="fieldError.fg" role="alert">
              {formError}
            </Text>
          )}

          <FormField
            label={t('fields.email')}
            required
            validate={emailValidator({
              required: tf('validation.required'),
              invalid: tf('validation.email'),
            })}
          >
            <Input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>

          <FormField
            label={t('fields.password')}
            required
            validate={passwordValidator({
              required: tf('validation.required'),
              tooShort: tf('validation.passwordTooShort'),
            })}
          >
            <Input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormField>

          <FormActions>
            <Button type="submit" colorPalette="brand" loading={submitting}>
              {t('login.submit')}
            </Button>
          </FormActions>
        </VStack>
      </form>

      <Text mt="6" color="fg.muted">
        {t('login.registerPrompt')}{' '}
        <ChakraLink asChild>
          <RouterLink to="/register">{t('login.registerLink')}</RouterLink>
        </ChakraLink>
      </Text>
    </Box>
  );
}
