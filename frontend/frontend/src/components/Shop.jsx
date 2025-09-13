import React, { useState, useEffect, useRef } from 'react';
import { getUserInventory, purchaseItem, equipItemAPI, getEquippedItems, getGameStats, updateGameStats } from '../api';
import styles from './Shop.module.css';

// Shop data
const PIGS = [
  { id: 'pink', name: 'Pink Pig', price: 0 }, // Free starter pig
  { id: 'black', name: 'Black Pig', price: null }, // Capsule only
  { id: 'angel', name: 'Angel Pig', price: null }, // Capsule only
  { id: 'roasted', name: 'Roasted Pig', price: null }, // Capsule only
];

const COSMETICS = [
  { id: 'top-hat', name: 'Top Hat', price: 20 },
  { id: 'traffic-cone', name: 'Traffic Cone', price: 15 },
];

const CAPSULE_COST = 50;
const CAPSULE_PIGS = ['black', 'angel', 'roasted'];

// Helper function for rounded rectangles
const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// Drawing helper functions (matching the sample.html ones)
const drawTopHat = (ctx, x, y, scale = 1, locked = false) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  
  // Apply grayscale if locked
  if (locked) {
    ctx.filter = 'grayscale(1) brightness(0.7)';
  }
  
  // Hat body (dark gray/black)
  ctx.fillStyle = locked ? '#555' : '#2d3748';
  ctx.fillRect(-25, -45, 50, 35);
  
  // Hat brim (slightly lighter)
  ctx.fillStyle = locked ? '#666' : '#4a5568';
  ctx.fillRect(-35, -15, 70, 8);
  
  // Hat band (red accent)
  ctx.fillStyle = locked ? '#777' : '#e53e3e';
  ctx.fillRect(-25, -20, 50, 6);
  
  ctx.filter = 'none';
  ctx.restore();
};

const drawTrafficCone = (ctx, x, y, scale, locked = false) => {
  const s = 1.0 * scale;
  ctx.save();
  ctx.translate(x, y - 10);
  
  // Apply grayscale if locked
  if (locked) {
    ctx.filter = 'grayscale(1) brightness(0.7)';
  }
  
  // Cone body
  ctx.fillStyle = locked ? '#888' : '#fb923c';
  ctx.beginPath();
  ctx.moveTo(0, -44 * s);
  ctx.bezierCurveTo(10 * s, -34 * s, 22 * s, -12 * s, 26 * s, 0);
  ctx.lineTo(-26 * s, 0);
  ctx.bezierCurveTo(-22 * s, -12 * s, -10 * s, -34 * s, 0, -44 * s);
  ctx.closePath();
  ctx.fill();
  
  // White stripe
  ctx.fillStyle = locked ? '#bbb' : '#fff';
  roundRect(ctx, -19 * s, -18 * s, 38 * s, 8 * s, 4 * s);
  ctx.fill();
  
  // Orange base
  ctx.fillStyle = locked ? '#666' : '#ea580c';
  roundRect(ctx, -30 * s, 0, 60 * s, 7 * s, 4 * s);
  ctx.fill();
  
  ctx.filter = 'none';
  ctx.restore();
};

const drawAngelWings = (ctx, size, locked = false) => {
  const stroke = Math.max(2, size * 0.02);
  ctx.save();
  ctx.translate(0, -size * 0.05);
  
  // Helper function to draw one wing
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
    
    // Wing details
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
  
  drawWing(1);  // Right wing
  drawWing(-1); // Left wing
  ctx.restore();
};

const drawHalo = (ctx, size, locked = false) => {
  const y = -size * 0.44;
  ctx.save();
  ctx.translate(0, y);
  ctx.rotate(-0.04);
  
  const glow = locked ? 'rgba(229,231,235,0.35)' : 'rgba(251,191,36,0.35)';
  const ring = locked ? '#d1d5db' : '#fbbf24';
  const inner = locked ? '#e5e7eb' : '#fde68a';
  
  // Glow effect
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.30, size * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Main ring
  ctx.globalAlpha = 1;
  ctx.strokeStyle = ring;
  ctx.lineWidth = size * 0.06;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.26, size * 0.08, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner ring
  ctx.strokeStyle = inner;
  ctx.lineWidth = size * 0.035;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.23, size * 0.07, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.restore();
};

