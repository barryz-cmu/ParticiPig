// Edit a class by id and user
export async function updateClassById(userId, classId, name, location, start_time, end_time) {
  return pool.query(
    'UPDATE classes SET name = $1, location = $2, start_time = $3, end_time = $4 WHERE id = $5 AND user_id = $6',
    [name, location, start_time, end_time, classId, userId]
  );
}

// Delete a class by id and user
export async function deleteClassById(userId, classId) {
  return pool.query(
    'DELETE FROM classes WHERE id = $1 AND user_id = $2',
    [classId, userId]
  );
}
