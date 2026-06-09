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
      catalog: 'Catalogue',
      archive: 'Archive',
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
    actions: {
      save: 'Save',
      cancel: 'Cancel',
      submit: 'Submit',
      skipToContent: 'Skip to content',
    },
    footer: {
      label: 'Site footer',
      privacy: 'Privacy Policy',
      github: 'GitHub',
      contact: 'Contact',
      dataLicense: 'Open data licensed under {{license}}.',
    },
  },
  map: {
    // F18 public interactive map (UC18). Quantity labels themselves come from the backend
    // (`/v1/properties` + SKOS prefLabels) — only the map's own chrome lives here.
    title: 'Indoor environmental quality map',
    intro:
      'Explore the latest readings from registered buildings. Pick a quantity, then select a ' +
      'building to see its trend and distribution. Locations are approximate by design.',
    mapRegionLabel: 'Interactive map of monitored buildings',
    filter: {
      label: 'Quantity',
      placeholder: 'Select a quantity…',
      loading: 'Loading quantities…',
    },
    legend: {
      title: 'Legend',
      good: 'Good',
      moderate: 'Moderate',
      poor: 'Poor',
      unknown: 'No recent data',
      continuous: 'Coloured by value (lighter = lower, darker = higher).',
    },
    marker: {
      label: '{{name}}: {{value}}',
      valueUnavailable: '{{name}}: no recent data',
    },
    value: {
      withUnit: '{{value}} {{unit}}',
      stale: 'No recent data',
      observedAt: 'Measured {{date}}',
    },
    degradation: {
      title: 'Live values are unavailable',
      body: 'The map is shown without current readings. You can still browse buildings in the list below.',
      retry: 'Try again',
    },
    fallback: {
      title: 'Buildings',
      caption: 'Registered buildings and their latest reading',
      colBuilding: 'Building',
      colValue: 'Latest value',
      colObserved: 'Measured',
      empty: 'No buildings to show for this quantity.',
      openDetail: 'Open {{name}}',
    },
    dialog: {
      close: 'Close',
      viewDetail: 'View building detail',
      sensorCount_one: '{{count}} sensor',
      sensorCount_few: '{{count}} sensors',
      sensorCount_other: '{{count}} sensors',
      loading: 'Loading measurements…',
      noData: 'No measurements in this period.',
      error: 'The measurements could not be loaded.',
      summaryTitle: 'Summary',
      measurements: '{{count}} measurements',
    },
    range: {
      label: 'Time range',
      day: 'Last day',
      week: 'Last week',
      month: 'Last month',
      year: 'Last year',
    },
    chart: {
      timeSeriesTitle: 'Trend',
      timeSeriesDesc: 'Average value over time, with the min–max range shaded.',
      boxplotTitle: 'Distribution',
      boxplotDesc:
        'Spread of values: the box spans the 25th–75th percentile, the line marks the median, ' +
        'and the whiskers reach the 5th–95th percentile.',
      axisTime: 'Time',
      axisValue: 'Value ({{unit}})',
      seriesAverage: 'Average',
      rangeBand: 'Min–max range',
      noData: 'No measurements in this period.',
    },
    boxplot: {
      min: 'Min',
      p05: '5th pct',
      p25: '25th pct',
      median: 'Median',
      p75: '75th pct',
      p95: '95th pct',
      max: 'Max',
    },
    units: {
      // Display-unit chooser (PER). Conversion is display-only; the data stays canonical.
      label: 'Display unit',
      ariaLabel: 'Choose display unit',
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
    moreInfo: 'More information',
    validation: {
      required: 'This field is required.',
      invalid: 'This value is not valid.',
      range: 'Enter a number between {{min}} and {{max}}.',
      email: 'Enter a valid email address.',
      passwordTooShort: 'Use at least 8 characters.',
    },
  },
  account: {
    // F01–F04 auth & account screens. Generic where anti-enumeration applies (login/register).
    loading: 'Loading…',
    nav: {
      login: 'Sign in',
      account: 'Account',
      logout: 'Sign out',
    },
    fields: {
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
      currentPassword: 'Current password',
      newPassword: 'New password',
      newEmail: 'New email',
    },
    login: {
      title: 'Sign in',
      submit: 'Sign in',
      registerPrompt: 'No account yet?',
      registerLink: 'Create one',
      invalidCredentials: 'Email or password is incorrect.',
      rateLimited: 'Too many attempts. Please try again in {{seconds}} s.',
      rateLimitedNoTime: 'Too many attempts. Please try again shortly.',
    },
    register: {
      title: 'Create account',
      submit: 'Create account',
      loginPrompt: 'Already have an account?',
      loginLink: 'Sign in',
      passwordMismatch: 'The passwords do not match.',
      conflict: 'If this email can be registered, a confirmation link has been sent.',
      successTitle: 'Check your email',
      successBody:
        'We sent a confirmation link to {{email}}. Open it to activate your account, then sign in.',
      resend: 'Resend confirmation email',
      resendDone: 'If the address is registered, a new link is on its way.',
      consentLabel: 'I agree to the {{link}}',
      consentLink: 'Privacy Policy',
      consentRequired: 'You must agree to the Privacy Policy to create an account.',
    },
    settings: {
      title: 'Account settings',
      emailLabel: 'Email',
      statusConfirmed: 'Email confirmed',
      statusUnconfirmed: 'Email not confirmed',
      changePasswordTitle: 'Change password',
      changePasswordSubmit: 'Update password',
      changePasswordDone: 'Your password has been changed.',
      changeEmailTitle: 'Change email',
      changeEmailSubmit: 'Request email change',
      changeEmailPending:
        'We sent a confirmation link to your new address. The change applies once you confirm it.',
      logoutTitle: 'Sign out',
      logoutSubmit: 'Sign out',
      dangerTitle: 'Delete account',
      dangerBody: 'This permanently deletes your account and cannot be undone.',
      deleteConfirmLabel: 'Type DELETE to confirm',
      deleteConfirmKeyword: 'DELETE',
      deleteConfirmMismatch: 'Type DELETE exactly to confirm.',
      deleteSubmit: 'Permanently delete account',
      deleteForbidden: 'You can only delete your own account.',
    },
    confirm: {
      title: 'Email confirmation',
      checking: 'Confirming your email…',
      emailSuccess: 'Your email address is confirmed. You can now sign in.',
      emailFailure: 'This confirmation link is invalid or has expired.',
      emailChangeSuccess: 'Your new email address is confirmed.',
      emailChangeFailure: 'This email-change link is invalid or has expired.',
      missingToken: 'This confirmation link is incomplete.',
      goToLogin: 'Go to sign in',
    },
  },
  evidence: {
    // F05–F09 operator evidence admin. Canonical glossary terms only (budova/building,
    // místnost/room, senzor/sensor, veličina/quantity, jednotka/unit). Codelist labels
    // (building types, room functions, ventilation, pollution sources, parameters, units,
    // sensor status) are NOT here — they come from backend SKOS prefLabels at runtime.
    nav: {
      buildings: 'Buildings',
      newBuilding: 'Register building',
      newRoom: 'Register room',
      newSensor: 'Register sensor',
      back: 'Back',
      details: 'Details',
      edit: 'Edit',
      history: 'History',
      rooms: 'Rooms',
      sensors: 'Sensors',
    },
    pager: {
      previous: 'Previous',
      next: 'Next',
      status: 'Page {{page}} of {{total}}',
    },
    common: {
      loading: 'Loading…',
      none: 'None',
      empty: 'Nothing here yet.',
      slug: 'Identifier',
      uri: 'URI',
      add: 'Add',
      remove: 'Remove',
      saved: 'Saved.',
      save: 'Save',
      cancel: 'Cancel',
      copy: 'Copy',
      copied: 'Copied.',
    },
    select: {
      placeholder: 'Select…',
      loading: 'Loading…',
      roomPlaceholder: 'Select a room…',
    },
    // House-number type is a fixed backend enum (not a SKOS codelist), so its labels live in the
    // frontend dictionary. The address follows the Czech OFN Adresy model (anchored on RÚIAN).
    houseNumberTypes: {
      cp: 'Descriptive number (č. p.)',
      cev: 'Registry number (č. ev.)',
    },
    asOf: {
      title: 'History viewer',
      label: 'Show state as of',
      apply: 'View',
      reset: 'Latest',
      viewing: 'Viewing the state as of {{date}}.',
      hint: 'Pick a past date and time to project how this record looked then.',
    },
    validFrom: {
      label: 'Valid from',
      hint: 'When this change takes effect. Must be later than the previous version.',
      tooEarly: 'The valid-from date must be later than the current version’s start.',
    },
    fields: {
      name: 'Name',
      addressPointCode: 'Address point code (RÚIAN)',
      addressPointCodeHint:
        'Identifier of the address point in the Czech RÚIAN registry (kód adresního místa). The ' +
        'backend does not verify the address against RÚIAN — enter the correct code.',
      streetName: 'Street name',
      streetCode: 'Street code (RÚIAN)',
      ruianCodeHint:
        'Optional RÚIAN code for the territorial element; enables its dereferenceable IRI ' +
        '(linked.cuzk.cz). Leave blank if unknown.',
      houseNumber: 'House number',
      houseNumberType: 'House-number type',
      orientationNumber: 'Orientation number',
      orientationNumberLetter: 'Orientation-number letter',
      municipalityName: 'Municipality',
      municipalityCode: 'Municipality code (RÚIAN)',
      municipalityPartName: 'Municipality part',
      municipalityPartCode: 'Municipality-part code (RÚIAN)',
      psc: 'Postal code',
      districtName: 'District',
      districtCode: 'District code (RÚIAN)',
      regionName: 'Region',
      regionCode: 'Region / VÚSC code (RÚIAN)',
      buildingType: 'Building type',
      latitude: 'Latitude',
      longitude: 'Longitude',
      yearBuilt: 'Year built',
      yearRenovated: 'Year renovated',
      floor: 'Floor',
      function: 'Function',
      exposure: 'Exposure',
      areaM2: 'Area (m²)',
      ceilingHeightM: 'Ceiling height (m)',
      ventilation: 'Ventilation',
      manufacturer: 'Manufacturer',
      model: 'Model',
      serialNumber: 'Serial number',
      status: 'Status',
      sourceCode: 'Pollution source',
      parameterCode: 'Measured quantity',
      newRoom: 'Move to room',
    },
    building: {
      listTitle: 'Buildings',
      registerTitle: 'Register building',
      registerSubmit: 'Register building',
      detailTitle: 'Building',
      editTitle: 'Building attributes',
      historyTitle: 'Building history',
      addressTitle: 'Address',
      yearsTitle: 'Construction years',
      locationTitle: 'Location',
      registered: 'The building has been registered.',
    },
    room: {
      listTitle: 'Rooms',
      registerTitle: 'Register room',
      registerSubmit: 'Register room',
      detailTitle: 'Room',
      editTitle: 'Room attributes',
      historyTitle: 'Room history',
      geometryTitle: 'Geometry',
      pollutionSourcesTitle: 'Pollution sources',
      registered: 'The room has been registered.',
    },
    sensor: {
      listTitle: 'Sensors',
      registerTitle: 'Register sensor',
      registerSubmit: 'Register sensor',
      detailTitle: 'Sensor',
      editTitle: 'Sensor attributes',
      historyTitle: 'Sensor history',
      identityTitle: 'Identity',
      placementTitle: 'Placement',
      statusTitle: 'Lifecycle status',
      relocateTitle: 'Relocate sensor',
      relocateSubmit: 'Move sensor',
      measuredParametersTitle: 'Measured quantities',
      ingestionId: 'Sensor ID (for ingestion)',
      ingestionIdHint:
        'Use this identifier when sending measurements to the ingestion API.',
      chartsTitle: 'Recent measurements',
      chartsSubtitle: 'Last 24 hours, one chart per measured quantity.',
      chartError: 'Measurements could not be loaded.',
      chartNoData: 'No measurements in the last 24 hours.',
      registered: 'The sensor has been registered.',
    },
    apiKey: {
      title: 'Save the API key now',
      warning:
        'This is the only time this key is shown. It cannot be retrieved again. Copy it and store it somewhere safe before leaving this page.',
      copy: 'Copy API key',
      copied: 'Copied to clipboard.',
      label: 'API key',
      done: "I've saved it",
    },
    collection: {
      addPlaceholder: 'Enter a code',
      addLabel: 'Add to list',
      removeLabel: 'Remove {{code}}',
      emptyList: 'No entries yet.',
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
    'urn:ambiquality:auth:invalid-email': 'Please enter a valid email address.',
    'urn:ambiquality:auth:email-already-registered':
      'If this email can be registered, a confirmation link has been sent.',
    'urn:ambiquality:auth:email-not-confirmed': 'Please confirm your email address first.',
    'urn:ambiquality:auth:invalid-refresh-token': 'Your session has expired. Please sign in again.',
    'urn:ambiquality:auth:user-not-found': 'Account not found.',
    'urn:ambiquality:auth:too-many-login-attempts': 'Too many attempts. Please try again shortly.',
    'urn:ambiquality:auth:forbidden': 'You are not allowed to perform this action.',
    'urn:ambiquality:auth:domain-rule-violation': 'The request could not be completed.',
    'urn:ambiquality:evidence:building-not-found': 'This building could not be found.',
    'urn:ambiquality:evidence:room-not-found': 'This room could not be found.',
    'urn:ambiquality:evidence:pollution-source-not-found': 'This pollution source could not be found.',
    'urn:ambiquality:evidence:sensor-not-found': 'This sensor could not be found.',
    'urn:ambiquality:evidence:measured-parameter-not-found':
      'This measured quantity could not be found.',
    'urn:ambiquality:evidence:forbidden': 'You are not allowed to modify this record.',
    'urn:ambiquality:evidence:duplicate-uri-slug':
      'A record with this identifier already exists. Please use a different name.',
    'urn:ambiquality:evidence:unknown-codelist-code': 'An unknown code was supplied.',
    'urn:ambiquality:evidence:overlapping-validity-range':
      'The valid-from date overlaps an existing version. Choose a later date.',
    'urn:ambiquality:evidence:invalid-attribute-value': 'This value is not valid.',
    'urn:ambiquality:evidence:invalid-timestamp': 'This date or time is not valid.',
    'urn:ambiquality:evidence:internal-server-error':
      'The server encountered an error. Please try again.',
    'urn:ambiquality:evidence:domain-rule-violation': 'This change breaks a domain rule.',
    'urn:ambiquality:public:not-found': 'The requested resource was not found.',
  },
  about: {
    // F-scope: the public "About" page — platform description + open-source attribution.
    // Library/licence names and OSS project names are proper nouns and stay untranslated;
    // only the surrounding prose lives here.
    title: 'About Ambiquality',
    intro: {
      heading: 'About the platform',
      lead:
        'Ambiquality is an open-source platform for monitoring Indoor Environmental Quality ' +
        '(IEQ). It collects measurements from IoT sensors across the four IEQ domains — indoor ' +
        'air quality, thermal comfort, acoustic comfort and visual comfort — covering ' +
        'parameters such as CO₂, temperature, humidity, particulate matter, volatile organic ' +
        'compounds, acoustics and light, and publishes them as open data.',
      app:
        'This web application is the platform’s visitor and operator interface: the public can ' +
        'explore measurements on an interactive map and browse the catalog of buildings, rooms ' +
        'and sensors, while operators register and maintain that catalog.',
      thesis:
        'Built as a bachelor thesis at VŠE Prague (Prague University of Economics and ' +
        'Business) by Vilém Charwot, submission May 2026.',
    },
    contact: {
      heading: 'Contact',
      authorLabel: 'Author',
      authorName: 'Vilém Charwot',
      emailLabel: 'Email',
    },
    source: {
      heading: 'Source code',
      description:
        'Ambiquality is open source. The frontend and backend repositories are published on ' +
        'GitHub.',
      linkLabel: 'View the source on GitHub',
    },
    data: {
      heading: 'Data licence',
      description: 'The measurements published by the platform are open data, licensed under:',
    },
    acknowledgements: {
      heading: 'Acknowledgements',
      description:
        'This application is built with open-source software. We gratefully acknowledge the ' +
        'following projects, retaining their licence notices.',
      licenseLabel: 'Licence: {{license}}',
      basemapNote:
        'Basemap tiles and styles are provided by OpenFreeMap and OpenMapTiles; the underlying ' +
        'geographic data is © OpenStreetMap contributors and licensed under ODbL.',
    },
  },
  archive: {
    // F17 — the visitor "file server": a list of downloadable monthly data archives, plus a link
    // to the live full CSV export. Reads the DCAT catalogue's distributions (Public.Api).
    title: 'Data archive',
    intro:
      'Download monthly archives of the open measurement data, or fetch the full current dataset ' +
      'directly. All files are published under the {{license}} licence.',
    live: {
      heading: 'Download all current data',
      description: 'Stream the complete, up-to-date dataset as CSV — no archiving required.',
      csvLabel: 'Download all observations (CSV)',
    },
    table: {
      heading: 'Monthly archives',
      caption: 'Downloadable monthly archives of the measurement data',
      colPeriod: 'Period',
      colFormat: 'Format',
      colSize: 'Size',
      colDownload: 'Download',
      download: 'Download',
      downloadLabel: 'Download archive for {{period}}',
      sizeUnknown: '—',
    },
    empty: {
      title: 'No archives published yet',
      body: 'No monthly archives have been published yet. You can still download the full current ' +
        'dataset above.',
    },
    loading: 'Loading archives…',
    error: {
      title: 'Archives are unavailable',
      body: 'The archive listing could not be loaded. Please try again later; you can still use the ' +
        'full current-data download above when it is available.',
      retry: 'Try again',
    },
  },
  catalog: {
    // F16 — the human-readable rendering of the DCAT-AP open-data catalogue metadata. Reads the
    // single `/v1/catalog` endpoint (Public.Api) via the shared `useCatalog` hook. Downloadable
    // archives live on the separate Archive tab; this page covers the descriptive metadata and the
    // live API access points only.
    fallbackTitle: 'Open data catalogue',
    intro:
      'Machine-readable, DCAT-AP metadata describing the published open observation data and the ' +
      'live access points where it can be retrieved.',
    dataset: {
      heading: 'Dataset',
      publisherLabel: 'Publisher',
      licenseLabel: 'Licence',
      themeLabel: 'Theme',
      periodicityLabel: 'Update frequency',
      keywordsLabel: 'Keywords',
      contactLabel: 'Contact',
    },
    coverage: {
      heading: 'Coverage',
      issuedLabel: 'Published',
      temporalLabel: 'Time period',
      temporalRange: '{{start}} – {{end}}',
      spatialLabel: 'Spatial extent',
      bboxLabel: 'Longitude {{minLon}} to {{maxLon}}, latitude {{minLat}} to {{maxLat}}',
    },
    distributions: {
      heading: 'Live data access',
      intro: 'Retrieve the live observation data directly from the open API:',
    },
    // Friendly labels for the EU controlled-vocabulary URIs the backend emits. Unmapped URIs fall
    // back to the raw URI text (still rendered as a dereferenceable link).
    theme: {
      ENVI: 'Environment',
    },
    periodicity: {
      CONT: 'Continuous',
    },
    loading: 'Loading catalogue…',
    error: {
      title: 'Catalogue is unavailable',
      body: 'The catalogue metadata could not be loaded. Please try again later.',
      retry: 'Try again',
    },
  },
  legal: {
    // Public Privacy Policy page (GDPR/EU framing). Structured as semantic sections; paragraphs
    // are discrete keys so translators keep cs/en parallel and we never inject raw HTML.
    privacy: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: June 2026',
      intro:
        'This Privacy Policy explains how the Ambiquality platform processes personal data when ' +
        'you use this web application. It is written to comply with Regulation (EU) 2016/679 ' +
        '(the General Data Protection Regulation, “GDPR”).',
      controller: {
        heading: 'Data controller',
        body:
          'The data controller is the Ambiquality project, operated as a bachelor-thesis project ' +
          'at Prague University of Economics and Business (VŠE Praha). For any privacy-related ' +
          'request you can reach us at the contact address below.',
        contactLabel: 'Contact',
      },
      data: {
        heading: 'What data we collect',
        intro: 'Depending on how you use the application, we process the following personal data:',
        accountEmail:
          'Account email address — when you register as an operator, we store the email address ' +
          'you provide. It is used to identify your account, to confirm it, and to contact you ' +
          'about your account.',
        addressData:
          'Building and location data — operators enter the address and location of the ' +
          'buildings they register. This address data may or may not be the registering ' +
          'operator’s own: an operator may register a building that belongs to a third party, ' +
          'so the address can describe premises other than the operator’s home or workplace.',
        technical:
          'Technical data — standard request metadata (such as the IP address and timestamp of ' +
          'API requests) may be processed transiently by the backend services to operate and ' +
          'secure the platform.',
      },
      purpose: {
        heading: 'Purpose and legal basis',
        intro: 'We process the data above on the following legal bases under GDPR Article 6:',
        contract:
          'Performance of a contract (Art. 6(1)(b)) — to create and manage your operator account ' +
          'and provide the registration and catalog-maintenance functions you request.',
        legitimate:
          'Legitimate interests (Art. 6(1)(f)) — to keep the platform secure and operational and ' +
          'to prevent abuse.',
        openData:
          'Public-interest / open-data publication — building and location data are published as ' +
          'open data. Public map coordinates are intentionally coarsened (masked) for non-owners ' +
          'so that exact locations are not revealed.',
      },
      retention: {
        heading: 'Retention period',
        body:
          'We keep account data for as long as your operator account exists. If you delete your ' +
          'account, associated personal data is removed or anonymized, except where we must keep ' +
          'it to meet a legal obligation. Published open data may be retained as part of the ' +
          'open-data record.',
      },
      recipients: {
        heading: 'Recipients and processors',
        body:
          'Personal data is processed by the platform’s own backend services (authentication, ' +
          'catalog/evidence and the public open-data API). An email-delivery provider is used to ' +
          'send account-confirmation and notification messages. We do not sell personal data.',
      },
      rights: {
        heading: 'Your rights',
        intro:
          'As a data subject you have the following rights under the GDPR, which you can exercise ' +
          'by contacting us at the address below:',
        access: 'Right of access — to obtain a copy of the personal data we hold about you.',
        rectification: 'Right to rectification — to have inaccurate data corrected.',
        erasure: 'Right to erasure — to have your personal data deleted (“right to be forgotten”).',
        restriction: 'Right to restriction — to limit how we process your data.',
        objection: 'Right to object — to object to processing based on legitimate interests.',
        portability:
          'Right to data portability — to receive your data in a structured, machine-readable ' +
          'format.',
        complaint:
          'You also have the right to lodge a complaint with a supervisory authority (in the ' +
          'Czech Republic, the Office for Personal Data Protection / Úřad pro ochranu osobních ' +
          'údajů).',
      },
      contact: {
        heading: 'How to contact us',
        body: 'For any privacy request or question, contact us at:',
      },
      disclaimer: {
        heading: 'Status of this notice',
        body:
          'Ambiquality is a student bachelor-thesis project at Prague University of Economics and ' +
          'Business (VŠE Praha). This Privacy Policy is provisional and is pending the author’s ' +
          'legal review; it may change before any production deployment.',
      },
    },
  },
} as const;
