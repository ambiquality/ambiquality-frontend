import { useState } from 'react';
import { Box, Button, Code, HStack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export interface CopyFieldProps {
  /** Field label (e.g. "Identifier"). */
  label: string;
  /** The value shown in a monospace block and written to the clipboard on copy. */
  value: string;
}

/**
 * A read-only, copy-to-clipboard field — used to surface an entity's stable `uriSlug`
 * (`bld-…` / `rm-…` / `sns-…`) on the detail/history cards so operators can grab the shareable
 * identifier. Clipboard may be unavailable (insecure context / denied); the value stays visible
 * for manual copy, so we simply skip the "copied" confirmation in that case.
 */
export function CopyField({ label, value }: CopyFieldProps) {
  const { t } = useTranslation('evidence');
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard?.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard unavailable — leave the value for manual copy, no confirmation.
    }
  }

  return (
    <Box>
      <Text fontSize="sm" color="fg.muted" mb="1">
        {label}
      </Text>
      <HStack gap="2" align="center" wrap="wrap">
        <Code px="2" py="1" wordBreak="break-all">
          {value}
        </Code>
        <Button size="xs" variant="outline" onClick={handleCopy}>
          {t('common.copy')}
        </Button>
        {copied && (
          <Text fontSize="sm" color="fg.muted" role="status">
            {t('common.copied')}
          </Text>
        )}
      </HStack>
    </Box>
  );
}
