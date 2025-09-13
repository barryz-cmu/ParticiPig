const API_URL = 'http://localhost:3000/api';

export async function editClass(token, classId, name, location, start_time, end_time) {
  const res = await fetch(`${API_URL}/class/${classId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name, location, start_time, end_time })
  });
  if (!res.ok) throw new Error('Failed to edit class');
  return await res.json();
}

export async function deleteClass(token, classId) {
  const res = await fetch(`${API_URL}/class/${classId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to delete class');
  return await res.json();
}
