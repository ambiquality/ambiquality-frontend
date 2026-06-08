import { describe, expect, it } from 'vitest';
import {
  formatByteSize,
  parseCatalog,
  pickLiteral,
  type RawCatalog,
} from './catalog-types';

/**
 * Pure-function tests for the catalog parser. The `/v1/catalog` openapi-fetch client binds
 * `globalThis.fetch` at import, so MSW can't intercept it; per the project gotcha we test the
 * parser as a pure function against a representative fixture instead of going through the network.
 */

/** A representative DCAT-AP 3.0 JSON-LD document, modelled on the backend's actual output. */
const FIXTURE: RawCatalog = {
  '@context': ['https://example/context.jsonld'],
  '@id': 'https://api.example/v1/catalog',
  '@type': 'dcat:Catalog',
  'dcterms:title': [
    { '@language': 'en', '@value': 'Ambiquality Catalogue' },
    { '@language': 'cs', '@value': 'Ambiquality katalog' },
  ],
  'dcterms:description': [
    { '@language': 'en', '@value': 'Open-data catalogue' },
    { '@language': 'cs', '@value': 'Katalog otevřených dat' },
  ],
  'dcterms:publisher': { '@type': 'foaf:Agent', 'foaf:name': 'Vilém Charwot, VŠE Prague' },
  'dcterms:license': { '@id': 'https://creativecommons.org/licenses/by/4.0/' },
  'dcat:dataset': {
    '@id': 'https://api.example/v1/catalog#dataset',
    '@type': 'dcat:Dataset',
    'dcterms:title': [
      { '@language': 'en', '@value': 'IEQ Open Data' },
      { '@language': 'cs', '@value': 'Otevřená data IEQ' },
    ],
    'dcterms:description': [{ '@language': 'en', '@value': 'IEQ measurements' }],
    'dcterms:publisher': { '@type': 'foaf:Agent', 'foaf:name': 'Vilém Charwot, VŠE Prague' },
    'dcterms:license': { '@id': 'https://creativecommons.org/licenses/by/4.0/' },
    'dcat:theme': { '@id': 'http://publications.europa.eu/resource/authority/data-theme/ENVI' },
    'dcat:keyword': [
      { '@language': 'en', '@value': 'IEQ' },
      { '@language': 'en', '@value': 'open data' },
      { '@language': 'cs', '@value': 'otevřená data' },
    ],
    'dcterms:accrualPeriodicity': { '@id': 'http://publications.europa.eu/resource/authority/frequency/CONT' },
    'dcat:contactPoint': {
      '@type': 'vcard:Individual',
      'vcard:fn': 'Vilém Charwot',
      'vcard:hasEmail': { '@id': 'mailto:info@ambiquality.org' },
    },
    'dcterms:issued': { '@type': 'xsd:date', '@value': '2025-01-01' },
    'dcterms:temporal': {
      'dcat:startDate': { '@type': 'xsd:dateTime', '@value': '2025-01-01T00:00:00Z' },
      'dcat:endDate': { '@type': 'xsd:dateTime', '@value': '2025-06-01T00:00:00Z' },
    },
    'dcterms:spatial': {
      '@type': 'dcterms:Location',
      'dcat:bbox': { '@type': 'geosparql:wktLiteral', '@value': 'POLYGON((14 50, 15 50, 15 51, 14 51, 14 50))' },
    },
    'dcat:distribution': [
      // Live access points (accessURL, no downloadURL):
      {
        '@type': 'dcat:Distribution',
        'dcterms:title': 'Observations as JSON-LD',
        'dcat:accessURL': { '@id': 'https://api.example/v1/observations' },
        'dcat:mediaType': 'application/ld+json',
        'dcterms:format': { '@id': 'http://example/format/jsonld' },
        'dcterms:license': { '@id': 'https://creativecommons.org/licenses/by/4.0/' },
      },
      {
        '@type': 'dcat:Distribution',
        'dcterms:title': 'Observations as CSV',
        'dcat:accessURL': { '@id': 'https://api.example/v1/observations.csv' },
        'dcat:mediaType': 'text/csv',
        'dcterms:format': { '@id': 'http://example/format/csv' },
        'dcterms:conformsTo': { '@id': 'https://api.example/v1/observations.csv-metadata.json' },
        'dcterms:license': { '@id': 'https://creativecommons.org/licenses/by/4.0/' },
      },
      // Downloadable archives (downloadURL). Deliberately out of order to exercise the sort:
      {
        '@type': 'dcat:Distribution',
        'dcterms:title': 'Measurements 2025-03 (text/csv, zipped)',
        'dcat:downloadURL': { '@id': 'https://storage.example/2025-03.csv.zip' },
        'dcat:mediaType': 'text/csv',
        'dcat:compressFormat': 'application/zip',
        'dcat:byteSize': 123456,
        'dcterms:temporal': {
          'dcat:startDate': { '@type': 'xsd:dateTime', '@value': '2025-03-01T00:00:00Z' },
          'dcat:endDate': { '@type': 'xsd:dateTime', '@value': '2025-04-01T00:00:00Z' },
        },
        'dcterms:license': { '@id': 'https://creativecommons.org/licenses/by/4.0/' },
      },
      {
        '@type': 'dcat:Distribution',
        'dcterms:title': 'Measurements 2025-05 (text/csv, zipped)',
        'dcat:downloadURL': { '@id': 'https://storage.example/2025-05.csv.zip' },
        'dcat:mediaType': 'text/csv',
        'dcat:compressFormat': 'application/zip',
        // byteSize deliberately absent here.
        'dcterms:temporal': {
          'dcat:startDate': { '@type': 'xsd:dateTime', '@value': '2025-05-01T00:00:00Z' },
          'dcat:endDate': { '@type': 'xsd:dateTime', '@value': '2025-06-01T00:00:00Z' },
        },
        'dcterms:license': { '@id': 'https://creativecommons.org/licenses/by/4.0/' },
      },
    ],
  },
};

