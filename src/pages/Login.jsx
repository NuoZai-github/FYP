import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Swords } from 'lucide-react';

export default function Login() {
    // 'login', 'signup', 'forgot'
    const [viewState, setViewState] = useState('login');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn, signUp, resetPassword } = useAuth();
    const navigate = useNavigate();

    const handleReset = () => {
        setError('');
        setMessage('');
        setEmail('');
        setPassword('');
        setUsername('');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            if (viewState === 'forgot') {
                const { error } = await resetPassword(email);
                if (error) throw error;
                setMessage("Password reset link sent! Check your email.");
            } else if (viewState === 'signup') {
                if (!username) throw new Error("Username is required");
                const { data, error } = await signUp({
                    email,
                    password,
                    options: { data: { username } }
                });
                if (error) throw error;

                if (!data.session) {
                    alert("Registration successful! Please check your email to confirm your account before logging in.");
                    setViewState('login');
                } else {
                    navigate('/');
                }
            } else {
                const { error } = await signIn({ email, password });
                if (error) throw error;
                navigate('/');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper to determine rotation based on state
    // We'll use a 3-state system simplified into front/back for 3d flip.
    // Actually, standard flip is 2 sides. doing 3 sides is tricky.
    // Let's do: Login (Front), Signup (Back). 
    // How about Forgot? Maybe it slides or replaces Front?
    // Let's try: Login/Forgot are Front (modal switch?), Signup is Back.

    // Better approach for "Flip Card" usually implies 2 sides.
    // Side A: Login
    // Side B: Signup
    // Forgot Password can be a slide-over on Side A or just replace content on Side A.

    const isFlipped = viewState === 'signup';

    return (
        <div className="center-container" style={{ perspective: '1000px' }}>
            <div className={`flip-container ${isFlipped ? 'hover' : ''}`} style={{ width: '100%', maxWidth: '400px', height: '600px', position: 'relative' }}>
                <div className="flipper" style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', height: '100%' }}>

                    {/* FRONT SIDE: LOGIN & FORGOT */}
                    <div className="front glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', backfaceVisibility: 'hidden' }}>
                        <div style={{ textAlign: 'center' }}>
                            <Swords size={48} color="#8b5cf6" style={{ margin: '0 auto 1rem' }} />
                            <h1 className="title-gradient" style={{ fontSize: '2rem' }}>CTF-Rank</h1>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                {viewState === 'forgot' ? "Reset Password" : "Welcome back, Operator"}
                            </p>
                        </div>

                        {/* Error/Message Area */}
                        {(error || message) && (
                            <div style={{
                                marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem',
                                background: error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                color: error ? '#ef4444' : '#22c55e'
                            }}>
                                {error || message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                            <input
                                type="email"
                                placeholder="Email"
                                className="input-field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            {viewState === 'login' && (
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className="input-field"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            )}

                            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
                                {loading ? 'Processing...' : (viewState === 'forgot' ? 'Send Reset Link' : 'Log In')}
                            </button>
                        </form>

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            {viewState === 'login' ? (
                                <>
                                    <button onClick={() => { setViewState('forgot'); handleReset(); }} style={{ color: 'var(--text-secondary)', background: 'none' }}>
                                        Forgot Password?
                                    </button>
                                    <div>
                                        Need an account?{' '}
                                        <button onClick={() => { setViewState('signup'); handleReset(); }} style={{ color: 'var(--accent-primary)', background: 'none', fontWeight: '600' }}>
                                            Sign Up
                                        </button>
                                    </div>
                                </>
                            ) : (
                                // Forgot State
                                <button onClick={() => { setViewState('login'); handleReset(); }} style={{ color: 'var(--text-secondary)', background: 'none' }}>
                                    Back to Login
                                </button>
                            )}
                        </div>
                    </div>

                    {/* BACK SIDE: SIGNUP */}
                    <div className="back glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <div style={{ textAlign: 'center' }}>
                            <Swords size={48} color="#06b6d4" style={{ margin: '0 auto 1rem' }} />
                            <h1 className="title-gradient" style={{ fontSize: '2rem' }}>CTF-Rank</h1>
                            <p style={{ color: 'var(--text-secondary)' }}>Create Account</p>
                        </div>

                        {(error) && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                            <input
                                type="text"
                                placeholder="Username"
                                className="input-field"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                className="input-field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                className="input-field"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                                {loading ? 'Processing...' : 'Sign Up'}
                            </button>
                        </form>

                        <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Already have an account?{' '}
                            <button onClick={() => { setViewState('login'); handleReset(); }} style={{ color: 'var(--accent-primary)', background: 'none', fontWeight: '600' }}>
                                Log In
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
