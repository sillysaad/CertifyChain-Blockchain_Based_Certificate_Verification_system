import React from 'react';
import { Link } from 'react-router-dom';

const FLOW_STEPS = [
    { icon: '📤', label: 'Admin Upload' },
    { icon: '🔐', label: 'Generate Hash' },
    { icon: '📦', label: 'Store on Chain' },
    { icon: '🖼️', label: 'User Upload' },
    { icon: '🔍', label: 'OCR Extract' },
    { icon: '#️⃣', label: 'Hash Again' },
    { icon: '⚖️', label: 'Compare' },
    { icon: '✅', label: 'VALID / FAKE' },
];

const FEATURES = [
    {
        icon: '🔗',
        title: 'Certificate Issuance',
        color: '#00f0ff',
        desc: 'Admin uploads certificates which are hashed, stored on IPFS, and registered immutably on the blockchain.',
        link: '/admin',
        linkText: 'Admin Portal',
    },
    {
        icon: '🛡️',
        title: 'Image Verification',
        color: '#b44fff',
        desc: 'Upload a certificate image — the system uses OCR + SHA-256 hashing to verify against the blockchain.',
        link: '/verify',
        linkText: 'Verify Image',
    },
    {
        icon: '📱',
        title: 'QR Verification',
        color: '#00ff88',
        desc: 'Scan the QR code on a certificate or enter the ID to instantly fetch verified details.',
        link: '/verify',
        linkText: 'Scan QR Code',
    },
];

const STATS = [
    { value: 'SHA-256', label: 'Hashing Algorithm' },
    { value: '0ms', label: 'Trusted Delay' },
    { value: '100%', label: 'On-Chain Proof' },
    { value: 'EVM', label: 'Smart Contract' },
];

const LandingPage = () => (
    <div className="landing-page page-enter" style={{ paddingBottom: '5rem' }}>

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section style={{ textAlign: 'center', padding: '5rem 0 3rem' }}>
            {/* Badge */}
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)',
                padding: '0.45rem 1.2rem', borderRadius: 50, marginBottom: '2rem',
                fontSize: '0.85rem', color: '#00f0ff', fontWeight: 600, letterSpacing: '0.04em',
                boxShadow: '0 0 20px rgba(0,240,255,0.1)',
                animation: 'badgePulse 3s ease-in-out infinite',
            }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00f0ff', display: 'inline-block', boxShadow: '0 0 8px #00f0ff', animation: 'dotBlink 1.5s ease-in-out infinite' }} />
                BLOCKCHAIN-POWERED VERIFICATION
            </div>

            <h1 style={{ fontSize: '4rem', marginBottom: '1.25rem', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                <span className="gradient-text">Verify Certificates</span><br />
                <span style={{ color: '#e8f4ff', fontSize: '3rem' }}>on the Blockchain</span>
            </h1>

            <p style={{ maxWidth: '580px', margin: '0 auto 2.5rem', fontSize: '1.05rem', color: '#5a7a99', lineHeight: 1.8 }}>
                Decentralized certificate verification using SHA-256 hashing,
                IPFS storage, OCR extraction, and Ethereum smart contracts.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Link to="/verify" className="btn btn-primary btn-lg">🔍 Verify Certificate</Link>
                <Link to="/admin" className="btn btn-secondary btn-lg">⛓ Admin Portal</Link>
            </div>
        </section>

        {/* ── Stats row ─────────────────────────────────────────────── */}
        <section style={{
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem',
            margin: '1rem 0 4rem',
        }}>
            {STATS.map((s, i) => (
                <div key={i} style={{
                    textAlign: 'center', padding: '1.25rem',
                    background: 'rgba(0,240,255,0.03)', border: '1px solid rgba(0,240,255,0.10)',
                    borderRadius: 14, transition: 'all .25s ease',
                }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,240,255,0.3)'; e.currentTarget.style.background = 'rgba(0,240,255,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,240,255,0.10)'; e.currentTarget.style.background = 'rgba(0,240,255,0.03)'; }}
                >
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#00f0ff', textShadow: '0 0 20px rgba(0,240,255,0.5)', marginBottom: '0.25rem' }}>{s.value}</div>
                    <div style={{ fontSize: '0.78rem', color: '#5a7a99', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                </div>
            ))}
        </section>

        {/* ── System Flow ───────────────────────────────────────────── */}
        <section style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ marginBottom: '1.75rem' }}>
                <span style={{
                    fontSize: '0.72rem', fontWeight: 700, color: '#5a7a99',
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                }}>OVERALL SYSTEM FLOW</span>
            </div>
            <div className="flow-diagram">
                {FLOW_STEPS.map((step, i) => (
                    <React.Fragment key={i}>
                        <div className="flow-node">
                            <span className="node-icon">{step.icon}</span>
                            <span style={{ fontWeight: 600, fontSize: '0.78rem', color: '#a8c4e0' }}>{step.label}</span>
                        </div>
                        {i < FLOW_STEPS.length - 1 && (
                            <div style={{ color: '#2d4a66', fontSize: '1.1rem', userSelect: 'none' }}>›</div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </section>

        {/* ── Feature cards ─────────────────────────────────────────── */}
        <section>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem', alignItems: 'stretch' }}>
                {FEATURES.map((feat, i) => (
                    <div key={i} className="glass-panel" style={{
                        textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    }}>
                        {/* Neon icon circle */}
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%', marginBottom: '1.25rem',
                            background: `rgba(${feat.color === '#00f0ff' ? '0,240,255' : feat.color === '#b44fff' ? '180,79,255' : '0,255,136'},0.08)`,
                            border: `1.5px solid ${feat.color}30`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.8rem',
                            boxShadow: `0 0 20px ${feat.color}20`,
                            transition: 'all .3s ease',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 30px ${feat.color}50`; e.currentTarget.style.borderColor = feat.color; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 20px ${feat.color}20`; e.currentTarget.style.borderColor = `${feat.color}30`; }}
                        >{feat.icon}</div>

                        <h3 style={{ marginBottom: '0.75rem', color: feat.color, fontWeight: 700 }}>{feat.title}</h3>
                        <p style={{ fontSize: '0.88rem', marginBottom: '1.5rem', flex: 1, color: '#5a7a99' }}>{feat.desc}</p>

                        <Link to={feat.link} className="btn btn-sm" style={{
                            width: '100%', marginTop: 'auto',
                            color: feat.color, borderColor: feat.color,
                            border: `1.5px solid ${feat.color}`,
                            background: 'transparent',
                            fontSize: '0.85rem', fontWeight: 600,
                            boxShadow: `0 0 12px ${feat.color}20`,
                            transition: 'all .25s ease',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = feat.color; e.currentTarget.style.color = '#020818'; e.currentTarget.style.boxShadow = `0 0 25px ${feat.color}60`; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = feat.color; e.currentTarget.style.boxShadow = `0 0 12px ${feat.color}20`; }}
                        >{feat.linkText}</Link>
                    </div>
                ))}
            </div>
        </section>

        <style>{`
            @keyframes badgePulse {
                0%,100% { box-shadow: 0 0 15px rgba(0,240,255,0.1); }
                50%      { box-shadow: 0 0 30px rgba(0,240,255,0.2); }
            }
            @keyframes dotBlink {
                0%,100% { opacity:1; } 50% { opacity:0.3; }
            }
        `}</style>
    </div>
);

export default LandingPage;
