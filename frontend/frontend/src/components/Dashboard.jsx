import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Dashboard.module.css';
import { recordAttendance, getTotalRewards, getGameStats, updateGameStats } from '../api';
import pigImage from './pig.png';

// Hardcoded CMU building coordinates (approximate)
const BUILDING_COORDS = {
  'Gates': [40.4433, -79.9446],
  'Wean': [40.4429, -79.9456],
  'Newell': [40.4431, -79.9452],
  'Tepper': [40.4441, -79.9426],
  'CFA': [40.4417, -79.9427],
  'Purnell': [40.4419, -79.9422],
  'Miller': [40.4418, -79.9437],
  'Margaret': [40.4442, -79.9422],
  'Mellon': [40.4435, -79.9436],
  'Doherty': [40.4427, -79.9439],
  'Scaife': [40.4437, -79.9462],
  'Hamerschlag': [40.4440, -79.9467],
  'Porter': [40.4443, -79.9431],
  'Scott': [40.4445, -79.9450],
  'Baker': [40.4446, -79.9429],
  'Posner': [40.4440, -79.9435],
  'Hamburg': [40.4441, -79.9442],
};

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = x => x * Math.PI / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Check if current time is within start time window (10 minutes before to 10 minutes after start)
function isWithinClassTime(startTime) {
  if (!startTime) return true;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const timeMatch = startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!timeMatch) return true;
  
  let [, hourStr, minStr, ampm] = timeMatch;
  let hour = parseInt(hourStr);
  const min = parseInt(minStr);
  
  if (ampm.toUpperCase() === 'PM' && hour !== 12) {
    hour += 12;
  } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }
  
  const startMinutes = hour * 60 + min;
  return currentTime >= (startMinutes - 30) && currentTime <= (startMinutes + 30); // 2 hours window for testing
}

