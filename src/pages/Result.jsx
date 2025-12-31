import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Frown, ArrowRight, ShieldAlert, BadgeCheck, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Result() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [match, setMatch] = useState(null);
    const [isWinner, setIsWinner] = useState(null);
    const [pointsChange, setPointsChange] = useState(0);

    useEffect(() => {
        const fetchResult = async () => {
            // Fetch match details including winner and challenge info
            const { data, error } = await supabase
                .from('matches')
                .select(`
                    *,
                    winner:winner_id(username),
                    challenge:challenges(title, difficulty)
                `)
                .eq('id', id)
                .single();

            if (data) {
                setMatch(data);
                const win = data.winner_id === user.id;
                setIsWinner(win);

                // Set points display (mock update logic for visual, ideally fetched from DB diff)
                // Assuming simple +100 / -50 logic or utilizing the simple +1/-1 from DB
                setPointsChange(win ? 100 : 25);

                if (win) {
                    launchConfetti();
                }
            }
        };
        fetchResult();
    }, [id, user]);

    const launchConfetti = () => {
        var duration = 3 * 1000;
        var animationEnd = Date.now() + duration;
        var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        var random = function (min, max) {
            return Math.random() * (max - min) + min;
        };

        var interval = setInterval(function () {
            var timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            var particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    };

    if (!match || isWinner === null) return (
        <div className="center-container">
            <div className="animate-spin" style={{ color: '#8b5cf6' }}>
                <Zap size={48} />
            </div>
        </div>
    );

    return (
        <div className="page-container center-container" style={{ overflow: 'hidden' }}>
            {/* Background Ambience */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1,
                background: isWinner
                    ? 'radial-gradient(circle at center, rgba(34, 197, 94, 0.15), transparent 70%)'
                    : 'radial-gradient(circle at center, rgba(239, 68, 68, 0.15), transparent 70%)'
            }} />

            <div className="glass-panel animate-fade-in-up"
                style={{
                    textAlign: 'center', padding: '4rem 3rem', maxWidth: '600px', width: '100%',
                    borderTop: `4px solid ${isWinner ? '#22c55e' : '#ef4444'}`,
                    boxShadow: isWinner ? '0 0 50px rgba(34, 197, 94, 0.2)' : '0 0 50px rgba(239, 68, 68, 0.2)'
                }}
            >
                {isWinner ? (
                    /* VICTORY STATE */
                    <>
                        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                            <div style={{ position: 'relative' }}>
                                <Trophy size={100} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.6))' }} />
                                <div className="animate-pulse" style={{ position: 'absolute', top: -10, right: -10 }}>
                                    <BadgeCheck size={40} color="#22c55e" fill="#fff" />
                                </div>
                            </div>
                        </div>

                        <h1 style={{
                            fontSize: '4rem', fontWeight: 900, lineHeight: 1, marginBottom: '0.5rem',
                            background: 'linear-gradient(to right, #22c55e, #fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            textTransform: 'uppercase', letterSpacing: '-0.02em'
                        }}>
                            Victory
                        </h1>
                        <p style={{ color: '#86efac', fontSize: '1.25rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '3rem' }}>
                            Mission Accomplished
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '3rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Challenge</div>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#fff' }}>{match.challenge?.title}</div>
                            </div>
                            <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                <div style={{ fontSize: '0.9rem', color: '#86efac' }}>Rank Points</div>
                                <div style={{ fontWeight: 800, fontSize: '2rem', color: '#22c55e' }}>+{pointsChange}</div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* DEFEAT STATE */
                    <>
                        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                            <div style={{ position: 'relative' }}>
                                <ShieldAlert size={100} color="#ef4444" style={{ filter: 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.4))' }} />
                            </div>
                        </div>

                        <h1 style={{
                            fontSize: '4rem', fontWeight: 900, lineHeight: 1, marginBottom: '0.5rem',
                            color: '#ef4444',
                            textTransform: 'uppercase', letterSpacing: '-0.02em'
                        }}>
                            Defeat
                        </h1>
                        <p style={{ color: '#fca5a5', fontSize: '1.25rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '3rem' }}>
                            System Compromised
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '3rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Winner</div>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#fff' }}>{match.winner?.username || 'Opponent'}</div>
                            </div>
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <div style={{ fontSize: '0.9rem', color: '#fca5a5' }}>Rank Points</div>
                                <div style={{ fontWeight: 800, fontSize: '2rem', color: '#ef4444' }}>-50</div>
                            </div>
                        </div>
                    </>
                )}

                <button
                    className="btn-primary"
                    onClick={() => navigate('/lobby')}
                    style={{
                        width: '100%', padding: '1.25rem', fontSize: '1.1rem',
                        background: isWinner ? 'var(--accent-primary)' : '#334155'
                    }}
                >
                    Return to Lobby <ArrowRight size={20} style={{ marginLeft: '0.5rem' }} />
                </button>
            </div>
        </div>
    );
}
