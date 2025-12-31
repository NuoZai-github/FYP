import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Swords } from 'lucide-react';

export default function Login() {
    // 'login', 'signup', 'forgot'
    const [viewState, setViewState] = useState('login');
    // Track what should be displayed on the back side ('signup' or 'forgot')
    const [backView, setBackView] = useState('signup');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn, signUp, resetPassword, signInWithUsername } = useAuth();
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
                    navigate('/lobby');
                }
            } else {
                // Login with Username
                const { error } = await signInWithUsername({ username, password });
                if (error) throw error;
                navigate('/lobby');
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

    const isFlipped = viewState === 'signup' || viewState === 'forgot';

    return (
        <div className="center-container" style={{ perspective: '1000px' }}>
            <div className={`flip-container ${isFlipped ? 'hover' : ''}`} style={{ width: '100%', maxWidth: '400px', height: '540px', position: 'relative' }}>
                <div className="flipper" style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', height: '100%' }}>

                    {/* FRONT SIDE: LOGIN */}
                    <div className="front glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', backfaceVisibility: 'hidden', justifyContent: 'center', padding: '0 3rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <Swords size={56} color="#8b5cf6" style={{ margin: '0 auto 1rem', filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))' }} />
                            <h1 className="title-gradient" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>CTF-Rank</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                                Welcome back, Operator
                            </p>
                        </div>

                        {/* Error/Message Area - Only show if we are effectively in login mode to avoid showing wrong errors? 
                            Actually errors are cleared on switch. So safe to show. */}
                        {(error || message) && (
                            <div style={{
                                marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem',
                                background: error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                color: error ? '#ef4444' : '#22c55e',
                                border: `1px solid ${error ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
                            }}>
                                {error || message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <input
                                type="text"
                                placeholder="Username"
                                className="input-field"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
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

                            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.9rem' }}>
                                {loading ? 'Processing...' : 'Log In'}
                            </button>
                        </form>

                        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <button onClick={() => { setViewState('forgot'); setBackView('forgot'); setTimeout(handleReset, 300); }} style={{ color: 'var(--text-secondary)', background: 'none' }}>
                                Forgot Password?
                            </button>
                            <div>
                                Need an account?{' '}
                                <button onClick={() => { setViewState('signup'); setBackView('signup'); setTimeout(handleReset, 300); }} style={{ color: 'var(--accent-primary)', background: 'none', fontWeight: '600' }}>
                                    Sign Up
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* BACK SIDE: SIGNUP OR FORGOT */}
                    <div className="back glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', justifyContent: 'center', padding: '0 3rem' }}>

                        {backView === 'signup' ? (
                            /* SIGN UP CONTENT */
                            <>
                                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                    <Swords size={56} color="#06b6d4" style={{ margin: '0 auto 1rem', filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))' }} />
                                    <h1 className="title-gradient" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>CTF-Rank</h1>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Create Account</p>
                                </div>

                                {(error) && (
                                    <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
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
                                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', padding: '0.9rem' }}>
                                        {loading ? 'Processing...' : 'Sign Up'}
                                    </button>
                                </form>

                                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Already have an account?{' '}
                                    <button onClick={() => { setViewState('login'); setTimeout(handleReset, 300); }} style={{ color: 'var(--accent-primary)', background: 'none', fontWeight: '600' }}>
                                        Log In
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* FORGOT PASSWORD CONTENT */
                            <>
                                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                    <Swords size={56} color="#8b5cf6" style={{ margin: '0 auto 1rem', filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))' }} />
                                    <h1 className="title-gradient" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>CTF-Rank</h1>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Reset Password</p>
                                </div>

                                {(error || message) && (
                                    <div style={{
                                        marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem',
                                        background: error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                        color: error ? '#ef4444' : '#22c55e',
                                        border: `1px solid ${error ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
                                    }}>
                                        {error || message}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                        Enter your email address and we'll send you a link to reset your password.
                                    </p>
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        className="input-field"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.9rem' }}>
                                        {loading ? 'Processing...' : 'Send Reset Link'}
                                    </button>
                                </form>

                                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <button onClick={() => { setViewState('login'); setTimeout(handleReset, 300); }} style={{ color: 'var(--text-secondary)', background: 'none' }}>
                                        Back to Login
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
