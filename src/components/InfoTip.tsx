import { IconButton, Portal, Tooltip } from '@chakra-ui/react';
import { LuInfo } from 'react-icons/lu';

export interface InfoTipProps {
  /** The explanatory text shown in the tooltip (already localized by the caller). */
  content: string;
  /**
   * Accessible name for the trigger button (already localized). Screen-reader users hear this;
   * the visible `content` is wired as the description, so keep this short (e.g. "More information").
   */
  ariaLabel: string;
}

/**
 * A small "ⓘ" trigger that reveals an explanatory {@link content} tooltip on hover **and** focus
 * (Chakra v3 `Tooltip` exposes the content via `aria-describedby`, so it is keyboard-reachable —
 * WCAG). Use it next to a field label to explain a non-obvious choice without permanently
 * spending vertical space on helper text.
 */
export function InfoTip({ content, ariaLabel }: InfoTipProps) {
  return (
    <Tooltip.Root openDelay={150} closeDelay={100}>
      <Tooltip.Trigger asChild>
        <IconButton
          type="button"
          aria-label={ariaLabel}
          variant="ghost"
          size="2xs"
          color="fg.muted"
          rounded="full"
        >
          <LuInfo />
        </IconButton>
      </Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content maxW="xs" lineHeight="tall">
            {content}
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  );
}
