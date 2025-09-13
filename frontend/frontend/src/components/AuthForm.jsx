import React, { useState } from 'react';
import styles from './AuthForm.module.css';

export default function AuthForm({ mode = 'login', onAuth, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    onAuth(username, password);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2>{mode === 'signup' ? 'Sign Up' : 'Log In'}</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <button type="submit">{mode === 'signup' ? 'Sign Up' : 'Log In'}</button>
      {error && <div className={styles.error}>{error}</div>}
    </form>
  );
}
