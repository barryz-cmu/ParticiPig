import React from 'react';
import styles from './Dashboard.module.css';

export default function Dashboard({ user, pig, leaderboard, streak, classes, onUpdateSchedule }) {
  return (
    <div className={styles.dashboard}>
      <section className={styles.stats}>
        <h2>Welcome, {user.username}!</h2>
        <div>Streak: <b>{streak} days</b></div>
        <div>Food: <b>{pig.food}</b></div>
        <div>Weight: <b>{pig.weight} kg</b></div>
      </section>
      <section className={styles.leaderboard}>
        <h3>Leaderboard</h3>
        <ol>
          {leaderboard.map((entry, i) => (
            <li key={entry.username} className={entry.username === user.username ? styles.me : ''}>
              {i+1}. {entry.username} - {entry.streak} days
            </li>
          ))}
        </ol>
      </section>
      <section className={styles.schedule}>
        <h3>Your Class Schedule</h3>
        <ul>
          {(!classes || classes.length === 0) && <li>No classes added yet.</li>}
          {classes && classes.map((c, i) => (
            <li key={i}>
              {c.name} @ {c.location} ({c.start_time || 'No start'} - {c.end_time || 'No end'})
            </li>
          ))}
        </ul>
        <button onClick={onUpdateSchedule} style={{ marginTop: 8 }}>Update Schedule</button>
      </section>
    </div>
  );
}
