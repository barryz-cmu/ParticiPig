import React from 'react';
import styles from './MapView.module.css';

// Placeholder: Replace with real map integration later
const classLocations = [
  { name: 'Math 101', lat: 40.4433, lng: -79.9436 },
  { name: 'CS 201', lat: 40.4441, lng: -79.9425 },
];

export default function MapView({ attendance }) {
  return (
    <div className={styles.map}>
      <h3>Class Locations & Attendance</h3>
      <div className={styles.mapBox}>
        {classLocations.map(loc => (
          <div key={loc.name} className={styles.marker}>
            <span>{loc.name}</span>
            <span className={styles.dot}></span>
          </div>
        ))}
      </div>
      <div className={styles.attendance}>
        <h4>Attendance</h4>
        <ul>
          {attendance.map((a, i) => (
            <li key={i}>{a.className} - {a.date}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
