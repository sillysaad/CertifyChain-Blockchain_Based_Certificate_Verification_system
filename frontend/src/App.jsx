import React, { useState, useCallback, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ethers } from 'ethers';

import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import VerificationPortal from './components/VerificationPortal';
import RainbowBackground from './components/RainbowBackground';

export const WalletContext = createContext({ address: null });

/* ── Wallet options ──────────────────────────────────────────────────────── */
const WALLETS = [
    {
        id: 'metamask',
        name: 'MetaMask',
        desc: 'Browser extension wallet',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
        emoji: '🦊',
        iconBg: '#f5f0e8',
        detect: () => typeof window !== 'undefined' && !!window.ethereum,
        connect: async () => {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send('eth_requestAccounts', []);
            return accounts[0];
        },
        installUrl: 'https://metamask.io/download/',
    },
    {
        id: 'walletconnect',
        name: 'Other Wallets',
        desc: 'WalletConnect, Ledger, etc.',
        emoji: '🔗',
        iconBg: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
        detect: () => true, // Built-in fallback
        connect: async () => {
             // In a real app involving WalletConnect, we'd trigger the WalletConnect modal here.
            alert("WalletConnect option selected (Place holder for other wallets setup)");
            throw new Error("WalletConnect pending");
        },
        installUrl: '#',
    }
];

