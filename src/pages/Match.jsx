import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { 
    Terminal, Shield, AlertCircle, Timer, 
    Zap, Lock, Cpu, Activity, Globe, Info
} from 'lucide-react';

export default function Match() {
    const { id } = useParams();
    const { user, profile } = useAuth();
    const [match, setMatch] = useState(null);
    const [challenge, setChallenge] = useState(null);
    const [opponent, setOpponent] = useState(null);
    const [flag, setFlag] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [terminalOutput, setTerminalOutput] = useState([
        { text: 'SYSTEM INITIALIZED...', type: 'info' },
        { text: 'ESTABLISHING SECURE CONNECTION...', type: 'info' },
    ]);
    const navigate = useNavigate();
    const terminalEndRef = useRef(null);

    useEffect(() => {
        fetchMatchData();

        // REAL-TIME SUBSCRIPTION
        const channel = supabase
            .channel(`match:${id}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'matches', 
                filter: `id=eq.${id}` 
            }, (payload) => {
                if (payload.new.winner_id) {
                    addTerminalEntry(`MATCH TERMINATED. WINNER_ID DETECTED.`, 'warning');
                    setTimeout(() => navigate(`/result/${id}`), 1000);
                }
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [id]);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [terminalOutput]);

    const addTerminalEntry = (text, type = 'info') => {
        setTerminalOutput(prev => [...prev, { text: `[${new Date().toLocaleTimeString()}] ${text}`, type }]);
    };

    const fetchMatchData = async () => {
        try {
            const { data: matchData } = await supabase
                .from('matches')
                .select('*')
                .eq('id', id)
                .single();

            if (matchData) {
                setMatch(matchData);
                const opponentId = matchData.player1_id === user.id ? matchData.player2_id : matchData.player1_id;
                
                // Fetch Opponent
                const { data: oppData } = await supabase.from('profiles').select('username').eq('id', opponentId).single();
                if (oppData) setOpponent(oppData);

                // Fetch Challenge
                const { data: challengeData } = await supabase
                    .from('challenges')
                    .select('title, description, category, difficulty')
                    .eq('id', matchData.challenge_id)
                    .single();
                if (challengeData) setChallenge(challengeData);
                
                addTerminalEntry('TARGET ACQUIRED: ' + (challengeData?.title || 'Unknown'), 'success');
                addTerminalEntry('OPPONENT IDENTIFIED: ' + (oppData?.username || 'Unknown'), 'warning');
            }
        } catch (err) {
            addTerminalEntry('ERROR: FAILED TO FETCH MISSION DATA', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        addTerminalEntry(`ATTEMPTING FLAG SUBMISSION...`, 'info');

        const { data, error } = await supabase.rpc('submit_flag', {
            match_id_input: id,
            flag_submission: flag
        });

        if (data?.success) {
            addTerminalEntry('ACCESS GRANTED. FLAG AUTHENTICATED.', 'success');
            setTimeout(() => navigate(`/result/${id}`), 800);
        } else {
            addTerminalEntry(`ACCESS DENIED: ${data?.message || 'INVALID FLAG'}`, 'error');
            setMessage(data?.message || 'Incorrect flag.');
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="center-container">
            <Cpu className="animate-spin" size={48} color="var(--primary)" />
        </div>
    );

    return (
        <div className="page-container" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', maxWidth: '1400px', margin: '0 auto', height: 'calc(100vh - 120px)' }}>
            
            {/* Main Terminal Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{challenge?.title}</h2>
                            <span className="badge" style={{ background: challenge?.difficulty === 'Hard' ? '#f43f5e20' : '#10b98120', color: challenge?.difficulty === 'Hard' ? '#f43f5e' : '#10b981' }}>
                                {challenge?.difficulty}
                            </span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Deploying environment: {challenge?.category} Sector</p>
                    </div>
                </div>

                <div className="glass-panel" style={{ flex: 1, padding: '2rem', overflowY: 'auto', background: 'rgba(2, 6, 23, 0.4)' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Info size={16} /> Mission Intelligence
                    </h3>
                    <div style={{ lineHeight: '1.6', fontSize: '1.05rem', color: '#e2e8f0' }}>
                        {challenge?.description}
                    </div>
                    
                    <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input 
                                    className="input-field" placeholder="Enter Flag: CTF{...}"
                                    value={flag} onChange={(e) => setFlag(e.target.value)}
                                    style={{ paddingLeft: '3rem', marginBottom: 0, background: 'rgba(0,0,0,0.5)' }}
                                    disabled={submitting}
                                />
                            </div>
                            <button className="btn-primary" disabled={submitting} style={{ padding: '0 2rem' }}>
                                {submitting ? 'VALIDATING...' : 'SUBMIT'}
                            </button>
                        </form>
                        {message && <div style={{ marginTop: '1rem', color: '#f43f5e', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={14} /> {message}
                        </div>}
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>Operator Tracking</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', background: 'var(--primary-gradient)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{profile?.username ? profile.username[0] : 'U'}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{profile?.username} (YOU)</div>
                                <div style={{ fontSize: '0.75rem', color: '#10b981' }}><Activity size={10} /> ACTIVE</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{opponent?.username ? opponent.username[0] : '?'}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{opponent?.username || 'Finding...'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}><Globe size={10} /> STREAMING...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', background: '#020617' }}>
                    <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Terminal size={14} /> Console Logs
                    </h3>
                    <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>
                        {terminalOutput.map((log, i) => (
                            <div key={i} style={{ marginBottom: '0.4rem', color: log.type === 'error' ? '#f43f5e' : log.type === 'success' ? '#10b981' : log.type === 'warning' ? '#fbbf24' : '#94a3b8' }}>
                                {log.text}
                            </div>
                        ))}
                        <div ref={terminalEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
}