const drawPigVariant = (ctx, x, y, size, pigId, cosmeticId, locked = false, basePigImage) => {
  if (!basePigImage) return;

  ctx.save();
  ctx.translate(x, y);

  // Draw angel halo FIRST (so it appears behind the pig head)
  if (pigId === 'angel') {
    const scale = size / 150; // Assuming base pig image is ~150px
    drawHalo(ctx, size / scale, locked);
  }

  // Draw angel wings BEFORE the pig (behind it)
  if (pigId === 'angel') {
    drawAngelWings(ctx, size, locked);
  }

  // Build filter string based on pig variant and locked state
  let filter = 'none';
  
  // If pig is locked (not owned), show in grayscale
  if (locked) {
    filter = 'grayscale(1) brightness(0.7) contrast(1.2)';
  } else {
    // Apply pig variant filters only if unlocked
    if (pigId === 'black') {
      filter = 'brightness(0.38) saturate(0) contrast(1.05)';
    } else if (pigId === 'angel') {
      filter = 'brightness(1.10) saturate(1.08)';
    } else if (pigId === 'roasted') {
      filter = 'sepia(1) saturate(2.2) hue-rotate(-20deg) brightness(1.12) contrast(1.05)';
    }
  }

  // Apply the filter and draw pig
  ctx.filter = filter;
  
  // Draw pig based on variant
  const scale = size / 150; // Assuming base pig image is ~150px
  ctx.scale(scale, scale);

  ctx.drawImage(basePigImage, -75, -75, 150, 150);

  // Reset filter for cosmetics
  ctx.filter = 'none';

  // Always draw cosmetics, but gray them out if locked
  if (cosmeticId) {
    if (cosmeticId === 'top-hat') {
      drawTopHat(ctx, 0, -40, 1.0, locked);
    } else if (cosmeticId === 'traffic-cone') {
      drawTrafficCone(ctx, 0, -30, 1.0, locked);
    }
  }

  ctx.restore();
};