/* ── Wallet Modal ────────────────────────────────────────────────────────── */
function WalletModal({ onClose, onConnected }) {
    const [status, setStatus] = useState({});

    const tryConnect = useCallback(async (wallet) => {
        const available = wallet.detect();
        if (!available) { window.open(wallet.installUrl, '_blank'); return; }
        setStatus(s => ({ ...s, [wallet.id]: 'connecting' }));
        try {
            const addr = await wallet.connect();
            onConnected(addr);
            onClose();
        } catch (err) {
            console.error(err.message);
            setStatus(s => ({ ...s, [wallet.id]: 'error' }));
            setTimeout(() => setStatus(s => ({ ...s, [wallet.id]: undefined })), 2000);
        }
    }, [onConnected, onClose]);

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', // prevents modal from hitting screen edges on tiny screens
            animation: 'fadeIn .2s ease',
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: 'rgba(255,255,255,0.98)',
                borderRadius: 24, padding: '2rem',
                width: 400, maxWidth: '100%',
                maxHeight: '90vh', overflowY: 'auto', // Fix: ensures modal never overflows top/bottom of screen
                boxShadow: '0 40px 100px rgba(99,102,241,0.22)',
                animation: 'slideUp .28s cubic-bezier(.34,1.56,.64,1)',
                position: 'relative',
            }}>

                {/* Close */}
                <button onClick={onClose} style={{
                    position: 'absolute', top: 16, right: 16,
                    background: 'rgba(0,0,0,0.06)', border: 'none',
                    borderRadius: '50%', width: 32, height: 32,
                    cursor: 'pointer', fontSize: '1rem', color: '#888',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .2s',
                }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.12)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.06)'}>✕</button>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16, margin: '0 auto 1rem',
                        background: 'linear-gradient(135deg,#6366f1,#a855f7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.75rem', boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
                    }}>⛓</div>
                    <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.3rem', color: '#111' }}>Connect Wallet</h2>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#888' }}>
                        Select a wallet to connect to CertifyChain
                    </p>
                </div>

                {/* Wallet list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {WALLETS.map(w => {
                        const isAvailable = w.detect();
                        const s = status[w.id];
                        return (
                            <button key={w.id} onClick={() => tryConnect(w)} style={{
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                padding: '0.9rem 1.1rem', borderRadius: 14, width: '100%',
                                background: s === 'connecting' ? '#f5f5ff' : '#fafafa',
                                border: s === 'error' ? '2px solid #ef4444' : '2px solid #ebebeb',
                                cursor: 'pointer', textAlign: 'left',
                                transition: 'all .18s ease',
                            }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = '#6366f1';
                                    e.currentTarget.style.background = '#f5f5ff';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = s === 'error' ? '#ef4444' : '#ebebeb';
                                    e.currentTarget.style.background = s === 'connecting' ? '#f5f5ff' : '#fafafa';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                {/* Icon */}
                                <div style={{
                                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                                    background: w.iconBg || '#f1f1f1',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.5rem', overflow: 'hidden',
                                }}>
                                    {w.icon
                                        ? <img src={w.icon} alt={w.name} width={34} height={34} style={{ borderRadius: 6 }}
                                            onError={e => { e.target.style.display = 'none'; e.target.parentNode.textContent = w.emoji; }} />
                                        : w.emoji}
                                </div>

                                {/* Labels */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.97rem', color: '#111' }}>{w.name}</div>
                                    <div style={{ fontSize: '0.78rem', color: s === 'error' ? '#ef4444' : s === 'connecting' ? '#6366f1' : '#888' }}>
                                        {s === 'connecting' ? '⏳ Connecting…'
                                           : s === 'error'      ? '❌ Failed — try again'
                                           : isAvailable        ? w.desc
                                           : 'Not installed — click to install'}
                                    </div>
                                </div>

                                {/* Badge */}
                                {isAvailable && !s && (
                                    <span style={{
                                        fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.55rem',
                                        borderRadius: 20, background: 'rgba(5,150,105,0.1)',
                                        color: '#059669', flexShrink: 0,
                                    }}>Detected</span>
                                )}
                                {!isAvailable && !s && (
                                    <span style={{ color: '#ccc', fontSize: '1.1rem', flexShrink: 0 }}>↗</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <p style={{ textAlign: 'center', fontSize: '0.73rem', color: '#bbb', marginTop: '1.25rem', marginBottom: 0 }}>
                    By connecting, you agree to CertifyChain's Terms of Service
                </p>

                <style>{`
                    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
                    @keyframes slideUp { from{transform:translateY(36px) scale(.97);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
                `}</style>
            </div>
        </div>
    );
}

/* ── Wallet Button ───────────────────────────────────────────────────────── */
function WalletButton({ onAddressChange }) {
    const [address, setAddress] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_accounts' })
                .then(accs => { if (accs[0]) { setAddress(accs[0]); onAddressChange?.(accs[0]); } })
                .catch(() => {});
        }
    }, []);

    const handleConnected = useCallback((addr) => {
        setAddress(addr); onAddressChange?.(addr);
    }, [onAddressChange]);

    const disconnect = useCallback(() => { setAddress(null); onAddressChange?.(null); }, [onAddressChange]);

    if (address) {
        return (
            <button className="btn btn-outline btn-sm" onClick={disconnect} title="Disconnect"
                style={{ fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', display: 'inline-block' }} />
                {address.slice(0, 6)}…{address.slice(-4)}
            </button>
        );
    }

    return (
        <>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                🔗 Connect Wallet
            </button>
            {showModal && <WalletModal onClose={() => setShowModal(false)} onConnected={handleConnected} />}
        </>
    );
}

/* ── Nav ─────────────────────────────────────────────────────────────────── */
function NavLink({ to, children }) {
    const location = useLocation();
    const isActive = location.pathname === to;
    return <Link to={to} className={`nav-link ${isActive ? 'active' : ''}`}>{children}</Link>;
}

/* ── App ─────────────────────────────────────────────────────────────────── */
function AppContent() {
    const [walletAddress, setWalletAddress] = useState(null);

    return (
        <div className="app-wrapper">
            <RainbowBackground />

            <nav className="navbar">
                <div className="navbar-inner">
                    <Link to="/" className="navbar-brand">
                        <div className="brand-icon">⛓</div>
                        <span className="brand-text">CertifyChain</span>
                    </Link>
                    <div className="nav-links">
                        <NavLink to="/">Home</NavLink>
                        <NavLink to="/verify">Verify</NavLink>
                        <NavLink to="/admin">Admin</NavLink>
                        <div className="wallet-container">
                            <WalletButton onAddressChange={setWalletAddress} />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="app-container" style={{ position: 'relative', zIndex: 1 }}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/verify" element={<VerificationPortal />} />
                    <Route path="/admin" element={<AdminDashboard walletAddress={walletAddress} />} />
                </Routes>
            </main>

            <footer className="app-footer" style={{ position: 'relative', zIndex: 1 }}>
                <div className="footer-inner">
                    <span>© 2024 CertifyChain — Blockchain Certificate Verification</span>
                    <div className="footer-tech">
                        <span>⚡ Ethereum</span>
                        <span>🔐 SHA-256</span>
                        <span>📦 IPFS</span>
                        <span>🔍 Tesseract OCR</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function App() {
    return <Router><AppContent /></Router>;
}

export default App;
