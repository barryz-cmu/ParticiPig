import React, { useEffect, useRef, useState } from 'react';
import { useEquipped } from '../context/EquippedContext.jsx';
import { drawPigVariant } from './drawPigHelpers';


const skinToImage = {
  default: '/pig1.png',
  // angel: '/pig_angel.png', // Add this if you have an angel image in public/
};

const skinSpecialMoves = {
  angel: ['angel'],
  // Add more: skin: [move1, move2]
};

const allMoves = [
  { id: 'angel', label: 'Angel Dive' },
  { id: 'welldone', label: 'Well Done' },
  { id: 'heal', label: 'Self-Heal' },
  { id: 'charge', label: 'Rampage' },
  { id: 'dance', label: 'Piggy Dance' },
  { id: 'belly', label: 'Belly Row' },
  { id: 'breath', label: 'Fart Attack' },
  { id: 'slam', label: 'Body Slam' },
];


// Animation helpers
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeOut = t => 1 - (1 - t) * (1 - t);

// Battle layout constants (must be top-level for all helpers to access)
const PLATE_Y = 200;
const LEFT_PLATE  = { x: 110, y: PLATE_Y };
const RIGHT_PLATE = { x: 310, y: PLATE_Y };
const HOME = { x: LEFT_PLATE.x,  y: LEFT_PLATE.y - 18 };
const ENEMY_CENTER = { x: RIGHT_PLATE.x, y: RIGHT_PLATE.y - 18 };

