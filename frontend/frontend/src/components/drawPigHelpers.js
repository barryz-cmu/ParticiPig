// Shared pig drawing helpers for Dashboard, Shop, and Battle
// Copy from Dashboard.jsx/Shop.jsx

export const drawTopHat = (ctx, x, y, scale = 1, locked = false) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (locked) ctx.filter = 'grayscale(1) brightness(0.7)';
  ctx.fillStyle = locked ? '#555' : '#2d3748';
  ctx.fillRect(-25, -45, 50, 35);
  ctx.fillStyle = locked ? '#666' : '#4a5568';
  ctx.fillRect(-35, -15, 70, 8);
  ctx.fillStyle = locked ? '#777' : '#e53e3e';
  ctx.fillRect(-25, -20, 50, 6);
  ctx.filter = 'none';
  ctx.restore();
};

export const drawTrafficCone = (ctx, x, y, scale, locked = false) => {
  const s = 1.0 * scale;
  ctx.save();
  ctx.translate(x, y - 10);
  if (locked) ctx.filter = 'grayscale(1) brightness(0.7)';
  ctx.fillStyle = locked ? '#888' : '#fb923c';
  ctx.beginPath();
  ctx.moveTo(0, -44 * s);
  ctx.bezierCurveTo(10 * s, -34 * s, 22 * s, -12 * s, 26 * s, 0);
  ctx.lineTo(-26 * s, 0);
  ctx.bezierCurveTo(-22 * s, -12 * s, -10 * s, -34 * s, 0, -44 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = locked ? '#bbb' : '#fff';
  ctx.beginPath();
  ctx.ellipse(0, -18 * s, 19 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = locked ? '#666' : '#ea580c';
  ctx.beginPath();
  ctx.ellipse(0, 3.5 * s, 30 * s, 3.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.filter = 'none';
  ctx.restore();
};

export const drawAngelWings = (ctx, size, locked = false) => {
  const stroke = Math.max(2, size * 0.02);
  ctx.save();
  ctx.translate(0, -size * 0.05);
  const drawWing = (side = 1) => {
    ctx.save();
    ctx.scale(side, 1);
    ctx.translate(-size * 0.44, -size * 0.10);
    ctx.rotate(-0.12);
    ctx.fillStyle = locked ? '#e5e7eb' : '#fff';
    ctx.strokeStyle = locked ? '#d1d5db' : '#c7e0ff';
    ctx.lineWidth = stroke;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-size * 0.10, -size * 0.08, -size * 0.22, -size * 0.02);
    ctx.quadraticCurveTo(-size * 0.26, size * 0.10, -size * 0.06, size * 0.14);
    ctx.quadraticCurveTo(-size * 0.18, size * 0.06, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = locked ? 'rgba(209,213,219,0.45)' : 'rgba(199,224,255,0.35)';
    for (let i = 0; i < 3; i++) {
      const f = i / 3;
      ctx.beginPath();
      ctx.ellipse(-size * (0.18 - f * 0.10), size * (0.02 + f * 0.06),
                 size * (0.10 - f * 0.03), size * (0.05 - f * 0.015), -0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };
  drawWing(1);
  drawWing(-1);
  ctx.restore();
};

export const drawHalo = (ctx, size, locked = false) => {
  ctx.save();
  ctx.translate(0, -size * 0.4);
  const glow = locked ? 'rgba(229,231,235,0.35)' : 'rgba(251,191,36,0.35)';
  const ring = locked ? '#d1d5db' : '#fbbf24';
  const inner = locked ? '#e5e7eb' : '#fde68a';
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.30, size * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = ring;
  ctx.lineWidth = size * 0.06;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.26, size * 0.08, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = inner;
  ctx.lineWidth = size * 0.02;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.22, size * 0.06, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

export const drawPigVariant = (ctx, x, y, size, pigId, cosmeticId, locked = false, basePigImage, flip = false) => {
  if (!basePigImage) return;
  ctx.save();
  ctx.translate(x, y);
  if (flip) {
    ctx.scale(-1, 1);
  }
  if (pigId === 'angel') {
    const scale = size / 150;
    drawHalo(ctx, size / scale, locked);
    drawAngelWings(ctx, size, locked);
  }
  let filter = 'none';
  if (locked) {
    filter = 'grayscale(1) brightness(0.7) contrast(1.2)';
  } else {
    if (pigId === 'black') {
      filter = 'brightness(0.38) saturate(0) contrast(1.05)';
    } else if (pigId === 'angel') {
      filter = 'brightness(1.10) saturate(1.08)';
    } else if (pigId === 'roasted') {
      filter = 'sepia(1) saturate(2.2) hue-rotate(-20deg) brightness(1.12) contrast(1.05)';
    }
  }
  ctx.filter = filter;
  const scale = size / 150;
  ctx.scale(scale, scale);
  ctx.drawImage(basePigImage, -75, -75, 150, 150);
  ctx.filter = 'none';
  if (cosmeticId) {
    if (cosmeticId === 'top-hat') {
      drawTopHat(ctx, 0, -40, 1.0, locked);
    } else if (cosmeticId === 'traffic-cone') {
      drawTrafficCone(ctx, 0, -30, 1.0, locked);
    }
  }
  ctx.restore();
};