export default function Shop({ user, onNavigateBack }) {
  const [carrots, setCarrots] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [equippedItems, setEquippedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [toast, setToast] = useState('');
  const [showUnboxModal, setShowUnboxModal] = useState(false);
  const [unboxResult, setUnboxResult] = useState(null);
  const [unboxAnimating, setUnboxAnimating] = useState(false);

  // Canvas refs
  const capsuleCanvasRef = useRef(null);
  const equippedCanvasRef = useRef(null);
  const unboxCanvasRef = useRef(null);

  // Load pig image
  const basePigImage = useRef(null);

  useEffect(() => {
    // Load pig image
    const img = new Image();
    img.src = '/pig1.png';
    img.onload = () => {
      basePigImage.current = img;
      drawAll();
    };
    img.onerror = () => {
      console.error('Failed to load pig image');
    };

    loadShopData();
  }, []);

  // Redraw when equipped items change
  useEffect(() => {
    if (!loading) {
      drawEquippedPreview();
    }
  }, [equippedItems]);

  // Animation loop for capsule preview
  useEffect(() => {
    let animationId;
    
    const animate = () => {
      if (!loading) {
        drawCapsulePreview();
      }
      animationId = requestAnimationFrame(animate);
    };
    
    if (!loading) {
      animate();
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [loading]);

  const loadShopData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [gameStats, userInventory, equipped] = await Promise.all([
        getGameStats(token),
        getUserInventory(token),
        getEquippedItems(token)
      ]);

      setCarrots(gameStats.carrots);
      setInventory(userInventory);
      
      // Convert equipped items array to object for easy lookup
      const equippedObj = {};
      equipped.forEach(item => {
        equippedObj[item.item_type] = item.item_id;
      });
      setEquippedItems(equippedObj);
      
      setLoading(false);
      drawAll();
    } catch (error) {
      console.error('Failed to load shop data:', error);
      showToast('Failed to load shop data');
      setLoading(false);
    }
  };

  const drawAll = () => {
    if (!basePigImage.current) return;
    drawCapsulePreview();
    drawEquippedPreview();
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const hasItem = (itemType, itemId) => {
    return inventory.some(item => item.item_type === itemType && item.item_id === itemId);
  };

  const isEquipped = (itemType, itemId) => {
    return equippedItems[itemType] === itemId;
  };

  const handlePurchase = async (itemType, itemId, cost) => {
    if (purchasing) return;
    
    if (carrots < cost) {
      showToast('Not enough carrots!');
      return;
    }

    setPurchasing(`${itemType}-${itemId}`);
    
    try {
      const token = localStorage.getItem('token');
      const result = await purchaseItem(token, itemType, itemId, cost);
      
      setCarrots(result.remainingCarrots);
      await loadShopData(); // Reload to get updated inventory
      showToast(`Purchased ${itemType === 'pig' ? PIGS.find(p => p.id === itemId)?.name : COSMETICS.find(c => c.id === itemId)?.name}!`);
      
    } catch (error) {
      console.error('Purchase failed:', error);
      showToast(error.message);
    }
    
    setPurchasing(null);
  };

  const handleEquip = async (itemType, itemId) => {
    try {
      // Immediately update local state for better UX
      setEquippedItems(prev => ({
        ...prev,
        [itemType]: itemId
      }));
      
      const token = localStorage.getItem('token');
      await equipItemAPI(token, itemType, itemId);
      await loadShopData(); // Reload to get updated equipped items from server
      showToast(`Equipped ${itemType === 'pig' ? PIGS.find(p => p.id === itemId)?.name : COSMETICS.find(c => c.id === itemId)?.name}!`);
    } catch (error) {
      console.error('Equip failed:', error);
      // Revert the optimistic update on error
      await loadShopData();
      showToast('Failed to equip item');
    }
  };

  const startUnboxAnimation = (resultPig) => {
    const canvas = unboxCanvasRef.current;
    if (!canvas || !basePigImage.current) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;  // 500px
    const H = canvas.height; // 250px

    // Create reel with random pigs and the final result
    const choices = ['pink', 'black', 'angel', 'roasted'];
    const reel = [];
    
    // Fill reel with random items
    for (let i = 0; i < 20; i++) {
      reel.push(choices[Math.floor(Math.random() * choices.length)]);
    }
    
    // Add final result
    reel.push(resultPig);
    reel.push('black', 'pink'); // Extra items for smooth stopping
    
    const ITEM_W = 180;
    let x = 0;
    let speed = 1200;
    const centerX = W / 2;
    const targetIndex = reel.length - 3;
    const targetX = targetIndex * ITEM_W + ITEM_W / 2;
    
    let last = performance.now();
    let stopped = false;
    let particles = [];
    
    const createParticles = () => {
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: centerX + (Math.random() - 0.5) * 100,
          y: H * 0.5 + (Math.random() - 0.5) * 60,
          vx: (Math.random() - 0.5) * 600,
          vy: (Math.random() - 0.9) * 700,
          life: 1,
          size: 3 + Math.random() * 4,
          color: `hsl(${Math.random() * 360}, 90%, 70%)`
        });
      }
    };

    const animate = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      
      ctx.clearRect(0, 0, W, H);
      
      // Dark gradient background
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#1a202c');
      bg.addColorStop(0.5, '#2d3748');
      bg.addColorStop(1, '#1a202c');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      
      // Title text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🎰 Opening Capsule...', centerX, 40);
      
      // Reel container
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      const reelY = 70;
      const reelHeight = 120;
      ctx.fillRect(50, reelY, W - 100, reelHeight);
      ctx.strokeRect(50, reelY, W - 100, reelHeight);
      
      // Clip to reel area
      ctx.beginPath();
      ctx.rect(50, reelY, W - 100, reelHeight);
      ctx.clip();
      
      // Update position
      if (!stopped) {
        const targetScroll = targetX - centerX;
        const dist = targetScroll - x;
        const k = 3.5;
        const damp = 1.8;
        speed = speed + (dist * k - speed * damp) * dt;
        x += speed * dt;
        
        if (Math.abs(dist) < 6 && Math.abs(speed) < 30) {
          stopped = true;
          speed = 0;
          createParticles();
          // Immediately update equipped items to show the new pig
          setTimeout(async () => {
            setUnboxAnimating(false);
            
            console.log('Unbox complete, updating state for pig:', resultPig);
            console.log('Current inventory before update:', inventory.length, 'items');
            
            // Update both equipped items AND inventory immediately for UI responsiveness
            setEquippedItems(prev => {
              const newEquipped = { ...prev, pig: resultPig };
              console.log('Updated equipped items:', newEquipped);
              return newEquipped;
            });
            
            setInventory(prev => {
              const newInventory = [...prev, { item_type: 'pig', item_id: resultPig }];
              console.log('Updated inventory:', newInventory.length, 'items, new pig:', resultPig);
              return newInventory;
            });
            
            // Force redraw immediately
            setTimeout(() => {
              drawEquippedPreview();
              drawCapsulePreview();
            }, 50);
            
            // Then reload all data to ensure consistency with backend
            setTimeout(async () => {
              console.log('Reloading shop data for consistency...');
              await loadShopData();
            }, 300);
          }, 1500);
        }
      }
      
      // Draw reel items
      for (let i = 0; i < reel.length; i++) {
        const cx = 50 + i * ITEM_W - x + ITEM_W / 2;
        const cy = reelY + reelHeight / 2;
        
        if (cx < -ITEM_W || cx > W + ITEM_W) continue;
        
        // Item background
        const isCenter = Math.abs(cx - centerX) < ITEM_W / 2;
        ctx.fillStyle = isCenter ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)';
        ctx.fillRect(cx - ITEM_W / 2 + 10, cy - 50, ITEM_W - 20, 100);
        
        // Draw pig variant
        drawPigVariant(ctx, cx, cy, 90, reel[i], null, false, basePigImage.current);
      }
      ctx.restore();
      
      // Selection arrow
      ctx.save();
      ctx.translate(centerX, reelY - 10);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(15, -20);
      ctx.lineTo(-15, -20);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      
      // Draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += 1200 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= 1.2 * dt;
        
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      
      if (stopped && particles.length === 0) {
        // Show final result text
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`You got: ${PIGS.find(p => p.id === resultPig)?.name}!`, centerX, H - 30);
        return; // Stop animation
      }
      
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  };

  const handleCapsulePurchase = async () => {
    if (purchasing) return;
    
    if (carrots < CAPSULE_COST) {
      showToast('Not enough carrots!');
      return;
    }

    // Get available pigs (ones not owned yet)
    const ownedPigIds = inventory.filter(item => item.item_type === 'pig').map(item => item.item_id);
    const availablePigs = CAPSULE_PIGS.filter(pigId => !ownedPigIds.includes(pigId));
    
    if (availablePigs.length === 0) {
      showToast('You already own all capsule pigs!');
      return;
    }

    setPurchasing('capsule');
    
    try {
      const token = localStorage.getItem('token');
      
      // Deduct carrots
      const gameStats = await getGameStats(token);
      await updateGameStats(token, { ...gameStats, carrots: gameStats.carrots - CAPSULE_COST });
      
      // Pick random pig
      const randomPig = availablePigs[Math.floor(Math.random() * availablePigs.length)];
      
      // Add to inventory
      await purchaseItem(token, 'pig', randomPig, 0); // Cost 0 since we already deducted
      
      setUnboxResult(randomPig);
      setShowUnboxModal(true);
      setUnboxAnimating(true);
      
      // Start unbox animation after modal is rendered
      setTimeout(() => {
        startUnboxAnimation(randomPig);
      }, 100);
      
      await loadShopData();
      
    } catch (error) {
      console.error('Capsule purchase failed:', error);
      showToast('Failed to purchase capsule');
    }
    
    setPurchasing(null);
  };

  const drawCapsulePreview = () => {
    const canvas = capsuleCanvasRef.current;
    if (!canvas || !basePigImage.current) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create animated cycling through pig variants
    const time = Date.now() / 1000;
    const cycleIndex = Math.floor(time * 2) % 3; // Change every 0.5 seconds
    const pigs = ['black', 'angel', 'roasted'];
    
    // Draw animated pig in center with bob effect
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const bob = Math.sin(time * 3) * 8; // Floating animation
    
    // Draw a glowing background for the capsule effect
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100);
    gradient.addColorStop(0, 'rgba(251, 191, 36, 0.3)');
    gradient.addColorStop(1, 'rgba(251, 191, 36, 0.1)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw the animated pig
    drawPigVariant(ctx, centerX, centerY + bob, 100, pigs[cycleIndex], null, false, basePigImage.current);
    
    // Add sparkle effects
    for (let i = 0; i < 3; i++) {
      const angle = time + i * (Math.PI * 2 / 3);
      const sparkleX = centerX + Math.cos(angle) * 80;
      const sparkleY = centerY + Math.sin(angle) * 60 + bob * 0.3;
      
      ctx.save();
      ctx.translate(sparkleX, sparkleY);
      ctx.rotate(time * 2 + i);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(2, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-2, 0);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }
  };

  const drawEquippedPreview = () => {
    const canvas = equippedCanvasRef.current;
    if (!canvas || !basePigImage.current) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const equippedPig = equippedItems.pig || 'pink';
    const equippedCosmetic = equippedItems.cosmetic || null;
    
    drawPigVariant(ctx, 150, 110, 120, equippedPig, equippedCosmetic, false, basePigImage.current);
  };

  if (loading) {
    return <div className={styles.loading}>Loading shop...</div>;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className={styles.btn} onClick={onNavigateBack}>← Back to Dashboard</button>
          <div className={styles.carrots}>Carrots: <span>{carrots}</span> 🥕</div>
        </div>
        <div className={styles.note}>Equip choices persist and are used on your dashboard.</div>
      </div>

      {/* Capsule Section */}
      <div className={styles.section}>
        <h3>🐷 Pig Capsule — {CAPSULE_COST} 🥕</h3>
        <div className={styles.pad} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px', alignItems: 'center' }}>
          <canvas 
            ref={capsuleCanvasRef} 
            width={520} 
            height={240} 
            style={{ width: '100%', height: 'auto', border: '1px solid var(--line)', borderRadius: '8px' }}
          />
          <div>
            <button 
              className={`${styles.btn} ${styles.cta}`}
              onClick={handleCapsulePurchase}
              disabled={purchasing === 'capsule'}
            >
              {purchasing === 'capsule' ? 'Opening...' : `Buy Capsule (${CAPSULE_COST} 🥕)`}
            </button>
            <div className={styles.note} style={{ marginTop: '10px' }}>
              Contains one of: Black Pig, Angel Pig, Roasted Pig.
            </div>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Pigs Section */}
        <div className={styles.section}>
          <h3>Pigs</h3>
          <div className={styles.pad}>
            {PIGS.map(pig => {
              const owned = hasItem('pig', pig.id);
              const equipped = isEquipped('pig', pig.id);
              const isPurchasing = purchasing === `pig-${pig.id}`;

              return (
                <PigCard
                  key={pig.id}
                  pig={pig}
                  owned={owned}
                  equipped={equipped}
                  purchasing={isPurchasing}
                  onPurchase={() => handlePurchase('pig', pig.id, pig.price)}
                  onEquip={() => handleEquip('pig', pig.id)}
                  basePigImage={basePigImage.current}
                />
              );
            })}
          </div>
        </div>

        {/* Cosmetics Section */}
        <div className={styles.section}>
          <h3>Cosmetics</h3>
          <div className={styles.pad}>
            {COSMETICS.map(cosmetic => {
              const owned = hasItem('cosmetic', cosmetic.id);
              const equipped = isEquipped('cosmetic', cosmetic.id);
              const isPurchasing = purchasing === `cosmetic-${cosmetic.id}`;

              return (
                <CosmeticCard
                  key={cosmetic.id}
                  cosmetic={cosmetic}
                  owned={owned}
                  equipped={equipped}
                  purchasing={isPurchasing}
                  onPurchase={() => handlePurchase('cosmetic', cosmetic.id, cosmetic.price)}
                  onEquip={() => handleEquip('cosmetic', cosmetic.id)}
                  basePigImage={basePigImage.current}
                />
              );
            })}
          </div>
        </div>

        {/* Equipped Section */}
        <div className={styles.section}>
          <h3>Equipped</h3>
          <div className={styles.pad}>
            <div className={styles.note}>
              Pig: {PIGS.find(p => p.id === equippedItems.pig)?.name || 'Pink Pig'} • 
              Cosmetic: {equippedItems.cosmetic ? 
                COSMETICS.find(c => c.id === equippedItems.cosmetic)?.name : 'None'}
            </div>
            <canvas 
              ref={equippedCanvasRef}
              width={300}
              height={200}
              style={{ marginTop: '8px', border: '1px solid var(--line)', borderRadius: '8px' }}
            />
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles.show}`}>
          {toast}
        </div>
      )}

      {/* Unbox Modal */}
      {showUnboxModal && (
        <div className={styles.modal}>
          <div className={styles.panel} style={{ maxWidth: '600px', width: '90vw' }}>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <h2 style={{ marginBottom: '10px', color: '#4a5568' }}>🎉 Capsule Opened!</h2>
              {!unboxAnimating && (
                <p style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
                  You got: <span style={{ color: '#e53e3e' }}>{PIGS.find(p => p.id === unboxResult)?.name}</span>
                </p>
              )}
              <canvas 
                ref={unboxCanvasRef}
                width={500}
                height={250}
                style={{ 
                  border: '2px solid var(--line)', 
                  borderRadius: '12px',
                  marginBottom: '20px',
                  display: 'block',
                  margin: '0 auto 20px auto'
                }}
              />
              <button 
                className={`${styles.btn} ${styles.cta}`}
                onClick={() => setShowUnboxModal(false)}
                style={{ 
                  fontSize: '16px', 
                  padding: '12px 24px',
                  minWidth: '120px'
                }}
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Pig Card Component
function PigCard({ pig, owned, equipped, purchasing, onPurchase, onEquip, basePigImage }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (basePigImage) {
      drawPig();
    }
  }, [basePigImage, pig.id]);

  const drawPig = () => {
    const canvas = canvasRef.current;
    if (!canvas || !basePigImage) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Use the main drawPigVariant function for consistency
    drawPigVariant(ctx, 160, 110, 100, pig.id, null, !owned, basePigImage);
  };

  return (
    <div className={styles.card}>
      <canvas 
        ref={canvasRef}
        width={320}
        height={200}
        style={{ width: '100%', height: '200px' }}
      />
      <div className={styles.meta}>
        <div className={styles.name}>{pig.name}</div>
        <div className={styles.price}>
          {pig.price === null ? 'Capsule Only' : `${pig.price} 🥕`}
        </div>
      </div>
      {owned ? (
        <button 
          className={equipped ? styles.own : styles.equip}
          onClick={onEquip}
          disabled={equipped}
        >
          {equipped ? 'Equipped' : 'Equip'}
        </button>
      ) : pig.price === null ? (
        <button className={styles.own} disabled>
          Roll Capsule to Unlock
        </button>
      ) : (
        <button 
          className={styles.cta}
          onClick={onPurchase}
          disabled={purchasing || pig.price === 0}
        >
          {purchasing ? 'Buying...' : pig.price === 0 ? 'Free' : `Buy (${pig.price} 🥕)`}
        </button>
      )}
    </div>
  );
}

// Cosmetic Card Component  
function CosmeticCard({ cosmetic, owned, equipped, purchasing, onPurchase, onEquip, basePigImage }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    drawCosmetic();
  }, [cosmetic.id, owned]);

  const drawCosmetic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (basePigImage) {
      // Draw a pink pig wearing the cosmetic to demonstrate
      drawPigVariant(ctx, 160, 110, 100, 'pink', cosmetic.id, !owned, basePigImage);
    } else {
      // Fallback to drawing just the cosmetic
      ctx.save();
      ctx.translate(160, 110);

      if (!owned) {
        ctx.globalAlpha = 0.3;
        ctx.filter = 'grayscale(100%)';
      }

      // Draw stand shadow
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(0, 32, 45, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = owned ? 1 : 0.3;

      if (cosmetic.id === 'top-hat') {
        drawTopHat(ctx, 0, -40, 1.0);
      } else if (cosmetic.id === 'traffic-cone') {
        drawTrafficCone(ctx, 0, -30, 1.0);
      }

      ctx.restore();
    }
  };

  return (
    <div className={styles.card}>
      <canvas 
        ref={canvasRef}
        width={320}
        height={200}
        style={{ width: '100%', height: '200px' }}
      />
      <div className={styles.meta}>
        <div className={styles.name}>{cosmetic.name}</div>
        <div className={styles.price}>{cosmetic.price} 🥕</div>
      </div>
      {owned ? (
        <button 
          className={equipped ? styles.own : styles.equip}
          onClick={onEquip}
          disabled={equipped}
        >
          {equipped ? 'Equipped' : 'Equip'}
        </button>
      ) : (
        <button 
          className={styles.cta}
          onClick={onPurchase}
          disabled={purchasing}
        >
          {purchasing ? 'Buying...' : `Buy (${cosmetic.price} 🥕)`}
        </button>
      )}
    </div>
  );
}