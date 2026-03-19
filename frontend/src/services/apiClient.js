const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const buildUrl = (path) => `${API_BASE_URL}${path}`;

export const apiGet = async (path) => {
  const response = await fetch(buildUrl(path));
  if (!response.ok) {
    throw new Error(`GET ${path} failed with status ${response.status}`);
  }
  return response.json();
};

export const apiPost = async (path, payload) => {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`POST ${path} failed with status ${response.status}`);
  }

  return response.json();
};

export const apiPut = async (path, payload) => {
  const response = await fetch(buildUrl(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`PUT ${path} failed with status ${response.status}`);
  }

  return response.json();
};

export const apiDelete = async (path) => {
  const response = await fetch(buildUrl(path), {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`DELETE ${path} failed with status ${response.status}`);
  }

  return response.json();
};

export { API_BASE_URL };
