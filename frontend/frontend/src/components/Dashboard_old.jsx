
import React, { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';
import { recordAttendance, getTotalRewards } from '../api';

// Hardcoded CMU building coordinates (approximate)
import React, { useState, useEffect, useRef } from 'react';
import styles from './Dashboard.module.css';
import { recordAttendance, getTotalRewards } from '../api';
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
  if (!startTime) return true; // Allow if no time specified
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
  
  // Parse start time (format: "H:MM AM/PM" or "HH:MM AM/PM")
  const timeMatch = startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!timeMatch) {
    console.log('Debug - Could not parse time format');
    return true; // Allow if can't parse
  }
  
  let [, hourStr, minStr, ampm] = timeMatch;
  let hour = parseInt(hourStr);
  const min = parseInt(minStr);
  
  // Convert to 24-hour format
  if (ampm.toUpperCase() === 'PM' && hour !== 12) {
    hour += 12;
  } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }
  
  const startMinutes = hour * 60 + min;
  
  // Allow check-in from 10 minutes before to 10 minutes after start time
  return currentTime >= (startMinutes - 10) && currentTime <= (startMinutes + 10);
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
      pigImgRef.current = img;
    };
    img.src = pigImage;
  }, []);

  // Fetch game stats when component mounts
  useEffect(() => {
    const fetchGameStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token && user) {
          // For now, use localStorage for game stats
          // TODO: Replace with API calls when backend is ready
          const saved = JSON.parse(localStorage.getItem(`piggy-stats-${user.id}`) || '{}');
          setLevel(saved.level || 0);
          setXp(saved.xp || 0);
          setHunger(saved.hunger || 100);
          setCarrots(saved.carrots || 0);
        }
      } catch (error) {
        console.error('Failed to fetch game stats:', error);
      }
    };
    
    fetchGameStats();
  }, [user]);

  // Save game stats to localStorage (TODO: replace with API)
  const saveGameStats = () => {
    if (user) {
      const stats = { level, xp, hunger, carrots };
      localStorage.setItem(`piggy-stats-${user.id}`, JSON.stringify(stats));
    }
  };

  useEffect(() => {
    saveGameStats();
  }, [level, xp, hunger, carrots, user]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = false;
    
    const pigSize = 150;
    const pigPos = { x: canvas.width * 0.36, y: canvas.height * 0.62 };
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
  if (!startTime) return true; // Allow if no time specified
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
  
  console.log('Debug - Current time:', now.toTimeString(), 'Minutes:', currentTime);
  console.log('Debug - Start time string:', startTime);
  
  // Parse start time (format: "H:MM AM/PM" or "HH:MM AM/PM")
  const timeMatch = startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!timeMatch) {
    console.log('Debug - Could not parse time format');
    return true; // Allow if can't parse
  }
  
  let [, hourStr, minStr, ampm] = timeMatch;
  let hour = parseInt(hourStr);
  const min = parseInt(minStr);
  
  // Convert to 24-hour format
  if (ampm.toUpperCase() === 'PM' && hour !== 12) {
    hour += 12;
  } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }
  
  const startMinutes = hour * 60 + min;
  
  console.log('Debug - Parsed hour:', hour, 'min:', min);
  console.log('Debug - Start minutes:', startMinutes, 'Window:', (startMinutes - 10), '-', (startMinutes + 10));
  
  // Allow check-in from 10 minutes before to 10 minutes after start time
  const withinWindow = currentTime >= (startMinutes - 10) && currentTime <= (startMinutes + 10);
  console.log('Debug - Within window:', withinWindow);
  
  return withinWindow;
}

function Dashboard({ user, streak, pig, leaderboard, classes, onUpdateSchedule }) {
  const [checkMsg, setCheckMsg] = useState('');
  const [checking, setChecking] = useState(false);
  const [totalRewards, setTotalRewards] = useState(0);

  // Fetch total rewards when component mounts or user changes
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token && user) {
          console.log('Fetching rewards for user:', user.username);
          const rewards = await getTotalRewards(token);
          setTotalRewards(rewards);
        } else {
          console.log('No token or user found, setting rewards to 0');
          setTotalRewards(0);
        }
      } catch (error) {
        console.error('Failed to fetch rewards:', error);
        setTotalRewards(0); // Reset to 0 on error
      }
    };
    
    fetchRewards();
  }, [user]); // Re-fetch when user changes

  const handleCheck = (classObj) => {
    console.log('Debug - handleCheck called with:', classObj);
    
    if (!navigator.geolocation) {
      console.log('Debug - Geolocation not supported');
      setCheckMsg('Geolocation not supported.');
      return;
    }
    
    console.log('Debug - About to check time with start_time:', classObj.start_time);
    
    // Check if within class time window
    if (!isWithinClassTime(classObj.start_time)) {
      console.log('Debug - Time check failed');
      setCheckMsg('Class check-in window closed (must be within 10 minutes of start time).');
      return;
    }
    
    console.log('Debug - Time check passed, proceeding with location check');
    
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
        if (dist <= 200) {
          const reward = Math.floor(Math.random() * 10) + 1;
          try {
            const token = localStorage.getItem('token');
            await recordAttendance(token, classObj.id, reward);
            setCheckMsg(`Attendance success! Reward: ${reward}`);
            // Update total rewards after successful attendance
            setTotalRewards(prev => prev + reward);
          } catch (error) {
            // Check if it's a cooldown error (429 status)
            if (error.message && error.message.includes('429')) {
              setCheckMsg('Already checked in within the last 23 hours. Try again tomorrow!');
            } else {
              setCheckMsg('Attendance recorded locally, but failed to sync with server.');
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

  return (
    <div className={styles.dashboard}>
      <section className={styles.stats}>
        <h2>Welcome, {user.username}!</h2>
        <div>Streak: <b>{streak} days</b></div>
        <div>Total Rewards: <b>{totalRewards} points</b></div>
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
              <button style={{ marginLeft: 8 }} onClick={() => handleCheck(c)} disabled={checking}>Check</button>
            </li>
          ))}
        </ul>
        <div style={{ color: '#007b00', marginTop: 8 }}>{checkMsg}</div>
        <button onClick={onUpdateSchedule} style={{ marginTop: 8 }}>Update Schedule</button>
      </section>
    </div>
  );
}

export default Dashboard;
