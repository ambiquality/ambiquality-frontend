/**
 * Hand-written response types + parser for `GET /v1/catalog` on Public.Api — the platform's
 * DCAT-AP 3.0 JSON-LD catalog (F16). Like the map endpoints, `/v1/catalog` is documented in prose
 * only, so the generated `publicClient` types its body as `unknown`; this module layers a loose
 * raw shape and a clean parsed view-model on top, mirroring `./map-types.ts`.
 *
 * Both the visitor **Archive** tab (downloadable monthly archives) and the future human-readable
 * **Catalogue** page read this one endpoint: archives are `dcat:distribution` entries carrying a
 * `dcat:downloadURL`; the live API access points carry a `dcat:accessURL` instead. The parser
 * therefore exposes *everything* the catalogue will need (metadata + both kinds of distribution),
 * not just the archives.
 *
 * Robustness: JSON-LD may serialize a single-element array as a bare object (and language-tagged
 * literals as a bare string), so every accessor normalizes arrays/objects/strings defensively and
 * tolerates missing fields — `parseCatalog` never throws on a sparse document.
 */

// ---------------------------------------------------------------------------------------------
// Raw JSON-LD shapes (loose: every value may be object | array | string | number | undefined).
// ---------------------------------------------------------------------------------------------

/** A JSON-LD reference node, e.g. `{ "@id": "https://…" }`. */
export interface RawIdRef {
  '@id'?: string;
}

/** A JSON-LD language-tagged literal, e.g. `{ "@language": "en", "@value": "…" }`. */
export interface RawLangLiteral {
  '@language'?: string;
  '@value'?: string;
}

/** A JSON-LD typed literal, e.g. `{ "@type": "xsd:dateTime", "@value": "2025-01-01T…" }`. */
export interface RawTypedLiteral {
  '@type'?: string;
  '@value'?: string;
}

/** A value that may appear as a single literal, an array of them, or a bare string. */
export type RawLangValue = RawLangLiteral | RawLangLiteral[] | string | undefined;

export interface RawPeriodOfTime {
  'dcat:startDate'?: RawTypedLiteral | string;
  'dcat:endDate'?: RawTypedLiteral | string;
}

export interface RawDistribution {
  '@type'?: string;
  'dcterms:title'?: RawLangValue;
  'dcat:accessURL'?: RawIdRef;
  'dcat:downloadURL'?: RawIdRef;
  'dcat:mediaType'?: string;
  'dcat:compressFormat'?: string;
  'dcat:byteSize'?: number | string;
  'dcterms:format'?: RawIdRef;
  'dcterms:conformsTo'?: RawIdRef;
  'dcterms:license'?: RawIdRef;
  'dcterms:temporal'?: RawPeriodOfTime;
}

export interface RawContactPoint {
  '@type'?: string;
  'vcard:fn'?: string;
  'vcard:hasEmail'?: RawIdRef | string;
}

export interface RawPublisher {
  '@type'?: string;
  'foaf:name'?: string;
}

export interface RawDataset {
  '@id'?: string;
  '@type'?: string;
  'dcterms:title'?: RawLangValue;
  'dcterms:description'?: RawLangValue;
  'dcterms:publisher'?: RawPublisher;
  'dcterms:license'?: RawIdRef;
  'dcat:theme'?: RawIdRef;
  'dcat:keyword'?: RawLangValue;
  'dcterms:accrualPeriodicity'?: RawIdRef;
  'dcat:contactPoint'?: RawContactPoint;
  'dcterms:issued'?: RawTypedLiteral | string;
  'dcterms:temporal'?: RawPeriodOfTime;
  'dcterms:spatial'?: {
    '@type'?: string;
    'dcat:bbox'?: RawTypedLiteral | string;
  };
  'dcat:distribution'?: RawDistribution | RawDistribution[];
}

export interface RawCatalog {
  '@context'?: unknown;
  '@id'?: string;
  '@type'?: string;
  'dcterms:title'?: RawLangValue;
  'dcterms:description'?: RawLangValue;
  'dcterms:publisher'?: RawPublisher;
  'dcterms:license'?: RawIdRef;
  'dcat:dataset'?: RawDataset;
}

// ---------------------------------------------------------------------------------------------
// Parsed view-model (clean, localized, optional-safe).
// ---------------------------------------------------------------------------------------------

/** A start/end period derived from a `dcterms:PeriodOfTime`. */
export interface Period {
  /** ISO 8601 start instant/date (as the backend serialized it). */
  start?: string;
  /** ISO 8601 end instant/date. */
  end?: string;
}

