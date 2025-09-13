
import React, { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';
import { recordAttendance, getTotalRewards } from '../api';

// Hardcoded CMU building coordinates (approximate)
const BUILDING_COORDS = {
  'Gates': [40.44361511780627, -79.94447839755829], 
  'Wean': [40.442741984780234, -79.94574936521462], 
  'Newell': [40.44343619117864, -79.9456159806902], 
  'Tepper': [40.445123938296916, -79.94528688421317], 
  'CFA': [40.44160102767352, -79.94291396863714], 
  'Purnell': [40.4435767517987, -79.94352475320801], 
  'Miller': [40.44389802861458, -79.94329803911742], 
  'Margaret': [40.442146764785406, -79.94153828941452], 
  'Mellon': [40.446180208306394, -79.95112186641965], 
  'Doherty': [40.442501207155246, -79.94458888238812], 
  'Scaife': [40.44184968597645, -79.94733101135822],
  'Hamerschlag': [40.44244579336064, -79.94691902436426],
  'Porter': [40.441716595669135, -79.9460103801308],
  'Scott': [40.44302566337631, -79.94679875360116], 
  'Baker': [40.44151334119467, -79.94499873220663],
  'Posner': [40.4410693526565, -79.9422943907734],
  'Hamburg': [40.44423347564315, -79.94556537945613]
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
