import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Award, Medal } from 'lucide-react';

export default function Leaderboard() {
    const [profiles, setProfiles] = useState([]);

    useEffect(() => {
        async function fetchLeaderboard() {
            const { data } = await supabase
                .from('profiles')
                .select('username, rank_points')
                .order('rank_points', { ascending: false })
                .limit(50);
            setProfiles(data || []);
        }
        fetchLeaderboard();
    }, []);

    const getRankTier = (points) => {
        if (points >= 10) return { name: 'Gold', color: '#fbbf24' };
        if (points >= 5) return { name: 'Silver', color: '#94a3b8' };
        return { name: 'Bronze', color: '#b45309' };
    };

    return (
        <div className="page-container">
            <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Global Leaderboard</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Top hackers ranked by competitive points</p>
            </header>

            <div className="glass-panel" style={{ overflowX: 'auto' }}>
                <table className="leaderboard-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>User</th>
                            <th>Tier</th>
                            <th style={{ textAlign: 'right' }}>Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        {profiles.map((p, idx) => {
                            const tier = getRankTier(p.rank_points);
                            return (
                                <tr key={idx}>
                                    <td style={{ fontWeight: 'bold', color: idx < 3 ? '#fff' : 'var(--text-secondary)' }}>
                                        #{idx + 1}
                                    </td>
                                    <td style={{ fontWeight: '600', color: '#fff' }}>{p.username}</td>
                                    <td>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '12px',
                                            background: `${tier.color}20`,
                                            color: tier.color,
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            border: `1px solid ${tier.color}40`
                                        }}>
                                            {tier.name}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{p.rank_points}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {profiles.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No data yet</div>}
            </div>
        </div>
    );
}
