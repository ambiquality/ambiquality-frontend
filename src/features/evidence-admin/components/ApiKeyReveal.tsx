import { useState } from 'react';
import { Alert, Box, Button, Code, HStack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export interface ApiKeyRevealProps {
  /** The one-time `amq_sk_…` key returned by sensor registration. Shown exactly once. */
  apiKey: string;
  /** Called when the operator acknowledges they've stored the key (dismisses the panel). */
  onAcknowledge?: () => void;
}

/**
 * One-time API-key reveal (F08). Sensor registration returns `apiKey` ONCE and it is
 * unrecoverable: it is never refetched or displayed afterwards. This panel presents it
 * prominently with a "store it now, it won't be shown again" warning and a copy button. The
 * key text is rendered via React (escaped) — never `dangerouslySetInnerHTML` (XSS-clean).
 */
export function ApiKeyReveal({ apiKey, onAcknowledge }: ApiKeyRevealProps) {
  const { t } = useTranslation('evidence');
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard?.writeText(apiKey);
      setCopied(true);
    } catch {
      // Clipboard may be unavailable (insecure context / denied permission); the key stays
      // visible for manual copy, so we simply don't show the "copied" confirmation.
    }
  }

  return (
    <Alert.Root status="warning" flexDirection="column" alignItems="stretch">
      <HStack>
        <Alert.Indicator />
        <Alert.Title>{t('apiKey.title')}</Alert.Title>
      </HStack>
      <Alert.Content mt="2">
        <Alert.Description>{t('apiKey.warning')}</Alert.Description>

        <Box mt="3">
          <Text fontWeight="medium" mb="1">
            {t('apiKey.label')}
          </Text>
          <HStack gap="2" align="center" wrap="wrap">
            <Code px="2" py="1" wordBreak="break-all" data-testid="api-key-value">
              {apiKey}
            </Code>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {t('apiKey.copy')}
            </Button>
          </HStack>
          {copied && (
            <Text color="fg.muted" mt="1" role="status">
              {t('apiKey.copied')}
            </Text>
          )}
        </Box>

        {onAcknowledge && (
          <Button mt="4" colorPalette="brand" onClick={onAcknowledge}>
            {t('apiKey.done')}
          </Button>
        )}
      </Alert.Content>
    </Alert.Root>
  );
}
