import { HStack, type StackProps } from '@chakra-ui/react';
import type { PropsWithChildren } from 'react';

export interface FormActionsProps extends StackProps {
  /**
   * Horizontal alignment of the action buttons. Defaults to `end` (primary action on the
   * right) — the single convention every form follows (KON: fixed action-button position).
   */
  justify?: StackProps['justifyContent'];
}

/**
 * The form action footer (KON: uniform, fixed action-button position). Place this as the last
 * element of every form and put the submit/cancel buttons inside it, primary action last. By
 * routing all forms through this component, button placement and spacing stay identical across
 * the app instead of each form inventing its own footer.
 *
 * @example
 *   <FormActions>
 *     <Button variant="ghost">{t('actions.cancel')}</Button>
 *     <Button type="submit" colorPalette="brand">{t('actions.save')}</Button>
 *   </FormActions>
 */
export function FormActions({
  children,
  justify = 'flex-end',
  ...rest
}: PropsWithChildren<FormActionsProps>) {
  return (
    <HStack as="footer" gap="3" mt="6" justifyContent={justify} {...rest}>
      {children}
    </HStack>
  );
}
