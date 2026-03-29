import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
    Trophy, Users, Plus, Hash, 
    ArrowRight, Loader2, Sparkles, Sword
} from 'lucide-react';

export default function Tournaments() {
    const { user, profile } = useAuth();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [newTourney, setNewTourney] = useState({ name: '', max: 8 });
    const [joinCode, setJoinCode] = useState('');
    const [selectedRole, setSelectedRole] = useState('player'); // player or spectator
    const navigate = useNavigate();

    useEffect(() => {
        fetchTournaments();
        // Subscribe to NEW tournaments or status changes
        const channel = supabase
            .channel('tournaments-list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, () => {
                fetchTournaments();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchTournaments = async () => {
        const { data, error } = await supabase
            .from('tournaments')
            .select(`
                *,
                creator:profiles!creator_id(username)
            `)
            .order('created_at', { ascending: false });
        
        if (data) setTournaments(data);
        setLoading(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data, error } = await supabase
            .from('tournaments')
            .insert({
                name: newTourney.name,
                max_participants: newTourney.max,
                creator_id: user.id,
                join_code: code
            })
            .select()
            .single();

        if (data) {
            // Auto join creator
            await supabase.from('tournament_participants').insert({ tournament_id: data.id, user_id: user.id });
            navigate(`/tournament/${data.id}`);
        } else {
            alert(error.message);
        }
    };

    const handleJoinByCode = async (e) => {
        e.preventDefault();
        const { data: tourney, error: tErr } = await supabase
            .from('tournaments')
            .select('id, status')
            .eq('join_code', joinCode.toUpperCase())
            .single();

        if (tourney) {
            if (tourney.status !== 'waiting') {
                alert("Tournament already started or ended.");
                return;
            }
            const { error: jErr } = await supabase
                .from('tournament_participants')
                .insert({ tournament_id: tourney.id, user_id: user.id, role: selectedRole });
                
            if (!jErr || jErr.code === '23505') { // Success or already joined
                navigate(`/tournament/${tourney.id}`);
            } else {
                alert(jErr.message);
            }
        } else {
            alert("Invalid Join Code");
        }
    };

    return (
        <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                        Tournaments
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Compete for glory in organized brackets.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-secondary" onClick={() => setIsJoining(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Hash size={18} /> Join with Code
                    </button>
                    <button className="btn-primary" onClick={() => setIsCreating(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Create Room
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="center-container"><Loader2 className="animate-spin" /></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {tournaments.length === 0 && (
                        <div className="glass-panel" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem' }}>
                            <Trophy size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem', opacity: 0.3 }} />
                            <h3>No active tournaments</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>Create one to start the competition.</p>
                        </div>
                    )}
                    {tournaments.map(t => (
                        <div key={t.id} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ 
                                    padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800,
                                    background: t.status === 'running' ? '#f43f5e20' : '#10b98120',
                                    color: t.status === 'running' ? '#f43f5e' : '#10b981'
                                }}>
                                    {t.status.toUpperCase()}
                                </span>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Users size={14} /> {t.max_participants} Players
                                </div>
                            </div>
                            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{t.name}</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                Hosted by <strong>{t.creator?.username}</strong>
                            </p>
                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', flex: '0 0 auto' }}>
                                    #{t.join_code}
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem', flex: 1 }}>
                                    <button
                                        className="btn-secondary"
                                        onClick={async () => {
                                            try {
                                                const { data: tourney } = await supabase.from('tournament_participants').select('user_id').eq('tournament_id', t.id).eq('user_id', user.id).single();
                                                if (!tourney) {
                                                    await supabase.from('tournament_participants').insert({ tournament_id: t.id, user_id: user.id, role: 'spectator' });
                                                }
                                            } catch (err) { }
                                            navigate(`/tournament/${t.id}`);
                                        }}
                                        style={{ padding: '0.6rem', fontSize: '0.75rem', flex: '0 0 auto' }}
                                        title="Watch as Spectator"
                                    >
                                        Watch
                                    </button>
                                    <button
                                        className="btn-primary"
                                        onClick={async () => {
                                            try {
                                                const { data: tourney } = await supabase.from('tournament_participants').select('user_id').eq('tournament_id', t.id).eq('user_id', user.id).single();
                                                if (!tourney) {
                                                    await supabase.from('tournament_participants').insert({ tournament_id: t.id, user_id: user.id, role: 'player' });
                                                }
                                            } catch (err) { }
                                            navigate(`/tournament/${t.id}`);
                                        }}
                                        style={{ flex: 1, padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                                    >
                                        Compete <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isCreating && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="glass-panel" style={{ maxWidth: '450px', width: '100%', padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Sparkles color="var(--primary)" /> Organize Tournament
                        </h2>
                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Tournament Name</label>
                                <input 
                                    className="input-field" placeholder="e.g. Sibu Finals 2024"
                                    required value={newTourney.name} 
                                    onChange={e => setNewTourney({...newTourney, name: e.target.value})}
                                />
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Max Participants</label>
                                <select 
                                    className="input-field" 
                                    style={{ background: 'rgba(0,0,0,0.5)' }}
                                    value={newTourney.max}
                                    onChange={e => setNewTourney({...newTourney, max: parseInt(e.target.value)})}
                                >
                                    <option value={4}>4 Players</option>
                                    <option value={8}>8 Players (Standard)</option>
                                    <option value={16}>16 Players</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsCreating(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Deploy Room</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isJoining && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Sword color="var(--primary)" /> Enter Warzone
                        </h2>
                        <form onSubmit={handleJoinByCode}>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Invitation Code</label>
                                <input 
                                    className="input-field" placeholder="ABCDEF"
                                    style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}
                                    required maxLength={6}
                                    value={joinCode} onChange={e => setJoinCode(e.target.value)}
                                />
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Join As</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <button 
                                        type="button" 
                                        className={selectedRole === 'player' ? 'btn-primary' : 'btn-secondary'}
                                        onClick={() => setSelectedRole('player')}
                                        style={{ padding: '0.5rem' }}
                                    >
                                        Player
                                    </button>
                                    <button 
                                        type="button" 
                                        className={selectedRole === 'spectator' ? 'btn-primary' : 'btn-secondary'}
                                        onClick={() => setSelectedRole('spectator')}
                                        style={{ padding: '0.5rem' }}
                                    >
                                        Spectator
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem' }}>Join Tournament</button>
                            <button type="button" className="btn-secondary" style={{ width: '100%', padding: '1rem', marginTop: '1rem' }} onClick={() => setIsJoining(false)}>Cancel</button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
