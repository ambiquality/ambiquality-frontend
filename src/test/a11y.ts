import axe, { type RunOptions, type AxeResults } from 'axe-core';
import { expect } from 'vitest';

/**
 * Run axe-core against a rendered DOM subtree and assert it has no WCAG 2.1 A/AA violations.
 *
 * Scope: this is the **structural** accessibility gate — roles, names, labels, ARIA validity,
 * landmark/list/table semantics, heading order, form-control labelling. It runs under jsdom, which
 * has no layout engine, so the layout-dependent `color-contrast` rule cannot be evaluated here and
 * is disabled; contrast is guaranteed instead by the `ieq.*` / semantic theme tokens and is
 * re-checked in the browser-based Playwright + axe pass. Everything else axe can determine from the
 * DOM is enforced.
 */
export async function expectNoA11yViolations(
  container: HTMLElement,
  options: RunOptions = {},
): Promise<void> {
  const results: AxeResults = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    // color-contrast needs a real layout/canvas; unavailable under jsdom. Covered by the theme
    // tokens + the Playwright browser pass.
    rules: { 'color-contrast': { enabled: false } },
    ...options,
  });

  if (results.violations.length > 0) {
    const summary = results.violations
      .map((v) => {
        const targets = v.nodes.map((n) => `      - ${n.target.join(' ')}`).join('\n');
        return `  [${v.impact ?? 'n/a'}] ${v.id}: ${v.help}\n    ${v.helpUrl}\n${targets}`;
      })
      .join('\n\n');
    throw new Error(`Expected no accessibility violations but found ${results.violations.length}:\n\n${summary}`);
  }

  expect(results.violations).toEqual([]);
}
