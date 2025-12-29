import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Timer, Send, AlertTriangle } from 'lucide-react';

export default function Match() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [match, setMatch] = useState(null);
    const [challenge, setChallenge] = useState(null);
    const [opponent, setOpponent] = useState(null);
    const [flag, setFlag] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchMatchDetails();

        // Subscribe to match updates (for opponent win)
        const subscription = supabase
            .channel(`match-${id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'matches',
                filter: `id=eq.${id}`
            }, (payload) => {
                if (payload.new.winner_id) {
                    navigate(`/result/${id}`);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [id]);

    const fetchMatchDetails = async () => {
        const { data: matchData, error: matchError } = await supabase
            .from('matches')
            .select('*')
            .eq('id', id)
            .single();

        if (matchError || !matchData) {
            // Handle error (redirect?)
            console.error("Match load error", matchError);
            return;
        }

        // Check if match ended
        if (matchData.winner_id) {
            navigate(`/result/${id}`);
            return;
        }

        setMatch(matchData);

        // Fetch Challenge
        const { data: challengeData } = await supabase
            .from('challenges')
            .select('title, description') // Secure selection
            .eq('id', matchData.challenge_id)
            .single();

        setChallenge(challengeData);

        // Fetch Opponent
        const opponentId = matchData.player1_id === user.id ? matchData.player2_id : matchData.player1_id;
        const { data: oppData } = await supabase.from('profiles').select('username, rank_points').eq('id', opponentId).single();
        setOpponent(oppData);
    };

    // Timer logic
    const [elapsed, setElapsed] = useState('00:00');
    useEffect(() => {
        if (!match?.start_time) return;
        const interval = setInterval(() => {
            const start = new Date(match.start_time).getTime();
            const now = new Date().getTime();
            const diff = Math.floor((now - start) / 1000);

            if (diff >= 0) {
                const m = Math.floor(diff / 60).toString().padStart(2, '0');
                const s = (diff % 60).toString().padStart(2, '0');
                setElapsed(`${m}:${s}`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [match]);

    const submitFlag = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const { data, error } = await supabase.rpc('submit_flag', {
                match_id_input: id,
                flag_submission: flag
            });

            if (error) throw error;

            if (data.success) {
                navigate(`/result/${id}`);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!match || !challenge) return <div className="center-container">Loading...</div>;

    return (
        <div className="page-container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 className="title-gradient" style={{ fontSize: '1.5rem' }}>Match in Progress</h2>
                    {opponent && <div style={{ color: 'var(--text-secondary)' }}>Vs. {opponent.username} ({opponent.rank_points} pts)</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold' }}>
                    <Timer size={20} />
                    <span>{elapsed}</span>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff' }}>{challenge.title}</h3>
                    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                        {challenge.description}
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Submit Flag</h3>

                    <form onSubmit={submitFlag} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter flag here..."
                            value={flag}
                            onChange={(e) => setFlag(e.target.value)}
                        />

                        {error && (
                            <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <AlertTriangle size={16} />
                                {error}
                            </div>
                        )}

                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Flag'} <Send size={18} />
                        </button>
                    </form>

                    <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <p>Format example: CTF{'{secret_code}'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
