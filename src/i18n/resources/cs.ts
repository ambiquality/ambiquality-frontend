import type { en } from './en';

/**
 * Czech (`cs`) resource bundle. Shape is locked to the English bundle's KEY structure via the
 * `Resources` type so the two stay in sync at compile time (a missing/extra key is a type
 * error) — while leaf values are widened to `string` so Czech text is allowed (the `en`
 * bundle is `as const`, which would otherwise demand identical literals).
 *
 * Terminology (KON): canonical Czech terms from the thesis glossary, one per concept, no
 * synonyms. Codelist labels are NOT here — they arrive from the backend SKOS prefLabels.
 */
type Stringify<T> = {
  [K in keyof T]: T[K] extends string ? string : Stringify<T[K]>;
};
type Resources = Stringify<typeof en>;

export const cs: Resources = {
  common: {
    appName: 'Ambiquality',
    nav: {
      map: 'Mapa',
      operator: 'Provozovatel',
      about: 'O aplikaci',
      primary: 'Hlavní',
      breadcrumb: 'Drobečková navigace',
    },
    language: {
      label: 'Jazyk',
      switchTo: 'Přepnout jazyk na {{language}}',
      cs: 'Čeština',
      en: 'English',
    },
    colorMode: {
      toggle: 'Přepnout barevný režim',
    },
    actions: {
      save: 'Uložit',
      cancel: 'Zrušit',
      submit: 'Odeslat',
      skipToContent: 'Přejít na obsah',
    },
  },
  glossary: {
    building: 'budova',
    room: 'místnost',
    sensor: 'senzor',
    observation: 'pozorování',
    featureOfInterest: 'subjekt zájmu',
    quantity: 'veličina',
    unit: 'jednotka',
    measurement: 'měření',
  },
  forms: {
    required: 'povinné',
    requiredMarker: '*',
    optional: 'nepovinné',
    validation: {
      required: 'Toto pole je povinné.',
      invalid: 'Tato hodnota není platná.',
    },
  },
  errors: {
    title: 'Něco se pokazilo',
    generic: 'Požadavek se nepodařilo dokončit. Zkuste to prosím znovu.',
    fieldErrorsLabel: 'Opravte prosím následující:',
    'urn:ambiquality:auth:invalid-credentials': 'E-mail nebo heslo je nesprávné.',
    'urn:ambiquality:auth:account-locked': 'Tento účet je dočasně zablokován.',
    'urn:ambiquality:auth:rate-limited': 'Příliš mnoho pokusů. Zkuste to prosím za chvíli.',
    'urn:ambiquality:evidence:validation': 'Některá pole vyžadují pozornost.',
    'urn:ambiquality:evidence:unknown-codelist-code': 'Byl zadán neznámý kód.',
    'urn:ambiquality:evidence:domain-rule-violation': 'Tato změna porušuje doménové pravidlo.',
    'urn:ambiquality:evidence:overlapping-validity-range':
      'Rozsah platnosti se překrývá s existujícím.',
    'urn:ambiquality:public:not-found': 'Požadovaný zdroj nebyl nalezen.',
  },
};
