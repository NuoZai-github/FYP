import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Frown, ArrowRight } from 'lucide-react';

export default function Result() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [match, setMatch] = useState(null);
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        async function fetchResult() {
            const { data, error } = await supabase
                .from('matches')
                .select('*, winner:winner_id(username)')
                .eq('id', id)
                .single();

            if (data) {
                setMatch(data);
                if (data.winner_id === user.id) {
                    setWinner(true);
                } else {
                    setWinner(false);
                }
            }
        }
        fetchResult();
    }, [id, user]);

    if (!match) return <div className="center-container">Loading result...</div>;

    return (
        <div className="center-container">
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', maxWidth: '500px', width: '100%' }}>

                {winner ? (
                    <>
                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '2rem', borderRadius: '50%', display: 'inline-flex', marginBottom: '1.5rem' }}>
                            <Trophy size={64} className="text-success" style={{ color: '#22c55e' }} />
                        </div>
                        <h1 className="title-gradient" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>VICTORY</h1>
                        <p style={{ fontSize: '1.2rem', color: '#fff' }}>+1 Rank Point</p>
                    </>
                ) : (
                    <>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '2rem', borderRadius: '50%', display: 'inline-flex', marginBottom: '1.5rem' }}>
                            <Frown size={64} className="text-danger" style={{ color: '#ef4444' }} />
                        </div>
                        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', color: '#ef4444', fontWeight: '800' }}>DEFEAT</h1>
                        <p style={{ fontSize: '1.2rem', color: '#fff' }}>-1 Rank Point</p>
                        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
                            Winner: {match.winner?.username || 'Opponent'}
                        </p>
                    </>
                )}

                <div style={{ marginTop: '3rem' }}>
                    <button className="btn-primary" onClick={() => navigate('/')}>
                        Back to Lobby <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