describe('pickLiteral', () => {
  it('picks the requested language', () => {
    const values = [
      { '@language': 'en', '@value': 'Hello' },
      { '@language': 'cs', '@value': 'Ahoj' },
    ];
    expect(pickLiteral(values, 'cs')).toBe('Ahoj');
    expect(pickLiteral(values, 'en')).toBe('Hello');
  });

  it('falls back to the fallback language, then to the first available', () => {
    const values = [{ '@language': 'en', '@value': 'Hello' }];
    expect(pickLiteral(values, 'cs')).toBe('Hello'); // fallback en
    expect(pickLiteral([{ '@language': 'de', '@value': 'Hallo' }], 'cs', 'en')).toBe('Hallo');
  });

  it('accepts a single object or a bare string', () => {
    expect(pickLiteral({ '@language': 'en', '@value': 'Solo' }, 'en')).toBe('Solo');
    expect(pickLiteral('Plain', 'en')).toBe('Plain');
  });

  it('returns undefined for empty/missing input', () => {
    expect(pickLiteral(undefined, 'en')).toBeUndefined();
    expect(pickLiteral([], 'en')).toBeUndefined();
  });
});

describe('formatByteSize', () => {
  it('formats bytes, KB, MB and GB (base 1024)', () => {
    expect(formatByteSize(512)).toBe('512 B');
    expect(formatByteSize(1024)).toBe('1 KB');
    expect(formatByteSize(1536)).toBe('1.5 KB');
    expect(formatByteSize(123456)).toBe('120.6 KB');
    expect(formatByteSize(1024 * 1024)).toBe('1 MB');
    expect(formatByteSize(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('returns undefined for missing/invalid sizes', () => {
    expect(formatByteSize(undefined)).toBeUndefined();
    expect(formatByteSize(-1)).toBeUndefined();
    expect(formatByteSize(NaN)).toBeUndefined();
  });
});

describe('parseCatalog', () => {
  it('parses catalog-level metadata in the requested language', () => {
    const parsed = parseCatalog(FIXTURE, 'cs');
    expect(parsed.catalog.title).toBe('Ambiquality katalog');
    expect(parsed.catalog.description).toBe('Katalog otevřených dat');
    expect(parsed.catalog.publisher).toBe('Vilém Charwot, VŠE Prague');
    expect(parsed.catalog.licenseUrl).toBe('https://creativecommons.org/licenses/by/4.0/');
  });

  it('parses dataset metadata, keywords, contact, issued, temporal and spatial', () => {
    const parsed = parseCatalog(FIXTURE, 'en');
    expect(parsed.dataset.title).toBe('IEQ Open Data');
    expect(parsed.dataset.themeUri).toContain('ENVI');
    expect(parsed.dataset.keywords).toEqual(['IEQ', 'open data']);
    expect(parsed.dataset.accrualPeriodicityUri).toContain('CONT');
    expect(parsed.dataset.contact.name).toBe('Vilém Charwot');
    expect(parsed.dataset.issued).toBe('2025-01-01');
    expect(parsed.dataset.temporal).toEqual({
      start: '2025-01-01T00:00:00Z',
      end: '2025-06-01T00:00:00Z',
    });
    expect(parsed.dataset.spatialBboxWkt).toContain('POLYGON');
  });

  it('strips the leading mailto: from the contact email', () => {
    const parsed = parseCatalog(FIXTURE, 'en');
    expect(parsed.dataset.contact.email).toBe('info@ambiquality.org');
  });

  it('splits live access points from downloadable archives', () => {
    const parsed = parseCatalog(FIXTURE, 'en');
    expect(parsed.liveDistributions).toHaveLength(2);
    expect(parsed.archives).toHaveLength(2);

    const csvLive = parsed.liveDistributions.find((d) => d.mediaType === 'text/csv');
    expect(csvLive?.url).toBe('https://api.example/v1/observations.csv');
    expect(csvLive?.conformsToUri).toContain('csv-metadata');
  });

  it('sorts archives newest-first by period start', () => {
    const parsed = parseCatalog(FIXTURE, 'en');
    expect(parsed.archives.map((a) => a.period?.start)).toEqual([
      '2025-05-01T00:00:00Z',
      '2025-03-01T00:00:00Z',
    ]);
  });

  it('carries archive size when present and omits it when absent', () => {
    const parsed = parseCatalog(FIXTURE, 'en');
    const march = parsed.archives.find((a) => a.downloadUrl.includes('2025-03'));
    const may = parsed.archives.find((a) => a.downloadUrl.includes('2025-05'));
    expect(march?.byteSize).toBe(123456);
    expect(march?.compressFormat).toBe('application/zip');
    expect(may?.byteSize).toBeUndefined();
  });

  it('normalizes a single distribution object (not array)', () => {
    const single: RawCatalog = {
      'dcat:dataset': {
        'dcat:distribution': {
          '@type': 'dcat:Distribution',
          'dcterms:title': 'Only archive',
          'dcat:downloadURL': { '@id': 'https://storage.example/one.csv.zip' },
          'dcat:mediaType': 'text/csv',
          'dcterms:temporal': { 'dcat:startDate': { '@value': '2025-02-01T00:00:00Z' } },
        },
      },
    };
    const parsed = parseCatalog(single, 'en');
    expect(parsed.archives).toHaveLength(1);
    expect(parsed.archives[0].downloadUrl).toBe('https://storage.example/one.csv.zip');
    expect(parsed.archives[0].period?.start).toBe('2025-02-01T00:00:00Z');
  });

  it('never throws on a sparse or empty document', () => {
    expect(() => parseCatalog(null, 'en')).not.toThrow();
    expect(() => parseCatalog(undefined, 'en')).not.toThrow();
    expect(() => parseCatalog({}, 'en')).not.toThrow();

    const empty = parseCatalog({}, 'en');
    expect(empty.archives).toEqual([]);
    expect(empty.liveDistributions).toEqual([]);
    expect(empty.dataset.keywords).toEqual([]);
    expect(empty.catalog.title).toBeUndefined();
  });
});
