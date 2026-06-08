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
      catalog: 'Katalog',
      archive: 'Archiv',
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
    footer: {
      label: 'Patička webu',
      privacy: 'Zásady ochrany osobních údajů',
      github: 'GitHub',
      contact: 'Kontakt',
      dataLicense: 'Otevřená data pod licencí {{license}}.',
    },
  },
  map: {
    title: 'Mapa kvality vnitřního prostředí',
    intro:
      'Prozkoumejte nejnovější naměřené hodnoty z registrovaných budov. Vyberte veličinu a poté ' +
      'budovu, abyste viděli její vývoj a rozložení hodnot. Polohy jsou záměrně přibližné.',
    mapRegionLabel: 'Interaktivní mapa sledovaných budov',
    filter: {
      label: 'Veličina',
      placeholder: 'Vyberte veličinu…',
      loading: 'Načítání veličin…',
    },
    legend: {
      title: 'Legenda',
      good: 'Dobrá',
      moderate: 'Zhoršená',
      poor: 'Špatná',
      unknown: 'Bez aktuálních dat',
      continuous: 'Obarveno podle hodnoty (světlejší = nižší, tmavší = vyšší).',
    },
    marker: {
      label: '{{name}}: {{value}}',
      valueUnavailable: '{{name}}: bez aktuálních dat',
    },
    value: {
      withUnit: '{{value}} {{unit}}',
      stale: 'Bez aktuálních dat',
      observedAt: 'Naměřeno {{date}}',
    },
    degradation: {
      title: 'Aktuální hodnoty nejsou dostupné',
      body: 'Mapa je zobrazena bez aktuálních hodnot. Budovy můžete procházet v seznamu níže.',
      retry: 'Zkusit znovu',
    },
    fallback: {
      title: 'Budovy',
      caption: 'Registrované budovy a jejich poslední naměřená hodnota',
      colBuilding: 'Budova',
      colValue: 'Poslední hodnota',
      colObserved: 'Naměřeno',
      empty: 'Pro tuto veličinu nejsou žádné budovy.',
      openDetail: 'Otevřít {{name}}',
    },
    dialog: {
      close: 'Zavřít',
      viewDetail: 'Zobrazit detail budovy',
      sensorCount_one: '{{count}} senzor',
      sensorCount_few: '{{count}} senzory',
      sensorCount_other: '{{count}} senzorů',
      loading: 'Načítání měření…',
      noData: 'V tomto období nejsou žádná měření.',
      error: 'Měření se nepodařilo načíst.',
      summaryTitle: 'Souhrn',
      measurements: '{{count}} měření',
    },
    range: {
      label: 'Časové období',
      day: 'Poslední den',
      week: 'Poslední týden',
      month: 'Poslední měsíc',
      year: 'Poslední rok',
    },
    chart: {
      timeSeriesTitle: 'Vývoj',
      timeSeriesDesc: 'Průměrná hodnota v čase se zvýrazněným rozsahem min–max.',
      boxplotTitle: 'Rozložení',
      boxplotDesc:
        'Rozptyl hodnot: obdélník pokrývá 25.–75. percentil, čára značí medián a vousy dosahují ' +
        '5.–95. percentilu.',
      axisTime: 'Čas',
      axisValue: 'Hodnota ({{unit}})',
      seriesAverage: 'Průměr',
      rangeBand: 'Rozsah min–max',
      noData: 'V tomto období nejsou žádná měření.',
    },
    boxplot: {
      min: 'Min',
      p05: '5. pct',
      p25: '25. pct',
      median: 'Medián',
      p75: '75. pct',
      p95: '95. pct',
      max: 'Max',
    },
    units: {
      // Volič zobrazené jednotky (PER). Převod je pouze zobrazovací; data zůstávají kanonická.
      label: 'Zobrazená jednotka',
      ariaLabel: 'Vyberte zobrazenou jednotku',
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
      consentLabel: 'Souhlasím se {{link}}',
      consentLink: 'zásadami ochrany osobních údajů',
      consentRequired: 'Pro vytvoření účtu musíte souhlasit se zásadami ochrany osobních údajů.',
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
    // Typ čísla domovního je pevný výčet na backendu (ne SKOS číselník), proto jsou jeho popisky
    // zde. Adresa vychází z českého OFN modelu Adresy (kotveno na RÚIAN).
    houseNumberTypes: {
      cp: 'Číslo popisné (č. p.)',
      cev: 'Číslo evidenční (č. ev.)',
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
      addressPointCode: 'Kód adresního místa (RÚIAN)',
      addressPointCodeHint:
        'Identifikátor adresního místa z registru RÚIAN (kód adresního místa). Backend adresu ' +
        'neověřuje v RÚIAN — zadejte správný kód.',
      streetName: 'Název ulice',
      streetCode: 'Kód ulice (RÚIAN)',
      ruianCodeHint:
        'Volitelný kód územního prvku z registru RÚIAN; zpřístupní jeho dereferencovatelné IRI ' +
        '(linked.cuzk.cz). Nechte prázdné, pokud jej neznáte.',
      houseNumber: 'Číslo domovní',
      houseNumberType: 'Typ čísla domovního',
      orientationNumber: 'Číslo orientační',
      orientationNumberLetter: 'Písmeno orientačního čísla',
      municipalityName: 'Obec',
      municipalityCode: 'Kód obce (RÚIAN)',
      municipalityPartName: 'Část obce',
      municipalityPartCode: 'Kód části obce (RÚIAN)',
      psc: 'PSČ',
      districtName: 'Okres',
      districtCode: 'Kód okresu (RÚIAN)',
      regionName: 'Kraj',
      regionCode: 'Kód kraje / VÚSC (RÚIAN)',
      buildingType: 'Typ budovy',
      latitude: 'Zeměpisná šířka',
      longitude: 'Zeměpisná délka',
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
      ingestionId: 'ID senzoru (pro příjem dat)',
      ingestionIdHint:
        'Tento identifikátor použijte při odesílání měření do ingestního API.',
      chartsTitle: 'Poslední měření',
      chartsSubtitle: 'Posledních 24 hodin, jeden graf na měřenou veličinu.',
      chartError: 'Měření se nepodařilo načíst.',
      chartNoData: 'Za posledních 24 hodin nejsou žádná měření.',
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
  about: {
    title: 'O Ambiquality',
    intro: {
      heading: 'O platformě',
      lead:
        'Ambiquality je open-source platforma pro monitorování kvality vnitřního prostředí ' +
        '(IEQ). Sbírá měření z IoT senzorů napříč čtyřmi oblastmi IEQ — kvalita vnitřního ' +
        'ovzduší, tepelný komfort, akustický komfort a zrakový komfort — a pokrývá veličiny ' +
        'jako CO₂, teplota, vlhkost, prachové částice, těkavé organické látky, akustika a ' +
        'osvětlení; tato data zveřejňuje jako otevřená data.',
      app:
        'Tato webová aplikace je návštěvnické a operátorské rozhraní platformy: veřejnost si ' +
        'může prohlížet pozorování na interaktivní mapě a procházet katalog budov, místností a ' +
        'senzorů, zatímco operátoři tento katalog registrují a spravují.',
      thesis:
        'Vytvořeno jako bakalářská práce na VŠE v Praze (Vysoká škola ekonomická v Praze), ' +
        'autor Vilém Charwot, odevzdání květen 2026.',
    },
    contact: {
      heading: 'Kontakt',
      authorLabel: 'Autor',
      authorName: 'Vilém Charwot',
      emailLabel: 'E-mail',
    },
    source: {
      heading: 'Zdrojový kód',
      description:
        'Ambiquality je open source. Repozitáře frontendu i backendu jsou zveřejněny na ' +
        'GitHubu.',
      linkLabel: 'Zobrazit zdrojový kód na GitHubu',
    },
    data: {
      heading: 'Licence dat',
      description: 'Měření zveřejňovaná platformou jsou otevřená data pod licencí:',
    },
    acknowledgements: {
      heading: 'Poděkování',
      description:
        'Tato aplikace je postavena na open-source softwaru. S vděčností uvádíme následující ' +
        'projekty a zachováváme jejich licenční ujednání.',
      licenseLabel: 'Licence: {{license}}',
      basemapNote:
        'Mapové podklady a styly poskytují OpenFreeMap a OpenMapTiles; podkladová geografická ' +
        'data jsou © přispěvatelé OpenStreetMap a jsou licencována pod ODbL.',
    },
  },
  archive: {
    title: 'Archiv dat',
    intro:
      'Stáhněte si měsíční archivy otevřených naměřených dat nebo si přímo stáhněte kompletní ' +
      'aktuální datovou sadu. Všechny soubory jsou zveřejněny pod licencí {{license}}.',
    live: {
      heading: 'Stáhnout všechna aktuální data',
      description: 'Stáhněte si kompletní aktuální datovou sadu ve formátu CSV — bez čekání na archiv.',
      csvLabel: 'Stáhnout všechna pozorování (CSV)',
    },
    table: {
      heading: 'Měsíční archivy',
      caption: 'Stažitelné měsíční archivy naměřených dat',
      colPeriod: 'Období',
      colFormat: 'Formát',
      colSize: 'Velikost',
      colDownload: 'Stažení',
      download: 'Stáhnout',
      downloadLabel: 'Stáhnout archiv za období {{period}}',
      sizeUnknown: '—',
    },
    empty: {
      title: 'Zatím nebyly zveřejněny žádné archivy',
      body: 'Zatím nebyly zveřejněny žádné měsíční archivy. Kompletní aktuální datovou sadu si ' +
        'můžete stáhnout výše.',
    },
    loading: 'Načítání archivů…',
    error: {
      title: 'Archivy nejsou dostupné',
      body: 'Seznam archivů se nepodařilo načíst. Zkuste to prosím později; kompletní stažení ' +
        'aktuálních dat výše zůstává k dispozici, pokud je dostupné.',
      retry: 'Zkusit znovu',
    },
  },
  catalog: {
    fallbackTitle: 'Katalog otevřených dat',
    intro:
      'Strojově čitelná metadata ve formátu DCAT-AP popisující zveřejněná otevřená data ' +
      'pozorování a přístupové body, odkud je lze získat.',
    dataset: {
      heading: 'Datová sada',
      publisherLabel: 'Poskytovatel',
      licenseLabel: 'Licence',
      themeLabel: 'Téma',
      periodicityLabel: 'Četnost aktualizace',
      keywordsLabel: 'Klíčová slova',
      contactLabel: 'Kontakt',
    },
    coverage: {
      heading: 'Pokrytí',
      issuedLabel: 'Zveřejněno',
      temporalLabel: 'Časové období',
      temporalRange: '{{start}} – {{end}}',
      spatialLabel: 'Územní rozsah',
      bboxLabel: 'Zeměpisná délka {{minLon}} až {{maxLon}}, zeměpisná šířka {{minLat}} až {{maxLat}}',
    },
    distributions: {
      heading: 'Přístup k živým datům',
      intro: 'Získejte živá data pozorování přímo z otevřeného API:',
    },
    theme: {
      ENVI: 'Životní prostředí',
    },
    periodicity: {
      CONT: 'Průběžně',
    },
    loading: 'Načítání katalogu…',
    error: {
      title: 'Katalog není dostupný',
      body: 'Metadata katalogu se nepodařilo načíst. Zkuste to prosím později.',
      retry: 'Zkusit znovu',
    },
  },
  legal: {
    privacy: {
      title: 'Zásady ochrany osobních údajů',
      lastUpdated: 'Poslední aktualizace: červen 2026',
      intro:
        'Tyto zásady ochrany osobních údajů vysvětlují, jak platforma Ambiquality zpracovává ' +
        'osobní údaje při používání této webové aplikace. Jsou vypracovány v souladu s nařízením ' +
        '(EU) 2016/679 (obecné nařízení o ochraně osobních údajů, „GDPR“).',
      controller: {
        heading: 'Správce údajů',
        body:
          'Správcem údajů je projekt Ambiquality, provozovaný jako bakalářská práce na Vysoké ' +
          'škole ekonomické v Praze (VŠE Praha). S jakýmkoli požadavkem týkajícím se ochrany ' +
          'osobních údajů se na nás můžete obrátit na níže uvedené kontaktní adrese.',
        contactLabel: 'Kontakt',
      },
      data: {
        heading: 'Jaké údaje shromažďujeme',
        intro: 'V závislosti na způsobu používání aplikace zpracováváme tyto osobní údaje:',
        accountEmail:
          'E-mailová adresa účtu — když se zaregistrujete jako provozovatel, uložíme e-mailovou ' +
          'adresu, kterou zadáte. Slouží k identifikaci vašeho účtu, k jeho potvrzení a ke ' +
          'kontaktování ohledně vašeho účtu.',
        addressData:
          'Údaje o budově a poloze — provozovatelé zadávají adresu a polohu budov, které ' +
          'registrují. Tato adresa nemusí, ale může být adresou samotného registrujícího ' +
          'provozovatele: provozovatel může zaregistrovat budovu patřící třetí straně, takže ' +
          'adresa může popisovat objekt jiný než domov či pracoviště provozovatele.',
        technical:
          'Technické údaje — standardní metadata požadavků (například IP adresa a časové razítko ' +
          'API požadavků) mohou být přechodně zpracovávána backendovými službami za účelem ' +
          'provozu a zabezpečení platformy.',
      },
      purpose: {
        heading: 'Účel a právní základ',
        intro: 'Výše uvedené údaje zpracováváme na základě těchto právních základů podle čl. 6 GDPR:',
        contract:
          'Plnění smlouvy (čl. 6 odst. 1 písm. b)) — k vytvoření a správě vašeho provozovatelského ' +
          'účtu a k poskytování funkcí registrace a správy katalogu, které požadujete.',
        legitimate:
          'Oprávněné zájmy (čl. 6 odst. 1 písm. f)) — k zajištění bezpečnosti a provozu platformy ' +
          'a k zabránění zneužití.',
        openData:
          'Veřejný zájem / zveřejnění otevřených dat — údaje o budově a poloze jsou zveřejňovány ' +
          'jako otevřená data. Souřadnice na veřejné mapě jsou pro nevlastníky záměrně zhrubeny ' +
          '(maskovány), aby nebyla prozrazena přesná poloha.',
      },
      retention: {
        heading: 'Doba uchovávání',
        body:
          'Údaje o účtu uchováváme po dobu existence vašeho provozovatelského účtu. Pokud svůj ' +
          'účet smažete, související osobní údaje jsou odstraněny nebo anonymizovány, s výjimkou ' +
          'případů, kdy je musíme uchovat ke splnění právní povinnosti. Zveřejněná otevřená data ' +
          'mohou být uchována jako součást záznamu otevřených dat.',
      },
      recipients: {
        heading: 'Příjemci a zpracovatelé',
        body:
          'Osobní údaje jsou zpracovávány vlastními backendovými službami platformy (autentizace, ' +
          'katalog/evidence a veřejné API otevřených dat). K odesílání zpráv o potvrzení účtu a ' +
          'oznámení se používá poskytovatel doručování e-mailů. Osobní údaje neprodáváme.',
      },
      rights: {
        heading: 'Vaše práva',
        intro:
          'Jako subjekt údajů máte podle GDPR následující práva, která můžete uplatnit ' +
          'kontaktováním na níže uvedené adrese:',
        access: 'Právo na přístup — získat kopii osobních údajů, které o vás uchováváme.',
        rectification: 'Právo na opravu — nechat opravit nepřesné údaje.',
        erasure: 'Právo na výmaz — nechat vymazat své osobní údaje („právo být zapomenut“).',
        restriction: 'Právo na omezení — omezit, jak vaše údaje zpracováváme.',
        objection: 'Právo vznést námitku — vznést námitku proti zpracování na základě oprávněných zájmů.',
        portability:
          'Právo na přenositelnost údajů — obdržet své údaje ve strukturovaném, strojově ' +
          'čitelném formátu.',
        complaint:
          'Máte rovněž právo podat stížnost u dozorového úřadu (v České republice u Úřadu pro ' +
          'ochranu osobních údajů).',
      },
      contact: {
        heading: 'Jak nás kontaktovat',
        body: 'S jakýmkoli požadavkem nebo dotazem ohledně ochrany osobních údajů nás kontaktujte na:',
      },
      disclaimer: {
        heading: 'Status tohoto dokumentu',
        body:
          'Ambiquality je studentská bakalářská práce na Vysoké škole ekonomické v Praze ' +
          '(VŠE Praha). Tyto zásady ochrany osobních údajů jsou předběžné a čekají na právní ' +
          'revizi autora; před případným produkčním nasazením se mohou změnit.',
      },
    },
  },
};
