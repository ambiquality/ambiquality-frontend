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
    'urn:ambiquality:evidence:validation': 'Some fields need your attention.',
    'urn:ambiquality:evidence:unknown-codelist-code': 'An unknown code was supplied.',
    'urn:ambiquality:evidence:domain-rule-violation': 'This change breaks a domain rule.',
    'urn:ambiquality:evidence:overlapping-validity-range':
      'The validity range overlaps an existing one.',
    'urn:ambiquality:public:not-found': 'The requested resource was not found.',
  },
} as const;
