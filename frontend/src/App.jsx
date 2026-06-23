import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ZoomCallback from './pages/ZoomCallback';
import { isAuthenticated, getUser, logout, verifyToken, getAuthenticatedAPI } from './services/authService';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showSignup, setShowSignup] = useState(false);
  const [stats, setStats] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        const isValid = await verifyToken();
        if (isValid) {
          setUser(getUser());
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const api = getAuthenticatedAPI();

      const [statsRes, recordingsRes, eventsRes] = await Promise.all([
        api.get('/events/stats'),
        api.get('/events/recordings'),
        api.get('/events/recent?limit=20')
      ]);

      setStats(statsRes.data.stats);
      setRecordings(recordingsRes.data.recordings);
      setEvents(eventsRes.data.events);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.response?.status === 401) {
        // Token invalid, logout
        handleLogout();
      } else {
        setError('Failed to load dashboard data');
      }
    }
  };

  // Fetch dashboard data when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      // Refresh every 10 seconds
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const handleLoginSuccess = (userData) => {
    if (userData.showSignup) {
      setShowSignup(true);
    } else if (userData.showLogin) {
      setShowSignup(false);
    } else {
      setUser(userData);
      setIsLoggedIn(true);
      setShowSignup(false);
    }
  };

  const handleSignupSuccess = (userData) => {
    if (userData.showLogin) {
      setShowSignup(false);
    } else {
      setUser(userData);
      setIsLoggedIn(true);
      setShowSignup(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsLoggedIn(false);
    setUser(null);
    setStats(null);
    setRecordings([]);
    setEvents([]);
    setShowSignup(false);
  };

  // Loading screen
  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Zoom OAuth callback */}
        <Route path="/zoom/callback" element={<ZoomCallback />} />

        {/* Auth pages */}
        {!isLoggedIn ? (
          <>
            <Route
              path="/signup"
              element={<Signup onSignupSuccess={handleSignupSuccess} />}
            />
            <Route
              path="/"
              element={showSignup ?
                <Signup onSignupSuccess={handleSignupSuccess} />
                : <Login onLoginSuccess={handleLoginSuccess} />
              }
            />
          </>
        ) : (
          <>
            {/* Dashboard - protected */}
            <Route
              path="/"
              element={
                <div className="app">
                  <header className="app-header">
                    <div className="header-content">
                      <div className="header-title">
                        <h1>📹 Zoom Recording Auto-Share</h1>
                        <p>Automatic download links for all your Zoom accounts</p>
                      </div>
                      <div className="header-user">
                        <span>👤 {user.name || user.email}</span>
                        <button className="logout-button" onClick={handleLogout}>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </header>

                  <main className="app-main">
                    {error && <div className="error-banner">{error}</div>}

                    {!stats ? (
                      <div className="loading">Loading dashboard...</div>
                    ) : (
                      <Dashboard stats={stats} recordings={recordings} events={events} />
                    )}
                  </main>

                  <footer className="app-footer">
                    <p>Auto-refresh every 10 seconds</p>
                  </footer>
                </div>
              }
            />
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
