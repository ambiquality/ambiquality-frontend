import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Combobox,
  Portal,
  Spinner,
  Stack,
  Text,
  createListCollection,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
  useAddressSuggest,
  useResolveAddress,
  type AddressSuggestion,
  type ResolvedAddress,
} from '../ruian/useAddressLookup';

export interface AddressAutocompleteProps {
  /** Called with the resolved OFN address when the operator picks a suggestion. */
  onResolve: (address: ResolvedAddress) => void;
}

/** Debounce delay (ms) before a keystroke turns into a RÚIAN suggest request. */
const DEBOUNCE_MS = 300;

/**
 * RÚIAN-backed address autocomplete for building registration (F05). The operator types an
 * address, picks a suggestion, and {@link onResolve} fires with the fully resolved OFN address so
 * the form fields fill themselves — instead of hand-copying ~18 fields out of the registry. It is
 * a convenience layered *above* the manual fields, which stay visible and editable; if RÚIAN is
 * unavailable the operator simply fills them in by hand (graceful degradation, UC18-style).
 *
 * Data © ČÚZK / RÚIAN, provided as open data under CC BY 4.0 — credited in the footer caption.
 */
export function AddressAutocomplete({ onResolve }: AddressAutocompleteProps) {
  const { t } = useTranslation('evidence');

  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveFailed, setResolveFailed] = useState(false);

  // Debounce keystrokes into the query that actually drives the suggest request.
  useEffect(() => {
    const handle = setTimeout(() => setQuery(inputValue), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [inputValue]);

  const { data: suggestions = [], isFetching, isError: suggestFailed } = useAddressSuggest(query);
  const resolveAddress = useResolveAddress();

  const collection = useMemo(
    () =>
      createListCollection<AddressSuggestion>({
        items: suggestions,
        itemToString: (item) => item.text,
        itemToValue: (item) => item.key,
      }),
    [suggestions],
  );

  async function handleSelect(key: string | undefined) {
    if (!key) return;
    setResolving(true);
    setResolveFailed(false);
    try {
      onResolve(await resolveAddress(key));
    } catch {
      setResolveFailed(true);
    } finally {
      setResolving(false);
    }
  }

  const degraded = suggestFailed || resolveFailed;
  const showSearching = isFetching || resolving;

  return (
    <Stack gap="1.5">
      <Combobox.Root
        collection={collection}
        colorPalette="brand"
        openOnClick
        // Server already returns the relevant matches; never re-filter client-side.
        inputBehavior="none"
        onInputValueChange={(details) => setInputValue(details.inputValue)}
        onValueChange={(details) => void handleSelect(details.value[0])}
      >
        <Combobox.Label>{t('addressLookup.label')}</Combobox.Label>
        <Combobox.Control>
          <Combobox.Input placeholder={t('addressLookup.placeholder')} />
          <Combobox.IndicatorGroup>
            {showSearching ? (
              <Spinner size="xs" aria-label={t('addressLookup.searching')} />
            ) : (
              <Combobox.Trigger />
            )}
          </Combobox.IndicatorGroup>
        </Combobox.Control>
        <Portal>
          <Combobox.Positioner>
            <Combobox.Content>
              {degraded ? (
                <Combobox.Empty>{t('addressLookup.unavailable')}</Combobox.Empty>
              ) : suggestions.length === 0 ? (
                <Combobox.Empty>
                  {showSearching ? t('addressLookup.searching') : t('addressLookup.noResults')}
                </Combobox.Empty>
              ) : (
                suggestions.map((item) => (
                  <Combobox.Item key={item.key} item={item}>
                    <Combobox.ItemText>{item.text}</Combobox.ItemText>
                  </Combobox.Item>
                ))
              )}
            </Combobox.Content>
          </Combobox.Positioner>
        </Portal>
      </Combobox.Root>

      {degraded ? (
        <Text fontSize="sm" color="fg.error" role="alert">
          {t('addressLookup.unavailable')}
        </Text>
      ) : (
        <Text fontSize="xs" color="fg.muted">
          {t('addressLookup.hint')}
        </Text>
      )}

      <Box fontSize="xs" color="fg.subtle">
        {t('addressLookup.attribution')}
      </Box>
    </Stack>
  );
}
