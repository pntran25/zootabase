import { auth } from './firebase';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

const buildUrl = (path) => `${API_BASE_URL}${path}`;

async function getAuthHeaders() {
  try {
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

/**
 * Converts a technical HTTP status + raw server error message into a
 * human-readable sentence that a non-technical admin can understand.
 */
export function humanizeError(status, serverMsg = '') {
  const msg = serverMsg.toLowerCase();

  // ── Network / connectivity ─────────────────────────────────────────────
  if (status === 0 || status == null) {
    return "Can't reach the server. Please check your internet connection or try again in a moment.";
  }

  // ── Client errors ──────────────────────────────────────────────────────
  if (status === 400) return "The information you entered isn't valid. Please check all fields and try again.";
  if (status === 401) return "You need to be logged in to do that.";
  if (status === 403) return "You don't have permission to perform this action.";
  if (status === 404) return "That item wasn't found — it may have already been deleted.";
  if (status === 409) return "A record with this name or ID already exists. Please use a different name.";
  if (status === 413) return "The file you're trying to upload is too large.";
  if (status === 422) return "Some of the information provided is incomplete or incorrectly formatted.";

  // ── Server errors — parse SQL / runtime message ────────────────────────
  if (status >= 500) {
    // Missing DB column — server needs restart to run migrations
    if (msg.includes('invalid column name')) {
      return "The database is missing a required field. Please restart the server so it can apply the latest updates.";
    }
    // Duplicate record
    if (msg.includes('duplicate key') || msg.includes('unique') || msg.includes('already exists')) {
      return "An item with this name or ID already exists. Please choose a different name.";
    }
    // Foreign key / reference constraint — can't delete parent record
    if (msg.includes('reference constraint') || msg.includes('foreign key') || msg.includes('conflicted')) {
      return "This item can't be deleted because other records (such as animals or events) still refer to it. Remove those first.";
    }
    // NOT NULL / required field
    if (msg.includes('not null') || msg.includes('cannot be null') || msg.includes('null value')) {
      return "A required field is empty. Please fill in all required fields before saving.";
    }
    // Value too long for column
    if (msg.includes('truncated') || msg.includes('string or binary data')) {
      return "One of the fields you entered is too long. Please shorten it and try again.";
    }
    // Timeout
    if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('request timeout')) {
      return "The server took too long to respond. Please try again in a moment.";
    }
    // Database connection lost
    if (msg.includes('connection') && (msg.includes('fail') || msg.includes('lost') || msg.includes('closed') || msg.includes('reset'))) {
      return "Lost connection to the database. Please check that the database server is running.";
    }
    // Login / auth to DB
    if (msg.includes('login failed') || msg.includes('authentication failed')) {
      return "The server couldn't authenticate with the database. Please check the server configuration.";
    }
    // Permission denied at DB level
    if (msg.includes('permission') || msg.includes('access denied') || msg.includes('execute access')) {
      return "The database refused the operation due to insufficient permissions.";
    }
    // Table or object not found
    if (msg.includes('invalid object name') || msg.includes("doesn't exist") || msg.includes('no such table')) {
      return "A required database table is missing. Please make sure the database has been set up correctly.";
    }
    // Data type mismatch
    if (msg.includes('conversion failed') || msg.includes('invalid value') || msg.includes('cannot convert')) {
      return "One of the values entered is the wrong type (for example, text where a number is expected).";
    }

    // Generic server error fallback
    return "Something went wrong on the server. Please try again, or restart the server if the problem continues.";
  }

  // ── Fallback ───────────────────────────────────────────────────────────
  return "An unexpected error occurred. Please try again.";
}

async function extractAndHumanize(response, fallbackStatus) {
  const status = response ? response.status : fallbackStatus;
  let serverMsg = '';
  try {
    const body = await response.json();
    serverMsg = body.error || '';
  } catch {
    // response body wasn't JSON — ignore
  }
  return humanizeError(status, serverMsg);
}

export const apiGet = async (path) => {
  let response;
  try {
    response = await fetch(buildUrl(path));
  } catch {
    throw new Error(humanizeError(0));
  }
  if (!response.ok) {
    throw new Error(await extractAndHumanize(response));
  }
  return response.json();
};

export const apiPost = async (path, payload) => {
  let response;
  try {
    const authHeaders = await getAuthHeaders();
    response = await fetch(buildUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(humanizeError(0));
  }
  if (!response.ok) {
    throw new Error(await extractAndHumanize(response));
  }
  return response.json();
};

export const apiPut = async (path, payload) => {
  let response;
  try {
    const authHeaders = await getAuthHeaders();
    response = await fetch(buildUrl(path), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(humanizeError(0));
  }
  if (!response.ok) {
    throw new Error(await extractAndHumanize(response));
  }
  return response.json();
};

export const apiDelete = async (path, payload) => {
  let response;
  try {
    const authHeaders = await getAuthHeaders();
    response = await fetch(buildUrl(path), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
  } catch {
    throw new Error(humanizeError(0));
  }
  if (!response.ok) {
    throw new Error(await extractAndHumanize(response));
  }
  return response.json();
};

export { API_BASE_URL };
