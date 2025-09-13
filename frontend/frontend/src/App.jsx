import { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import Shop from './components/Shop';
import { signup as apiSignup, login as apiLogin, getUser, getClasses, saveClasses } from './api';
import Profile from './components/Profile';

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
        onUpdateSchedule={() => setPage('profile')}
        onNavigateToShop={() => setPage('shop')}
      />
    </div>
  );
}

export default App;
