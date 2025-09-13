import React from 'react';
import styles from './Dashboard.module.css';

export default function Dashboard({ user, pig, leaderboard, streak }) {
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
    </div>
  );
}
