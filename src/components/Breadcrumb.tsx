import { HStack, Link as ChakraLink, Text } from '@chakra-ui/react';
import { Fragment } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * A single breadcrumb segment. `to` is a React Router path; omit it (or pass the last item)
 * to render the current page as plain, non-clickable text.
 */
export interface BreadcrumbItem {
  /** Visible label (already resolved — feature pages typically pass an entity name). */
  label: string;
  /** Router path; the last/current segment usually omits this. */
  to?: string;
}

export interface BreadcrumbProps {
  /** Ordered trail, e.g. building → room → sensor → measurement (ROZ). */
  items: BreadcrumbItem[];
  /** Accessible name for the landmark; defaults to a localized "Breadcrumb". */
  'aria-label'?: string;
  /** Visual separator between segments. */
  separator?: string;
}

/**
 * Accessible breadcrumb trail (ROZ: building → room → sensor → measurement, each clickable).
 *
 * - Rendered as `nav > ol > li` for correct landmark + list semantics.
 * - Every segment with a `to` is a React Router `Link`; the **last** segment is rendered as
 *   plain text and marked `aria-current="page"` regardless of whether it has a `to`.
 * - Generic by design: feature pages build the typed `items` trail and pass it in.
 */
export function Breadcrumb({ items, 'aria-label': ariaLabel, separator = '/' }: BreadcrumbProps) {
  const { t } = useTranslation('common');
  const label = ariaLabel ?? t('nav.breadcrumb');
  const lastIndex = items.length - 1;

  return (
    <nav aria-label={label}>
      <HStack as="ol" gap="2" listStyleType="none" m="0" p="0" flexWrap="wrap">
        {items.map((item, index) => {
          const isLast = index === lastIndex;
          return (
            <Fragment key={`${item.label}-${index}`}>
              <Text as="li" display="inline-flex" alignItems="center">
                {isLast || !item.to ? (
                  <Text as="span" aria-current={isLast ? 'page' : undefined} fontWeight="medium">
                    {item.label}
                  </Text>
                ) : (
                  <ChakraLink asChild color="brand.fg">
                    <RouterLink to={item.to}>{item.label}</RouterLink>
                  </ChakraLink>
                )}
              </Text>
              {!isLast && (
                <Text as="li" aria-hidden="true" color="muted.fg" userSelect="none">
                  {separator}
                </Text>
              )}
            </Fragment>
          );
        })}
      </HStack>
    </nav>
  );
}
