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
    moreInfo: 'Více informací',
    validation: {
      required: 'Toto pole je povinné.',
      invalid: 'Tato hodnota není platná.',
      range: 'Zadejte číslo mezi {{min}} a {{max}}.',
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
  evidence: {
    nav: {
      buildings: 'Budovy',
      newBuilding: 'Registrovat budovu',
      newRoom: 'Registrovat místnost',
      newSensor: 'Registrovat senzor',
      back: 'Zpět',
      details: 'Detail',
      edit: 'Upravit',
      history: 'Historie',
      rooms: 'Místnosti',
      sensors: 'Senzory',
    },
    pager: {
      previous: 'Předchozí',
      next: 'Další',
      status: 'Stránka {{page}} z {{total}}',
    },
    common: {
      loading: 'Načítání…',
      none: 'Žádné',
      empty: 'Zatím tu nic není.',
      slug: 'Identifikátor',
      uri: 'URI',
      add: 'Přidat',
      remove: 'Odebrat',
      saved: 'Uloženo.',
      save: 'Uložit',
      cancel: 'Zrušit',
      copy: 'Kopírovat',
      copied: 'Zkopírováno.',
    },
    select: {
      placeholder: 'Vyberte…',
      loading: 'Načítání…',
      roomPlaceholder: 'Vyberte místnost…',
    },
    // Úrovně přesnosti souřadnic jsou pevný výčet na backendu (ne SKOS číselník), proto jsou
    // jejich popisky zde. Pro nevlastníky jsou souřadnice zhrubeny na zvolenou úroveň.
    anonymizationLevels: {
      precise: 'Přesné (přesné souřadnice)',
      street: 'Úroveň ulice',
      municipality: 'Úroveň obce',
    },
    asOf: {
      title: 'Prohlížeč historie',
      label: 'Zobrazit stav k',
      apply: 'Zobrazit',
      reset: 'Aktuální',
      viewing: 'Zobrazujete stav k {{date}}.',
      hint: 'Vyberte datum a čas v minulosti pro promítnutí, jak záznam tehdy vypadal.',
    },
    validFrom: {
      label: 'Platné od',
      hint: 'Kdy tato změna nabývá účinnosti. Musí být pozdější než předchozí verze.',
      tooEarly: 'Datum „platné od“ musí být pozdější než začátek aktuální verze.',
    },
    fields: {
      name: 'Název',
      street: 'Ulice',
      city: 'Město',
      postcode: 'PSČ',
      country: 'Země',
      buildingType: 'Typ budovy',
      latitude: 'Zeměpisná šířka',
      longitude: 'Zeměpisná délka',
      anonymizationLevel: 'Přesnost souřadnic',
      anonymizationLevelHint:
        'Jak přesně se poloha této budovy sdílí s veřejností — kdokoli, kdo není vlastníkem, ' +
        'uvidí souřadnice zhrubené na tuto úroveň. Volte raději hrubší úroveň: chrání soukromí ' +
        '(ne každý chce mít svůj domov přesně zaměřený na veřejné mapě) i bezpečnost ' +
        '(některé hodnoty prozrazují přítomnost osob — např. neobvykle nízké CO₂ může ' +
        'signalizovat, že nikdo není doma).',
      yearBuilt: 'Rok výstavby',
      yearRenovated: 'Rok rekonstrukce',
      floor: 'Podlaží',
      function: 'Funkce',
      exposure: 'Orientace',
      areaM2: 'Plocha (m²)',
      ceilingHeightM: 'Výška stropu (m)',
      ventilation: 'Větrání',
      manufacturer: 'Výrobce',
      model: 'Model',
      serialNumber: 'Sériové číslo',
      status: 'Stav',
      sourceCode: 'Zdroj znečištění',
      parameterCode: 'Měřená veličina',
      newRoom: 'Přesunout do místnosti',
    },
    building: {
      listTitle: 'Budovy',
      registerTitle: 'Registrace budovy',
      registerSubmit: 'Registrovat budovu',
      detailTitle: 'Budova',
      editTitle: 'Atributy budovy',
      historyTitle: 'Historie budovy',
      addressTitle: 'Adresa',
      yearsTitle: 'Roky výstavby',
      locationTitle: 'Poloha',
      registered: 'Budova byla zaregistrována.',
    },
    room: {
      listTitle: 'Místnosti',
      registerTitle: 'Registrace místnosti',
      registerSubmit: 'Registrovat místnost',
      detailTitle: 'Místnost',
      editTitle: 'Atributy místnosti',
      historyTitle: 'Historie místnosti',
      geometryTitle: 'Geometrie',
      pollutionSourcesTitle: 'Zdroje znečištění',
      registered: 'Místnost byla zaregistrována.',
    },
    sensor: {
      listTitle: 'Senzory',
      registerTitle: 'Registrace senzoru',
      registerSubmit: 'Registrovat senzor',
      detailTitle: 'Senzor',
      editTitle: 'Atributy senzoru',
      historyTitle: 'Historie senzoru',
      identityTitle: 'Identita',
      placementTitle: 'Umístění',
      statusTitle: 'Stav životního cyklu',
      relocateTitle: 'Přemístit senzor',
      relocateSubmit: 'Přesunout senzor',
      measuredParametersTitle: 'Měřené veličiny',
      registered: 'Senzor byl zaregistrován.',
    },
    apiKey: {
      title: 'Uložte si API klíč nyní',
      warning:
        'Toto je jediný okamžik, kdy se klíč zobrazuje. Nelze jej znovu získat. Zkopírujte si jej a uložte na bezpečné místo, než opustíte tuto stránku.',
      copy: 'Kopírovat API klíč',
      copied: 'Zkopírováno do schránky.',
      label: 'API klíč',
      done: 'Klíč jsem uložil',
    },
    collection: {
      addPlaceholder: 'Zadejte kód',
      addLabel: 'Přidat do seznamu',
      removeLabel: 'Odebrat {{code}}',
      emptyList: 'Zatím žádné položky.',
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
    'urn:ambiquality:evidence:building-not-found': 'Tato budova nebyla nalezena.',
    'urn:ambiquality:evidence:room-not-found': 'Tato místnost nebyla nalezena.',
    'urn:ambiquality:evidence:pollution-source-not-found': 'Tento zdroj znečištění nebyl nalezen.',
    'urn:ambiquality:evidence:sensor-not-found': 'Tento senzor nebyl nalezen.',
    'urn:ambiquality:evidence:measured-parameter-not-found': 'Tato měřená veličina nebyla nalezena.',
    'urn:ambiquality:evidence:forbidden': 'K úpravě tohoto záznamu nemáte oprávnění.',
    'urn:ambiquality:evidence:duplicate-uri-slug':
      'Záznam s tímto identifikátorem již existuje. Použijte prosím jiný název.',
    'urn:ambiquality:evidence:unknown-codelist-code': 'Byl zadán neznámý kód.',
    'urn:ambiquality:evidence:overlapping-validity-range':
      'Datum platnosti od se překrývá s existující verzí. Zvolte pozdější datum.',
    'urn:ambiquality:evidence:invalid-attribute-value': 'Tato hodnota není platná.',
    'urn:ambiquality:evidence:invalid-timestamp': 'Toto datum nebo čas není platné.',
    'urn:ambiquality:evidence:internal-server-error':
      'Na serveru došlo k chybě. Zkuste to prosím znovu.',
    'urn:ambiquality:evidence:domain-rule-violation': 'Tato změna porušuje doménové pravidlo.',
    'urn:ambiquality:public:not-found': 'Požadovaný zdroj nebyl nalezen.',
  },
};
