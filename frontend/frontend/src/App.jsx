import { useState, useEffect } from 'react';
import { EquippedProvider } from './context/EquippedContext.jsx';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import Shop from './components/Shop';
import { signup as apiSignup, login as apiLogin, getUser, getClasses, saveClasses, getGameStats, getEquippedItems } from './api';
import Profile from './components/Profile';
import Battle from './components/Battle.jsx';

const initialPig = { food: 0, weight: 0 };
const initialLeaderboard = [
  { username: '', streak: 0 },
  { username: 'piggy', streak: 0 },
  { username: 'babe', streak: 0 },
];
const initialStreak = 0;

function App() {
  const [page, setPage] = useState('login');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [pig, setPig] = useState(initialPig);
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
  const [streak, setStreak] = useState(initialStreak);
  const [classes, setClasses] = useState([]);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [carrots, setCarrots] = useState(0);
  const addCarrots = (amount) => setCarrots(prev => Math.max(0, prev + amount));

  // Load carrot count from backend on login/user change
  useEffect(() => {
    async function loadCarrots() {
      if (user) {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const stats = await getGameStats(token);
            setCarrots(stats.carrots || 0);
          }
        } catch (e) {
          setCarrots(0);
        }
      }
    }
    loadCarrots();
  }, [user]);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setPage('login');
  };

  // Refresh user data (useful when returning from profile)
  const refreshUserData = async () => {
    const token = localStorage.getItem('token');
    if (token && user) {
      try {
        const userData = await getUser(token);
        setUser(userData);
        const backendClasses = await getClasses(token);
        setClasses(backendClasses);
        console.log('User data refreshed');
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  // Auto-login if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      getUser(token)
        .then(async userData => {
          setUser(userData);
          setPig({ food: 0, weight: 0 }); // Placeholder
          setLeaderboard([
            { username: userData.username, streak: 0 },
            { username: 'piggy', streak: 0 },
            { username: 'babe', streak: 0 },
          ]);
          setStreak(0);
          // Fetch classes from backend
          try {
            const backendClasses = await getClasses(token);
            setClasses(backendClasses);
          } catch (error) {
            console.error('Failed to fetch classes:', error);
            setClasses([]); // Set empty array on error
          }
          setPage('dashboard');
        })
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
  }, [user]);


  // Auth handler using backend API
  const handleAuth = async (username, password) => {
    setError('');
    try {
      let data;
      if (page === 'signup') {
        data = await apiSignup(username, password);
        // Store JWT token for new user
        localStorage.setItem('token', data.token);
        // Set user data from signup response
        setUser(data.user);
        // After signup, prompt for classes/locations
        setShowProfilePrompt(true);
        setClasses([]);
        setPage('profile');
        return;
      } else {
        data = await apiLogin(username, password);
      }
      // Store JWT in localStorage (for demo; use httpOnly cookie in production)
      localStorage.setItem('token', data.token);
      // Fetch user data
      const userData = await getUser(data.token);
      setUser(userData);
      setPig({ food: 0, weight: 0 }); // Placeholder, update with real pig data later
      setLeaderboard([
        { username: userData.username, streak: 0 },
        { username: 'piggy', streak: 0 },
        { username: 'babe', streak: 0 },
      ]);
      setStreak(0);
      // Fetch classes from backend
      try {
        const backendClasses = await getClasses(data.token);
        setClasses(backendClasses);
      } catch (error) {
        console.error('Failed to fetch classes after login:', error);
        setClasses([]);
      }
      setPage('dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };


  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <AuthForm
          mode={page}
          onAuth={handleAuth}
          error={error}
        />
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          {page === 'login' ? (
            <span>Don&apos;t have an account?{' '}
              <button style={{ color: '#ff69b4', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => { setPage('signup'); setError(''); }}>Sign up</button>
            </span>
          ) : (
            <span>Already have an account?{' '}
              <button style={{ color: '#ff69b4', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => { setPage('login'); setError(''); }}>Log in</button>
            </span>
          )}
        </div>
      </div>
    );
  }
  
  if (page === 'battle' && user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 0 }}>
          <button
            onClick={() => setPage('dashboard')}
            style={{
              fontSize: '1.1rem',
              padding: '8px 32px',
              borderRadius: 18,
              background: 'linear-gradient(90deg, #ffe0f0 0%, #e0f7fa 100%)',
              color: '#ef5da8',
              border: 'none',
              fontWeight: 700,
              boxShadow: '0 2px 8px #e0b7ff22',
              letterSpacing: '0.03em',
              cursor: 'pointer',
              marginBottom: 0,
              marginTop: 0,
              outline: 'none',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
          >
            Back
          </button>
        </div>
        <Battle onWinReward={addCarrots} />
      </div>
    );
  }

  if (page === 'shop' && user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <Shop
          user={user}
          onNavigateBack={() => setPage('dashboard')}
        />
      </div>
    );
  }

  if (page === 'profile' && user) {
    const token = localStorage.getItem('token');
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <Profile
          user={user}
          classes={classes}
          onSave={async cls => {
            setClasses(cls);
            setShowProfilePrompt(false);
            // Save to backend
            if (token) {
              try { 
                await saveClasses(token, cls); 
                console.log('Classes saved successfully');
              } catch (error) {
                console.error('Failed to save classes:', error);
              }
            }
            // Refresh user data before going back to dashboard
            await refreshUserData();
            setPage('dashboard');
          }}
        />
      </div>
    );
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      <button onClick={handleLogout} style={{ position: 'absolute', top: 28, right: 8, zIndex: 10, fontSize: '12px', padding: '4px 8px' }}>Logout</button>
      <Dashboard
        key={user?.id || 'no-user'} // Force re-render when user changes
        user={user}
        pig={pig}
        leaderboard={leaderboard}
        streak={streak}
        classes={classes}
        carrots={carrots}
        addCarrots={addCarrots}
        onUpdateSchedule={() => setPage('profile')}
        onNavigateToShop={() => setPage('shop')}
        onNavigateToBattle={() => setPage('battle')}
      />
    </div>
  );
}

export default function WrappedApp() {
  return (
    <EquippedProvider>
      <App />
    </EquippedProvider>
  );
}