function getRandomMoves(allMoves, n) {
  const arr = [...allMoves];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

export default function Battle({ onWinReward }) {
  // Track if Heal has been used (once per match)
  const [playerHealUsed, setPlayerHealUsed] = useState(false);
  const [opponentHealUsed, setOpponentHealUsed] = useState(false);
  // Track if next attack is powered up (from dance)
  const [playerPower, setPlayerPower] = useState(1);
  const [opponentPower, setOpponentPower] = useState(1);
  // Track if Angel Dive has been used (per match)
  const [playerAngelUsed, setPlayerAngelUsed] = useState(false);
  const [opponentAngelUsed, setOpponentAngelUsed] = useState(false);
  // Health state for both pigs
  const [playerHp, setPlayerHp] = useState(5);
  const [opponentHp, setOpponentHp] = useState(5);
  // Flinch state: { player: false, opponent: false, until: 0 }
  const [flinch, setFlinch] = useState({ player: false, opponent: false, until: 0 });
  // Only show 4 random moves per battle
  const [battleMoves, setBattleMoves] = useState(() => getRandomMoves(allMoves, 4));
  const playerBreathParticles = useRef([]);
  const opponentBreathParticles = useRef([]);
  const impactPuffs = useRef([]);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('Choose a move…');
  const [mode, setMode] = useState('idle');
  const [currentMove, setCurrentMove] = useState(null);
  const [moveStart, setMoveStart] = useState(0);
  const [turn, setTurn] = useState('player');
  // Removed unused moveDuration state

  const { equippedPig, equippedCosmetic } = useEquipped();
  const [pigImg, setPigImg] = useState(null);

  // ---- Rampage (Charge) move ----
  function drawCharge(ctx, now, pigImg, HOME, RIGHT_PLATE, SIZE, drawShadow) {
    const elapsed = now - moveStart;
    const moveDuration = 1500;
    const p = clamp(elapsed / moveDuration, 0, 1);
    const cycles = 3;
    const t = p * (cycles + 1);
    let phase = Math.floor(t);
    let frac = t - phase;
    let dir = (phase % 2 === 0) ? 1 : -1;
    let startX = dir === 1 ? HOME.x : RIGHT_PLATE.x - 24;
    let endX = dir === 1 ? RIGHT_PLATE.x - 24 : HOME.x;
    let x = lerp(startX, endX, easeInOut(frac));
    let y = HOME.y - 10 + 8 * Math.sin(now / 60 + phase * 2);
    let rot = dir * 0.18 * Math.sin(Math.PI * frac);
    if (Math.random() < 0.5) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.ellipse(x, y + SIZE / 2 + 18, 32 + 16 * Math.random(), 8 + 4 * Math.random(), 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(1.08, 0.96);
    ctx.translate(-SIZE / 2, -SIZE / 2);
    ctx.drawImage(pigImg, 0, 0, SIZE, SIZE);
    ctx.restore();
    drawShadow(ctx, x, 38, 11, 0.18);
  }
  // ---- Self-Heal move ----
  function drawHeal(ctx, now, pigImg, HOME, SIZE, drawShadow) {
    const elapsed = now - moveStart;
    const moveDuration = 1200;
    const p = clamp(elapsed / moveDuration, 0, 1);
    ctx.save();
    ctx.shadowColor = '#a7f3d0';
    ctx.shadowBlur = 32 + 32 * Math.sin(now / 120);
    ctx.drawImage(pigImg, HOME.x - SIZE / 2, HOME.y - SIZE / 2, SIZE, SIZE);
    ctx.restore();
    drawShadow(ctx, HOME.x, 34, 10, 0.14);
    // Sparkles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + now / 400;
      const r = 38 + 12 * Math.sin(now / 200 + i);
      const x = HOME.x + Math.cos(angle) * r;
      const y = HOME.y - 18 + Math.sin(angle) * r;
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(now / 100 + i);
      ctx.beginPath();
      ctx.arc(x, y, 4 + 2 * Math.sin(now / 90 + i), 0, Math.PI * 2);
      ctx.fillStyle = '#6ee7b7';
      ctx.fill();
      ctx.restore();
    }
  }
  // ---- Well Done move ----
  function drawWellDone(ctx, now, pigImg, HOME, SIZE, drawShadow) {
    const elapsed = now - moveStart;
    const moveDuration = 1000;
    const p = clamp(elapsed / moveDuration, 0, 1);
    ctx.save();
    ctx.filter = `brightness(1.1) sepia(1) hue-rotate(-20deg) saturate(2)`;
    ctx.drawImage(pigImg, HOME.x - SIZE / 2, HOME.y - SIZE / 2, SIZE, SIZE);
    ctx.restore();
    drawShadow(ctx, HOME.x, 34, 10, 0.14);
    // Sizzle effect
    if (p > 0.2 && p < 0.9) {
      ctx.save();
      ctx.globalAlpha = 0.18 + 0.12 * Math.sin(now / 80);
      ctx.beginPath();
      ctx.ellipse(HOME.x, HOME.y - 60, 38, 14, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
      ctx.restore();
    }
  }
  // ---- Angel Dive move ----
  function drawAngelDive(ctx, now, pigImg, HOME, RIGHT_PLATE, SIZE, drawShadow) {
    const elapsed = now - moveStart;
    const moveDuration = 1300;
    const p = clamp(elapsed / moveDuration, 0, 1);
    // Leap up in an arc, then down to enemy
    const startX = HOME.x, startY = HOME.y;
    const endX = RIGHT_PLATE.x - 24, endY = RIGHT_PLATE.y - 30;
    const t = easeInOut(p);
    const x = lerp(startX, endX, t);
    const y = lerp(startY, endY, t) - 100 * Math.sin(Math.PI * t);
    const rot = lerp(0, 0.7, t);
    // Angel halo
    if (p < 0.8) {
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.ellipse(x, y-54, 32, 8, 0, 0, Math.PI*2);
      ctx.strokeStyle = '#ffe066';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#fffbe6';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(1, 1);
    ctx.translate(-SIZE / 2, -SIZE / 2);
    ctx.drawImage(pigImg, 0, 0, SIZE, SIZE);
    ctx.restore();
    drawShadow(ctx, x, 34, 10, 0.14);
    // Trail removed: no trailing effect drawn
  }
  // ---- Body Slam move ----
  function drawShadow(ctx, cx, w = 32, h = 10, alpha = 0.16) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx, PLATE_Y + 12, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function drawSpeedLines(ctx, x, y, dir = +1) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#9ca3af';
    for (let i = 0; i < 3; i++) {
      const ox = -dir * (18 + i * 16);
      const oy = -10 + i * 8;
      ctx.fillRect(x + ox, y + oy, 26, 3);
    }
    ctx.restore();
  }
  function drawBodySlam(ctx, now, pigImg, HOME, ENEMY_CENTER, SIZE, drawPlates, drawShadow, drawSpeedLines, easeInOut) {
    const elapsed = now - moveStart;
    const moveDuration = 1300;
    const p = clamp(elapsed / moveDuration, 0, 1);
    const startX = HOME.x, startY = HOME.y;
    const impactX = ENEMY_CENTER.x - 8;
    let x = startX, y = startY, rot = 0, sx = 1, sy = 1;
    if (p < 0.18) {
      const t = p / 0.18;
      rot = lerp(0, -0.18, t);
      sy = lerp(1, 1.12, t);
      drawPlates();
      drawShadow(ctx, x, 36, 11, 0.16);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(sx, sy);
      ctx.translate(-SIZE / 2, -SIZE / 2);
      ctx.drawImage(pigImg, 0, 0, SIZE, SIZE);
      ctx.restore();
    } else if (p < 0.68) {
      const t = (p - 0.18) / 0.50;
      x = lerp(startX, impactX, easeInOut(t));
      const s = Math.sin((now - moveStart) / 1000 * 16);
      y = startY - 3 * Math.max(0, s);
      rot = -0.18;
      sy = 1 + 0.04 * Math.sin((now - moveStart) / 1000 * 32);
      drawPlates();
      drawShadow(ctx, x, 34, 10, 0.14);
      drawSpeedLines(ctx, x, startY, +1);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(sx, sy);
      ctx.translate(-SIZE / 2, -SIZE / 2);
      ctx.drawImage(pigImg, 0, 0, SIZE, SIZE);
      ctx.restore();
    } else if (p < 0.88) {
      const t = (p - 0.68) / 0.20;
      x = impactX; y = startY;
      const k = 0.26 * (1 - easeInOut(t));
      sx = 1 + k; sy = 1 - k; rot = 0;
      drawPlates();
      drawShadow(ctx, x, 38, 9, 0.20);
      // Impact ring
      const ringA = 0.5 * (1 - t);
      const ringR = 10 + 22 * t;
      ctx.save();
      ctx.globalAlpha = ringA;
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x + 18, PLATE_Y - 22, ringR, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(sx, sy);
      ctx.translate(-SIZE / 2, -SIZE / 2);
      ctx.drawImage(pigImg, 0, 0, SIZE, SIZE);
      ctx.restore();
    } else {
      const t = easeInOut((p - 0.88) / 0.12);
      x = lerp(impactX, startX, t);
      y = startY - 2 * Math.max(0, Math.sin((now - moveStart) / 1000 * 14));
      rot = 0.08 * (1 - t);
      drawPlates();
      drawShadow(ctx, x, 34, 10, 0.14);
      drawSpeedLines(ctx, x, startY, -1);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(1, 1);
      ctx.translate(-SIZE / 2, -SIZE / 2);
      ctx.drawImage(pigImg, 0, 0, SIZE, SIZE);
      ctx.restore();
    }
  }
  // Load pig image for current skin
  useEffect(() => {
    const img = new window.Image();
    img.src = skinToImage[equippedPig] || skinToImage.default;
    img.onload = () => setPigImg(img);
  }, [equippedPig]);

  // Animation and drawing logic (idle and moves)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pigImg) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = false;
  // Adjusted for 420x260 canvas
  const SIZE = 90;
  const PLATE_Y = 200;
  const LEFT_PLATE  = { x: 110, y: PLATE_Y };
  const RIGHT_PLATE = { x: 310, y: PLATE_Y };
  const HOME = { x: LEFT_PLATE.x,  y: LEFT_PLATE.y - 18 };
  const ENEMY_CENTER = { x: RIGHT_PLATE.x, y: RIGHT_PLATE.y - 18 };
    let animId;
    let startTime = null;

    function drawPlates() {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.ellipse(LEFT_PLATE.x, LEFT_PLATE.y, 60, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.ellipse(RIGHT_PLATE.x, RIGHT_PLATE.y, 60, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawPigDance(t, progress, base = HOME) {
      // Animation logic from sample.html
      const sway = Math.sin(t * 4) * 0.22;
      const bounce = Math.max(0, Math.sin(t * 8)) * 8;
      const scaleY = 1 + Math.sin(t * 8) * 0.06;
      const edge = 0.3;
      let pulse = 1.0;
      if (progress < edge) pulse = 0.9 + 0.1 * Math.sin((progress / edge) * Math.PI / 2);
      else if (progress > 1 - edge) pulse = 0.9 + 0.1 * Math.sin(((1 - progress) / edge) * Math.PI / 2);
      const cx = base.x, cy = base.y - bounce - 4;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(sway);
      ctx.scale(pulse, scaleY * pulse);
      ctx.translate(-SIZE / 2, -SIZE / 2);
      ctx.drawImage(pigImg, 0, 0, SIZE, SIZE);
      ctx.restore();
      // Shadow
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(cx, PLATE_Y + 12, 34 + Math.sin(t * 8) * 3, 10 - Math.sin(t * 8) * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Belly Row animation state
    let theta = 0;
    function drawBellyRow(now, base = HOME) {
      const elapsed = now - moveStart;
      const moveDuration = 1400;
      const p = clamp(elapsed / moveDuration, 0, 1);
      const R = SIZE * 0.50;
      const yBall = PLATE_Y - R + 18;
      const startX = base.x;
      const endX   = base === HOME ? RIGHT_PLATE.x - 18 : LEFT_PLATE.x + 18;
  let x = startX, sx = 1, sy = 1;
      if (p < 0.32) {
        const t = p / 0.32;
        sx = lerp(1.00, 0.96, t);
        sy = lerp(1.00, 1.06, t);
        // Shadow
        ctx.save();
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(x, PLATE_Y + 12, 14 + 22 * t, 8 - 1.2 * t, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(x, yBall);
        ctx.scale(sx, sy);
        ctx.beginPath(); ctx.arc(0, 0, R * 0.98, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(pigImg, -SIZE / 2, -SIZE / 2, SIZE, SIZE);
        ctx.restore();
      } else if (p < 0.68) {
        const t = easeInOut((p - 0.32) / 0.36);
        const cx = lerp(startX, endX, t);
        const arcLen = (endX - startX) * t;
        theta = arcLen / R;
        // Shadow
        ctx.save();
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(cx, PLATE_Y + 12, 30, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.save();
  ctx.translate(cx, yBall);
        ctx.rotate(theta);
        ctx.beginPath(); ctx.arc(0, 0, R * 0.98, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(pigImg, -SIZE / 2, -SIZE / 2, SIZE, SIZE);
        ctx.restore();
      } else if (p < 0.84) {
        const t = (p - 0.68) / 0.16;
        const k = 0.22 * (1 - easeOut(t));
        // Shadow
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(endX, PLATE_Y + 12, 34, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(endX, yBall);
        ctx.scale(1 + k, 1 - k);
        ctx.beginPath(); ctx.arc(0, 0, R * 0.98, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(pigImg, -SIZE / 2, -SIZE / 2, SIZE, SIZE);
        ctx.restore();
      } else {
        const t = easeInOut((p - 0.84) / 0.16);
        const cx = lerp(endX, startX, t);
        // Shadow
        ctx.save();
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(cx, PLATE_Y + 12, 30, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 1 - t;
  ctx.translate(cx, yBall);
        ctx.beginPath(); ctx.arc(0, 0, R * 0.98, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(pigImg, -SIZE / 2, -SIZE / 2, SIZE, SIZE);
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = t;
  ctx.translate(cx, lerp(yBall, base.y, t));
        ctx.drawImage(pigImg, -SIZE / 2, -SIZE / 2, SIZE, SIZE);
        ctx.restore();
      }
    }

    // --- Fart Attack (Breath) particle system ---

    function emitBreath(x, y, dir, isOpponent = false) {
      for (let i = 0; i < 3; i++) {
        let offsetX = dir > 0 ? -SIZE * 0.32 : SIZE * 0.32;
        let offsetY = 18;
        const particle = {
          x: x + offsetX + Math.random() * 6,
          y: y + offsetY + Math.random() * 8,
          vx: dir * (320 + Math.random() * 160),
          vy: -30 + Math.random() * 60,
          life: 0,
          ttl: 1400 + Math.random() * 500,
          r: 5 + Math.random() * 6
        };
        if (isOpponent) opponentBreathParticles.current.push(particle);
        else playerBreathParticles.current.push(particle);
      }
    }

    function drawBreath(dt, isOpponent = false) {
      const arr = isOpponent ? opponentBreathParticles.current : playerBreathParticles.current;
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        p.life += dt;
        p.x += p.vx * (dt / 1000);
        p.y += p.vy * (dt / 1000);
        p.vy += 5 * (dt / 1000);
        const a = clamp(1 - p.life / p.ttl, 0, 1);
        ctx.save();
        ctx.globalAlpha = 0.65 * a;
        ctx.fillStyle = '#8aff70';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.35 * a;
        ctx.fillStyle = '#5fdc3b';
        ctx.beginPath(); ctx.arc(p.x + 2, p.y + 1, p.r * 0.7, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // reach enemy plate -> impact puff
        if (!isOpponent && p.x >= RIGHT_PLATE.x - 12 && p.life < p.ttl) {
          impactPuffs.current.push({ x: RIGHT_PLATE.x, y: RIGHT_PLATE.y - 20, life: 0, ttl: 320 });
          p.life = p.ttl;
        }
        if (isOpponent && p.x <= LEFT_PLATE.x + 12 && p.life < p.ttl) {
          impactPuffs.current.push({ x: LEFT_PLATE.x, y: LEFT_PLATE.y - 20, life: 0, ttl: 320 });
          p.life = p.ttl;
        }
        if (p.life >= p.ttl) arr.splice(i, 1);
      }
      // impact visuals
      for (let i = impactPuffs.current.length - 1; i >= 0; i--) {
        const q = impactPuffs.current[i];
        q.life += dt;
        const a = clamp(1 - q.life / q.ttl, 0, 1);
        const r = 12 + 16 * (q.life / q.ttl);
        ctx.save();
        ctx.globalAlpha = 0.5 * a;
        ctx.fillStyle = '#e6f3ff';
        ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        if (q.life >= q.ttl) impactPuffs.current.splice(i, 1);
      }
    }

    function drawPigBreath(now, base = HOME, isOpponent = false) {
      ctx.save();
      ctx.scale(-1, 1);
      const elapsed = now - moveStart;
      const moveDuration = 1300;
      const p = clamp(elapsed / moveDuration, 0, 1);
      let sy = 1, rot = 0;
      if (p < 0.22) { const t = p / 0.22; sy = 1 + 0.12 * t; rot = -0.04 * t; }
      else if (p < 0.88) { sy = 1.12; rot = -0.04; if (Math.random() < 0.9) emitBreath(base.x, base.y - 8, isOpponent ? -1 : +1, isOpponent); }
      else { const t = (p - 0.88) / 0.12; sy = 1.12 - 0.12 * t; rot = -0.04 * (1 - t); }
      let x = -base.x;
      ctx.translate(x, base.y - 8);
      ctx.rotate(rot);
      ctx.scale(1, sy);
      ctx.translate(-SIZE / 2, -SIZE / 2);
      ctx.drawImage(pigImg, 0, 0, SIZE, SIZE);
      ctx.restore();
      drawBreath(1000 / 60, isOpponent);
    }

    function drawIdle(t) {
  drawPlates();
  // Idle: player faces right, opponent always faces player (flipped)
  const flinchOffsetPlayer = (flinch.player && flinch.until > performance.now()) ? Math.sin(performance.now() / 40) * 8 : 0;
  const flinchOffsetOpponent = (flinch.opponent && flinch.until > performance.now()) ? Math.sin(performance.now() / 40) * 8 : 0;
  drawPigVariant(ctx, HOME.x + flinchOffsetPlayer, HOME.y, SIZE, equippedPig, equippedCosmetic, false, pigImg);
  drawPigVariant(ctx, ENEMY_CENTER.x + flinchOffsetOpponent, ENEMY_CENTER.y, SIZE, 'pink', null, false, pigImg, true);
  // Draw idle breath particles (if any)
  drawBreath(1000 / 60, false);
  drawBreath(1000 / 60, true);
    }

    function loop(now) {
      if (!startTime) startTime = now;
      const t = (now - startTime) / 1000;
      let finished = false;
      // Animate the correct pig depending on whose turn it is
      const isOpponentTurn = turn === 'animating-opponent';
      const isPlayerTurn = turn === 'animating-player' || turn === 'player';
      // Flinch offset helpers
      const getFlinchOffset = (who) => {
        return (flinch[who] && flinch.until > performance.now()) ? Math.sin(performance.now() / 40) * 8 : 0;
      };
      // Player's turn: opponent is being attacked, always flipped (faces player), can flinch
      const playerPig = () => {
        if (mode === 'animating' && isPlayerTurn) {
          const flinchOffset = getFlinchOffset('opponent');
          // Powerful moves: trigger flinch
          if (["slam","charge","angel","welldone"].includes(currentMove)) {
            if (!flinch.opponent || flinch.until < performance.now()) {
              setFlinch({ ...flinch, opponent: true, until: performance.now() + 400 });
            }
          }
          // Opponent is always flipped (faces player) when being attacked
          const drawOpponent = () => drawPigVariant(ctx, ENEMY_CENTER.x + flinchOffset, ENEMY_CENTER.y, SIZE, 'pink', null, false, pigImg, true);
          if (currentMove === 'dance') {
            drawPlates();
            const duration = 1200;
            const progress = clamp((now - moveStart) / duration, 0, 1);
            drawPigDance(t, progress);
            drawOpponent();
            if (progress >= 1) finished = 'It finished dancing!';
          } else if (currentMove === 'belly') {
            drawPlates();
            drawBellyRow(now);
            drawOpponent();
            const duration = 1400;
            const progress = clamp((now - moveStart) / duration, 0, 1);
            if (progress >= 1) finished = 'It rolled back!';
          } else if (currentMove === 'breath') {
            drawPlates();
            drawPigBreath(now);
            drawOpponent();
            const duration = 1300;
            const progress = clamp((now - moveStart) / duration, 0, 1);
            if (progress >= 1) finished = 'It let it rip!';
          } else if (currentMove === 'slam') {
            drawBodySlam(ctx, now, pigImg, HOME, ENEMY_CENTER, SIZE, drawPlates, drawShadow, drawSpeedLines, easeInOut);
            drawOpponent();
            const duration = 1300;
            const progress = clamp((now - moveStart) / duration, 0, 1);
            if (progress >= 1) finished = 'It slammed hard!';
          } else if (currentMove === 'angel') {
            drawAngelDive(ctx, now, pigImg, HOME, RIGHT_PLATE, SIZE, drawShadow);
            drawOpponent();
            const duration = 1300;
            const progress = clamp((now - moveStart) / duration, 0, 1);
            if (progress >= 1) finished = 'It soared from above!';
          } else if (currentMove === 'welldone') {
            drawWellDone(ctx, now, pigImg, HOME, SIZE, drawShadow);
            drawOpponent();
            const duration = 1000;
            const progress = clamp((now - moveStart) / duration, 0, 1);
            if (progress >= 1) finished = 'It is well done!';
          } else if (currentMove === 'heal') {
            drawHeal(ctx, now, pigImg, HOME, SIZE, drawShadow);
            drawOpponent();
            const duration = 1200;
            const progress = clamp((now - moveStart) / duration, 0, 1);
            if (progress >= 1) finished = 'It healed itself!';
          } else if (currentMove === 'charge') {
            drawCharge(ctx, now, pigImg, HOME, RIGHT_PLATE, SIZE, drawShadow);
            drawOpponent();
            const duration = 1500;
            const progress = clamp((now - moveStart) / duration, 0, 1);
            if (progress >= 1) finished = 'It rampaged wildly!';
          } else {
            drawIdle();
          }
        } else {
          drawIdle();
        }
      };
      // Opponent's turn: opponent is attacking, should NOT be flipped (faces right), player can flinch
      const opponentPig = () => {
        if (mode === 'animating' && isOpponentTurn) {
          const flinchOffset = getFlinchOffset('player');
          // Powerful moves: trigger flinch
          if (["slam","charge","angel","welldone"].includes(currentMove)) {
            if (!flinch.player || flinch.until < performance.now()) {
              setFlinch({ ...flinch, player: true, until: performance.now() + 400 });
            }
          }
          drawPlates();
          // Opponent is NOT flipped (faces right) when attacking
          const drawPlayer = () => drawPigVariant(ctx, HOME.x + flinchOffset, HOME.y, SIZE, equippedPig, equippedCosmetic, false, pigImg);
          if (currentMove === 'dance') {
            const duration = 1200;
            const progress = clamp((now - moveStart) / duration, 0, 1);
            drawPigDance(t, progress, ENEMY_CENTER);
            drawPlayer();
            if (progress >= 1) finished = 'Opponent finished dancing!';
          } else if (currentMove === 'belly') {
            drawBellyRow(now, ENEMY_CENTER);
            drawPlayer();
            const duration = 1400;
            const progress = clamp((now - moveStart) / duration, 0, 1);
            if (progress >= 1) finished = 'Opponent rolled back!';
          } else if (currentMove === 'breath') {
            drawPigBreath(now, ENEMY_CENTER, true);
            drawPlayer();
            const duration = 1300;
            const progress = clamp((now - moveStart) / duration, 0, 1);
            if (progress >= 1) finished = 'Opponent let it rip!';
          } else if (currentMove === 'slam') {
            drawBodySlam(ctx, now, pigImg, ENEMY_CENTER, HOME, SIZE, drawPlates, drawShadow, drawSpeedLines, easeInOut);
            drawPlayer();
            const duration = 1300;
            const progress = clamp((now - moveStart) / duration, 0, 1);
            if (progress >= 1) finished = 'Opponent slammed hard!';
          } else if (currentMove === 'heal') {
            drawHeal(ctx, now, pigImg, ENEMY_CENTER, SIZE, drawShadow);
            drawPlayer();
            const duration = 1200;
            const progress = clamp((now - moveStart) / duration, 0, 1);
            if (progress >= 1) finished = 'Opponent healed!';
          } else if (currentMove === 'charge') {
            drawCharge(ctx, now, pigImg, ENEMY_CENTER, HOME, SIZE, drawShadow);
            drawPlayer();
            const duration = 1500;
            const progress = clamp((now - moveStart) / duration, 0, 1);
            if (progress >= 1) finished = 'Opponent rampaged!';
          } else {
            drawIdle();
          }
        } else {
          drawIdle();
        }
      };
      if (isOpponentTurn) {
        opponentPig();
      } else {
        playerPig();
      }
      if (finished) {
        if (turn === 'animating-player') {
          // Player just attacked: calculate damage
          let damage = 1;
          let heal = 0;
          let rampageHit = true;
          if (currentMove === 'dance') {
            setPlayerPower(2); // Next attack is doubled
            damage = 0;
          } else if (currentMove === 'angel') {
            damage = 2 * playerPower;
            setPlayerPower(1); // Reset after use
          } else if (currentMove === 'heal') {
            heal = 3;
            damage = 0;
            setOpponentHealUsed(true);
          } else if (currentMove === 'charge') {
            rampageHit = Math.random() < 1/3;
            damage = rampageHit ? 3 * playerPower : 0;
            setPlayerPower(1);
          } else {
            damage = playerPower;
            setPlayerPower(1); // Reset after use
          }
          if (heal > 0) {
            setPlayerHp(Math.min(5, playerHp + heal));
          }
          if (damage > 0 && opponentHp > damage) {
            setOpponentHp(opponentHp - damage);
          } else if (damage > 0) {
            setOpponentHp(0);
            setStatus('You win! +15 🥕');
            setMode('idle');
            setCurrentMove(null);
            setMoveStart(0);
            if (onWinReward) onWinReward(15);
            return;
          }
          // Prevent multiple opponent moves by checking a ref
          if (!window._opponentMoveTriggered) {
            window._opponentMoveTriggered = true;
            setStatus(finished);
            setTimeout(() => {
              // Pick a random move for opponent (excluding 'angel', 'welldone', and 'heal' if used)
              let opponentMoves = allMoves.filter(m => m.id !== 'welldone' && m.id !== 'angel');
              if (opponentHealUsed) opponentMoves = opponentMoves.filter(m => m.id !== 'heal');
              const oppMove = opponentMoves[Math.floor(Math.random() * opponentMoves.length)].id;
              setMode('animating');
              setCurrentMove(oppMove);
              setMoveStart(performance.now());
              setStatus(`Opponent used ${oppMove}!`);
              setTurn('animating-opponent');
              // Mark Angel Dive as used for opponent
              if (oppMove === 'angel') setOpponentAngelUsed(true);
              window._opponentMoveTriggered = false;
            }, 700);
          }
        } else if (turn === 'animating-opponent') {
          // Opponent just attacked: calculate damage
          let damage = 1;
          let heal = 0;
          let rampageHit = true;
          if (currentMove === 'dance') {
            setOpponentPower(2); // Next attack is doubled
            damage = 0;
          } else if (currentMove === 'angel') {
            // Prevent opponent from using angel (no effect)
            damage = 0;
            setOpponentPower(1);
          } else if (currentMove === 'heal') {
            heal = 3;
            damage = 0;
          } else if (currentMove === 'charge') {
            rampageHit = Math.random() < 1/3;
            damage = rampageHit ? 3 * opponentPower : 0;
            setOpponentPower(1);
          } else {
            damage = opponentPower;
            setOpponentPower(1);
          }
          if (heal > 0) {
            setOpponentHp(Math.min(5, opponentHp + heal));
          }
          if (damage > 0 && playerHp > damage) {
            setPlayerHp(playerHp - damage);
            setTimeout(() => {
              setMode('idle');
              setCurrentMove(null);
              setMoveStart(0);
              setStatus('Choose a move…');
              setTurn('player');
            }, 700);
          } else if (damage > 0) {
            setPlayerHp(0);
            setStatus('You lose!');
            setMode('idle');
            setCurrentMove(null);
            setMoveStart(0);
          } else {
            setTimeout(() => {
              setMode('idle');
              setCurrentMove(null);
              setMoveStart(0);
              setStatus('Choose a move…');
              setTurn('player');
            }, 700);
          }
        } else {
          setMode('idle');
          setStatus(finished);
          setCurrentMove(null);
          setMoveStart(0);
        }
      }
      animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [equippedPig, equippedCosmetic, pigImg, mode, currentMove, moveStart]);

  // Determine which moves are enabled for this skin
  const enabledMoves = new Set(['dance', 'belly', 'breath', 'slam', 'heal', 'charge']);
  if (equippedPig === 'roasted') {
    enabledMoves.add('welldone');
  }
  if (skinSpecialMoves[equippedPig]) {
    skinSpecialMoves[equippedPig].forEach(m => enabledMoves.add(m));
  }
  // Angel Dive can only be used once per match
  if (playerAngelUsed) enabledMoves.delete('angel');
  // Heal can only be used once per match
  if (playerHealUsed) enabledMoves.delete('heal');

  const handleMove = (moveId) => {
  if (mode === 'animating' || turn !== 'player') return;
  // Prevent using Angel Dive or Heal more than once
  if ((moveId === 'angel' && playerAngelUsed) || (moveId === 'heal' && playerHealUsed)) return;
  setMode('animating');
  setCurrentMove(moveId);
  setMoveStart(performance.now());
  setStatus(`Pig used ${moveId}!`);
  setTurn('animating-player');
  // Mark Angel Dive or Heal as used
  if (moveId === 'angel') setPlayerAngelUsed(true);
  if (moveId === 'heal') setPlayerHealUsed(true);
  };

  return (
    <div className="wrap" style={{ width: '100%', maxWidth: 480, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '0 0 32px 0' }}>
      <h1 style={{ textAlign: 'center', fontSize: '2rem', color: '#ef5da8', margin: '24px 0 0 0', letterSpacing: '0.04em' }}>Pig Fight</h1>
      {/* Health bars with HP labels */}
      <div style={{ width: 420, display: 'flex', justifyContent: 'space-between', margin: '8px 0 0 0', position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ fontWeight: 600, fontSize: '1.02rem', color: '#222', marginBottom: 2, marginLeft: 2 }}>Pig HP: {playerHp}</div>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ width: 24, height: 12, borderRadius: 4, background: i < playerHp ? '#6ee7b7' : '#e5e7eb', border: '1px solid #bbb', marginRight: 2 }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ fontWeight: 600, fontSize: '1.02rem', color: '#222', marginBottom: 2, marginRight: 2 }}>Opp HP: {opponentHp}</div>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ width: 24, height: 12, borderRadius: 4, background: i < opponentHp ? '#fca5a5' : '#e5e7eb', border: '1px solid #bbb', marginLeft: 2 }} />
            ))}
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} width={420} height={260} style={{ display: 'block', margin: '18px auto 18px', background: '#fff8fc', borderRadius: 24, boxShadow: '0 4px 16px #e0b7ff33', maxWidth: '100%', width: '100%' }} />
      <div className="hud" style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 0, marginTop: 0, pointerEvents: 'none' }}>
        <div className="status" style={{ minWidth: 180, minHeight: 32, padding: '10px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.7)', boxShadow: '0 2px 8px #e0b7ff22', color: '#222', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.02em', textAlign: 'center', border: 'none', backdropFilter: 'blur(6px)', pointerEvents: 'auto' }}>{status}</div>
      </div>
      <div className="moves" style={{ width: '100%', display: 'flex', flexDirection: 'row', gap: 12, overflowX: 'auto', marginTop: 18, justifyContent: 'center', alignItems: 'center', padding: '0 4px' }}>
        {battleMoves.map(move => (
          <button
            key={move.id}
            onClick={() => handleMove(move.id)}
            disabled={!enabledMoves.has(move.id) || mode === 'animating' || playerHp === 0 || opponentHp === 0}
            style={{
              borderRadius: 16,
              border: 'none',
              width: 120,
              height: 56,
              padding: 0,
              fontSize: '1.08rem',
              fontWeight: 700,
              background: enabledMoves.has(move.id)
                ? (move.id === 'angel' && playerAngelUsed ? '#eee' : 'linear-gradient(90deg, #ffe0f0 0%, #e0f7fa 100%)')
                : '#eee',
              color: '#ef5da8',
              boxShadow: '0 1px 4px #e0b7ff22',
              margin: 0,
              letterSpacing: '0.03em',
              outline: 'none',
              borderColor: enabledMoves.has(move.id) ? '#ef5da8' : 'transparent',
              opacity: enabledMoves.has(move.id) ? 1 : 0.45,
              cursor: enabledMoves.has(move.id) ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
            title={move.id === 'angel' && playerAngelUsed ? 'Angel Dive can only be used once per match' : ''}
          >
            {move.label}
            {move.id === 'angel' && playerAngelUsed && <span style={{ color: '#aaa', fontSize: '0.9em', marginLeft: 4 }}>(used)</span>}
            {move.id === 'dance' && playerPower > 1 && <span style={{ color: '#f59e42', fontSize: '0.9em', marginLeft: 4 }}>(next attack x2)</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
