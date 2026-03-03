import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Swords, ArrowRight, Shield, Code, Zap, Trophy, Users, Terminal, Cpu } from 'lucide-react';

/* ─── Custom cursor hook ─────────────────────────────────────── */
function useCursor() {
    const dotRef  = useRef(null);
    const ringRef = useRef(null);
    const posRef  = useRef({ x: -100, y: -100 });
    const ringPos = useRef({ x: -100, y: -100 });

    useEffect(() => {
        const dot  = dotRef.current;
        const ring = ringRef.current;
        if (!dot || !ring) return;

        // Hide OS cursor
        document.body.classList.add('landing-cursor-active');

        let animId;
        const onMove = (e) => { posRef.current = { x: e.clientX, y: e.clientY }; };
        window.addEventListener('mousemove', onMove);

        const loop = () => {
            // Dot snaps instantly
            dot.style.transform = `translate(${posRef.current.x - 5}px, ${posRef.current.y - 5}px)`;
            // Ring has spring lag
            ringPos.current.x += (posRef.current.x - ringPos.current.x) * 0.12;
            ringPos.current.y += (posRef.current.y - ringPos.current.y) * 0.12;
            ring.style.transform = `translate(${ringPos.current.x - 18}px, ${ringPos.current.y - 18}px)`;
            animId = requestAnimationFrame(loop);
        };
        animId = requestAnimationFrame(loop);

        // Scale ring on click + ripple
        const down = (e) => {
            ring.style.transform += ' scale(0.65)';
            // Ripple
            const ripple = document.createElement('div');
            Object.assign(ripple.style, {
                position: 'fixed', zIndex: '9997', pointerEvents: 'none',
                width: '60px', height: '60px', borderRadius: '50%',
                border: '1px solid rgba(167,139,250,0.6)',
                top: `${e.clientY - 30}px`, left: `${e.clientX - 30}px`,
                animation: 'ripple 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
            });
            document.body.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        };
        const up = () => {
            ring.style.transform = ring.style.transform.replace(' scale(0.65)', '');
        };
        window.addEventListener('mousedown', down);
        window.addEventListener('mouseup',   up);

        return () => {
            document.body.classList.remove('landing-cursor-active');
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mousedown', down);
            window.removeEventListener('mouseup',   up);
            cancelAnimationFrame(animId);
        };
    }, []);

    return { dotRef, ringRef };
}

/* ─── Spotlight card ─────────────────────────────────────────── */
function SpotlightCard({ children, style, className }) {
    const cardRef = useRef(null);
    const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });

    const handleMouseMove = useCallback((e) => {
        const rect = cardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width)  * 100;
        const y = ((e.clientY - rect.top)  / rect.height) * 100;
        setSpotlight({ x, y, opacity: 1 });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setSpotlight(s => ({ ...s, opacity: 0 }));
    }, []);

    return (
        <div
            ref={cardRef}
            className={className}
            style={{ ...style, position: 'relative', overflow: 'hidden', cursor: 'default' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={e => {
                cardRef.current.style.transform = 'translateY(-6px)';
                cardRef.current.style.boxShadow = '0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.2)';
            }}
            onMouseOut={e => {
                cardRef.current.style.transform = 'translateY(0)';
                cardRef.current.style.boxShadow = '';
            }}
        >
            {/* Spotlight layer */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
                borderRadius: 'inherit',
                background: `radial-gradient(200px circle at ${spotlight.x}% ${spotlight.y}%, rgba(139,92,246,0.12), transparent 70%)`,
                opacity: spotlight.opacity,
                transition: 'opacity 0.25s ease',
            }} />
            <div style={{ position: 'relative', zIndex: 2 }}>
                {children}
            </div>
        </div>
    );
}

