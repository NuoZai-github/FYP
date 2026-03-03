import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';

// Generate a colour from a string (for avatars)
function strToColor(str = '') {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 55%, 45%)`;
}

const MEDAL_ICONS = [Crown, Medal, Trophy];
const MEDAL_COLORS = ['#fbbf24', '#94a3b8', '#cd7f32'];

export default function Leaderboard() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        async function fetchLeaderboard() {
            const { data } = await supabase
                .from('profiles')
                .select('username, rank_points')
                .order('rank_points', { ascending: false })
                .limit(50);
            setProfiles(data || []);
            setLoading(false);
        }
        fetchLeaderboard();
    }, []);

    const getRankTier = (points) => {
        if (points >= 10) return { name: 'Gold',   color: '#fbbf24' };
        if (points >= 5)  return { name: 'Silver', color: '#94a3b8' };
        return                   { name: 'Bronze', color: '#cd7f32' };
    };

    const getRankRowStyle = (idx) => {
        if (idx === 0) return { background: 'rgba(251,191,36,0.05)',  borderLeft: '3px solid #fbbf24' };
        if (idx === 1) return { background: 'rgba(148,163,184,0.04)', borderLeft: '3px solid #94a3b8' };
        if (idx === 2) return { background: 'rgba(205,127,50,0.04)',  borderLeft: '3px solid #cd7f32' };
        return {};
    };

    return (
        <div className="page-container">
            {/* Header */}
            <header style={{ marginBottom: '2.5rem', textAlign: 'center', paddingTop: '1rem' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
                    padding: '0.35rem 0.9rem', borderRadius: '100px',
                    fontSize: '0.78rem', color: '#fbbf24', marginBottom: '1rem',
                    backdropFilter: 'blur(8px)',
                }}>
                    <Trophy size={13} /> SEASON 1 STANDINGS
                </div>
                <h1 className="title-gradient" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '0.6rem' }}>
                    Global Leaderboard
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>Top hackers ranked by competitive points</p>
            </header>

            {/* Table */}
            <div className="glass-panel lb-wrapper" style={{ overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Loading operators...
                    </div>
                ) : profiles.length === 0 ? (
                    // ── Empty State ──
                    <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                        <Trophy size={48} color="#475569" style={{ margin: '0 auto 1.5rem', display: 'block', opacity: 0.5 }} />
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#94a3b8' }}>No Operators Ranked Yet</h3>
                        <p style={{ color: '#475569', fontSize: '0.95rem' }}>
                            Be the first to climb the leaderboard. Start a match now!
                        </p>
                    </div>
                ) : (
                    <table className="leaderboard-table">
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>Rank</th>
                                <th>Operator</th>
                                <th>Tier</th>
                                <th style={{ textAlign: 'right' }}>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.map((p, idx) => {
                                const tier      = getRankTier(p.rank_points);
                                const rowStyle  = getRankRowStyle(idx);
                                const MedalIcon = idx < 3 ? MEDAL_ICONS[idx] : null;
                                const medalColor = idx < 3 ? MEDAL_COLORS[idx] : null;
                                const avatarColor = strToColor(p.username);

                                return (
                                    <tr key={idx} style={rowStyle}>
                                        {/* Rank # */}
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {MedalIcon
                                                    ? <MedalIcon size={18} color={medalColor} style={{ filter: `drop-shadow(0 0 4px ${medalColor}80)` }} />
                                                    : <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '0.95rem' }}>#{idx + 1}</span>
                                                }
                                            </div>
                                        </td>

                                        {/* User with avatar */}
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                                <div style={{
                                                    width: '34px', height: '34px', borderRadius: '50%',
                                                    background: avatarColor,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.85rem', fontWeight: 700, color: '#fff',
                                                    flexShrink: 0,
                                                    boxShadow: `0 0 0 2px rgba(255,255,255,0.06)`,
                                                }}>
                                                    {(p.username || '?')[0].toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600, color: idx < 3 ? '#fff' : '#e2e8f0' }}>
                                                    {p.username}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Tier badge */}
                                        <td>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '100px',
                                                background: `${tier.color}15`,
                                                color: tier.color,
                                                fontSize: '0.78rem',
                                                fontWeight: 700,
                                                border: `1px solid ${tier.color}35`,
                                                letterSpacing: '0.03em',
                                            }}>
                                                {tier.name}
                                            </span>
                                        </td>

                                        {/* Points */}
                                        <td style={{ textAlign: 'right' }}>
                                            <span style={{
                                                fontWeight: 700,
                                                fontSize: '1rem',
                                                color: idx === 0 ? '#fbbf24' : '#fff',
                                            }}>
                                                {p.rank_points}
                                            </span>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginLeft: '0.3rem' }}>RP</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer note */}
            <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.8rem', marginTop: '1.5rem' }}>
                <TrendingUp size={13} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                Rankings update in real-time after every match.
            </p>
        </div>
    );
}
