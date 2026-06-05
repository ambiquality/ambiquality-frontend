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
      email: 'Zadejte platnou e-mailovou adresu.',
      passwordTooShort: 'Použijte alespoň 8 znaků.',
    },
  },
  account: {
    loading: 'Načítání…',
    nav: {
      login: 'Přihlásit se',
      account: 'Účet',
      logout: 'Odhlásit se',
    },
    fields: {
      email: 'E-mail',
      password: 'Heslo',
      confirmPassword: 'Potvrzení hesla',
      currentPassword: 'Současné heslo',
      newPassword: 'Nové heslo',
      newEmail: 'Nový e-mail',
    },
    login: {
      title: 'Přihlášení',
      submit: 'Přihlásit se',
      registerPrompt: 'Ještě nemáte účet?',
      registerLink: 'Vytvořit účet',
      invalidCredentials: 'E-mail nebo heslo je nesprávné.',
      rateLimited: 'Příliš mnoho pokusů. Zkuste to prosím za {{seconds}} s.',
      rateLimitedNoTime: 'Příliš mnoho pokusů. Zkuste to prosím za chvíli.',
    },
    register: {
      title: 'Vytvoření účtu',
      submit: 'Vytvořit účet',
      loginPrompt: 'Už máte účet?',
      loginLink: 'Přihlásit se',
      passwordMismatch: 'Hesla se neshodují.',
      conflict: 'Pokud lze tento e-mail registrovat, byl odeslán potvrzovací odkaz.',
      successTitle: 'Zkontrolujte e-mail',
      successBody:
        'Na adresu {{email}} jsme odeslali potvrzovací odkaz. Otevřete jej pro aktivaci účtu a poté se přihlaste.',
      resend: 'Odeslat potvrzovací e-mail znovu',
      resendDone: 'Pokud je adresa registrovaná, nový odkaz je na cestě.',
    },
    settings: {
      title: 'Nastavení účtu',
      emailLabel: 'E-mail',
      statusConfirmed: 'E-mail potvrzen',
      statusUnconfirmed: 'E-mail nepotvrzen',
      changePasswordTitle: 'Změna hesla',
      changePasswordSubmit: 'Změnit heslo',
      changePasswordDone: 'Vaše heslo bylo změněno.',
      changeEmailTitle: 'Změna e-mailu',
      changeEmailSubmit: 'Požádat o změnu e-mailu',
      changeEmailPending:
        'Na novou adresu jsme odeslali potvrzovací odkaz. Změna se projeví po jeho potvrzení.',
      logoutTitle: 'Odhlášení',
      logoutSubmit: 'Odhlásit se',
      dangerTitle: 'Smazání účtu',
      dangerBody: 'Tímto trvale smažete svůj účet. Akci nelze vrátit zpět.',
      deleteConfirmLabel: 'Pro potvrzení napište SMAZAT',
      deleteConfirmKeyword: 'SMAZAT',
      deleteConfirmMismatch: 'Pro potvrzení napište přesně SMAZAT.',
      deleteSubmit: 'Trvale smazat účet',
      deleteForbidden: 'Můžete smazat pouze svůj vlastní účet.',
    },
    confirm: {
      title: 'Potvrzení e-mailu',
      checking: 'Potvrzujeme váš e-mail…',
      emailSuccess: 'Vaše e-mailová adresa je potvrzena. Nyní se můžete přihlásit.',
      emailFailure: 'Tento potvrzovací odkaz je neplatný nebo vypršel.',
      emailChangeSuccess: 'Vaše nová e-mailová adresa je potvrzena.',
      emailChangeFailure: 'Tento odkaz pro změnu e-mailu je neplatný nebo vypršel.',
      missingToken: 'Tento potvrzovací odkaz je neúplný.',
      goToLogin: 'Přejít na přihlášení',
    },
  },
  errors: {
    title: 'Něco se pokazilo',
    generic: 'Požadavek se nepodařilo dokončit. Zkuste to prosím znovu.',
    fieldErrorsLabel: 'Opravte prosím následující:',
    'urn:ambiquality:auth:invalid-credentials': 'E-mail nebo heslo je nesprávné.',
    'urn:ambiquality:auth:invalid-email': 'Zadejte prosím platnou e-mailovou adresu.',
    'urn:ambiquality:auth:email-already-registered':
      'Pokud lze tento e-mail registrovat, byl odeslán potvrzovací odkaz.',
    'urn:ambiquality:auth:email-not-confirmed': 'Nejprve prosím potvrďte svou e-mailovou adresu.',
    'urn:ambiquality:auth:invalid-refresh-token':
      'Vaše relace vypršela. Přihlaste se prosím znovu.',
    'urn:ambiquality:auth:user-not-found': 'Účet nebyl nalezen.',
    'urn:ambiquality:auth:too-many-login-attempts':
      'Příliš mnoho pokusů. Zkuste to prosím za chvíli.',
    'urn:ambiquality:auth:forbidden': 'K této akci nemáte oprávnění.',
    'urn:ambiquality:auth:domain-rule-violation': 'Požadavek se nepodařilo dokončit.',
    'urn:ambiquality:evidence:validation': 'Některá pole vyžadují pozornost.',
    'urn:ambiquality:evidence:unknown-codelist-code': 'Byl zadán neznámý kód.',
    'urn:ambiquality:evidence:domain-rule-violation': 'Tato změna porušuje doménové pravidlo.',
    'urn:ambiquality:evidence:overlapping-validity-range':
      'Rozsah platnosti se překrývá s existujícím.',
    'urn:ambiquality:public:not-found': 'Požadovaný zdroj nebyl nalezen.',
  },
};
