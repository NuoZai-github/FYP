import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { 
    Users, Trophy, Zap, AlertTriangle, 
    ArrowRight, Sword, Shield, Loader2, Play, Info
} from 'lucide-react';

export default function TournamentRoom() {
    const { id } = useParams();
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const [tournament, setTournament] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [bracket, setBracket] = useState([]);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        fetchData();
        // Subscribe to participant changes (New player joins)
        const sub1 = supabase.channel(`tourney-p-${id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_participants', filter: `tournament_id=eq.${id}` }, () => fetchData())
            .subscribe();

        // Subscribe to tournament core changes (Status starts/ends)
        const sub2 = supabase.channel(`tourney-t-${id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${id}` }, () => fetchData())
            .subscribe();

        // Subscribe to bracket changes (Match setup, winners advancing)
        const sub3 = supabase.channel(`tourney-b-${id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_bracket', filter: `tournament_id=eq.${id}` }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(sub1);
            supabase.removeChannel(sub2);
            supabase.removeChannel(sub3);
        };
    }, [id]);

    const fetchData = async () => {
        const { data: t } = await supabase.from('tournaments').select(`*, creator:profiles!creator_id(username)`).eq('id', id).single();
        if (t) setTournament(t);

        const { data: p } = await supabase.from('tournament_participants').select('profiles(*)').eq('tournament_id', id);
        if (p) setParticipants(p.map(x => x.profiles));

        const { data: b } = await supabase.from('tournament_bracket').select('*').eq('tournament_id', id).order('round', { ascending: true }).order('slot_index', { ascending: true });
        if (b) setBracket(b);

        setLoading(false);
    };

    const handleStart = async () => {
        setStarting(true);
        const { data, error } = await supabase.rpc('start_tournament', { t_id: id });
        if (error) alert(error.message);
        setStarting(false);
    };

    const handleLeave = async () => {
        if (confirm("Are you sure you want to leave this tournament?")) {
            await supabase.from('tournament_participants').delete().eq('tournament_id', id).eq('user_id', user.id);
            navigate('/tournaments');
        }
    };

    const handleDelete = async () => {
        if (confirm("Delete this tournament? All progress will be lost.")) {
            await supabase.from('tournaments').delete().eq('id', id);
            navigate('/tournaments');
        }
    };

    const createMatchForSlot = async (bracket_id) => {
        // Logic to create a real match if it doesn't exist
        const slot = bracket.find(x => x.id === bracket_id);
        if (!slot.player1_id || !slot.player2_id) return;
        
        // Pick a random challenge
        const { data: challenges } = await supabase.from('challenges').select('id').limit(10);
        const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)].id;

        const { data: match, error } = await supabase
            .from('matches')
            .insert({
                player1_id: slot.player1_id,
                player2_id: slot.player2_id,
                challenge_id: randomChallenge
            })
            .select()
            .single();

        if (match) {
            await supabase.from('tournament_bracket').update({ match_id: match.id }).eq('id', bracket_id);
            navigate(`/match/${match.id}`);
        }
    };

    if (loading) return <div className="center-container"><Loader2 className="animate-spin" /></div>;

    const isCreator = tournament?.creator_id === user.id;

    return (
        <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            
            {/* Room Header */}
            <header className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--primary)' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>{tournament?.name}</h1>
                        <span className={`badge ${tournament?.status === 'running' ? 'badge-warn' : 'badge-success'}`}>
                            {tournament?.status.toUpperCase()}
                        </span>
                    </div>
                    <div style={{ display: 'flex', color: 'var(--text-secondary)', gap: '1.5rem', fontSize: '0.9rem' }}>
                        <span><Users size={14} /> {participants.length} / {tournament?.max_participants} Participants</span>
                        <span><Shield size={14} /> Created by {tournament?.creator?.username}</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 800 }}>INVITE CODE: {tournament?.join_code}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {isCreator ? (
                        <>
                            {tournament?.status === 'waiting' && (
                                <button className="btn-primary" onClick={handleStart} disabled={starting || participants.length < 2}>
                                    {starting ? 'SEEDING...' : <><Play size={18} /> START</>}
                                </button>
                            )}
                            <button className="btn-secondary" onClick={handleDelete} style={{ color: '#ef4444' }}>
                                <AlertTriangle size={18} /> CANCEL
                            </button>
                        </>
                    ) : (
                        <button className="btn-secondary" onClick={handleLeave}>
                            LEAVE ROOM
                        </button>
                    )}
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: tournament?.status === 'waiting' ? '1fr' : '3fr 1fr', gap: '2rem' }}>
                
                {/* LOBBY / BRACKET */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {tournament?.status === 'waiting' ? (
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users size={20} /> Waiting Lobby
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                {participants.map(p => (
                                    <div key={p.id} className="glass-panel" style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.03)' }}>
                                        <div style={{ width: '40px', height: '40px', background: 'var(--primary-gradient)', borderRadius: '50%', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                            {p.username[0]}
                                        </div>
                                        <div style={{ fontWeight: 600 }}>{p.username}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Operator Ready</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
                             <h2 style={{ fontSize: '1.2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Trophy size={20} /> Tournament Bracket
                            </h2>
                            <div style={{ display: 'flex', gap: '4rem', paddingBottom: '2rem' }}>
                                {[1, 2, 3].map(round => (
                                    <div key={round} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1, minWidth: '250px', justifyContent: 'space-around' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'center', marginBottom: '1rem' }}>
                                            {round === 1 ? 'Quarter-Finals' : round === 2 ? 'Semi-Finals' : 'Finals'}
                                        </div>
                                        {bracket.filter(s => s.round === round).map(slot => (
                                            <div key={slot.id} className={`glass-panel ${slot.winner_id ? 'border-primary' : ''}`} style={{ padding: 0, overflow: 'hidden' }}>
                                                {/* Player 1 */}
                                                <div style={{ padding: '0.8rem 1rem', background: slot.winner_id === slot.player1_id ? 'rgba(16, 185, 129, 0.1)' : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <span style={{ fontSize: '0.9rem', color: slot.player1_id ? '#fff' : 'var(--text-secondary)' }}>
                                                        {participants.find(p => p.id === slot.player1_id)?.username || (slot.round > 1 ? 'TBD' : 'EMPTY')}
                                                    </span>
                                                    {slot.winner_id === slot.player1_id && <Zap size={14} color="#10b981" />}
                                                </div>
                                                {/* Player 2 */}
                                                <div style={{ padding: '0.8rem 1rem', background: slot.winner_id === slot.player2_id ? 'rgba(16, 185, 129, 0.1)' : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.9rem', color: slot.player2_id ? '#fff' : 'var(--text-secondary)' }}>
                                                        {participants.find(p => p.id === slot.player2_id)?.username || (slot.round > 1 ? 'TBD' : 'BYE')}
                                                    </span>
                                                    {slot.winner_id === slot.player2_id && <Zap size={14} color="#10b981" />}
                                                </div>
                                                {/* Action Button */}
                                                {(slot.player1_id === user.id || slot.player2_id === user.id) && !slot.winner_id && (
                                                    <button 
                                                        className="btn-primary" 
                                                        style={{ width: '100%', borderRadius: 0, padding: '0.4rem', fontSize: '0.8rem' }}
                                                        onClick={() => slot.match_id ? navigate(`/match/${slot.match_id}`) : createMatchForSlot(slot.id)}
                                                    >
                                                        <Sword size={14} /> BATTLE
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* SIDEBAR: Leaderboard or Activity */}
                {tournament?.status !== 'waiting' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Room Intelligence</h3>
                            <div style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <Info size={16} color="var(--primary)" />
                                    <span>Matches for this round are active. Winners will advance automatically.</span>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px' }}>
                                    <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>TOURNAMENT CODE</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>{tournament?.join_code}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
