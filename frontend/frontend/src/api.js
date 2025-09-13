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

export async function recordAttendance(token, class_id, reward) {
  const res = await fetch(`${API_URL}/attendance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ class_id, reward })
  });
  
  if (!res.ok) {
    if (res.status === 429) {
      // Cooldown error - throw with specific status info
      const data = await res.json().catch(() => ({}));
      throw new Error(`429: ${data.error || 'Already checked in within the last 23 hours'}`);
    }
    throw new Error('Failed to record attendance');
  }
  return await res.json();
}

export async function getTotalRewards(token) {
  const res = await fetch(`${API_URL}/rewards`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch rewards');
  const data = await res.json();
  return data.totalRewards;
}


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
