/**
 * Google Contacts API Integration using Client-Side OAuth Token
 * Fetches verified connections via Google People API v1.
 */

export interface GooglePersonContact {
  resourceName?: string;
  etag?: string;
  names?: Array<{
    displayName?: string;
    givenName?: string;
    familyName?: string;
  }>;
  phoneNumbers?: Array<{
    value?: string;
    type?: string;
    canonicalForm?: string;
  }>;
  emailAddresses?: Array<{
    value?: string;
    type?: string;
  }>;
  photos?: Array<{
    url?: string;
    default?: boolean;
  }>;
}

export interface FetchedContact {
  name: string;
  phone: string;
  email?: string;
  photoUrl?: string;
}

const GOOGLE_CONTACTS_SCOPE = 'https://www.googleapis.com/auth/contacts.readonly';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

/**
 * Loads the Google Identity Services (GSI) script if not already loaded.
 */
export async function loadGsiScript(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (window.google?.accounts?.oauth2) return;

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

/**
 * Requests OAuth access token for Google Contacts using GSI popup flow.
 */
export async function requestGoogleContactsToken(clientId?: string): Promise<string> {
  await loadGsiScript();

  // If clientId is not provided in env, fallback to standard or prompt
  const effectiveClientId =
    clientId ||
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
    '502857013867-client.apps.googleusercontent.com';

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity client unavailable. Please check your network or browser settings.'));
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: effectiveClientId,
        scope: GOOGLE_CONTACTS_SCOPE,
        callback: (resp) => {
          if (resp.error) {
            reject(new Error(`Google authorization error: ${resp.error}`));
          } else if (resp.access_token) {
            resolve(resp.access_token);
          } else {
            reject(new Error('No access token received from Google.'));
          }
        },
        error_callback: (err) => {
          reject(new Error(err?.message || 'Google OAuth prompt closed or failed.'));
        },
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (e: any) {
      reject(new Error(e?.message || 'Failed to initialize Google OAuth token client.'));
    }
  });
}

/**
 * Fetches connections from Google People API using the access token.
 */
export async function fetchGooglePeopleContacts(accessToken: string): Promise<FetchedContact[]> {
  const url = 'https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,emailAddresses,photos&pageSize=100';

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to fetch Google Contacts (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  const connections: GooglePersonContact[] = data.connections || [];

  const results: FetchedContact[] = [];

  for (const person of connections) {
    const name = person.names?.[0]?.displayName || person.names?.[0]?.givenName || 'Google Contact';
    const phone = person.phoneNumbers?.[0]?.canonicalForm || person.phoneNumbers?.[0]?.value || '';
    const email = person.emailAddresses?.[0]?.value;
    const photoUrl = person.photos?.[0]?.url;

    // Include contact if it has a phone or email
    if (phone || email) {
      results.push({
        name,
        phone: phone || '+91 90000 00000',
        email,
        photoUrl,
      });
    }
  }

  return results;
}
