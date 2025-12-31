import { useNavigate } from 'react-router-dom';
import { Swords, ArrowRight, Shield, Code, Zap, Trophy, Users, Terminal, Cpu } from 'lucide-react';

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div className="page-container" style={{ padding: 0, maxWidth: '100%', overflowX: 'hidden' }}>

            {/* Navigation */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                padding: '1.25rem 2rem',
                background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
                    <Swords size={24} color="#8b5cf6" />
                    <span className="title-gradient">CTF-Rank</span>
                </div>
                <div>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn-secondary"
                        style={{ fontSize: '0.9rem', padding: '0.5rem 1.25rem' }}
                    >
                        Log In
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '8rem 2rem 4rem', position: 'relative', overflow: 'hidden'
            }}>
                {/* Background Gradients */}
                <div style={{
                    position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
                    width: '100vw', height: '100vh',
                    background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
                    zIndex: -1
                }} />

                <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                    <div className="animate-fade-in">
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)',
                            padding: '0.4rem 1rem', borderRadius: '100px', fontSize: '0.85rem', color: '#a78bfa', marginBottom: '1.5rem'
                        }}>
                            <span style={{ width: '8px', height: '8px', background: '#a78bfa', borderRadius: '50%' }} />
                            System Online v1.0
                        </div>
                        <h1 style={{
                            fontSize: '3.5rem', lineHeight: 1.1, marginBottom: '1.5rem', fontWeight: 800,
                            letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                        }}>
                            Master the Art of <br />
                            <span className="title-gradient">Cyber Combat</span>
                        </h1>
                        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.6, maxWidth: '500px' }}>
                            The premier 1v1 Capture The Flag platform. Challenge players worldwide, solve real-time security puzzles, and climb the global leaderboard.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-primary"
                                style={{ padding: '0.9rem 2rem', fontSize: '1rem', borderRadius: '8px' }}
                            >
                                Start Hacking <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                            </button>
                            <button
                                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                                className="btn-secondary"
                                style={{ padding: '0.9rem 2rem', fontSize: '1rem', borderRadius: '8px' }}
                            >
                                Explore Features
                            </button>
                        </div>
                    </div>

                    {/* Hero Visual - Mock Code Terminal */}
                    <div className="animate-fade-in" style={{ animationDelay: '0.2s', position: 'relative' }}>
                        <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)', background: '#0f172a' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', opacity: 0.5 }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fbbf24' }} />
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }} />
                            </div>
                            <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.9rem', lineHeight: 1.5 }}>
                                <div style={{ color: '#94a3b8' }}>// Initiating matchmaking protocol...</div>
                                <div style={{ color: '#c084fc' }}>const</div> <div style={{ color: '#fff', display: 'inline' }}>match</div> <div style={{ color: '#c084fc', display: 'inline' }}>=</div> <div style={{ color: '#38bdf8', display: 'inline' }}>await</div> <div style={{ color: '#fff', display: 'inline' }}>system.findOpponent();</div>
                                <br />
                                <div style={{ color: '#94a3b8' }}>// Target acquired</div>
                                <div style={{ color: '#22c55e' }}>{'>'} Connection established: US-East-1</div>
                                <div style={{ color: '#22c55e' }}>{'>'} Challenge: SQL Injection Level 3</div>
                                <br />
                                <div className="animate-pulse" style={{ display: 'inline-block', width: '10px', height: '18px', background: '#38bdf8', verticalAlign: 'middle' }} />
                            </div>
                        </div>
                        {/* Floating Rank Showcase */}
                        <div className="glass-panel" style={{
                            position: 'absolute', bottom: '-40px', right: '-40px',
                            padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem',
                            background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
                            minWidth: '240px'
                        }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Rank System</div>

                            {[
                                { name: 'Bronze', color: '#cd7f32' },
                                { name: 'Silver', color: '#94a3b8' },
                                { name: 'Gold', color: '#fbbf24' },
                                { name: 'Platinum', color: '#22d3ee' },
                                { name: 'Diamond', color: '#a78bfa' }
                            ].map((rank, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <Trophy size={16} color={rank.color} />
                                    <span style={{ fontWeight: i >= 2 ? 'bold' : 'normal', color: i >= 3 ? '#fff' : '#cbd5e1' }}>
                                        {rank.name} Operator
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Info Strip */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem' }}>
                    {['500+ Active Users', '12k Matches Played', '99.9% Uptime'].map((stat, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                            <Users size={18} /> {stat}
                        </div>
                    ))}
                </div>
            </div>

            {/* Features Section */}
            <section id="features" style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Built for <span className="title-gradient">Elite Developers</span></h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                        Everything you need to test your security skills in a competitive environment.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    {[
                        { icon: Shield, title: "Real-time 1v1", desc: "Instantly match with opponents of similar skill level. No waiting list." },
                        { icon: Terminal, title: "Diverse Toolkit", desc: "Challenges cover Web, Crypto, Reverse Engineering, and Forensics." },
                        { icon: Trophy, title: "Ranked Progression", desc: "Climb from Bronze to Diamond. Earn badges and show off your profile." },
                        { icon: Cpu, title: "Anti-Cheat System", desc: "Advanced heuristics ensure fair play for every single match." },
                        { icon: Zap, title: "Instant Feedback", desc: "Submit flags and get millisecond-precision validation results." },
                        { icon: Code, title: "Open Source", desc: "Powered by modern tech stack. Extensible and community driven." }
                    ].map((feature, idx) => (
                        <div key={idx} className="glass-panel" style={{ padding: '2rem', transition: 'transform 0.2s', cursor: 'default' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <feature.icon size={32} color="#8b5cf6" style={{ marginBottom: '1.5rem' }} />
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>{feature.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section style={{ padding: '6rem 2rem', textAlign: 'center' }}>
                <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)' }} />
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Ready to Accpet the Challenge?</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
                        Join thousands of developers mastering cybersecurity through gamified competition.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn-primary"
                        style={{ padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: '100px' }}
                    >
                        Create Free Account
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '4rem 2rem', background: '#020617' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 'bold' }}>
                        <Swords size={20} color="#64748b" />
                        <span style={{ color: '#94a3b8' }}>CTF-Rank</span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        &copy; 2025 CTF-Rank System. Powered by <span style={{ color: '#fff' }}>Array Studio</span>.
                    </div>
                </div>
            </footer>

        </div>
    );
}
