import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { 
    Plus, Edit2, Trash2, X, Search, 
    Shield, Code, AlertCircle, Bell, 
    MessageSquare, Activity, Users, Flag, Layers
} from 'lucide-react';

export default function Admin() {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('challenges'); // 'challenges' or 'news'
    const [challenges, setChallenges] = useState([]);
    const [news, setNews] = useState([]);
    const [stats, setStats] = useState({ users: 0, matches: 0, challenges: 0, news: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        // Challenges
        title: '',
        description: '',
        flag: '',
        difficulty: 'Easy',
        category: 'Web',
        external_link: '',
        // News
        content: '',
        type: 'info'
    });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        await Promise.all([
            fetchChallenges(),
            fetchNews(),
            fetchStats()
        ]);
        setLoading(false);
    };

    const fetchChallenges = async () => {
        const { data } = await supabase.from('challenges').select('*').order('created_at', { ascending: false });
        if (data) setChallenges(data);
    };

    const fetchNews = async () => {
        const { data } = await supabase.from('system_news').select('*').order('created_at', { ascending: false });
        if (data) setNews(data);
    };

    const fetchStats = async () => {
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: matchCount } = await supabase.from('matches').select('*', { count: 'exact', head: true });
        const { count: challengeCount } = await supabase.from('challenges').select('*', { count: 'exact', head: true });
        const { count: newsCount } = await supabase.from('system_news').select('*', { count: 'exact', head: true });
        
        setStats({ users: userCount || 0, matches: matchCount || 0, challenges: challengeCount || 0, news: newsCount || 0 });
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            if (activeTab === 'challenges') {
                setFormData({
                    title: item.title,
                    description: item.description,
                    flag: item.flag,
                    difficulty: item.difficulty || 'Easy',
                    category: item.category || 'Web',
                    external_link: item.external_link || ''
                });
            } else {
                setFormData({
                    title: item.title,
                    content: item.content,
                    type: item.type || 'info'
                });
            }
        } else {
            setEditingItem(null);
            setFormData({
                title: '',
                description: '',
                flag: '',
                difficulty: 'Easy',
                category: 'Web',
                external_link: '',
                content: '',
                type: 'info'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const table = activeTab === 'challenges' ? 'challenges' : 'system_news';
        const payload = activeTab === 'challenges' 
            ? { title: formData.title, description: formData.description, flag: formData.flag, difficulty: formData.difficulty, category: formData.category, external_link: formData.external_link }
            : { title: formData.title, content: formData.content, type: formData.type };

        try {
            if (editingItem) {
                const { error } = await supabase.from(table).update(payload).eq('id', editingItem.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from(table).insert([payload]);
                if (error) throw error;
            }
            
            setIsModalOpen(false);
            if (activeTab === 'challenges') fetchChallenges(); else fetchNews();
            fetchStats();
        } catch (err) {
            alert('Error saving: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this item permanently?')) return;
        const table = activeTab === 'challenges' ? 'challenges' : 'system_news';
        
        try {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            if (activeTab === 'challenges') fetchChallenges(); else fetchNews();
            fetchStats();
        } catch (err) {
            alert('Error deleting: ' + err.message);
        }
    };

    const filteredData = useMemo(() => {
        const source = activeTab === 'challenges' ? challenges : news;
        return source.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [activeTab, challenges, news, searchTerm]);

    if (!profile?.is_admin) {
        return (
            <div className="center-container">
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Shield size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                    <h2>Access Denied</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>You do not have administrative privileges.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            
            {/* Header + Stats */}
            <header style={{ marginBottom: '3rem' }}>
                <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Control Center</h1>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <StatCard icon={Users} label="Total Users" val={stats.users} color="#8b5cf6" />
                    <StatCard icon={Activity} label="Matches" val={stats.matches} color="#10b981" />
                    <StatCard icon={Flag} label="Challenges" val={stats.challenges} color="#fbbf24" />
                    <StatCard icon={MessageSquare} label="Announcements" val={stats.news} color="#ec4899" />
                </div>
            </header>

            {/* Navigation & Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '0.25rem', display: 'flex', gap: '0.25rem', borderRadius: '12px' }}>
                    <button 
                        onClick={() => setActiveTab('challenges')}
                        style={{
                            padding: '0.6rem 1.5rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600,
                            background: activeTab === 'challenges' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                            color: activeTab === 'challenges' ? '#fff' : 'var(--text-secondary)',
                            border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        <Flag size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Challenges
                    </button>
                    <button 
                        onClick={() => setActiveTab('news')}
                        style={{
                            padding: '0.6rem 1.5rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600,
                            background: activeTab === 'news' ? 'rgba(236, 72, 153, 0.2)' : 'transparent',
                            color: activeTab === 'news' ? '#fff' : 'var(--text-secondary)',
                            border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        <Bell size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> System News
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '600px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input 
                            type="text" placeholder={`Search ${activeTab}...`} className="input-field" 
                            style={{ paddingLeft: '3rem', marginBottom: 0 }}
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-primary" onClick={() => handleOpenModal()} style={{ whiteSpace: 'nowrap' }}>
                        <Plus size={18} /> New {activeTab === 'challenges' ? 'Challenge' : 'Post'}
                    </button>
                </div>
            </div>

            {/* Main Table */}
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="leaderboard-table">
                    <thead>
                        {activeTab === 'challenges' ? (
                            <tr>
                                <th style={{ paddingLeft: '1.5rem' }}>Challenge Content</th>
                                <th>Category</th>
                                <th>Difficulty</th>
                                <th>Flag</th>
                                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Actions</th>
                            </tr>
                        ) : (
                            <tr>
                                <th style={{ paddingLeft: '1.5rem' }}>Announcements</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Actions</th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {filteredData.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>No records found in this sector.</td></tr>
                        ) : filteredData.map(item => (
                            <tr key={item.id}>
                                <td style={{ padding: '1.25rem 1.5rem' }}>
                                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '1rem' }}>{item.title}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {activeTab === 'challenges' ? item.description : item.content}
                                    </div>
                                </td>
                                <td>
                                    <span style={{ 
                                        fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '4px',
                                        background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)'
                                    }}>
                                        {activeTab === 'challenges' ? item.category : item.type.toUpperCase()}
                                    </span>
                                </td>
                                {activeTab === 'challenges' ? (
                                    <>
                                        <td style={{ color: item.difficulty === 'Easy' ? '#10b981' : item.difficulty === 'Medium' ? '#fbbf24' : '#f43f5e', fontWeight: 'bold' }}>
                                            {item.difficulty}
                                        </td>
                                        <td><code>{item.flag}</code></td>
                                    </>
                                ) : (
                                    <td>{new Date(item.created_at).toLocaleDateString()}</td>
                                )}
                                <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button className="btn-secondary" onClick={() => handleOpenModal(item)} style={{ padding: '0.5rem' }}><Edit2 size={16} /></button>
                                        <button className="btn-secondary" onClick={() => handleDelete(item.id)} style={{ padding: '0.5rem', color: '#f43f5e' }}><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Unified Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
                }}>
                    <div className="glass-panel animate-fade-in-up" style={{ maxWidth: '650px', width: '100%', padding: '2.5rem', borderTop: `4px solid ${activeTab === 'challenges' ? '#8b5cf6' : '#ec4899'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{editingItem ? 'Edit' : 'Create'} {activeTab === 'challenges' ? 'Challenge' : 'Post'}</h2>
                            <X size={24} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setIsModalOpen(false)} />
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</label>
                                <input className="input-field" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                            </div>

                            {activeTab === 'challenges' ? (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Category</label>
                                            <select className="input-field" style={{ width: '100%' }} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                                <option>Web</option><option>Crypto</option><option>Pwn</option><option>Forensics</option><option>Reverse</option><option>Misc</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Difficulty</label>
                                            <select className="input-field" style={{ width: '100%' }} value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
                                                <option>Easy</option><option>Medium</option><option>Hard</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Description</label>
                                        <textarea className="input-field" required rows={3} style={{ width: '100%', resize: 'none' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Flag</label>
                                        <input className="input-field" required placeholder="CTF{...}" value={formData.flag} onChange={e => setFormData({...formData, flag: e.target.value})} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Post Type</label>
                                        <select className="input-field" style={{ width: '100%' }} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                            <option value="info">Info (Blue)</option>
                                            <option value="success">Success (Green)</option>
                                            <option value="warning">Warning (Yellow)</option>
                                            <option value="error">Maintenance (Red)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Content</label>
                                        <textarea className="input-field" required rows={5} style={{ width: '100%', resize: 'none' }} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
                                    </div>
                                </>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 2, background: activeTab === 'challenges' ? '#8b5cf6' : '#ec4899' }} disabled={loading}>
                                    {loading ? 'Processing...' : (editingItem ? 'Save Changes' : 'Create Entry')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, val, color }) {
    return (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: `4px solid ${color}` }}>
            <div style={{ background: `${color}15`, padding: '0.75rem', borderRadius: '12px' }}>
                <Icon size={24} color={color} />
            </div>
            <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{val}</div>
            </div>
        </div>
    );
}
