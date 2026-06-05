import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Heading, Link as ChakraLink, Spinner, VStack } from '@chakra-ui/react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authClient } from '@/api/auth/client';

type Kind = 'confirm-email' | 'confirm-email-change';
type Status = 'checking' | 'success' | 'failure' | 'missing-token';

/**
 * Minimal landing route for the emailed confirmation links:
 *  - `kind="confirm-email"`        → `GET /v1/confirm-email?userId&token` (after registration),
 *  - `kind="confirm-email-change"` → `GET /v1/account/confirm-email-change?token` (after a
 *     change-email request).
 *
 * It reads the token(s) from the query string, calls the endpoint once on mount, and shows a
 * success/failure notice. No auth state is touched — confirmation is a server-side side effect;
 * the user signs in separately afterwards.
 */
export function ConfirmEmailPage({ kind }: { kind: Kind }) {
  const { t } = useTranslation('account');
  const [params] = useSearchParams();

  const token = params.get('token');
  const userId = params.get('userId');
  const tokenMissing = !token || (kind === 'confirm-email' && !userId);

  // Initialize from the (synchronously-known) query params so the effect only ever sets state
  // ASYNCHRONOUSLY after the network call resolves — no cascading synchronous setState-in-effect.
  const [status, setStatus] = useState<Status>(tokenMissing ? 'missing-token' : 'checking');
  // StrictMode double-invokes effects in dev; guard so we only fire the request once.
  const startedRef = useRef(false);

  useEffect(() => {
    if (tokenMissing) return;
    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      try {
        if (kind === 'confirm-email') {
          await authClient.GET('/v1/confirm-email', {
            params: { query: { userId: userId!, token } },
          });
        } else {
          await authClient.GET('/v1/account/confirm-email-change', {
            params: { query: { token } },
          });
        }
        setStatus('success');
      } catch {
        setStatus('failure');
      }
    })();
  }, [kind, token, userId, tokenMissing]);

  const successMsg =
    kind === 'confirm-email' ? t('confirm.emailSuccess') : t('confirm.emailChangeSuccess');
  const failureMsg =
    kind === 'confirm-email' ? t('confirm.emailFailure') : t('confirm.emailChangeFailure');

  return (
    <Box maxW="md" mx="auto">
      <Heading size="2xl" mb="6">
        {t('confirm.title')}
      </Heading>

      {status === 'checking' && (
        <VStack gap="3" align="start">
          <Spinner aria-label={t('confirm.checking')} />
        </VStack>
      )}

      {status === 'success' && (
        <VStack gap="4" align="stretch">
          <Alert.Root status="success">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{successMsg}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
          <ChakraLink asChild>
            <RouterLink to="/login">{t('confirm.goToLogin')}</RouterLink>
          </ChakraLink>
        </VStack>
      )}

      {(status === 'failure' || status === 'missing-token') && (
        <Alert.Root status="error" role="alert">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>
              {status === 'missing-token' ? t('confirm.missingToken') : failureMsg}
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}
    </Box>
  );
}
