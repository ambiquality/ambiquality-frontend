/**
 * English (`en`) resource bundle, organized by namespace.
 *
 * Namespaces (KON — terminology rule, pitfall #10):
 *  - `common`   — UI chrome (nav, language switch, generic actions).
 *  - `glossary` — the thesis glossary's single canonical term per concept. NO synonyms.
 *  - `forms`    — uniform form interaction strings (required marker, validation chrome).
 *  - `errors`   — RFC 9457 `type`-URN → human message map (see ProblemError component).
 *
 * NOTE: codelist / enumeration labels are deliberately ABSENT here. They come from the
 * backend SKOS `prefLabel`s (cs+en) via Public.Api `/v1/codelists/{scheme}` at runtime and
 * must never be re-translated in the frontend (see `src/i18n/README.md` + `useCodelistLabel`).
 */
export const en = {
  common: {
    appName: 'Ambiquality',
    nav: {
      map: 'Map',
      operator: 'Operator',
      about: 'About',
      primary: 'Primary',
      breadcrumb: 'Breadcrumb',
    },
    language: {
      label: 'Language',
      switchTo: 'Switch language to {{language}}',
      cs: 'Čeština',
      en: 'English',
    },
    colorMode: {
      toggle: 'Toggle color mode',
    },
    actions: {
      save: 'Save',
      cancel: 'Cancel',
      submit: 'Submit',
      skipToContent: 'Skip to content',
    },
  },
  glossary: {
    // Single canonical term per concept (thesis glossary). Keys are concept ids; values
    // are the canonical English label. Czech counterparts live in `cs.ts` under the same key.
    building: 'building',
    room: 'room',
    sensor: 'sensor',
    observation: 'observation',
    featureOfInterest: 'feature of interest',
    quantity: 'quantity',
    unit: 'unit',
    measurement: 'measurement',
  },
  forms: {
    required: 'required',
    requiredMarker: '*',
    optional: 'optional',
    validation: {
      required: 'This field is required.',
      invalid: 'This value is not valid.',
    },
  },
  errors: {
    // Stable `urn:ambiquality:*` problem `type` URNs are mapped to localized messages as
    // FLAT top-level keys (the ProblemError component looks them up with ns/key separators
    // disabled, since the URN itself contains ':' and '.'). Fallbacks to the server
    // `title`/`detail` happen in the component when no key matches.
    title: 'Something went wrong',
    generic: 'The request could not be completed. Please try again.',
    fieldErrorsLabel: 'Please correct the following:',
    'urn:ambiquality:auth:invalid-credentials': 'Email or password is incorrect.',
    'urn:ambiquality:auth:account-locked': 'This account is temporarily locked.',
    'urn:ambiquality:auth:rate-limited': 'Too many attempts. Please try again shortly.',
    'urn:ambiquality:evidence:validation': 'Some fields need your attention.',
    'urn:ambiquality:evidence:unknown-codelist-code': 'An unknown code was supplied.',
    'urn:ambiquality:evidence:domain-rule-violation': 'This change breaks a domain rule.',
    'urn:ambiquality:evidence:overlapping-validity-range':
      'The validity range overlaps an existing one.',
    'urn:ambiquality:public:not-found': 'The requested resource was not found.',
  },
} as const;
