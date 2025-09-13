const API_URL = 'http://localhost:3000/api';

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

export async function getUserDetails(token) {
  const res = await fetch(`${API_URL}/user`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch user details');
  return await res.json();
}

// Inventory API functions
export async function getUserInventory(token) {
  const res = await fetch(`${API_URL}/inventory`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch inventory');
  return await res.json();
}

export async function purchaseItem(token, itemType, itemId, cost) {
  const res = await fetch(`${API_URL}/inventory/purchase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ itemType, itemId, cost })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to purchase item');
  }
  return await res.json();
}

export async function equipItemAPI(token, itemType, itemId) {
  const res = await fetch(`${API_URL}/inventory/equip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ itemType, itemId })
  });
  
  if (!res.ok) throw new Error('Failed to equip item');
  return await res.json();
}

export async function getEquippedItems(token) {
  const res = await fetch(`${API_URL}/inventory/equipped`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch equipped items');
  return await res.json();
}

export async function recordAttendance(token, class_id, reward) {
  try {
    console.log('Making request to:', `${API_URL}/attendance`);
    console.log('Request data:', { class_id, reward });
    console.log('Token being sent:', token ? token.substring(0, 20) + '...' : 'null');
    
    const res = await fetch(`${API_URL}/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ class_id, reward })
    });
    
    console.log('Response status:', res.status);
    console.log('Response ok:', res.ok);
    
    if (!res.ok) {
      if (res.status === 429) {
        // Cooldown error - throw with specific status info
        const data = await res.json().catch(() => ({}));
        throw new Error(`429: ${data.error || 'Already checked in within the last 23 hours'}`);
      }
      
      // Try to get error details from response
      let errorMsg = `HTTP ${res.status}`;
      try {
        const errorData = await res.json();
        errorMsg = errorData.error || errorMsg;
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError);
      }
      
      throw new Error(`Server error: ${errorMsg}`);
    }
    
    const result = await res.json();
    console.log('Attendance response:', result);
    return result;
    
  } catch (fetchError) {
    console.error('Fetch error in recordAttendance:', fetchError);
    
    // Network or other errors
    if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
      throw new Error('Network error: Cannot connect to server');
    }
    
    throw fetchError; // Re-throw the original error
  }
}

export async function getTotalRewards(token) {
  const res = await fetch(`${API_URL}/rewards`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch rewards');
  const data = await res.json();
  return data.totalRewards;
}

export async function getGameStats(token) {
  const res = await fetch(`${API_URL}/game-stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch game stats');
  return await res.json();
}

export async function updateGameStats(token, { level, xp, hunger, carrots }) {
  const res = await fetch(`${API_URL}/game-stats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ level, xp, hunger, carrots })
  });
  if (!res.ok) throw new Error('Failed to update game stats');
  return await res.json();
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
    } catch {
      // Ignore JSON parsing errors
    }
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
    } catch {
      // Ignore JSON parsing errors
    }
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