/* ─── Magnetic button ────────────────────────────────────────── */
function MagneticButton({ children, onClick, className, style }) {
    const btnRef  = useRef(null);
    const frameRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        const btn  = btnRef.current;
        const rect = btn.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = e.clientX - cx;
        const dy   = e.clientY - cy;
        btn.style.transform = `translate(${dx * 0.35}px, ${dy * 0.35}px) scale(1.05)`;
    }, []);

    const handleMouseLeave = useCallback(() => {
        btnRef.current.style.transform = 'translate(0, 0) scale(1)';
    }, []);

    return (
        <button
            ref={btnRef}
            className={className}
            style={{ ...style, transition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s ease' }}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </button>
    );
}

/* ─── Parallax hero visual ───────────────────────────────────── */
function ParallaxHero() {
    const containerRef = useRef(null);
    const termRef      = useRef(null);
    const rankRef      = useRef(null);

    useEffect(() => {
        const onMove = (e) => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const mx = (e.clientX / w - 0.5) * 2; // -1 to +1
            const my = (e.clientY / h - 0.5) * 2;

            if (termRef.current) {
                termRef.current.style.transform = `translate(${mx * -12}px, ${my * -8}px) rotateY(${mx * 3}deg) rotateX(${-my * 2}deg)`;
            }
            if (rankRef.current) {
                rankRef.current.style.transform = `translate(${mx * 18}px, ${my * 12}px)`;
            }
        };
        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
    }, []);

    return (
        <div ref={containerRef} style={{ position: 'relative', perspective: '800px' }}>
            {/* Terminal Card */}
            <div ref={termRef} className="glass-panel glass-panel--glow" style={{
                padding: '1.5rem',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                background: 'linear-gradient(145deg, rgba(15,23,42,0.95), rgba(30,27,75,0.6))',
                transition: 'transform 0.1s ease-out',
                transformStyle: 'preserve-3d',
            }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', alignItems: 'center' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', opacity: 0.85 }} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fbbf24', opacity: 0.85 }} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e', opacity: 0.85 }} />
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'rgba(148,163,184,0.5)', fontFamily: 'monospace' }}>ctf-rank ~ terminal</span>
                </div>
                <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.88rem', lineHeight: 1.65 }}>
                    <div style={{ color: '#64748b' }}>// Initiating matchmaking protocol...</div>
                    <div>
                        <span style={{ color: '#c084fc' }}>const </span>
                        <span style={{ color: '#fff' }}>match </span>
                        <span style={{ color: '#c084fc' }}>= </span>
                        <span style={{ color: '#38bdf8' }}>await </span>
                        <span style={{ color: '#fff' }}>system.findOpponent();</span>
                    </div>
                    <br />
                    <div style={{ color: '#64748b' }}>// Target acquired</div>
                    <div style={{ color: '#22c55e' }}>&gt; Connection established: US-East-1</div>
                    <div style={{ color: '#22c55e' }}>&gt; Challenge: SQL Injection Level 3</div>
                    <div style={{ color: '#a78bfa' }}>&gt; ELO delta: ±24 RP</div>
                    <br />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ color: '#38bdf8' }}>$ </span>
                        <div className="animate-pulse" style={{ display: 'inline-block', width: '9px', height: '17px', background: '#38bdf8', verticalAlign: 'middle', borderRadius: '1px' }} />
                    </div>
                </div>
            </div>

            {/* Floating Rank panel */}
            <div ref={rankRef} className="glass-panel" style={{
                position: 'absolute', bottom: '-44px', right: '-44px',
                padding: '1.25rem 1.5rem',
                display: 'flex', flexDirection: 'column', gap: '0.85rem',
                background: 'linear-gradient(145deg, rgba(15,23,42,0.97), rgba(30,27,75,0.8))',
                border: '1px solid rgba(255,255,255,0.10)',
                minWidth: '215px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.07) inset',
                transition: 'transform 0.15s ease-out',
            }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Rank System</div>
                {[
                    { name: 'Bronze',   color: '#cd7f32' },
                    { name: 'Silver',   color: '#94a3b8' },
                    { name: 'Gold',     color: '#fbbf24' },
                    { name: 'Platinum', color: '#22d3ee' },
                    { name: 'Diamond',  color: '#a78bfa' },
                ].map((rank, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Trophy size={15} color={rank.color} style={{ filter: `drop-shadow(0 0 4px ${rank.color}80)` }} />
                        <span style={{ fontWeight: i >= 2 ? 700 : 400, color: i >= 3 ? '#fff' : '#cbd5e1', fontSize: '0.9rem' }}>
                            {rank.name} Operator
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function Landing() {
    const navigate = useNavigate();
    const { dotRef, ringRef } = useCursor();

    return (
        <div className="page-container" style={{ padding: 0, maxWidth: '100%', overflowX: 'hidden' }}>

            {/* ── Custom Cursor ── */}
            <div ref={dotRef} style={{
                position: 'fixed', zIndex: 9999, pointerEvents: 'none',
                width: '10px', height: '10px', borderRadius: '50%',
                background: '#a78bfa',
                boxShadow: '0 0 10px 3px rgba(167,139,250,0.6)',
                willChange: 'transform',
                top: 0, left: 0,
            }} />
            <div ref={ringRef} style={{
                position: 'fixed', zIndex: 9998, pointerEvents: 'none',
                width: '36px', height: '36px', borderRadius: '50%',
                border: '1.5px solid rgba(167,139,250,0.45)',
                willChange: 'transform',
                top: 0, left: 0,
                transition: 'transform 0.08s linear, border-color 0.2s ease',
            }} />

            {/* ── Navigation ── */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                padding: '1rem 2rem',
                background: 'rgba(2, 6, 23, 0.75)',
                backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 1px 40px rgba(0,0,0,0.4)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
                    <Swords size={24} color="#8b5cf6" style={{ filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.6))' }} />
                    <span className="title-gradient">CTF-Rank</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button onClick={() => navigate('/login')} className="btn-secondary" style={{ fontSize: '0.9rem', padding: '0.5rem 1.25rem' }}>
                        Log In
                    </button>
                    <MagneticButton onClick={() => navigate('/login')} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1.25rem' }}>
                        Sign Up Free
                    </MagneticButton>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '8rem 2rem 5rem', position: 'relative', overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '120vw', height: '120vh', background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.12) 0%, transparent 60%)', zIndex: 0, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '-10%', width: '50vw', height: '50vh', background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.07) 0%, transparent 60%)', zIndex: 0, pointerEvents: 'none' }} />

                <div className="landing-hero-grid" style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', position: 'relative', zIndex: 1 }}>

                    {/* Left: Text */}
                    <div className="animate-fade-in">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', padding: '0.4rem 1rem', borderRadius: '100px', fontSize: '0.82rem', color: '#a78bfa', marginBottom: '1.75rem', backdropFilter: 'blur(8px)' }}>
                            <span style={{ width: '7px', height: '7px', background: '#a78bfa', borderRadius: '50%', boxShadow: '0 0 6px #a78bfa' }} />
                            Competitive Season 1 &bull; Live
                        </div>

                        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.75rem)', lineHeight: 1.05, marginBottom: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(to bottom right, #fff 30%, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Master the Art of <br />
                            <span className="title-gradient">Cyber Combat</span>
                        </h1>

                        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.7, maxWidth: '480px' }}>
                            The premier 1v1 Capture The Flag platform. Challenge players worldwide, solve real-time security puzzles, and climb the global leaderboard.
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <MagneticButton onClick={() => navigate('/login')} className="btn-primary" style={{ padding: '0.9rem 2.25rem', fontSize: '1rem', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                Start Hacking <ArrowRight size={18} />
                            </MagneticButton>
                            <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="btn-secondary" style={{ padding: '0.9rem 2rem', fontSize: '1rem', borderRadius: '10px' }}>
                                Explore Features
                            </button>
                        </div>
                    </div>

                    {/* Right: Parallax Visual */}
                    <div className="landing-hero-visual animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <ParallaxHero />
                    </div>
                </div>
            </section>

            {/* ── Info Strip ── */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)', backdropFilter: 'blur(10px)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.5rem' }}>
                    {[
                        { icon: Users,  text: '500+ Active Users' },
                        { icon: Swords, text: '12k Matches Played' },
                        { icon: Zap,    text: '99.9% Uptime' },
                    ].map(({ icon: Icon, text }, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', color: '#94a3b8', fontWeight: 600, fontSize: '0.95rem', cursor: 'default' }}>
                            <Icon size={18} color="#8b5cf6" />
                            {text}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Features ── */}
            <section id="features" style={{ padding: '7rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', padding: '0.35rem 0.9rem', borderRadius: '100px', fontSize: '0.78rem', color: '#38bdf8', marginBottom: '1.25rem', backdropFilter: 'blur(8px)' }}>
                        PLATFORM FEATURES
                    </div>
                    <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', marginBottom: '1rem' }}>
                        Built for <span className="title-gradient">Elite Developers</span>
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
                        Everything you need to test your security skills in a competitive environment.
                    </p>
                </div>

                <div className="features-grid" style={{ display: 'grid', gap: '1.5rem' }}>
                    {[
                        { icon: Shield,   title: 'Real-time 1v1',      desc: 'Instantly match with opponents of similar skill level. Zero waiting list.' },
                        { icon: Terminal, title: 'Diverse Toolkit',     desc: 'Challenges cover Web, Crypto, Reverse Engineering, and Forensics.' },
                        { icon: Trophy,   title: 'Ranked Progression',  desc: 'Climb from Bronze to Diamond. Earn badges and show off your profile.' },
                        { icon: Cpu,      title: 'Anti-Cheat System',   desc: 'Advanced heuristics ensure fair play for every single match.' },
                        { icon: Zap,      title: 'Instant Feedback',    desc: 'Submit flags and get millisecond-precision validation results.' },
                        { icon: Code,     title: 'Open Source',         desc: 'Powered by modern tech stack. Extensible and community driven.' },
                    ].map((feature, idx) => (
                        <SpotlightCard key={idx} className="glass-panel" style={{ padding: '2rem', transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                                <feature.icon size={22} color="#a78bfa" />
                            </div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.6rem', color: '#f1f5f9' }}>{feature.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>{feature.desc}</p>
                        </SpotlightCard>
                    ))}
                </div>
            </section>

            {/* ── CTA ── */}
            <section style={{ padding: '5rem 2rem 7rem', textAlign: 'center' }}>
                <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', padding: '4.5rem 2.5rem', position: 'relative', overflow: 'hidden', background: 'linear-gradient(145deg, rgba(139,92,246,0.08) 0%, rgba(6,182,212,0.06) 100%)', border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 0 80px rgba(139,92,246,0.10), 0 20px 60px rgba(0,0,0,0.4)' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #8b5cf6, #06b6d4, #8b5cf6)', backgroundSize: '200% auto', animation: 'shimmer 3s linear infinite' }} />
                    <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(139,92,246,0.06)', filter: 'blur(40px)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(6,182,212,0.06)', filter: 'blur(40px)', pointerEvents: 'none' }} />

                    <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', marginBottom: '1rem', position: 'relative' }}>
                        Ready to Accept the Challenge?
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', maxWidth: '480px', margin: '0 auto 2.5rem', lineHeight: 1.7, position: 'relative' }}>
                        Join thousands of developers mastering cybersecurity through gamified competition.
                    </p>
                    <MagneticButton
                        onClick={() => navigate('/login')}
                        className="btn-primary"
                        style={{ padding: '1rem 3rem', fontSize: '1.05rem', borderRadius: '100px', position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        Create Free Account <ArrowRight size={18} />
                    </MagneticButton>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '3rem 2rem', background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(12px)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 'bold' }}>
                        <Swords size={18} color="#475569" />
                        <span style={{ color: '#64748b' }}>CTF-Rank</span>
                    </div>
                    <div style={{ color: '#475569', fontSize: '0.85rem' }}>
                        &copy; {new Date().getFullYear()} CTF-Rank System. Powered by <span style={{ color: '#94a3b8' }}>Array Studio</span>.
                    </div>
                </div>
            </footer>

        </div>
    );
}
