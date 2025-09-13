export async function getClasses(token) {
  const res = await fetch(`${API_URL}/classes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch classes');
  return await res.json();
}

export async function saveClasses(token, classes) {
  const res = await fetch(`${API_URL}/classes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ classes })
  });
  if (!res.ok) throw new Error('Failed to save classes');
  return await res.json();
}
const API_URL = 'http://localhost:3000/api';


export async function signup(username, password) {
  const res = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  // Only throw if status is not 2xx
  if (!res.ok) {
    let errMsg = 'Signup failed';
    try {
      const data = await res.json();
      errMsg = data.error || errMsg;
    } catch {}
    throw new Error(errMsg);
  }
  return await res.json();
}


export async function login(username, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    let errMsg = 'Login failed';
    try {
      const data = await res.json();
      errMsg = data.error || errMsg;
    } catch {}
    throw new Error(errMsg);
  }
  return await res.json();
}

export async function getUser(token) {
  const res = await fetch(`${API_URL}/user`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch user');
  return await res.json();
}
