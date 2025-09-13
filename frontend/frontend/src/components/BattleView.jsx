import React, { useState } from 'react';
import styles from './BattleView.module.css';

export default function BattleView({ pig1, pig2, onBattle }) {
  const [winner, setWinner] = useState(null);
  const [animating, setAnimating] = useState(false);

  const handleBattle = () => {
    setAnimating(true);
    setTimeout(() => {
      const win = Math.random() > 0.5 ? pig1 : pig2;
      setWinner(win);
      setAnimating(false);
      onBattle && onBattle(win);
    }, 1200);
  };

  return (
    <div className={styles.battle}>
      <div className={styles.pigs}>
        <div className={animating ? styles.animLeft : ''}>{pig1.name}</div>
        <span className={styles.vs}>VS</span>
        <div className={animating ? styles.animRight : ''}>{pig2.name}</div>
      </div>
      <button onClick={handleBattle} disabled={animating}>Battle!</button>
      {winner && <div className={styles.winner}>{winner.name} wins!</div>}
    </div>
  );
}
