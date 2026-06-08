import { useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Heading,
  Input,
  Link as ChakraLink,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FormField, FormActions, ProblemError } from '@/components';
import { ProblemError as ProblemErrorObject } from '@/api/middleware/problem-details';
import { authClient } from '@/api/auth/client';
import { useAuth } from '@/auth/useAuth';
import { emailValidator, passwordValidator } from './validation';

/**
 * F01 register. Email + password (+confirm) through the shared primitives (KON), client-side
 * validation, then `POST /v1/register`.
 *
 * The account is created UNCONFIRMED with **no auto-login** (per the contract): on 201 we swap to
 * a "check your email" state with a resend affordance. 400 validation problems surface through
 * `ProblemError`; 409 (email exists) is shown GENERICALLY (anti-enumeration) — we never confirm
 * whether the address is already registered.
 */
export function RegisterPage() {
  const { t } = useTranslation('account');
  const { t: tf } = useTranslation('forms');
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [problem, setProblem] = useState<ProblemErrorObject | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setProblem(null);
    setGenericError(null);

    if (password !== confirm) {
      setConfirmError(t('register.passwordMismatch'));
      return;
    }
    setConfirmError(null);

    // Privacy consent is mandatory: block the submit (and the `register` call) until it is given.
    if (!consented) {
      setConsentError(t('register.consentRequired'));
      return;
    }
    setConsentError(null);

    setSubmitting(true);
    const outcome = await register(email, password);
    setSubmitting(false);

    if (outcome.ok) {
      setRegistered(true);
      return;
    }
    if (outcome.reason === 'conflict') {
      // Generic, anti-enumeration: do not reveal that the email already exists.
      setGenericError(t('register.conflict'));
      return;
    }
    if (outcome.reason === 'validation' && outcome.error instanceof ProblemErrorObject) {
      setProblem(outcome.error);
      return;
    }
    setGenericError(t('register.conflict'));
  }

  async function handleResend() {
    // Best-effort; the endpoint always returns 202 (anti-enumeration), so we never branch on it.
    try {
      await authClient.POST('/v1/resend-confirmation', { body: { email } });
    } catch {
      // ignore
    }
    setResent(true);
  }

  if (registered) {
    return (
      <Box maxW="md" mx="auto">
        <Alert.Root status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t('register.successTitle')}</Alert.Title>
            <Alert.Description>{t('register.successBody', { email })}</Alert.Description>
          </Alert.Content>
        </Alert.Root>

        <VStack gap="3" align="start" mt="6">
          {resent ? (
            <Text color="fg.muted">{t('register.resendDone')}</Text>
          ) : (
            <Button variant="outline" onClick={handleResend}>
              {t('register.resend')}
            </Button>
          )}
          <ChakraLink asChild>
            <RouterLink to="/login">{t('register.loginLink')}</RouterLink>
          </ChakraLink>
        </VStack>
      </Box>
    );
  }

  return (
    <Box maxW="sm" mx="auto">
      <Heading size="2xl" mb="6">
        {t('register.title')}
      </Heading>

      <form onSubmit={handleSubmit} noValidate>
        <VStack gap="4" align="stretch">
          {genericError && (
            <Text color="fieldError.fg" role="alert">
              {genericError}
            </Text>
          )}
          <ProblemError error={problem} />

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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormField>

          <FormField
            label={t('fields.confirmPassword')}
            required
            error={confirmError}
            validate={(value) => (value === password ? null : t('register.passwordMismatch'))}
          >
            <Input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </FormField>

          <Box>
            <Checkbox.Root
              checked={consented}
              onCheckedChange={(e) => {
                setConsented(e.checked === true);
                if (e.checked === true) setConsentError(null);
              }}
              invalid={consentError != null}
            >
              <Checkbox.HiddenInput name="privacyConsent" />
              <Checkbox.Control />
              <Checkbox.Label>
                {/* The label embeds the Privacy Policy link. Split the i18n sentence on the
                    interpolated link slot (a sentinel) and place the styled router link in it. */}
                {(() => {
                  const SENTINEL = '\u0000';
                  const [before, after] = t('register.consentLabel', { link: SENTINEL }).split(
                    SENTINEL,
                  );
                  return (
                    <>
                      {before}
                      <ChakraLink asChild colorPalette="brand">
                        <RouterLink to="/privacy">{t('register.consentLink')}</RouterLink>
                      </ChakraLink>
                      {after}
                    </>
                  );
                })()}
              </Checkbox.Label>
            </Checkbox.Root>
            {consentError && (
              <Text color="fieldError.fg" role="alert" mt="1" fontSize="sm">
                {consentError}
              </Text>
            )}
          </Box>

          <FormActions>
            <Button type="submit" colorPalette="brand" loading={submitting}>
              {t('register.submit')}
            </Button>
          </FormActions>
        </VStack>
      </form>

      <Text mt="6" color="fg.muted">
        {t('register.loginPrompt')}{' '}
        <ChakraLink asChild>
          <RouterLink to="/login">{t('register.loginLink')}</RouterLink>
        </ChakraLink>
      </Text>
    </Box>
  );
}
