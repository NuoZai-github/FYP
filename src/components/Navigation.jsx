import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Trophy, Swords } from 'lucide-react';

export default function Navigation() {
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '1rem 2rem',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 50
        }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Swords size={28} className="text-accent-primary" style={{ color: '#8b5cf6' }} />
                    <span className="title-gradient">CTF Duel</span>
                </Link>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <Link to="/" className="nav-link" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Lobby</Link>
                    <Link to="/leaderboard" className="nav-link" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Leaderboard</Link>
                    <Link to="/admin" className="nav-link" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Admin</Link>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '20px' }}>
                    <Trophy size={16} color="#fbbf24" />
                    <span style={{ fontWeight: 'bold' }}>{profile?.rank_points || 0}</span>
                    <span style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>PTS</span>
                </div>
                <button onClick={handleLogout} style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '0.5rem', display: 'flex' }} title="Logout">
                    <LogOut size={20} />
                </button>
            </div>
        </nav>
    );
}
