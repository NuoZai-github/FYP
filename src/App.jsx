import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import Match from './pages/Match';
import Result from './pages/Result';
import Leaderboard from './pages/Leaderboard';
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
            <Route path="/login" element={<Login />} />

            <Route path="/*" element={
              <PrivateRoute>
                <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                  <Navigation />
                  <div style={{ flex: 1 }}>
                    <Routes>
                      <Route path="/" element={<Lobby />} />
                      <Route path="/match/:id" element={<Match />} />
                      <Route path="/result/:id" element={<Result />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/admin" element={<Admin />} />
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