function Dashboard({ user, classes, onUpdateSchedule }) {
  // Game state
  const [level, setLevel] = useState(0);
  const [xp, setXp] = useState(0);
  const [hunger, setHunger] = useState(100);
  const [carrots, setCarrots] = useState(0);
  
  // UI state
  const [checkMsg, setCheckMsg] = useState('');
  const [checking, setChecking] = useState(false);
  const [talkTimer, setTalkTimer] = useState(0);
  const [bubble, setBubble] = useState({ show: false, text: 'oink oink!' });
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const pigImgRef = useRef(null);

  // Load pig image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      console.log('Pig image loaded successfully');
      pigImgRef.current = img;
    };
    img.onerror = (error) => {
      console.error('Failed to load pig image:', error);
    };
    img.src = pigImage;
    console.log('Loading pig image from:', pigImage);
  }, []);

  // Fetch game stats when component mounts
  useEffect(() => {
    if (user) {
      const loadGameStats = async () => {
        try {
          const token = localStorage.getItem('token');
          console.log('Loading game stats for user:', user.id, 'token exists:', !!token);
          if (token) {
            const stats = await getGameStats(token);
            console.log('Loaded game stats:', stats);
            console.log('Setting state - Level:', stats.level, 'XP:', stats.xp, 'Hunger:', stats.hunger, 'Carrots:', stats.carrots);
            setLevel(stats.level);
            setXp(stats.xp);
            setHunger(stats.hunger);
            setCarrots(stats.carrots);
          }
        } catch (error) {
          console.error('Failed to load game stats:', error);
          // Fallback to localStorage for migration
          const saved = JSON.parse(localStorage.getItem(`piggy-stats-${user.id}`) || '{}');
          console.log('Using localStorage fallback:', saved);
          setLevel(saved.level || 0);
          setXp(saved.xp || 0);
          setHunger(saved.hunger || 100);
          setCarrots(saved.carrots || 0);
        }
      };
      loadGameStats();
    }
  }, [user]);

  // Save game stats to database (debounced)
  const saveGameStats = useCallback(async () => {
    if (user) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          console.log('Saving game stats:', { level, xp, hunger, carrots });
          await updateGameStats(token, { level, xp, hunger, carrots });
          console.log('Game stats saved successfully');
        }
      } catch (error) {
        console.error('Failed to save game stats:', error);
        // Fallback to localStorage
        const stats = { level, xp, hunger, carrots };
        localStorage.setItem(`piggy-stats-${user.id}`, JSON.stringify(stats));
      }
    }
  }, [user, level, xp, hunger, carrots]);

  useEffect(() => {
    // Add a small delay to prevent rapid-fire saves
    const timeoutId = setTimeout(() => {
      // Only save if stats have changed from defaults or if there's actual progress
      if (level > 0 || xp > 0 || hunger < 100 || carrots > 0) {
        console.log('Auto-saving game stats due to changes');
        saveGameStats();
      }
    }, 1000); // Increased delay to 1 second
    
    return () => clearTimeout(timeoutId);
  }, [saveGameStats, level, xp, hunger, carrots]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = false;
    
    const pigSize = 150;
    const pigPos = { x: canvas.width * 0.5, y: canvas.height * 0.62 }; // Center horizontally
    let startTime = performance.now();

    const animate = (currentTime) => {
      const t = (currentTime - startTime) / 1000;
      
      // Clear canvas
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw floor oval
      ctx.fillStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.ellipse(pigPos.x, pigPos.y + 30, 170, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw pig with animations
      if (pigImgRef.current) {
        const breathe = 1 + Math.sin(t * 2) * 0.02;
        const wiggle = Math.max(0, Math.min(1, talkTimer / 600));
        const tilt = Math.sin(t * 4) * 0.08 + wiggle * 0.18;
        const bounce = Math.max(0, Math.sin(t * 10)) * (6 * wiggle);

        ctx.save();
        ctx.translate(pigPos.x, pigPos.y - 30 - bounce);
        ctx.rotate(tilt);
        ctx.scale(1, breathe + wiggle * 0.10);
        ctx.translate(-pigSize / 2, -pigSize / 2);
        ctx.drawImage(pigImgRef.current, 0, 0, pigSize, pigSize);
        ctx.restore();
      }

      // Update talk timer
      if (talkTimer > 0) {
        setTalkTimer(prev => Math.max(0, prev - 16));
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [talkTimer]);

  // Game functions
  const addXP = (amount) => {
    setXp(prev => {
      let newXP = prev + amount;
      let newLevel = level;
      while (newXP >= 100) {
        newXP -= 100;
        newLevel++;
      }
      setLevel(newLevel);
      return newXP;
    });
  };

  const addCarrots = (amount) => {
    setCarrots(prev => Math.max(0, prev + amount));
  };

  const addHunger = (amount) => {
    setHunger(prev => Math.max(0, Math.min(100, prev + amount)));
  };

  // Decrease hunger over time (every 43 minutes for 72 hour total decay)
  useEffect(() => {
    const hungerDecay = setInterval(() => {
      setHunger(prev => Math.max(0, prev - 1)); // Decrease by 1% every 43 minutes
    }, 43 * 60 * 1000); // 43 minutes (72 hours total to go from 100% to 0%)

    return () => clearInterval(hungerDecay);
  }, []);

  // Talk to pig
  const handleTalk = () => {
    setTalkTimer(900);
    setBubble({ show: true, text: 'oink oink!' });
    
    // Generate oink sound
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const t = audioCtx.currentTime;
      
      const syllable = (start, dur, f0, f1) => {
        const o = audioCtx.createOscillator();
        o.type = 'square';
        const g = audioCtx.createGain();
        o.frequency.setValueAtTime(f0, start);
        o.frequency.exponentialRampToValueAtTime(f1, start + dur * 0.9);
        g.gain.setValueAtTime(0.0001, start);
        g.gain.linearRampToValueAtTime(0.22, start + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        o.connect(g).connect(audioCtx.destination);
        o.start(start);
        o.stop(start + dur + 0.02);
      };
      
      syllable(t, 0.16, 240, 170);
      syllable(t + 0.18, 0.14, 220, 160);
    } catch (e) {
      console.log('Audio not available:', e);
    }

    setTimeout(() => {
      setBubble({ show: false, text: '' });
    }, 2000);
  };

  // Check-in handler
  const handleCheck = (classObj) => {
    if (!navigator.geolocation) {
      setCheckMsg('Geolocation not supported.');
      return;
    }
    
    if (!isWithinClassTime(classObj.start_time)) {
      setCheckMsg('Class check-in window closed (must be within 2 hours of start time for testing).');
      return;
    }
    
    setChecking(true);
    setCheckMsg('Checking location...');
    
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        const coords = BUILDING_COORDS[classObj.location];
        if (!coords) {
          setCheckMsg('No coordinates for this building.');
          setChecking(false);
          return;
        }
        
        const dist = haversine(latitude, longitude, coords[0], coords[1]);
        console.log('Distance from class location:', dist, 'meters');
        if (dist <= 300) {
          const reward = Math.floor(Math.random() * 10) + 1;
          try {
            const token = localStorage.getItem('token');
            console.log('Attempting to record attendance for class:', classObj.id);
            await recordAttendance(token, classObj.id, reward);
            console.log('Attendance recorded successfully');
            
            // Give game rewards
            addXP(20);
            addCarrots(2);
            addHunger(15); // Increase hunger when checking in
            
            setCheckMsg(`Attendance success! +20 XP, +2 🥕, +15% Hunger`);
            setTalkTimer(700); // Make pig celebrate
          } catch (error) {
            console.error('Attendance error:', error);
            if (error.message && error.message.includes('429')) {
              setCheckMsg('Already checked in within the last 23 hours. Try again tomorrow!');
            } else {
              setCheckMsg(`Attendance error: ${error.message || 'Failed to sync with server'}`);
            }
          }
        } else {
          setCheckMsg(`Too far from class location (${Math.round(dist)}m).`);
        }
        setChecking(false);
      },
      () => { setCheckMsg('Could not get location.'); setChecking(false); }
    );
  };

  // Debug: Log current state values
  console.log('Current Dashboard state:', { level, xp, hunger, carrots });

  return (
    <div className={styles.phone}>
      {/* Stats Section */}
      <div className={styles.pad}>
        <div className={styles.stats}>
          <div className={`${styles.label} ${styles.levelLabel}`}>Lvl</div>
          <div className={styles.levelBarContainer}>
            <div className={styles.bar}>
              <div className={styles.fill} style={{ width: `${(xp / 100) * 100}%` }}></div>
            </div>
            <div className={styles.tiny}>
              <span>{level}</span> • <span>{Math.floor(xp)}</span>/100 XP
            </div>
          </div>

          <div className={styles.label}>Hunger</div>
          <div className={styles.hungerSlider}>
            <div className={styles.sliderTrack}>
              <div 
                className={styles.sliderFill}
                style={{ width: `${hunger}%` }}
              ></div>
              <div 
                className={styles.sliderThumb}
                style={{ left: `${hunger}%` }}
              ></div>
            </div>
          </div>

          <div className={styles.label}>Carrot</div>
          <div className={styles.value}>{carrots} 🥕</div>
        </div>
      </div>

      <div className={styles.line}></div>

      {/* Pig Stage */}
      <div className={styles.pad} style={{ position: 'relative' }}>
        <canvas 
          ref={canvasRef}
          id="stage" 
          width="420" 
          height="360"
          className={styles.canvas}
        />
        
        {bubble.show && (
          <div className={styles.bubble} style={{
            left: '50%',
            top: '30%',
            opacity: 1,
            transform: 'translate(-50%, -100%)'
          }}>
            {bubble.text}
          </div>
        )}

        <div className={styles.controls}>
          <button 
            onClick={handleTalk}
            className={styles.accent}
          >
            Talk to Pig
          </button>
        </div>

        {checkMsg && (
          <div className={styles.tiny} style={{ marginTop: '6px', textAlign: 'center' }}>
            {checkMsg}
          </div>
        )}
      </div>

      {/* Schedule Section */}
      <div className={styles.section}>
        <div style={{ fontWeight: 800, marginBottom: '6px' }}>Class Schedule</div>
        <div className={styles.tiny}>
          {(!classes || classes.length === 0) ? (
            <div>No classes yet. Use "Update Schedule" to add some!</div>
          ) : (
            classes.map((c, i) => {
              const isWithinTime = isWithinClassTime(c.start_time);
              return (
                <div key={i} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  margin: '4px 0',
                  padding: '8px',
                  background: isWithinTime ? '#f0f9ff' : 'transparent',
                  borderRadius: '6px',
                  border: isWithinTime ? '1px solid #0ea5e9' : '1px solid transparent'
                }}>
                  <span>
                    <b>{c.name}</b> — {c.location}<br/>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>
                      {c.start_time} - {c.end_time}
                    </span>
                  </span>
                  <button
                    onClick={() => handleCheck(c)}
                    disabled={!isWithinTime || checking}
                    className={isWithinTime ? styles.accent : styles.ghost}
                    style={{ 
                      fontSize: '12px', 
                      padding: '4px 8px',
                      opacity: isWithinTime ? 1 : 0.5,
                      cursor: isWithinTime ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {checking ? 'Checking...' : (isWithinTime ? 'Check In' : 'Not Time')}
                  </button>
                </div>
              );
            })
          )}
        </div>
        <button 
          onClick={onUpdateSchedule} 
          className={styles.ghost}
          style={{ marginTop: '8px', width: '100%' }}
        >
          Update Schedule
        </button>
      </div>

      {/* Directions */}
      <div className={styles.section}>
        <div style={{ fontWeight: 800, marginBottom: '8px' }}>How to Play</div>
        <div className={styles.tiny} style={{ lineHeight: '1.45' }}>
          • Add your <b>class schedule</b> using "Update Schedule". <br/>
          • When it's class time, tap <b>Check In for Class</b> (enabled within 10 minutes of your class). <br/>
          • Checking in gives you{' '}
          <span className={styles.pill}>+20 XP</span>{' '}
          <span className={styles.pill}>+2 🥕</span>{' '}
          <span className={styles.pill}>+15% Hunger</span>.<br/>
          • Train your pig by going to class regularly!
        </div>
      </div>
    </div>
  );
}

export default Dashboard;