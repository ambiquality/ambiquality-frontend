import { Text, type TextProps } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { convert, useUnitPreference } from '@/units';

/** Non-breaking space — keeps the value and unit together on wrap, e.g. "21.5 °C". */
const NBSP = ' ';

export interface UnitValueProps extends Omit<TextProps, 'children'> {
  /**
   * The **canonical** numeric value as returned by the API (never mutate this). When `null`/
   * `undefined`, a localized placeholder dash is shown.
   */
  value: number | null | undefined;
  /** The canonical unit symbol for `value`, e.g. `°C`, `ppm`, `%`. */
  unit: string;
  /**
   * PER override: force a specific display unit instead of the user's stored preference for `unit`.
   *
   * Resolution order for the unit actually rendered: this `displayUnit` (if convertible) → the
   * user's stored preference for `unit` → the canonical `unit`. When the resolved unit differs from
   * `unit`, the canonical `value` is converted **for display only** (the passed `value` is never
   * mutated). Most call sites omit this and let the preference drive; pass it to pin a unit.
   */
  displayUnit?: string;
  /** Maximum number of fraction digits for locale formatting. */
  fractionDigits?: number;
}

/**
 * Presentation primitive for a measured value + unit (e.g. `21.5 °C`). Formats the number with
 * locale-aware `Intl.NumberFormat` (cs uses a comma decimal separator, en a dot) and appends the
 * unit with a non-breaking space so the value and unit never wrap apart.
 *
 * PER: it renders in the user's preferred display unit (or an explicit `displayUnit` override),
 * converting the canonical `value` for display only — the canonical value the caller holds is never
 * mutated, and a unit with no known conversion falls back to canonical.
 */
export function UnitValue({ value, unit, displayUnit, fractionDigits, ...rest }: UnitValueProps) {
  const { i18n } = useTranslation();
  const { displayUnitFor } = useUnitPreference();
  const locale = i18n.resolvedLanguage ?? i18n.language;

  if (value == null || Number.isNaN(value)) {
    return (
      <Text as="span" {...rest}>
        {'—'}
      </Text>
    );
  }

  // Resolve the unit to show: explicit override wins, else the stored preference for this unit.
  const target = displayUnit ?? displayUnitFor(unit);
  const converted = target === unit ? value : convert(value, unit, target);
  // Fall back to canonical when the requested unit isn't a known conversion.
  const shownValue = converted ?? value;
  const shownUnit = converted == null ? unit : target;

  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: fractionDigits ?? 3,
    minimumFractionDigits: fractionDigits,
  }).format(shownValue);

  return (
    <Text as="span" {...rest}>
      {`${formatted}${NBSP}${shownUnit}`}
    </Text>
  );
}
