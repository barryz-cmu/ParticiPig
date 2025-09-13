const CMU_BUILDINGS = [
  'Gates', 'Wean', 'Newell', 'Tepper', 'CFA', 'Purnell', 'Miller', 'Margaret',
  'Mellon', 'Doherty', 'Scaife', 'Hamerschlag', 'Porter', 'Scott', 'Baker',
  'Posner', 'Hamburg'
];

import React, { useState } from 'react';
import { editClass, deleteClass } from '../api.classEdit';

function generateTimeOptions() {
  const options = [];
  let hour = 6;
  let minute = 0;
  while (hour < 18 || (hour === 18 && minute === 0)) {
    const ampm = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const label = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
    const value = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
    options.push({ label, value });
    minute += 30;
    if (minute === 60) {
      minute = 0;
      hour++;
    }
  }
  return options;
}
const TIME_OPTIONS = generateTimeOptions();


export default function Profile({ user, classes, onSave }) {
  const [editMode, setEditMode] = useState(false);
  const [localClasses, setLocalClasses] = useState(classes || []);
  const [newClass, setNewClass] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [editIdx, setEditIdx] = useState(null);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const token = localStorage.getItem('token');

  const handleAdd = () => {
    if (newClass && newLocation && newStart && newEnd) {
      setLocalClasses([...localClasses, { name: newClass, location: newLocation, start_time: newStart, end_time: newEnd }]);
      setNewClass('');
      setNewLocation('');
      setNewStart('');
      setNewEnd('');
    }
  };

  const handleEdit = idx => {
    setEditIdx(idx);
    setEditName(localClasses[idx].name);
    setEditLocation(localClasses[idx].location);
    setEditStart(localClasses[idx].start_time || '');
    setEditEnd(localClasses[idx].end_time || '');
  };

  const handleEditSave = async idx => {
    const updated = [...localClasses];
    updated[idx] = { ...updated[idx], name: editName, location: editLocation, start_time: editStart, end_time: editEnd };
    setLocalClasses(updated);
    setEditIdx(null);
    // If class has id, update backend
    if (updated[idx].id && token) {
      try { await editClass(token, updated[idx].id, editName, editLocation, editStart, editEnd); } catch {}
    }
  };

  const handleDelete = async idx => {
    const toDelete = localClasses[idx];
    setLocalClasses(localClasses.filter((_, i) => i !== idx));
    if (toDelete.id && token) {
      try { await deleteClass(token, toDelete.id); } catch {}
    }
  };

  const handleSave = () => {
    onSave(localClasses);
    setEditMode(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 32 }}>
      <div style={{ marginBottom: 24, padding: '14px 24px', background: '#fff', borderRadius: 12, border: '1.5px solid #ef5da8', fontSize: '1.12rem', fontWeight: 600, boxShadow: '0 2px 8px #e0b7ff11' }}>
        <div style={{ marginBottom: 6, color: '#ef5da8', fontWeight: 700, fontSize: '1.18rem', letterSpacing: '0.01em' }}>🐷 Pig Stats</div>
        <div style={{ display: 'flex', gap: 24, fontWeight: 500, fontSize: '1.08rem' }}>
          <div>Attack: <b>1</b></div>
          <div>Defense: <b>0</b></div>
          <div>HP: <b>5</b></div>
        </div>
      </div>
      <div style={{ maxWidth: 400, width: '100%', margin: '0 auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #e0b7ff11' }}>
        <h2>Profile</h2>
        <div><b>Username:</b> {user.username}</div>
        <h3>Classes & Locations</h3>
      {editMode ? (
        <>
          <ul>
            {localClasses.map((c, i) => (
              <li key={i}>
                {editIdx === i ? (
                  <>
                    <input value={editName} onChange={e => setEditName(e.target.value)} style={{ marginRight: 8 }} />
                    <select value={editLocation} onChange={e => setEditLocation(e.target.value)} style={{ marginRight: 8 }}>
                      <option value="">Select building</option>
                      {CMU_BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <select value={editStart} onChange={e => setEditStart(e.target.value)} style={{ marginRight: 8 }}>
                      <option value="">Start time</option>
                      {TIME_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <select value={editEnd} onChange={e => setEditEnd(e.target.value)} style={{ marginRight: 8 }}>
                      <option value="">End time</option>
                      {TIME_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <button onClick={() => handleEditSave(i)}>Save</button>
                    <button onClick={() => setEditIdx(null)} style={{ marginLeft: 4 }}>Cancel</button>
                  </>
                ) : (
                  <>
                    {c.name} @ {c.location} ({c.start_time || 'No start'} - {c.end_time || 'No end'})
                    <button onClick={() => handleEdit(i)} style={{ marginLeft: 8 }}>Edit</button>
                    <button onClick={() => handleDelete(i)} style={{ marginLeft: 4, color: 'red' }}>Delete</button>
                  </>
                )}
              </li>
            ))}
          </ul>
          <input
            type="text"
            placeholder="Class name"
            value={newClass}
            onChange={e => setNewClass(e.target.value)}
            style={{ marginRight: 8 }}
          />
          <select value={newLocation} onChange={e => setNewLocation(e.target.value)} style={{ marginRight: 8 }}>
            <option value="">Select building</option>
            {CMU_BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={newStart} onChange={e => setNewStart(e.target.value)} style={{ marginRight: 8 }}>
            <option value="">Start time</option>
            {TIME_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select value={newEnd} onChange={e => setNewEnd(e.target.value)} style={{ marginRight: 8 }}>
            <option value="">End time</option>
            {TIME_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <button onClick={handleAdd}>Add</button>
          <div style={{ marginTop: 12 }}>
            <button onClick={handleSave}>Save All</button>
            <button onClick={() => setEditMode(false)} style={{ marginLeft: 8 }}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <ul>
            {localClasses.length === 0 && <li>No classes added yet.</li>}
            {localClasses.map((c, i) => (
              <li key={i}>{c.name} @ {c.location}</li>
            ))}
          </ul>
          <button onClick={() => setEditMode(true)}>Edit Classes</button>
        </>
      )}
      </div>
    </div>
  );
}
