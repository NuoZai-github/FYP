import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Swords, Loader2, Trophy, Clock, Target,
    Shield, Activity, ChevronRight, User, Bell, Star, Zap
} from 'lucide-react';

export default function Lobby() {
    const { user, profile } = useAuth();
    const [status, setStatus] = useState('idle'); // idle, queuing, matched
    const [pollingId, setPollingId] = useState(null);
    const [topPlayers, setTopPlayers] = useState([]);
    const [recentMatches, setRecentMatches] = useState([]);
    const [systemNews, setSystemNews] = useState([]);
    const [missions, setMissions] = useState([]);
    const [userStats, setUserStats] = useState({ total_matches: 0, total_wins: 0 });
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
        return () => {
            if (pollingId) clearInterval(pollingId);
        };
    }, [user]);

    const fetchDashboardData = async () => {
        // 1. Fetch Top 5 Leaderboard
        const { data: leaders } = await supabase
            .from('profiles')
            .select('username, rank_points')
            .order('rank_points', { ascending: false })
            .limit(5);
        if (leaders) setTopPlayers(leaders);

        // 2. Fetch Recent Matches (Completed)
        const { data: matches } = await supabase
            .from('matches')
            .select(`
                id, 
                winner_id, 
                created_at, 
                challenge:challenges(title)
            `)
            .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
            .not('winner_id', 'is', null) // Only completed matches
            .order('created_at', { ascending: false })
            .limit(5);
        if (matches) setRecentMatches(matches);

        // 3. Fetch Real System News
        const { data: news } = await supabase
            .from('system_news')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3);
        if (news) setSystemNews(news);

        // 4. Fetch User Stats (Total wins/matches)
        const { data: stats } = await supabase
            .from('user_stats')
            .select('*')
            .eq('id', user.id)
            .single();
        if (stats) setUserStats(stats);

        // 5. Fetch Daily Missions & Progress
        const { data: userMissions } = await supabase
            .from('missions')
            .select('*, user_mission_progress!inner(*) ')
            .eq('user_mission_progress.user_id', user.id);
        
        // Fallback: If no progress found, fetch all mission definitions
        if (!userMissions || userMissions.length === 0) {
            const { data: allMissions } = await supabase.from('missions').select('*').limit(2);
            if (allMissions) setMissions(allMissions.map(m => ({ ...m, user_mission_progress: [{ current_count: 0, is_completed: false }] })));
        } else {
            setMissions(userMissions);
        }
    };

    const handleJoinMatch = async () => {
        setStatus('queuing');
        try {
            const { data, error } = await supabase.rpc('join_match');
            if (error) throw error;

            if (data.status === 'matched') {
                setStatus('matched');
                navigate(`/match/${data.match_id}`);
            } else {
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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('matches')
                .select('id')
                .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
                .is('winner_id', null)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (data) {
                clearInterval(id);
                setStatus('matched');
                navigate(`/match/${data.id}`);
            }
        }, 3000);
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

    // Calculate rank tier based on points
    const getRankInfo = (points) => {
        if (points < 100) return { name: 'Bronze', color: '#cd7f32', next: 100, progress: (points / 100) * 100 };
        if (points < 300) return { name: 'Silver', color: '#94a3b8', next: 300, progress: ((points - 100) / 200) * 100 };
        if (points < 600) return { name: 'Gold', color: '#fbbf24', next: 600, progress: ((points - 300) / 300) * 100 };
        if (points < 1000) return { name: 'Platinum', color: '#22d3ee', next: 1000, progress: ((points - 600) / 400) * 100 };
        return { name: 'Diamond', color: '#a78bfa', next: 2000, progress: 100 };
    };

    const rankInfo = getRankInfo(profile?.rank_points || 0);

    return (
        <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>

            {/* Lobby Header */}
            <div className="lobby-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ 
                        width: '64px', height: '64px', borderRadius: '16px', 
                        background: 'var(--primary-gradient)', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', 
                        fontWeight: 800, color: 'white', border: '2px solid rgba(255,255,255,0.1)'
                    }}>
                        {profile?.username ? profile.username[0] : '?'}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Welcome back, {profile?.username}</h1>
                            <span style={{ 
                                background: 'rgba(236, 72, 153, 0.2)', color: '#ec4899', 
                                padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', 
                                fontWeight: 700, border: '1px solid rgba(236, 72, 153, 0.3)'
                            }}>
                                LVL {Math.floor((profile?.xp || 0) / 1000) + 1}
                            </span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: rankInfo.color, fontWeight: 700 }}>{rankInfo.name}</span> 
                            • {profile?.rank_points} RP 
                            • <span style={{ color: '#8b5cf6' }}>{profile?.xp || 0} XP</span>
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="glass-panel" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Bell size={20} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />
                        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Trophy size={20} color={rankInfo.color} />
                            <div>
                                <div style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>Current Rank</div>
                                <div style={{ fontWeight: 'bold' }}>{rankInfo.name}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* BATTLE CARD (Queue Action) */}
                    <div className="glass-panel" style={{
                        padding: '3rem', position: 'relative', overflow: 'hidden',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(139, 92, 246, 0.3)', minHeight: '300px',
                        background: 'linear-gradient(145deg, rgba(139, 92, 246, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)'
                    }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, background: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 20px)' }} />

                        {status === 'idle' ? (
                            <>
                                <Swords size={64} style={{ color: '#8b5cf6', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 15px rgba(139,92,246,0.5))' }} />
                                <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', zIndex: 1 }}>Competitive Matchmaking</h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', zIndex: 1, maxWidth: '400px', textAlign: 'center' }}>
                                    Find an opponent of similar skill. Capture the flag to win.
                                </p>
                                <button
                                    onClick={handleJoinMatch}
                                    className="btn-primary"
                                    style={{
                                        padding: '1rem 3rem', fontSize: '1.2rem', borderRadius: '100px',
                                        boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)', zIndex: 1
                                    }}
                                >
                                    Start
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="animate-spin" style={{ marginBottom: '1.5rem', zIndex: 1 }}>
                                    <Loader2 size={64} style={{ color: '#06b6d4' }} />
                                </div>
                                <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', zIndex: 1 }}>Scanning Network...</h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', zIndex: 1 }}>
                                    Locating vulnerabilities (and opponents)..
                                </p>
                                <button
                                    onClick={handleCancel}
                                    className="btn-secondary"
                                    style={{ padding: '0.8rem 2rem', zIndex: 1 }}
                                >
                                    Abort
                                </button>
                            </>
                        )}
                    </div>

                    {/* DAILY MISSIONS ROW */}
                    <div className="mission-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {missions.length === 0 ? (
                            <div className="glass-panel" style={{ padding: '1.5rem', color: 'var(--text-secondary)' }}>No Missions available.</div>
                        ) : missions.slice(0, 2).map((m, idx) => {
                            const progress = m.user_mission_progress?.[0] || { current_count: 0, is_completed: false };
                            const isDone = progress.is_completed;
                            const pct = Math.min(100, (progress.current_count / m.goal_count) * 100);
                            
                            return (
                                <div key={m.id} className="glass-panel" style={{ 
                                    padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', 
                                    borderLeft: `4px solid ${isDone ? '#10b981' : idx === 0 ? '#f43f5e' : '#8b5cf6'}`,
                                    opacity: isDone ? 0.7 : 1
                                }}>
                                    {idx === 0 ? <Target size={32} color="#f43f5e" /> : <Star size={32} color="#10b981" />}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{idx === 0 ? 'DAILY OBJECTIVE' : 'OPERATIONAL TASK'}</span>
                                            {isDone && <Check size={14} color="#10b981" />}
                                        </div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{m.title}</div>
                                        <div style={{ marginTop: '0.5rem', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: isDone ? '#10b981' : idx === 0 ? '#f43f5e' : '#8b5cf6' }} />
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                                            {m.description} ({progress.current_count}/{m.goal_count})
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* RECENT ACTIVITY */}
                    <div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Activity size={20} /> Recent Operations
                        </h3>
                        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                            {recentMatches.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No recent matches. Start hacking!
                                </div>
                            ) : (
                                recentMatches.map((match, i) => {
                                    const isWin = match.winner_id === user.id;
                                    return (
                                        <div key={match.id} style={{
                                            padding: '1rem 1.5rem',
                                            borderBottom: i !== recentMatches.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    width: '8px', height: '8px', borderRadius: '50%',
                                                    background: isWin ? '#22c55e' : '#ef4444',
                                                    boxShadow: isWin ? '0 0 10px rgba(34,197,94,0.4)' : '0 0 10px rgba(239,68,68,0.4)'
                                                }} />
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{match.challenge?.title || 'Unknown Challenge'}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                        {new Date(match.created_at).toLocaleDateString()} • {new Date(match.created_at).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{
                                                fontWeight: 'bold',
                                                color: isWin ? '#22c55e' : '#ef4444',
                                                background: isWin ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                                padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem'
                                            }}>
                                                {isWin ? '+100 XP' : 'Loss'}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* STATS OVERVIEW */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Career Progress</h3>
                            <span style={{ fontSize: '0.8rem', color: '#8b5cf6', fontWeight: 600 }}>LEVEL {Math.floor((profile?.xp || 0) / 1000) + 1}</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff' }}>{profile?.rank_points || 0}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>/ {rankInfo.next} RP</span>
                        </div>
                        {/* Progress Bar (Rank) */}
                        <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginBottom: '0.75rem', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${rankInfo.progress}%`, background: rankInfo.color, borderRadius: '3px', transition: 'width 1s ease' }} />
                        </div>
                        
                        {/* XP Bar */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', textTransform: 'uppercase', fontWeight: 700 }}>
                                <span>XP PROGRESS</span>
                                <span>{profile?.xp % 1000} / 1000</span>
                            </div>
                            <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${(profile?.xp % 1000) / 10}%`, background: '#8b5cf6', borderRadius: '2px', transition: 'width 1s ease' }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Win Rate</div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
                                    {userStats.total_matches === 0
                                        ? '0%'
                                        : `${Math.round((userStats.total_wins / userStats.total_matches) * 100)}%`
                                    }
                                </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Total Matches</div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>{userStats.total_matches}</div>
                            </div>
                        </div>
                    </div>

                    {/* NEWS / BROADCAST */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Bell size={16} /> System Feed
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {systemNews.length === 0 ? (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No active broadcasts.</div>
                            ) : systemNews.map(item => (
                                <div key={item.id} style={{ 
                                    borderLeft: `2px solid ${
                                        item.type === 'warning' ? '#fbbf24' : 
                                        item.type === 'error' ? '#f43f5e' : 
                                        item.type === 'success' ? '#10b981' : '#06b6d4'
                                    }`, 
                                    paddingLeft: '0.75rem' 
                                }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0' }}>{item.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.4' }}>
                                        {item.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* TOP OPERATORS */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Elite Operators</h3>
                            <div style={{ fontSize: '0.8rem', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/leaderboard')}>
                                View All <ChevronRight size={14} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {topPlayers.map((player, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        <div style={{
                                            width: '24px', height: '24px', borderRadius: '50%', background: '#334155',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold'
                                        }}>
                                            {i + 1}
                                        </div>
                                        <span style={{ fontSize: '0.95rem' }}>{player.username}</span>
                                    </div>
                                    <span style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: 600 }}>{player.rank_points}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SYSTEM STATUS */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>System Status</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 5px #22c55e' }}></div>
                                Matchmaking Online
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 5px #22c55e' }}></div>
                                Challenges Active
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
