/**
 * What an emailed link did to the address bar. Supabase sends invite and password-reset links
 * back to the site with the session in the URL hash (#access_token=...&type=invite), and
 * supabase-js removes that hash as soon as it has read the session. This module reads it first,
 * when it is first imported, which happens before the Supabase client is created.
 *
 * - An invite or recovery link means the person has no password yet (or forgot it), so the app
 *   sends them to /set-password wherever the link landed.
 * - An error in the hash (an expired or used link) is shown on the sign-in page.
 *
 * Every storage access is wrapped: sessionStorage can be unavailable, and then the module-level
 * flags still cover the current page load.
 */

const SETUP_KEY = 'g39.passwordSetupPending';

let setupPending = false;
let linkProblem = false;

function readLanding(): void {
  try {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const type = params.get('type');
    if (params.get('access_token') && (type === 'invite' || type === 'recovery')) {
      setupPending = true;
      try {
        window.sessionStorage.setItem(SETUP_KEY, '1');
      } catch {
        // Storage unavailable: the flag lives only until the page reloads.
      }
    } else if (params.get('error') || params.get('error_code')) {
      linkProblem = true;
    }
  } catch {
    // No window or a malformed hash: treat it as an ordinary page load.
  }
}

readLanding();

/** True from an invite or recovery link until the person has saved a password. */
export function isPasswordSetupPending(): boolean {
  if (setupPending) return true;
  try {
    return window.sessionStorage.getItem(SETUP_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearPasswordSetupPending(): void {
  setupPending = false;
  try {
    window.sessionStorage.removeItem(SETUP_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** True when this page load came from a link Supabase rejected (expired, already used). */
export function hadBadEmailLink(): boolean {
  return linkProblem;
}
