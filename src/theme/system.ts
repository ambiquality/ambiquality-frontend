import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

/**
 * Ambiquality design system (Chakra UI v3).
 *
 * We extend Chakra's `defaultConfig` rather than replacing it, so all of Chakra's
 * recipes/components keep working. Tokens here are intentionally a11y-minded:
 *
 *  - The brand ramp keeps text-on-surface combinations at WCAG 2.1 AA contrast
 *    (the project's POU requirement). `brand.solid` (600) on white and white on
 *    `brand.solid` both clear 4.5:1.
 *  - Semantic IEQ status colors (good / moderate / poor) are defined once here so
 *    the map indicators and charts (Phase 6/7) share one accessible palette and are
 *    never duplicated with ad-hoc hex values.
 *  - A visible, high-contrast focus ring is enforced globally for keyboard users.
 *
 * The single design system requirement (VZH) means: no other UI kit, and no raw hex
 * in feature code — reference these tokens.
 */
const customConfig = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif' },
        body: { value: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif' },
      },
      colors: {
        brand: {
          50: { value: '#e6f2f3' },
          100: { value: '#c2dee0' },
          200: { value: '#9bc8cc' },
          300: { value: '#73b2b7' },
          400: { value: '#4f9ca3' },
          500: { value: '#2f8088' },
          600: { value: '#1f6770' },
          700: { value: '#164e55' },
          800: { value: '#0d353a' },
          900: { value: '#061d20' },
        },
        // IEQ status palette (shared by map indicators + charts). AA-contrast on dark text.
        ieq: {
          good: { value: '#2e7d32' },
          moderate: { value: '#b26a00' },
          poor: { value: '#c62828' },
          unknown: { value: '#5f6368' },
        },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: '{colors.brand.600}' },
          contrast: { value: 'white' },
          fg: { value: '{colors.brand.700}' },
          muted: { value: '{colors.brand.100}' },
          subtle: { value: '{colors.brand.50}' },
          emphasized: { value: '{colors.brand.700}' },
          focusRing: { value: '{colors.brand.500}' },
        },
      },
    },
  },
  globalCss: {
    // High-contrast, always-visible focus ring for keyboard navigation (WCAG 2.1 AA).
    '*:focus-visible': {
      outline: '2px solid',
      outlineColor: 'brand.focusRing',
      outlineOffset: '2px',
    },
    body: {
      bg: 'bg',
      color: 'fg',
    },
  },
});

export const system = createSystem(defaultConfig, customConfig);