/** A live API access point (has `dcat:accessURL`, no `downloadURL`). */
export interface LiveDistribution {
  title: string;
  url: string;
  mediaType?: string;
  formatUri?: string;
  conformsToUri?: string;
}

/** A downloadable archive (has `dcat:downloadURL`). */
export interface ArchiveDistribution {
  title: string;
  downloadUrl: string;
  mediaType?: string;
  compressFormat?: string;
  byteSize?: number;
  period?: Period;
}

/** Catalog-level metadata (the outer `dcat:Catalog`). */
export interface CatalogMeta {
  title?: string;
  description?: string;
  publisher?: string;
  licenseUrl?: string;
}

/** Dataset-level metadata (the inner `dcat:Dataset`). */
export interface DatasetMeta {
  title?: string;
  description?: string;
  publisher?: string;
  licenseUrl?: string;
  themeUri?: string;
  keywords: string[];
  accrualPeriodicityUri?: string;
  contact: { name?: string; email?: string };
  issued?: string;
  temporal?: Period;
  spatialBboxWkt?: string;
}

/** The fully parsed catalog: metadata plus both distribution kinds. */
export interface ParsedCatalog {
  catalog: CatalogMeta;
  dataset: DatasetMeta;
  /** Live access points (e.g. `/v1/observations`, `/v1/observations.csv`). */
  liveDistributions: LiveDistribution[];
  /** Downloadable monthly archives, newest-first by `period.start`. */
  archives: ArchiveDistribution[];
}

// ---------------------------------------------------------------------------------------------
// Pure helpers.
// ---------------------------------------------------------------------------------------------

/** Normalize a value that may be a single object, an array, or `undefined` into an array. */
function asArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

/** Extract the `@id` from a `{ "@id": … }` reference (or `undefined`). */
export function idOf(ref: RawIdRef | string | undefined): string | undefined {
  if (ref == null) return undefined;
  if (typeof ref === 'string') return ref || undefined;
  return ref['@id'] || undefined;
}

/** Read the `@value` from a typed literal, tolerating a bare string. */
export function valueOf(literal: RawTypedLiteral | string | undefined): string | undefined {
  if (literal == null) return undefined;
  if (typeof literal === 'string') return literal || undefined;
  return literal['@value'] || undefined;
}

/**
 * Pick the best literal for `lang` from a language-tagged value.
 *
 * Accepts an array of `{ '@language', '@value' }`, a single such object, or a bare string. Returns
 * the value whose `@language` matches `lang`; failing that, the `fallback` language; failing that,
 * the first value with any text. A bare string is returned as-is.
 */
export function pickLiteral(
  values: RawLangValue,
  lang: string,
  fallback = 'en',
): string | undefined {
  if (typeof values === 'string') return values || undefined;
  const list = asArray(values).filter((v): v is RawLangLiteral => v != null && typeof v === 'object');
  if (list.length === 0) return undefined;

  const byLang = (target: string) =>
    list.find((v) => v['@language'] === target && v['@value'])?.['@value'];

  return byLang(lang) ?? byLang(fallback) ?? list.find((v) => v['@value'])?.['@value'];
}

/** Collect every distinct localized value for `lang` (used for the keyword list). */
function pickLiteralList(values: RawLangValue, lang: string, fallback = 'en'): string[] {
  if (typeof values === 'string') return values ? [values] : [];
  const list = asArray(values).filter((v): v is RawLangLiteral => v != null && typeof v === 'object');
  const inLang = list.filter((v) => v['@language'] === lang && v['@value']);
  const pool = inLang.length > 0 ? inLang : list.filter((v) => v['@language'] === fallback && v['@value']);
  const chosen = pool.length > 0 ? pool : list.filter((v) => v['@value']);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of chosen) {
    const value = v['@value']!;
    if (!seen.has(value)) {
      seen.add(value);
      out.push(value);
    }
  }
  return out;
}

