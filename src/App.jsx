import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Lobby from './pages/Lobby';
import Match from './pages/Match';
import Result from './pages/Result';
import Leaderboard from './pages/Leaderboard';
import Tournaments from './pages/Tournaments';
import TournamentRoom from './pages/TournamentRoom';
import Admin from './pages/Admin';
import Navigation from './components/Navigation';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-container">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-main">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            {/* Private Routes */}
            <Route path="/*" element={
              <PrivateRoute>
                <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                  <Navigation />
                  <div style={{ flex: 1 }}>
                    <Routes>
                      <Route path="/lobby" element={<Lobby />} />
                      <Route path="/match/:id" element={<Match />} />
                      <Route path="/result/:id" element={<Result />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/tournaments" element={<Tournaments />} />
                      <Route path="/tournament/:id" element={<TournamentRoom />} />
                      <Route path="/admin" element={<Admin />} />
                      {/* Redirect unknown routes to lobby */}
                      <Route path="*" element={<Navigate to="/lobby" />} />
                    </Routes>
                  </div>
                </div>
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
