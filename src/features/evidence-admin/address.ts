import type { BuildingSnapshot } from './queries';

/**
 * Compose the structured OFN Adresy fields of a building snapshot into human-readable Czech
 * address text for display (the read-only summary card, history projection, and list rows).
 * Evidence.Api returns the fields *flat* (no pre-composed text), so the presentation lives here.
 *
 * Conventions: with a street, the number is written `houseNumber/orientationNumber+letter`
 * (číslo popisné / číslo orientační); without a street it is prefixed `č.p.` / `ev.č.` per the
 * house-number type. The municipality line appends the municipality part and PSČ when present.
 * Display-only — never mutate the canonical fields (cf. the display-unit rule).
 */

type AddressFields = Pick<
  BuildingSnapshot,
  | 'streetName'
  | 'houseNumber'
  | 'houseNumberType'
  | 'orientationNumber'
  | 'orientationNumberLetter'
  | 'municipalityName'
  | 'municipalityPartName'
  | 'psc'
>;

/** The house-number token, e.g. `1938/4`, `1938/4a`, or `č.p. 1938` / `ev.č. 5` when street-less. */
function houseNumberToken(a: AddressFields): string {
  const orientation =
    a.orientationNumber != null && a.orientationNumber !== ''
      ? `/${a.orientationNumber}${a.orientationNumberLetter ?? ''}`
      : '';
  const number = `${a.houseNumber}${orientation}`;
  if (a.streetName) return number;
  // Street-less obce: keep the type prefix so the bare number isn't ambiguous.
  return a.houseNumberType === 'č.ev.' ? `ev.č. ${number}` : `č.p. ${number}`;
}

/** Group the PSČ into the Czech `NNN NN` shape for display (input/storage stays 5 digits). */
function formatPsc(psc: string): string {
  const digits = psc.replace(/\s+/g, '');
  return /^\d{5}$/.test(digits) ? `${digits.slice(0, 3)} ${digits.slice(3)}` : psc;
}

/** The municipality line, e.g. `130 67 Praha – Žižkov`. */
function municipalityLine(a: AddressFields): string {
  const place = a.municipalityPartName
    ? `${a.municipalityName} – ${a.municipalityPartName}`
    : a.municipalityName;
  return `${formatPsc(a.psc)} ${place}`.trim();
}

/** Full one-line address, e.g. `Náměstí Winstona Churchilla 1938/4, 130 67 Praha – Žižkov`. */
export function composeAddressLine(a: AddressFields): string {
  const street = [a.streetName, houseNumberToken(a)].filter(Boolean).join(' ');
  return [street, municipalityLine(a)].filter(Boolean).join(', ');
}

/** Short address for dense list rows, e.g. `Náměstí Winstona Churchilla 1938, Praha`. */
export function composeAddressShort(a: AddressFields): string {
  const street = [a.streetName, a.streetName ? a.houseNumber : houseNumberToken(a)]
    .filter((part) => part != null && part !== '')
    .join(' ');
  return [street, a.municipalityName].filter(Boolean).join(', ');
}