/** Coerce a possibly-string byte size to a finite number (or `undefined`). */
function toByteSize(value: number | string | undefined): number | undefined {
  if (value == null) return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Parse a `dcterms:PeriodOfTime` into a `{ start, end }` (omitted when neither is present). */
function parsePeriod(raw: RawPeriodOfTime | undefined): Period | undefined {
  if (raw == null) return undefined;
  const start = valueOf(raw['dcat:startDate']);
  const end = valueOf(raw['dcat:endDate']);
  if (start == null && end == null) return undefined;
  return { start, end };
}

/** Strip a leading `mailto:` from a contact email reference. */
function parseEmail(ref: RawContactPoint['vcard:hasEmail']): string | undefined {
  const raw = idOf(ref);
  if (raw == null) return undefined;
  return raw.replace(/^mailto:/i, '') || undefined;
}

/**
 * Format a byte count as a short, locale-neutral string (`B`/`KB`/`MB`/`GB`, base 1024). The
 * Archive component supplies any localized label/aria text; this stays neutral so it's reusable.
 */
export function formatByteSize(bytes: number | undefined): string | undefined {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  // One decimal place, but drop a trailing `.0` for whole values.
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text} ${units[unitIndex]}`;
}

// ---------------------------------------------------------------------------------------------
// Parser.
// ---------------------------------------------------------------------------------------------

function parseDistributions(
  raw: RawDataset['dcat:distribution'],
  lang: string,
): { live: LiveDistribution[]; archives: ArchiveDistribution[] } {
  const live: LiveDistribution[] = [];
  const archives: ArchiveDistribution[] = [];

  for (const dist of asArray(raw)) {
    if (dist == null || typeof dist !== 'object') continue;
    const title = pickLiteral(dist['dcterms:title'], lang) ?? '';
    const mediaType = dist['dcat:mediaType'];
    const downloadUrl = idOf(dist['dcat:downloadURL']);
    const accessUrl = idOf(dist['dcat:accessURL']);

    if (downloadUrl != null) {
      archives.push({
        title,
        downloadUrl,
        mediaType,
        compressFormat: dist['dcat:compressFormat'],
        byteSize: toByteSize(dist['dcat:byteSize']),
        period: parsePeriod(dist['dcterms:temporal']),
      });
    } else if (accessUrl != null) {
      live.push({
        title,
        url: accessUrl,
        mediaType,
        formatUri: idOf(dist['dcterms:format']),
        conformsToUri: idOf(dist['dcterms:conformsTo']),
      });
    }
  }

  // Newest-first by period start. Entries without a start sort last (stable for the rest).
  archives.sort((a, b) => {
    const sa = a.period?.start;
    const sb = b.period?.start;
    if (sa == null && sb == null) return 0;
    if (sa == null) return 1;
    if (sb == null) return -1;
    return sb.localeCompare(sa);
  });

  return { live, archives };
}

/**
 * Parse the raw DCAT-AP JSON-LD catalog into a localized {@link ParsedCatalog}. Never throws on a
 * sparse/partial document; every field is optional-safe. `lang` (e.g. the active i18n language)
 * drives the title/description/keyword localization, with `fallback` (default `en`) behind it.
 */
export function parseCatalog(
  raw: RawCatalog | null | undefined,
  lang: string,
  fallback = 'en',
): ParsedCatalog {
  const doc = raw ?? {};
  const dataset = doc['dcat:dataset'] ?? {};

  const { live, archives } = parseDistributions(dataset['dcat:distribution'], lang);

  return {
    catalog: {
      title: pickLiteral(doc['dcterms:title'], lang, fallback),
      description: pickLiteral(doc['dcterms:description'], lang, fallback),
      publisher: doc['dcterms:publisher']?.['foaf:name'] || undefined,
      licenseUrl: idOf(doc['dcterms:license']),
    },
    dataset: {
      title: pickLiteral(dataset['dcterms:title'], lang, fallback),
      description: pickLiteral(dataset['dcterms:description'], lang, fallback),
      publisher: dataset['dcterms:publisher']?.['foaf:name'] || undefined,
      licenseUrl: idOf(dataset['dcterms:license']),
      themeUri: idOf(dataset['dcat:theme']),
      keywords: pickLiteralList(dataset['dcat:keyword'], lang, fallback),
      accrualPeriodicityUri: idOf(dataset['dcterms:accrualPeriodicity']),
      contact: {
        name: dataset['dcat:contactPoint']?.['vcard:fn'] || undefined,
        email: parseEmail(dataset['dcat:contactPoint']?.['vcard:hasEmail']),
      },
      issued: valueOf(dataset['dcterms:issued']),
      temporal: parsePeriod(dataset['dcterms:temporal']),
      spatialBboxWkt: valueOf(dataset['dcterms:spatial']?.['dcat:bbox']),
    },
    liveDistributions: live,
    archives,
  };
}
