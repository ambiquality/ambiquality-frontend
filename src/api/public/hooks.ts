/**
 * Typed query hooks for Public.Api. Because the spec declares no response schemas (pitfall:
 * inline/prose-only specs), the response shapes here are HAND-WRITTEN best-effort types. Query
 * params are passed through `params.query` even though the generated `paths` type them as
 * `never`, so we cast at the call site and keep the hand-typed params on the hook's public
 * surface.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { publicClient } from './client';
import type { CodelistScheme, CodelistConcept } from '@/i18n/codelist-labels';

/** Provisional shape of an observable property (`/v1/properties`). */
export interface PublicProperty {
  code: string;
  label?: string;
  applicableUnit?: string;
  [key: string]: unknown;
}

export const publicQueryKeys = {
  properties: () => ['public', 'properties'] as const,
  codelist: (scheme: string) => ['public', 'codelist', scheme] as const,
};

/** Raw member of a `/v1/codelists/{scheme}` response (Public.Api SKOS; cs+en prefLabels). */
interface CodelistMember {
  code: string;
  labelEn?: string;
  labelCs?: string;
  [key: string]: unknown;
}

/**
 * List the observable properties catalogue (`/v1/properties`). Example hook.
 */
export function usePublicProperties(): UseQueryResult<PublicProperty[]> {
  return useQuery({
    queryKey: publicQueryKeys.properties(),
    queryFn: async ({ signal }) => {
      const { data } = await publicClient.GET('/v1/properties', { signal });
      // Public.Api returns `{ items: [...], license }` — the members live under `items`,
      // not a bare array. (The `label` is English-only; there are no cs/en prefLabels here.)
      return ((data ?? {}) as { items?: PublicProperty[] }).items ?? [];
    },
  });
}

/**
 * Fetch a SKOS codelist scheme from Public.Api (`/v1/codelists/{scheme}`) and shape it into a
 * `CodelistScheme` (`{ [code]: { code, prefLabel } }`) for `useCodelistLabel` and code pickers.
 *
 * Codelists are open reference data (anonymous, CORS-open). Fetching them on the operator side
 * does NOT violate the "two read sources" rule — that governs entity/catalog data (precise vs.
 * masked coords, `asOf`), not the shared controlled vocabulary, which has a single public home.
 * Cached for an hour: codelists change rarely.
 */
export function useCodelistScheme(scheme: string): UseQueryResult<CodelistScheme> {
  return useQuery({
    queryKey: publicQueryKeys.codelist(scheme),
    staleTime: 60 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const { data } = await publicClient.GET('/v1/codelists/{scheme}', {
        params: { path: { scheme } },
        signal,
      });
      // Public.Api returns `{ scheme, iri, concepts: [...], license }` (SKOS ConceptScheme),
      // not a bare array — the members live under `concepts`.
      const body = (data ?? {}) as { concepts?: CodelistMember[] };
      const members = body.concepts ?? [];
      const result: CodelistScheme = {};
      for (const member of members) {
        const concept: CodelistConcept = {
          code: member.code,
          prefLabel: { en: member.labelEn, cs: member.labelCs },
        };
        result[member.code] = concept;
      }
      return result;
    },
  });
}
