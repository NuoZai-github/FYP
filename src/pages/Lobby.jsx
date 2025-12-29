import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Swords, Loader2 } from 'lucide-react';

export default function Lobby() {
    const [status, setStatus] = useState('idle'); // idle, queuing, matched
    const [pollingId, setPollingId] = useState(null);
    const navigate = useNavigate();

    const handleJoinMatch = async () => {
        setStatus('queuing');
        try {
            const { data, error } = await supabase.rpc('join_match');
            if (error) throw error;

            if (data.status === 'matched') {
                setStatus('matched');
                navigate(`/match/${data.match_id}`);
            } else {
                // Start polling
                startPolling();
            }
        } catch (err) {
            console.error("Join error:", err);
            setStatus('idle');
            alert("Failed to join queue: " + err.message);
        }
    };

    const startPolling = () => {
        const id = setInterval(async () => {
            // Check if I am in an active match
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('matches')
                .select('id')
                .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
                .is('winner_id', null) // Only active matches
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (data) {
                clearInterval(id);
                setStatus('matched');
                navigate(`/match/${data.id}`);
            }
        }, 3000); // 3 seconds
        setPollingId(id);
    };

    const handleCancel = async () => {
        if (pollingId) clearInterval(pollingId);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('match_queue').delete().eq('user_id', user.id);
        }
        setStatus('idle');
    };

    useEffect(() => {
        return () => {
            if (pollingId) clearInterval(pollingId);
        };
    }, [pollingId]);

    return (
        <div className="page-container center-container">
            <div className="glass-panel match-card" style={{ maxWidth: '600px', width: '100%' }}>

                {status === 'idle' && (
                    <>
                        <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '2rem', borderRadius: '50%', marginBottom: '1rem' }}>
                            <Swords size={64} className="text-accent-primary" style={{ color: '#8b5cf6' }} />
                        </div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Ready to Duel?</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                            Enter the queue to be matched with an opponent of similar rank.
                        </p>
                        <button className="btn-primary" onClick={handleJoinMatch} style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}>
                            Start Ranked Match
                        </button>
                    </>
                )}

                {status === 'queuing' && (
                    <>
                        <div className="animate-spin" style={{ marginBottom: '1rem' }}>
                            <Loader2 size={64} className="text-accent-primary" style={{ color: '#06b6d4', animation: 'spin 1s linear infinite' }} />
                            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                        </div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Searching for Opponent...</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                            Please wait while we find a worthy challenger.
                        </p>
                        <button className="btn-secondary" onClick={handleCancel}>
                            Cancel
                        </button>
                    </>
                )}

            </div>
        </div>
    );
}
